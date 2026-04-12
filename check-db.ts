import { prisma } from "./src/lib/db";

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, username: true } });
  console.log("USERS:", JSON.stringify(users));
  const etapas = await prisma.etapa.findMany({ select: { id: true, nome: true } });
  console.log("ETAPAS:", JSON.stringify(etapas));
  const montarias = await prisma.montaria.findMany({
    include: { competidor: true, animal: true }
  });
  console.log("MONTARIAS:", JSON.stringify(montarias));
}

main();
