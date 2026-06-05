const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Database Seeding...');

  // 1. Create Default Users (Super Admin and Manager)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@chemicrown.com' },
    update: {},
    create: {
      email: 'admin@chemicrown.com',
      role: 'SUPER_ADMIN',
      employeeProfile: {
        create: {
          firstName: 'System',
          lastName: 'Administrator',
          phone: '9999999999',
        },
      },
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@chemicrown.com' },
    update: {},
    create: {
      email: 'manager@chemicrown.com',
      role: 'MANAGER',
      employeeProfile: {
        create: {
          firstName: 'Operations',
          lastName: 'Manager',
          phone: '8888888888',
        },
      },
    },
  });

  console.log('✅ Users seeded');

  // 2. Create Categories
  const catThinners = await prisma.category.upsert({
    where: { name: 'Thinners' },
    update: {},
    create: { name: 'Thinners' },
  });

  const catSolvents = await prisma.category.upsert({
    where: { name: 'Solvents' },
    update: {},
    create: { name: 'Solvents' },
  });

  const catPrimers = await prisma.category.upsert({
    where: { name: 'Primers' },
    update: {},
    create: { name: 'Primers' },
  });

  console.log('✅ Categories seeded');

  // 3. Create Products (The 7 requested chemicals)
  const productsData = [
    {
      name: 'General Purpose (GP) Thinner',
      description: 'Standard thinner for cleaning and general dilution.',
      unit: 'Litre',
      price: 150.0,
      categoryId: catThinners.id,
    },
    {
      name: 'Mineral Turpentine Oil (MTO)',
      description: 'Used as a solvent and thinner for oil-based paints.',
      unit: 'Litre',
      price: 90.0,
      categoryId: catSolvents.id,
    },
    {
      name: 'Toluene (Methylbenzene)',
      description: 'Industrial solvent for paints, thinners, and adhesives.',
      unit: 'Drum',
      price: 4500.0,
      categoryId: catSolvents.id,
    },
    {
      name: 'Acetone (Propanone)',
      description: 'Fast-drying solvent used in manufacturing and cleaning.',
      unit: 'Drum',
      price: 5200.0,
      categoryId: catSolvents.id,
    },
    {
      name: 'Nitrocellulose (NC) Thinner',
      description: 'High-grade thinner for wood coatings and auto paints.',
      unit: 'Litre',
      price: 210.0,
      categoryId: catThinners.id,
    },
    {
      name: 'Polyurethane (PU) Thinner',
      description: 'Specialized thinner for PU-based coatings and finishes.',
      unit: 'Litre',
      price: 280.0,
      categoryId: catThinners.id,
    },
    {
      name: 'Red Oxide Primer (Iron Oxide Primer)',
      description: 'Anti-corrosive primer for metal surfaces.',
      unit: 'Kg',
      price: 180.0,
      categoryId: catPrimers.id,
    }
  ];

  for (const p of productsData) {
    const createdProduct = await prisma.product.create({
      data: p
    });
    
    // Add initial inventory for each product
    await prisma.inventory.create({
      data: {
        productId: createdProduct.id,
        quantity: 100, // starting stock
        minThreshold: 20,
        transactions: {
          create: {
            type: 'IN',
            quantity: 100,
            remarks: 'Initial System Stock'
          }
        }
      }
    });
  }

  console.log('✅ Products & Initial Inventory seeded');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
