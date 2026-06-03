import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  
  // Finance user
  const financeHashed = await bcrypt.hash('Axienta@123', 10);
  await prisma.user.upsert({
    where: { email: 'finance@axientabusinessconsulting.com' },
    update: {
      password: financeHashed,
      name: 'Finance User',
      role: 'STAFF',
    },
    create: {
      email: 'finance@axientabusinessconsulting.com',
      password: financeHashed,
      name: 'Finance User',
      role: 'STAFF',
    },
  });
  
  const profile = await prisma.businessProfile.findFirst();
  if (!profile) {
    await prisma.businessProfile.create({
      data: {
        name: 'My Store',
        upiId: 'merchant@upi',
      },
    });
  }
  
  console.log('Seed completed. Admin user: admin@example.com / admin123');
  console.log('Finance user: finance@axientabusinessconsulting.com / Axienta@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
