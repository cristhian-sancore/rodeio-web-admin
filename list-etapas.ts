import { prisma } from "./src/lib/db";

async function main() {
  const etapas = await prisma.etapa.findMany({ select: { id: true, nome: true } });
  console.log(JSON.stringify(etapas));
}

main();
