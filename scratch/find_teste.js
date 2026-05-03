const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const etapas = await prisma.etapa.findMany({
    where: { nome: { contains: 'teste', mode: 'insensitive' } }
  });
  console.log(JSON.stringify(etapas, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
