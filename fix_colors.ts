import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`UPDATE "Configuracao" SET "primaryColor" = '#d4af37', "secondaryColor" = '#111111' WHERE id = 1;`);
    console.log("Cores restauradas no banco de dados com sucesso!");
  } catch (e) {
    console.error("Erro ao atualizar o banco de dados via Raw SQL:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
