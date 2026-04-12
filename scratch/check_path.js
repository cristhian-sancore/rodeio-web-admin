const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.configuracao.findUnique({where:{id:1}});
  console.log('--- ACTUAL DB CONFIG ---');
  console.log('Replay Export Path:', c?.replayExportPath);
  console.log('Full Config:', JSON.stringify(c, null, 2));
}
main().finally(() => prisma.$disconnect());
