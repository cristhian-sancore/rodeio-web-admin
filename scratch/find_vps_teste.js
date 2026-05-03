const { PrismaClient } = require('@prisma/client');
// Conectando diretamente na VPS
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://rodeio_admin:rodeio_secure_pass_2026@portainer.cristhiansancore.com.br:5432/rodeio_db?schema=public'
    }
  }
});
async function main() {
  const etapas = await prisma.etapa.findMany({
    where: { nome: { contains: 'teste', mode: 'insensitive' } }
  });
  console.log('ETAPAS ENCONTRADAS NA VPS:');
  console.log(JSON.stringify(etapas, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
