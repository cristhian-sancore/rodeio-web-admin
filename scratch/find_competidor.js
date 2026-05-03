const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const name = "- DATARODEO - BY LUMORAES 19-981816473";
  const competidor = await prisma.competidor.findFirst({
    where: { nome: name }
  });

  if (!competidor) {
    console.log("Competidor não encontrado.");
  } else {
    console.log(`ID: ${competidor.id}`);
    const montarias = await prisma.montaria.findMany({
        where: { competidorId: competidor.id }
    });
    console.log(`Montarias vinculadas: ${montarias.length}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
