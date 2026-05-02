const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--- INICIANDO REPARO DE SCHEMA ---");
  try {
    // Adicionar a coluna faltante
    await prisma.$executeRawUnsafe(`ALTER TABLE "Configuracao" ADD COLUMN IF NOT EXISTS "exibirCronometroNoOverlay" BOOLEAN DEFAULT true;`);
    console.log("✅ Coluna 'exibirCronometroNoOverlay' adicionada.");

    // Garantir ID 1 único
    await prisma.$executeRawUnsafe(`DELETE FROM "Configuracao" WHERE id != 1;`);
    console.log("✅ Duplicatas de configuração removidas.");

    // Criar se não existir
    const count = await prisma.configuracao.count();
    if (count === 0) {
      await prisma.configuracao.create({ data: { id: 1, titulo: "Rodeio Web", numJuizes: 2 } });
      console.log("✅ Registro padrão ID: 1 criado.");
    }

    console.log("--- REPARO CONCLUÍDO COM SUCESSO ---");
  } catch (err) {
    console.error("❌ Erro durante o reparo:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
