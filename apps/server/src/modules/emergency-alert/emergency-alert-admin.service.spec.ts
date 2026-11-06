import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EmergencyAlertAdminService } from './emergency-alert-admin.service';
import { EmergencyAlertService } from './emergency-alert.service';
import { PrismaService } from '../../database/prisma.service';
import { RequestUser } from '../../common/decorators/current-user.decorator';

describe('EmergencyAlertAdminService (TASK-c-4: Admin Emergency Alert Operations)', () => {
  let service: EmergencyAlertAdminService;
  let prisma: any;
  let alertService: any;
  let configService: any;

  const mockAdminUser: RequestUser = {
    id: 'admin-uuid-1',
    email: 'superadmin@trustpassz.io',
    walletAddress: '0x1111111111111111111111111111111111111111',
    role: 'SUPER_ADMIN',
  };

  beforeEach(async () => {
    prisma = {
      emergencyMailingList: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'uuid-1',
            email: 'admin@trustpassz.io',
            label: 'Primary SecOps',
            isActive: true,
            addedBy: 'superadmin@trustpassz.io',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      emergencyDispatchLog: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'log-uuid-1', ...data }),
        ),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    alertService = {
      getConfigAdminEmails: jest.fn().mockReturnValue(['admin@trustpassz.io']),
      getConfig: jest.fn().mockReturnValue({
        senderName: 'TrustPassz Emergency Sentinel',
        smtpUser: 'dev@trustpassz.local',
      }),
      getTransporter: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({
          messageId: '<test-msg-123@trustpassz.io>',
        }),
      }),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'ADMIN_2FA_PIN') return '888999';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmergencyAlertAdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
        { provide: EmergencyAlertService, useValue: alertService },
      ],
    }).compile();

    service = module.get<EmergencyAlertAdminService>(EmergencyAlertAdminService);
  });

  describe('2FA Verification', () => {
    it('should throw ForbiddenException if PIN is invalid', () => {
      expect(() => service.verify2FaPin('123456')).toThrow(ForbiddenException);
    });

    it('should succeed when PIN matches configured value', () => {
      expect(() => service.verify2FaPin('888999')).not.toThrow();
    });
  });

  describe('Mailing List Operations', () => {
    it('should return list of registered emergency emails', async () => {
      const list = await service.getMailingList();
      expect(list).toHaveLength(1);
      expect(list[0].email).toBe('admin@trustpassz.io');
    });

    it('should create new emergency email when 2FA is valid and email unique', async () => {
      prisma.emergencyMailingList.findUnique.mockResolvedValue(null);
      prisma.emergencyMailingList.create.mockResolvedValue({
        id: 'new-uuid',
        email: 'ops@trustpassz.io',
        label: 'SecOps On-Call',
        isActive: true,
        addedBy: mockAdminUser.email,
      });

      const res = await service.addEmail(
        {
          email: 'ops@trustpassz.io',
          label: 'SecOps On-Call',
          pin2FA: '888999',
        },
        mockAdminUser,
      );

      expect(res.email).toBe('ops@trustpassz.io');
      expect(prisma.emergencyMailingList.create).toHaveBeenCalled();
    });

    it('should reject duplicate email with ConflictException', async () => {
      prisma.emergencyMailingList.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'admin@trustpassz.io',
      });

      await expect(
        service.addEmail(
          {
            email: 'admin@trustpassz.io',
            label: 'Duplicate',
            pin2FA: '888999',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should delete email when 2FA is verified', async () => {
      prisma.emergencyMailingList.findUnique.mockResolvedValue({
        id: 'del-id',
        email: 'remove@trustpassz.io',
      });
      prisma.emergencyMailingList.delete.mockResolvedValue({ id: 'del-id' });

      const res = await service.deleteEmail('del-id', '888999');
      expect(res.success).toBe(true);
      expect(prisma.emergencyMailingList.delete).toHaveBeenCalledWith({
        where: { id: 'del-id' },
      });
    });
  });

  describe('Test Send Alert (SLA Benchmark)', () => {
    it('should dispatch test email within SLA < 2000ms and persist log as SENT', async () => {
      const result = await service.testSendEmergencyAlert(
        { targetEmail: 'test@trustpassz.io' },
        mockAdminUser,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('SENT');
      expect(result.latencyMs).toBeLessThan(2000);
      expect(prisma.emergencyDispatchLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            alertType: 'TEST',
            status: 'SENT',
          }),
        }),
      );
    });
  });

  describe('Dispatch Audit Logs', () => {
    it('should return paginated audit logs', async () => {
      prisma.emergencyDispatchLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          alertType: 'CRITICAL',
          status: 'SENT',
          latencyMs: 120,
        },
      ]);
      prisma.emergencyDispatchLog.count.mockResolvedValue(1);

      const logs = await service.getDispatchLogs({ page: 1, limit: 10 });
      expect(logs.total).toBe(1);
      expect(logs.data).toHaveLength(1);
    });
  });
});

