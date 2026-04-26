const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.configuracao.updateMany({
    data: {
      homeHeroImage: null
    }
  });
  console.log('Reset da imagem hero concluído.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
