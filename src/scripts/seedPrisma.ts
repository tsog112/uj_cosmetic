import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma seeding...');

  // 1. Clear existing data in correct dependency order
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.setting.deleteMany({});

  console.log('🗑️  Existing data cleared.');

  // 2. Create Categories
  const categoriesData = [
    { name: 'Арьс арчилгаа' },
    { name: 'Нүүр будаг' },
    { name: 'Маск' },
    { name: 'Цэвэрлэгч' },
    { name: 'Эрүүл мэнд' },
    { name: 'Бусад' }
  ];

  const categories: any[] = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories.push(created);
  }
  console.log(`📂 Created ${categories.length} categories.`);

  // Find category helper
  const getCatId = (name: string) => categories.find(c => c.name === name)?.id || categories[0].id;

  // 3. Create Users (Customers & Admins)
  const users = [
    {
      name: 'Бат-Эрдэнэ Болд',
      email: 'bat@gmail.com',
      phone: '99112233',
      role: 'customer'
    },
    {
      name: 'Сарнай Ганболд',
      email: 'sarnaichka@yahoo.com',
      phone: '88009988',
      role: 'customer'
    },
    {
      name: 'Төгөлдөр Баяр',
      email: 'tuguldur@gmail.com',
      phone: '95152535',
      role: 'customer'
    },
    {
      name: 'Анужин Энхбаяр',
      email: 'anujin@ujcosmetic.mn',
      phone: '99001122',
      role: 'admin'
    }
  ];

  const seededUsers: any[] = [];
  for (const u of users) {
    const created = await prisma.user.create({ data: u });
    seededUsers.push(created);
  }
  console.log(`👥 Created ${seededUsers.length} users.`);

  // 4. Create Products
  const products = [
    {
      name: 'Sulwhasoo First Care Activating Serum',
      brand: 'Sulwhasoo',
      description: 'Арьсыг гүн чийгшүүлж, дараах бүтээгдэхүүний шингэлтийг дэмжих тэргүүлэх серум.',
      ingredients: 'Жавхаажуулагч ургамлын цогцолбор ханд, Сарнай, Гиалурон.',
      howToUse: 'Өглөө, оройдоо нүүр цэвэрлэсний дараа хамгийн түрүүнд түрхэж хэрэглэнэ.',
      price: 185000,
      salePrice: 165000,
      stock: 45,
      images: JSON.stringify(['/placeholder-product.svg']),
      categoryId: getCatId('Арьс арчилгаа')
    },
    {
      name: 'Laneige Lip Sleeping Mask (Berry)',
      brand: 'Laneige',
      description: 'Унтаж байх хугацаанд уруулыг зөөлрүүлж, үхэжсэн арьсыг гуужуулах маск.',
      ingredients: 'Berry Mix Complex, Витамин С, Үхрийн нүдний ханд.',
      howToUse: 'Унтахын өмнө зориулалтын хусуураар уруулдаа зузаан түрхэж хононо.',
      price: 65000,
      salePrice: null,
      stock: 3, // Low stock to trigger warning!
      images: JSON.stringify(['/placeholder-product.svg']),
      categoryId: getCatId('Маск')
    },
    {
      name: 'COSRX Low pH Good Morning Gel Cleanser',
      brand: 'COSRX',
      description: 'Арьсны чийглэг байдлыг алдагдуулахгүйгээр зөөлөн цэвэрлэх тохиромжтой pH-тай гел.',
      ingredients: 'Цайны модны тос, BHA хүчил, Ургамлын ханд.',
      howToUse: 'Чийгтэй гартаа хөөсрүүлэн нүүрээ зөөлөн иллэг хийж бүлээн усаар угаана.',
      price: 38000,
      salePrice: 35000,
      stock: 2, // Low stock!
      images: JSON.stringify(['/placeholder-product.svg']),
      categoryId: getCatId('Цэвэрлэгч')
    },
    {
      name: 'Mediheal N.M.F Aquaring Ampoule Mask',
      brand: 'Mediheal',
      description: 'Арьсыг эрчимтэй чийгшүүлж, нүхийг агшаах өндөр идэвхт ампултай маск.',
      ingredients: 'Гиалуроны хүчил, Амино хүчил, Тогтворжуулсан ус.',
      howToUse: 'Нүүрэндээ тааруулан 15-20 минут байлгасны дараа авч, үлдэгдлийг шингээнэ.',
      price: 6500,
      salePrice: null,
      stock: 120,
      images: JSON.stringify(['/placeholder-product.svg']),
      categoryId: getCatId('Маск')
    },
    {
      name: 'Pepe Juice Detox Premium',
      brand: 'Pepe Juice',
      description: 'Бие махбодийг эрүүлжүүлэн хоргүйжүүлэх дээд зэрэглэлийн детокс ундаа.',
      ingredients: 'Байгалийн жимсний эслэг, Нимбэг, Идэвхтэй нүүрс.',
      howToUse: '1 уутыг 300мл усанд найруулж өглөө өлөн элгэн дээрээ ууна.',
      price: 75000,
      salePrice: 70000,
      stock: 80,
      images: JSON.stringify(['/placeholder-product.svg']),
      categoryId: getCatId('Эрүүл мэнд')
    },
    {
      name: 'Dr.Jart+ Cicapair Tiger Grass Cream',
      brand: 'Dr.Jart+',
      description: 'Арьсны улайлт, цочролыг намдааж, арьсны хамгаалалтын бүрхүүлийг бэхжүүлэх тос.',
      ingredients: 'Centella Asiatica (Tiger Grass), Ниацинамид.',
      howToUse: 'Арьс арчилгааны сүүлийн шатанд улайж цочирсон хэсэгт эсвэл бүтэн нүүрэндээ түрхэнэ.',
      price: 115000,
      salePrice: null,
      stock: 0, // Out of stock!
      images: JSON.stringify(['/placeholder-product.svg']),
      categoryId: getCatId('Арьс арчилгаа')
    }
  ];

  const seededProducts: any[] = [];
  for (const p of products) {
    const created = await prisma.product.create({ data: p });
    seededProducts.push(created);
  }
  console.log(`💄 Created ${seededProducts.length} products.`);

  // 5. Create Settings
  await prisma.setting.create({
    data: {
      id: 'MAIN',
      key: 'store_settings',
      value: JSON.stringify({
        storeName: 'UJ Cosmetic',
        freeShippingMin: 100000,
        deliveryFee: 5000,
        phone: '99001122',
        address: 'Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо',
        pushNotifications: true
      })
    }
  });
  console.log('⚙️ Default settings seeded.');

  // 6. Create Orders and Order Items
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

  const orders = [
    {
      userId: seededUsers[0].id,
      customerName: seededUsers[0].name,
      customerPhone: seededUsers[0].phone,
      status: 'PENDING',
      total: 70000,
      shippingAddress: 'УБ, Баянзүрх дүүрэг, 26-р хороо, Олимп хотхон 101-20',
      createdAt: today,
      items: [
        {
          productId: seededProducts[4].id, // Pepe Juice
          quantity: 1,
          price: 70000
        }
      ]
    },
    {
      userId: seededUsers[1].id,
      customerName: seededUsers[1].name,
      customerPhone: seededUsers[1].phone,
      status: 'CONFIRMED',
      total: 165000,
      shippingAddress: 'УБ, Сонгинохайрхан дүүрэг, 19-р хороо, 21-45',
      createdAt: yesterday,
      items: [
        {
          productId: seededProducts[0].id, // Sulwhasoo
          quantity: 1,
          price: 165000
        }
      ]
    },
    {
      userId: seededUsers[2].id,
      customerName: seededUsers[2].name,
      customerPhone: seededUsers[2].phone,
      status: 'DELIVERED',
      total: 76500,
      shippingAddress: 'УБ, Хан-Уул дүүрэг, Ривер Гарден 302-12',
      createdAt: twoDaysAgo,
      items: [
        {
          productId: seededProducts[2].id, // COSRX Cleanser
          quantity: 1,
          price: 35000
        },
        {
          productId: seededProducts[3].id, // Mediheal Mask
          quantity: 6,
          price: 6500
        }
      ]
    },
    {
      userId: null,
      customerName: 'Зочин Хэрэглэгч',
      customerPhone: '99887766',
      status: 'PENDING',
      total: 13000,
      shippingAddress: 'УБ, Чингэлтэй дүүрэг, 5-р хороо, 12-3а',
      createdAt: today,
      items: [
        {
          productId: seededProducts[3].id, // Mediheal Mask
          quantity: 2,
          price: 6500
        }
      ]
    }
  ];

  for (const o of orders) {
    const { items, ...orderData } = o;
    const createdOrder = await prisma.order.create({
      data: orderData
    });

    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }
      });
    }
  }

  console.log(`📦 Seeded ${orders.length} orders and their order items successfully.`);
  console.log('✅ Seeding completed! Database is fully populated.');
}

main()
  .catch((e) => {
    console.error('❌ Error during Prisma seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
