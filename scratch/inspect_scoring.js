const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  console.log('CONFIG:', config);

  const montarias = await prisma.montaria.findMany({
    where: { notaTotal: { gt: 0 } },
    orderBy: { id: 'desc' },
    take: 5
  });
  console.log('RECENT MONTARIAS:', JSON.stringify(montarias, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
