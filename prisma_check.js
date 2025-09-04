const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const c = await prisma.company.findUnique({
      where: { businessIdentifier: 'AGM150318F76' },
      include: { users: true, currency: true },
    });
    console.log(JSON.stringify(c, null, 2));
  } catch (e) {
    console.error('Prisma error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
