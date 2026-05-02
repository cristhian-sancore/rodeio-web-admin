const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--- CLEANING CONFIGURACAO ---");
  const configs = await prisma.configuracao.findMany();
  console.log("Found configs:", configs.length);
  
  if (configs.length > 1) {
    console.log("Multiple configs found! Keeping only ID 1 (or the first one if ID 1 missing).");
    for (const c of configs) {
      if (c.id !== 1) {
        console.log("Deleting config ID:", c.id);
        await prisma.configuracao.delete({ where: { id: c.id } });
      }
    }
  } else if (configs.length === 1 && configs[0].id !== 1) {
    console.log("Single config found but ID is not 1. Changing to ID 1.");
    const c = configs[0];
    await prisma.configuracao.delete({ where: { id: c.id } });
    await prisma.configuracao.create({
      data: { ...c, id: 1 }
    });
  } else if (configs.length === 0) {
    console.log("No config found. Creating default ID 1.");
    await prisma.configuracao.create({
      data: { id: 1, titulo: "Rodeio Web", numJuizes: 2 }
    });
  }
  
  console.log("Final Config ID 1 check:");
  const final = await prisma.configuracao.findUnique({ where: { id: 1 } });
  console.log(final);
  
  console.log("--- DONE ---");
}

main().catch(console.error).finally(() => prisma.$disconnect());
