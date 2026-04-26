import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin account
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      fullName: 'Administrator',
      role: 'admin',
      isActive: true,
    },
  });
  console.log(`Created admin: ${admin.username}`);

  // Create sample kasir account
  const kasirPasswordHash = await bcrypt.hash('kasir123', 10);
  const kasir = await prisma.user.upsert({
    where: { username: 'kasir1' },
    update: {},
    create: {
      username: 'kasir1',
      passwordHash: kasirPasswordHash,
      fullName: 'Kasir Satu',
      role: 'kasir',
      isActive: true,
    },
  });
  console.log(`Created kasir: ${kasir.username}`);

  // Create sample products
  const products = [
    { name: 'Nasi Goreng', price: 15000, stockQuantity: 50, maxCapacity: 100 },
    { name: 'Mie Goreng', price: 12000, stockQuantity: 40, maxCapacity: 100 },
    { name: 'Ayam Goreng', price: 20000, stockQuantity: 30, maxCapacity: 50 },
    { name: 'Es Teh', price: 5000, stockQuantity: 100, maxCapacity: 200 },
    { name: 'Kopi Hitam', price: 8000, stockQuantity: 80, maxCapacity: 150 },
  ];

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product,
    });
    console.log(`Created product: ${created.name}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
