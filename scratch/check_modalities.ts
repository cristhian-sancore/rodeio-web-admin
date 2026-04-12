import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const rounds = await prisma.round.findMany({
    select: { modalidade: true, nome: true, etapaId: true }
  });
  
  const modalities = [...new Set(rounds.map(r => r.modalidade))];
  console.log('Modalidades únicas:', modalities);
  
  const sampleRounds = rounds.slice(0, 10);
  console.log('Amostra de Rounds:', JSON.stringify(sampleRounds, null, 2));
}

main().finally(() => prisma.$disconnect());
