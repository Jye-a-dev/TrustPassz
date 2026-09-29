import { PrismaClient, UserRole, DealState, AssetType, DisputeStatus, ProductStatus, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING PRODUCTION TEST DATA INTO NEON POSTGRESQL ---');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  async function upsertUser(data: {
    id: string;
    email: string;
    phone?: string;
    displayName: string;
    walletAddress?: string;
    password?: string;
    role: UserRole;
    avatarUrl?: string;
  }) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { id: data.id },
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.walletAddress ? [{ walletAddress: data.walletAddress }] : []),
        ],
      },
    });
    if (existing) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          displayName: data.displayName,
          role: data.role,
          ...(data.password ? { password: data.password } : {}),
          ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {}),
        },
      });
    }
    return prisma.user.create({ data });
  }

  // 1. Seed Users
  const seller = await upsertUser({
    id: '11111111-1111-4111-a111-111111111111',
    email: 'seller@trustpassz.io',
    phone: '+84988111222',
    displayName: 'Trusted Seller Corp',
    walletAddress: '0x1111111111111111111111111111111111111111',
    password: passwordHash,
    role: UserRole.USER,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  });

  const buyer = await upsertUser({
    id: '22222222-2222-4222-a222-222222222222',
    email: 'passkey-user@trustpassz.io',
    phone: '+84977333444',
    displayName: 'Passkey Verified Trader',
    walletAddress: '0x2222222222222222222222222222222222222222',
    password: passwordHash,
    role: UserRole.USER,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  });

  const arbitrator = await upsertUser({
    id: '33333333-3333-4333-a333-333333333333',
    email: 'arbitrator@trustpassz.io',
    displayName: 'AI Escrow Arbitrator Council',
    walletAddress: '0x3333333333333333333333333333333333333333',
    role: UserRole.ARBITRATOR,
  });

  console.log(`Users seeded: Seller (${seller.id}), Buyer (${buyer.id}), Arbitrator (${arbitrator.id})`);

  // 2. Seed Storefront for Seller
  const storefront = await prisma.storefront.upsert({
    where: { sellerId: seller.id },
    update: {},
    create: {
      sellerId: seller.id,
      slug: 'trusted-developer-store',
      shopName: 'Official Dev & Escrow Vault Store',
      bio: 'Chuyên cung cấp source code production, license bản quyền phần mềm và tài sản số chất lượng cao với bảo chứng Smart Contract Escrow.',
      customConfig: {
        theme: 'dark',
        verified: true,
        reputationScore: 99.8,
        totalVolumeVND: 125000000,
      },
    },
  });

  // 3. Seed Products
  const prod1 = await prisma.product.upsert({
    where: { id: 'fa000000-0000-4000-a000-000000000001' },
    update: {},
    create: {
      id: 'fa000000-0000-4000-a000-000000000001',
      sellerId: seller.id,
      storefrontId: storefront.id,
      title: 'Fullstack Escrow Marketplace Source Code (Next.js 15 + Smart Contract)',
      category: 'SOURCE_CODE',
      basePrice: 500000,
      floorPrice: 350000,
      currency: 'VND',
      status: ProductStatus.ACTIVE,
      specAttributes: {
        delivery_method: 'INSTANT_VAULT',
        tags: ['Next.js 15', 'Solidity', 'VietQR', 'AES-256'],
        features: ['Full Source Code Repo', 'Deployment Docs', 'Smart Contract Sepolia'],
      },
    },
  });

  const prod2 = await prisma.product.upsert({
    where: { id: 'fa000000-0000-4000-a000-000000000002' },
    update: {},
    create: {
      id: 'fa000000-0000-4000-a000-000000000002',
      sellerId: seller.id,
      storefrontId: storefront.id,
      title: 'Kênh YouTube 120k Subs - Niche Công Nghệ & AI (Kèm Mail Gốc)',
      category: 'ACCOUNT_CREDENTIAL',
      basePrice: 750000,
      floorPrice: 600000,
      currency: 'VND',
      status: ProductStatus.ACTIVE,
      specAttributes: {
        delivery_method: 'INSTANT_VAULT',
        tags: ['YouTube', 'Google Account', 'Monetized', 'AI Niche'],
        subscribers: 120500,
      },
    },
  });

  const prod3 = await prisma.product.upsert({
    where: { id: 'fa000000-0000-4000-a000-000000000003' },
    update: {},
    create: {
      id: 'fa000000-0000-4000-a000-000000000003',
      sellerId: seller.id,
      storefrontId: storefront.id,
      title: 'Bản quyền License Tool Auto Marketing V4 Trọn Đời',
      category: 'LICENSE_KEY',
      basePrice: 320000,
      floorPrice: 280000,
      currency: 'VND',
      status: ProductStatus.ACTIVE,
      specAttributes: {
        delivery_method: 'INSTANT_VAULT',
        tags: ['Software License', 'Marketing Tool', 'Lifetime Updates'],
      },
    },
  });

  const prod4 = await prisma.product.upsert({
    where: { id: 'fa000000-0000-4000-a000-000000000004' },
    update: {},
    create: {
      id: 'fa000000-0000-4000-a000-000000000004',
      sellerId: seller.id,
      storefrontId: storefront.id,
      title: 'Tài khoản AWS Activate Credits $5,000 Portfolio',
      category: 'ACCOUNT_CREDENTIAL',
      basePrice: 1200000,
      floorPrice: 1000000,
      currency: 'VND',
      status: ProductStatus.ACTIVE,
      specAttributes: {
        delivery_method: 'INSTANT_VAULT',
        tags: ['Cloud', 'AWS Credits', '$5000 Balance'],
      },
    },
  });

  console.log('Products seeded.');

  // 4. Seed Deals
  // Deal 1: IN_INSPECTION (Inspection window running)
  const deal1 = await prisma.deal.upsert({
    where: { id: 'd0000000-0000-4000-a000-000000000001' },
    update: {},
    create: {
      id: 'd0000000-0000-4000-a000-000000000001',
      sellerId: seller.id,
      buyerId: buyer.id,
      title: prod1.title,
      description: 'Giao dịch chuyển nhượng mã nguồn Escrow Marketplace có giải mã Vault AES-256 và inspection window 12 giờ.',
      amount: 500000,
      currency: 'VND',
      state: DealState.IN_INSPECTION,
      inspectionDuration: 43200, // 12h
      depositedAt: new Date(Date.now() - 3 * 3600 * 1000), // deposited 3h ago
      inspectionDeadline: new Date(Date.now() + 9 * 3600 * 1000),
      onchainDealId: '0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d',
      paymentOrderCode: 88990011n,
      settleTxHash: null,
    },
  });

  // Attach Digital Vault to Deal 1
  await prisma.digitalAsset.upsert({
    where: { dealId: deal1.id },
    update: {},
    create: {
      dealId: deal1.id,
      assetType: AssetType.SOURCE_CODE,
      // Sample AES-256-GCM encrypted package
      encryptedContent: 'cGFzc3dvcmRfbGVhazpsaWNlbnNlX2tleV84ODk5MDAxMV92ZXJpZmllZF9vd25lcg==',
      encryptionIv: 'e4d29e7c3b9f4a120000000000000000',
      authTag: '9f8e7d6c5b4a32100000000000000000',
      contentHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
      fileName: 'trustpassz-escrow-v1.zip',
      fileSizeBytes: 52428800n,
      maxAccessLimit: 5,
    },
  });

  // Deal 2: PENDING (Waiting VietQR payment)
  const deal2 = await prisma.deal.upsert({
    where: { id: 'd0000000-0000-4000-a000-000000000002' },
    update: {},
    create: {
      id: 'd0000000-0000-4000-a000-000000000002',
      sellerId: seller.id,
      buyerId: buyer.id,
      title: prod2.title,
      description: 'Chờ người mua quét VietQR chuyển khoản cọc vào Két Ký Quỹ Escrow PayOS.',
      amount: 750000,
      currency: 'VND',
      state: DealState.PENDING,
      inspectionDuration: 86400, // 24h
      onchainDealId: '0x2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e',
      paymentOrderCode: 88990012n,
    },
  });

  // Deal 3: SETTLED (Successfully settled)
  const deal3 = await prisma.deal.upsert({
    where: { id: 'd0000000-0000-4000-a000-000000000003' },
    update: {},
    create: {
      id: 'd0000000-0000-4000-a000-000000000003',
      sellerId: seller.id,
      buyerId: buyer.id,
      title: prod3.title,
      description: 'Kèo ký quỹ đã nghiệm thu thành công và giải ngân thanh toán cho người bán.',
      amount: 320000,
      currency: 'VND',
      state: DealState.SETTLED,
      inspectionDuration: 21600,
      depositedAt: new Date(Date.now() - 48 * 3600 * 1000),
      onchainDealId: '0x3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f',
      paymentOrderCode: 88990013n,
      settleTxHash: '0x' + '7a8b9cf1234567890abcdef1234567890abcdef1234567890abcdef12345678'.slice(0, 64),
    },
  });

  // Deal 4: DISPUTED (Disputed with active arbitration)
  const deal4 = await prisma.deal.upsert({
    where: { id: 'd0000000-0000-4000-a000-000000000004' },
    update: {},
    create: {
      id: 'd0000000-0000-4000-a000-000000000004',
      sellerId: seller.id,
      buyerId: buyer.id,
      title: prod4.title,
      description: 'Kèo đang trong trạng thái tranh chấp chờ phán quyết của Trọng tài AI & Admin.',
      amount: 1200000,
      currency: 'VND',
      state: DealState.DISPUTED,
      inspectionDuration: 86400,
      depositedAt: new Date(Date.now() - 12 * 3600 * 1000),
      onchainDealId: '0x4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f70',
      paymentOrderCode: 88990014n,
      disputeTxHash: '0x' + '9'.repeat(64),
    },
  });

  console.log('Deals & Vault seeded.');

  // 5. Seed Orders
  await prisma.order.upsert({
    where: { dealId: deal1.id },
    update: {},
    create: {
      orderNumber: 'TPZ-2026-88990011',
      dealId: deal1.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      productId: prod1.id,
      status: OrderStatus.IN_INSPECTION,
      totalAmount: 500000,
      paymentMetadata: {
        paymentMethod: 'VietQR (PayOS MBBank)',
        orderCode: 88990011,
        txHash: '0x7a8b9cf123',
      },
    },
  });

  await prisma.order.upsert({
    where: { dealId: deal3.id },
    update: {},
    create: {
      orderNumber: 'TPZ-2026-88990013',
      dealId: deal3.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      productId: prod3.id,
      status: OrderStatus.COMPLETED,
      totalAmount: 320000,
      paymentMetadata: {
        paymentMethod: 'VietQR (PayOS MBBank)',
        orderCode: 88990013,
        txHash: '0x1b2c3de456',
      },
    },
  });

  console.log('Orders seeded.');

  // 6. Seed Dispute Logs
  await prisma.disputeLog.upsert({
    where: { id: 'fd000000-0000-4000-a000-000000000001' },
    update: {},
    create: {
      id: 'fd000000-0000-4000-a000-000000000001',
      dealId: deal4.id,
      initiatorId: buyer.id,
      status: DisputeStatus.AI_PROCESSING,
      reason: 'Tài khoản AWS Activate Credits bị khóa sau 2 giờ kích hoạt, không thể truy cập dashboard quản trị đám mây.',
      evidenceUrls: [
        'https://trustpassz-evidence.s3.amazonaws.com/screenshots/aws-console-error.png',
        'https://trustpassz-evidence.s3.amazonaws.com/logs/activation-audit.json',
      ],
      aiConfidenceScore: 0.8850,
      aiExplanation: 'Mô hình phát hiện bằng chứng xác thực mã lỗi AWS IAM AuthFailed tương thích với claim người mua.',
      aiAnalyzedAt: new Date(),
    },
  });

  console.log('Dispute Logs seeded.');
  console.log('--- ALL REAL DATA SEEDED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
