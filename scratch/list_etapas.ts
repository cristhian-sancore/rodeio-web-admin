import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const etapas = await prisma.etapa.findMany({ select: { id: true, nome: true } });
  console.log(JSON.stringify(etapas, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
