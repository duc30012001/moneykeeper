import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

interface CategorySeed {
  name: string;
  type: TransactionType;
  icon?: string;
  children?: Omit<CategorySeed, 'type'>[];
}

const INCOME_CATEGORIES: CategorySeed[] = [
  {
    name: 'Thu nhập chủ động',
    type: 'income',
    icon: '💼',
    children: [
      { name: 'Lương chính', icon: '💰' },
      { name: 'Tiền thưởng / Phụ cấp', icon: '🎁' },
      { name: 'Làm thêm / Freelance', icon: '💻' },
    ],
  },
  {
    name: 'Thu nhập thụ động',
    type: 'income',
    icon: '📈',
    children: [
      { name: 'Lãi tiết kiệm / Cổ tức', icon: '🏦' },
      { name: 'Tiền cho thuê tài sản', icon: '🏠' },
      { name: 'Nguồn thu từ kinh doanh phụ', icon: '🏪' },
    ],
  },
];

const EXPENSE_CATEGORIES: CategorySeed[] = [
  {
    name: 'Chi phí thiết yếu',
    type: 'expense',
    icon: '🏡',
    children: [
      { name: 'Tiền nhà (Thuê nhà / Trả góp)', icon: '🏠' },
      { name: 'Ăn uống cơ bản (Đi chợ, siêu thị)', icon: '🛒' },
      { name: 'Hóa đơn (Điện, nước, internet, điện thoại)', icon: '🧾' },
      { name: 'Đi lại (Xăng xe, vé xe, taxi, Grab)', icon: '🚗' },
      { name: 'Sức khỏe (Thuốc men, khám bệnh)', icon: '💊' },
    ],
  },
  {
    name: 'Chi phí linh hoạt',
    type: 'expense',
    icon: '🎉',
    children: [
      { name: 'Ăn ngoài & Cà phê', icon: '☕' },
      { name: 'Giải trí (Xem phim, đăng ký Netflix/Spotify)', icon: '🎬' },
      { name: 'Mua sắm (Quần áo, mỹ phẩm, đồ công nghệ)', icon: '🛍️' },
      { name: 'Du lịch & Nghỉ dưỡng', icon: '✈️' },
    ],
  },
  {
    name: 'Tiết kiệm & Đầu tư',
    type: 'expense',
    icon: '🐷',
    children: [
      { name: 'Quỹ dự phòng khẩn cấp', icon: '🆘' },
      { name: 'Tiết kiệm mục tiêu (Mua xe, mua nhà)', icon: '🎯' },
      { name: 'Đầu tư (Cổ phiếu, chứng chỉ quỹ, vàng)', icon: '📊' },
    ],
  },
  {
    name: 'Nghĩa vụ & Khoản chi khác',
    type: 'expense',
    icon: '📋',
    children: [
      { name: 'Trả nợ (Thẻ tín dụng, vay tiêu dùng)', icon: '💳' },
      { name: 'Phí duy trì (Phí ngân hàng, phí thường niên)', icon: '🏧' },
      { name: 'Bảo hiểm (Bảo hiểm nhân thọ, phi nhân thọ)', icon: '🛡️' },
      { name: 'Giao tế (Cưới hỏi, quà tặng, biếu gia đình)', icon: '🤝' },
    ],
  },
];

async function seedCategories(categories: CategorySeed[]) {
  for (const cat of categories) {
    const parent = await prisma.category.create({
      data: {
        name: cat.name,
        type: cat.type,
        icon: cat.icon ?? null,
        is_default: true,
        user_id: null,
      },
    });

    if (cat.children) {
      for (const child of cat.children) {
        await prisma.category.create({
          data: {
            name: child.name,
            type: cat.type,
            icon: child.icon ?? null,
            parent_id: parent.id,
            is_default: true,
            user_id: null,
          },
        });
      }
    }
  }
}

async function main() {
  console.log('🌱 Seeding default categories...');

  // Clear existing default categories
  await prisma.category.deleteMany({
    where: { is_default: true, user_id: null },
  });

  await seedCategories(INCOME_CATEGORIES);
  await seedCategories(EXPENSE_CATEGORIES);

  const count = await prisma.category.count({
    where: { is_default: true },
  });
  console.log(`✅ Seeded ${count} default categories`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
