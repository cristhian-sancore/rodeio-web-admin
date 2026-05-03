const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const etapas = await prisma.etapa.findMany();
  console.log('ETAPAS ENCONTRADAS:');
  etapas.forEach(e => console.log(`ID: ${e.id} | NOME: ${e.nome}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
