const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.configuracao.update({
    where: { id: 1 },
    data: { 
      googleDriveApiKey: 'AIzaSyDOd77GqEie2svpVsSBtpWO4YeF4BYhmiE' 
    }
  });
  console.log('✅ API Key applied successfully in the database.');
}

main()
  .catch(err => {
    console.error('❌ Error applying API Key:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
