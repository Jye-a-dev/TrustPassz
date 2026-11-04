import { Injectable, Logger } from '@nestjs/common';
import { RegisterDeviceTokenDto, UnregisterDeviceTokenDto } from './dto/device-token.dto';

interface ActiveDeviceSession {
  token: string;
  userId: string;
  platform: 'android' | 'ios';
  deviceModel?: string;
  appVersion?: string;
  updatedAt: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly tokenRegistry = new Map<string, ActiveDeviceSession>();

  async registerDeviceToken(dto: RegisterDeviceTokenDto): Promise<{ success: boolean; registeredAt: string }> {
    const session: ActiveDeviceSession = {
      ...dto,
      updatedAt: new Date(),
    };

    this.tokenRegistry.set(dto.token, session);
    this.logger.log(`[FCM] Registered token for user ${dto.userId} (${dto.platform})`);

    return {
      success: true,
      registeredAt: session.updatedAt.toISOString(),
    };
  }

  async unregisterDeviceToken(dto: UnregisterDeviceTokenDto): Promise<{ success: boolean }> {
    const existing = this.tokenRegistry.get(dto.token);
    if (existing && existing.userId === dto.userId) {
      this.tokenRegistry.delete(dto.token);
      this.logger.log(`[FCM] Revoked token for user ${dto.userId}`);
    }
    return { success: true };
  }

  async getTokensForUser(userId: string): Promise<string[]> {
    const tokens: string[] = [];
    for (const [token, session] of this.tokenRegistry.entries()) {
      if (session.userId === userId) {
        tokens.push(token);
      }
    }
    return tokens;
  }
}

