const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  const montarias = await prisma.montaria.findMany({
    where: { NOT: { replayFileName: null } },
    select: { id: true, replayFileName: true, competidorId: true }
  });

  console.log('--- CONFIG ---');
  console.log(JSON.stringify(config, null, 2));
  console.log('--- REPLAYS ---');
  console.log(JSON.stringify(montarias, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
