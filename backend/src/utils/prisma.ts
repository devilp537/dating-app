import { PrismaClient } from '@prisma/client';

// تعریف یک متغیر گلوبال برای جلوگیری از ساخت نمونه‌های تکراری در زمان Hot-Reload
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // می‌توانید لاگ‌ها را برای دیباگ بهتر اینجا روشن کنید (اختیاری)
    // log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;