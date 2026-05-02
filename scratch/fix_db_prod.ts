
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando correção do banco de dados...");
  
  // 1. Limpar duplicatas na tabela Configuracao
  const count = await prisma.configuracao.count();
  console.log(`Registros em Configuracao: ${count}`);
  
  if (count > 1) {
    console.log("Removendo duplicatas...");
    await prisma.$executeRaw`DELETE FROM "Configuracao" WHERE id != 1`;
  }
  
  // 2. Garantir registro ID 1
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  if (!config) {
    console.log("Criando registro padrão ID 1...");
    await prisma.configuracao.create({
      data: { id: 1, titulo: "Rodeio Web", numJuizes: 2 }
    });
  } else {
    console.log("Registro ID 1 já existe.");
  }

  // 3. Limpar montaria ativa se estiver corrompida
  await prisma.configuracao.update({
    where: { id: 1 },
    data: { montariaAtivaId: null }
  });

  console.log("Correção concluída!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
