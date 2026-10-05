import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRESERVED_EMAILS = [
  'omkhoa@gmail.com',
  'admin@gmail.com',
  'shokoste1@gmail.com',
];

async function cleanAllExceptPreservedUsers() {
  console.log('--- BẮT ĐẦU DỌN DẸP TOÀN BỘ DATABASE ---');
  console.log(`Bảo lưu 3 tài khoản: ${PRESERVED_EMAILS.join(', ')}`);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Xoá tất cả nhật ký tranh chấp (DisputeLogs)
    const deletedDisputes = await tx.disputeLog.deleteMany({});
    console.log(`- Đã xoá ${deletedDisputes.count} DisputeLogs`);

    // 2. Xoá tất cả đơn hàng (Orders)
    const deletedOrders = await tx.order.deleteMany({});
    console.log(`- Đã xoá ${deletedOrders.count} Orders`);

    // 3. Xoá tất cả DigitalAssets
    const deletedAssets = await tx.digitalAsset.deleteMany({});
    console.log(`- Đã xoá ${deletedAssets.count} DigitalAssets`);

    // 4. Xoá tất cả Deals / Kèo
    const deletedDeals = await tx.deal.deleteMany({});
    console.log(`- Đã xoá ${deletedDeals.count} Deals`);

    // 5. Xoá tất cả BargainOffers
    const deletedBargains = await tx.bargainOffer.deleteMany({});
    console.log(`- Đã xoá ${deletedBargains.count} BargainOffers`);

    // 6. Xoá tất cả Products
    const deletedProducts = await tx.product.deleteMany({});
    console.log(`- Đã xoá ${deletedProducts.count} Products`);

    // 7. Xoá tất cả Storefronts
    const deletedStorefronts = await tx.storefront.deleteMany({});
    console.log(`- Đã xoá ${deletedStorefronts.count} Storefronts`);

    // 8. Xoá tất cả Users ngoại trừ 3 tài khoản được yêu cầu
    const deletedUsers = await tx.user.deleteMany({
      where: {
        email: {
          notIn: PRESERVED_EMAILS,
        },
      },
    });
    console.log(`- Đã xoá ${deletedUsers.count} Users`);

    return {
      deletedDisputes: deletedDisputes.count,
      deletedOrders: deletedOrders.count,
      deletedAssets: deletedAssets.count,
      deletedDeals: deletedDeals.count,
      deletedBargains: deletedBargains.count,
      deletedProducts: deletedProducts.count,
      deletedStorefronts: deletedStorefronts.count,
      deletedUsers: deletedUsers.count,
    };
  });

  // Kiểm tra lại danh sách Users còn lại
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true, displayName: true },
  });

  console.log('\n--- KẾT QUẢ DỌN DẸP ---');
  console.log('Tổng hợp số lượng bản ghi đã xoá:', result);
  console.log('Danh sách tài khoản còn lại trong database:', remainingUsers);
}

cleanAllExceptPreservedUsers()
  .catch((error) => {
    console.error('Lỗi khi thực hiện dọn dẹp database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
