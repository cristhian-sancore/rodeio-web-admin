import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const config = await prisma.configuracao.findFirst();
    if (config) {
      await prisma.configuracao.update({
        where: { id: config.id },
        data: {
          primaryColor: '#d4af37',
          secondaryColor: '#111111'
        }
      });
      console.log("Cores restauradas via ORM!");
    } else {
      console.log("Nenhuma configuracao encontrada.");
    }
  } catch (e) {
    console.error("Erro ORM:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
