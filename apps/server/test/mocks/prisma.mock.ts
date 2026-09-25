/// <reference types="jest" />
import { AssetType, DealState, Prisma } from '@prisma/client';
import '../../src/common/utils/bigint-serializer.util';

export interface MockUser {
  id: string;
  email: string;
  walletAddress: string;
  displayName: string;
  avatarUrl: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockDigitalAsset {
  id: string;
  dealId: string;
  assetType: AssetType;
  encryptedContent: string;
  encryptionIv: string;
  authTag: string;
  contentHash: string | null;
  fileName: string | null;
  fileSizeBytes: bigint | null;
  maxAccessLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockDeal {
  id: string;
  sellerId: string;
  buyerId: string | null;
  title: string;
  description?: string | null;
  amount: Prisma.Decimal;
  currency: string;
  state: DealState;
  inspectionDuration?: number;
  paymentOrderCode?: bigint | null;
  settleTxHash?: string | null;
  disputeTxHash?: string | null;
  inspectionDeadline?: Date | null;
  depositedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  digitalAsset?: MockDigitalAsset | null;
  seller?: MockUser;
  buyer?: MockUser | null;
  disputeLogs?: unknown[];
}

export const sellerUser: MockUser = {
  id: '11111111-1111-4111-a111-111111111111',
  email: 'seller@trustpassz.io',
  walletAddress: '0x1111111111111111111111111111111111111111',
  displayName: 'Trusted Seller',
  avatarUrl: 'https://trustpassz.io/avatars/seller.png',
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const buyerUser: MockUser = {
  id: '22222222-2222-4222-a222-222222222222',
  email: 'buyer@trustpassz.io',
  walletAddress: '0x2222222222222222222222222222222222222222',
  displayName: 'Verified Buyer',
  avatarUrl: 'https://trustpassz.io/avatars/buyer.png',
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function createMockPrismaService(
  getDealsStore: () => MockDeal[],
  setDealsStore: (deals: MockDeal[]) => void,
  getAssetsStore: () => MockDigitalAsset[],
  setAssetsStore: (assets: MockDigitalAsset[]) => void,
) {
  const service = {
    user: {
      findUnique: jest
        .fn()
        .mockImplementation(({ where }: { where: { id: string } }) => {
          if (where.id === sellerUser.id) return Promise.resolve(sellerUser);
          if (where.id === buyerUser.id) return Promise.resolve(buyerUser);
          return Promise.resolve(null);
        }),
      findFirst: jest.fn().mockImplementation(() => Promise.resolve(null)),
      create: jest
        .fn()
        .mockImplementation(({ data }: { data: Record<string, unknown> }) => {
          return Promise.resolve({
            id: 'a0000000-0000-4000-a000-000000000099',
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }),
      update: jest
        .fn()
        .mockImplementation(({ data }: { data: Record<string, unknown> }) => {
          return Promise.resolve({
            ...sellerUser,
            ...data,
          });
        }),
    },
    deal: {
      create: jest.fn().mockImplementation(
        ({
          data,
        }: {
          data: {
            sellerId: string;
            buyerId?: string | null;
            title: string;
            description?: string | null;
            amount: Prisma.Decimal | number;
            currency?: string;
            state?: DealState;
            inspectionDuration?: number;
            onchainDealId?: string | null;
          };
        }) => {
          const dealsStore = getDealsStore();
          const id = `d0000000-0000-4000-a000-${String(dealsStore.length + 1).padStart(12, '0')}`;
          const newDeal: MockDeal = {
            id,
            sellerId: data.sellerId,
            buyerId: data.buyerId || null,
            title: data.title,
            description: data.description || null,
            amount: new Prisma.Decimal(data.amount),
            currency: data.currency || 'VND',
            state: data.state || DealState.PENDING,
            inspectionDuration: data.inspectionDuration || 86400,
            createdAt: new Date(),
            updatedAt: new Date(),
            paymentOrderCode: null,
            settleTxHash: null,
            disputeTxHash: null,
            inspectionDeadline: null,
            depositedAt: null,
          };
          dealsStore.push(newDeal);
          return Promise.resolve(newDeal);
        },
      ),
      count: jest.fn().mockImplementation(
        ({
          where,
        }: {
          where?: { sellerId?: string; buyerId?: string; state?: DealState };
        } = {}) => {
          const dealsStore = getDealsStore();
          if (!where || Object.keys(where).length === 0) {
            return Promise.resolve(dealsStore.length);
          }
          const count = dealsStore.filter((d) => {
            if (where.sellerId && d.sellerId !== where.sellerId) return false;
            if (where.buyerId && d.buyerId !== where.buyerId) return false;
            if (where.state && d.state !== where.state) return false;
            return true;
          }).length;
          return Promise.resolve(count);
        },
      ),
      groupBy: jest
        .fn()
        .mockImplementation(
          ({ where }: { where?: { sellerId?: string; buyerId?: string } }) => {
            const dealsStore = getDealsStore();
            const counts: Record<string, number> = {};
            const filtered = dealsStore.filter((d) => {
              if (where?.sellerId && d.sellerId !== where.sellerId)
                return false;
              if (where?.buyerId && d.buyerId !== where.buyerId) return false;
              return true;
            });
            for (const deal of filtered) {
              counts[deal.state] = (counts[deal.state] || 0) + 1;
            }
            const result = Object.entries(counts).map(([state, count]) => ({
              state,
              _count: { id: count },
            }));
            return Promise.resolve(result);
          },
        ),
      findMany: jest.fn().mockImplementation(
        ({
          where,
          skip = 0,
          take = 10,
        }: {
          where?: {
            state?: DealState;
            sellerId?: string;
            buyerId?: string;
            OR?: Array<{
              title?: { contains?: string };
              description?: { contains?: string };
            }>;
          };
          skip?: number;
          take?: number;
        }) => {
          const dealsStore = getDealsStore();
          const digitalAssetsStore = getAssetsStore();
          let results = [...dealsStore];
          if (where?.state) {
            results = results.filter((d) => d.state === where.state);
          }
          if (where?.sellerId) {
            results = results.filter((d) => d.sellerId === where.sellerId);
          }
          if (where?.buyerId) {
            results = results.filter((d) => d.buyerId === where.buyerId);
          }
          if (where?.OR) {
            const query = where.OR[0]?.title?.contains?.toLowerCase() || '';
            results = results.filter(
              (d) =>
                d.title.toLowerCase().includes(query) ||
                (d.description && d.description.toLowerCase().includes(query)),
            );
          }
          const paginated = results
            .slice(skip, skip + take)
            .map((d: MockDeal) => ({
              ...d,
              digitalAsset:
                digitalAssetsStore.find((a) => a.dealId === d.id) || null,
              seller: sellerUser,
              buyer: buyerUser,
            }));
          return Promise.resolve(paginated);
        },
      ),
      findUnique: jest
        .fn()
        .mockImplementation(({ where }: { where: { id: string } }) => {
          const dealsStore = getDealsStore();
          const digitalAssetsStore = getAssetsStore();
          const found = dealsStore.find((d) => d.id === where.id);
          if (!found) return Promise.resolve(null);
          return Promise.resolve({
            ...found,
            digitalAsset:
              digitalAssetsStore.find((a) => a.dealId === found.id) || null,
            seller: sellerUser,
            buyer: buyerUser,
            disputeLogs: [],
          });
        }),
      update: jest
        .fn()
        .mockImplementation(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => {
            const dealsStore = getDealsStore();
            const digitalAssetsStore = getAssetsStore();
            const index = dealsStore.findIndex((d) => d.id === where.id);
            if (index === -1) return Promise.resolve(null);
            dealsStore[index] = {
              ...dealsStore[index],
              ...data,
              updatedAt: new Date(),
            };
            return Promise.resolve({
              ...dealsStore[index],
              digitalAsset:
                digitalAssetsStore.find((a) => a.dealId === where.id) || null,
              seller: sellerUser,
              buyer: buyerUser,
            });
          },
        ),
      delete: jest
        .fn()
        .mockImplementation(({ where }: { where: { id: string } }) => {
          const dealsStore = getDealsStore();
          const index = dealsStore.findIndex((d) => d.id === where.id);
          if (index === -1) return Promise.resolve(null);
          const [deleted] = dealsStore.splice(index, 1);
          setAssetsStore(getAssetsStore().filter((a) => a.dealId !== where.id));
          return Promise.resolve(deleted);
        }),
    },
    digitalAsset: {
      create: jest.fn().mockImplementation(
        ({
          data,
        }: {
          data: {
            dealId: string;
            assetType: AssetType;
            encryptedContent: string;
            encryptionIv: string;
            authTag: string;
            contentHash?: string | null;
            fileName?: string | null;
            fileSizeBytes?: bigint | null;
            maxAccessLimit: number;
          };
        }) => {
          const digitalAssetsStore = getAssetsStore();
          const newAsset: MockDigitalAsset = {
            ...data,
            id: `da000000-0000-4000-a000-${String(digitalAssetsStore.length + 1).padStart(12, '0')}`,
            contentHash: data.contentHash || null,
            fileName: data.fileName || null,
            fileSizeBytes: data.fileSizeBytes || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          digitalAssetsStore.push(newAsset);
          return Promise.resolve(newAsset);
        },
      ),
      upsert: jest
        .fn()
        .mockImplementation(
          ({
            where,
            create,
            update,
          }: {
            where: { dealId: string };
            create: Record<string, unknown>;
            update: Record<string, unknown>;
          }) => {
            const digitalAssetsStore = getAssetsStore();
            const index = digitalAssetsStore.findIndex(
              (a) => a.dealId === where.dealId,
            );
            if (index >= 0) {
              digitalAssetsStore[index] = {
                ...digitalAssetsStore[index],
                ...update,
                updatedAt: new Date(),
              };
              return Promise.resolve(digitalAssetsStore[index]);
            }
            const newAsset: MockDigitalAsset = {
              ...(create as unknown as MockDigitalAsset),
              id: `da000000-0000-4000-a000-${String(digitalAssetsStore.length + 1).padStart(12, '0')}`,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            digitalAssetsStore.push(newAsset);
            return Promise.resolve(newAsset);
          },
        ),
    },
    $transaction: jest
      .fn()
      .mockImplementation(
        (callback: (tx: typeof service) => Promise<unknown>) => {
          return callback(service);
        },
      ),
  };

  return service;
}
