const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Semeando Dados Completos de Ranking...');

  // 1. Temporada
  let temporada = await prisma.temporada.findFirst({ where: { ano: 2026 } });
  if (!temporada) {
    temporada = await prisma.temporada.create({
      data: { ano: 2026, titulo: 'TEMPORADA 2026', ativa: true }
    });
  }

  // 2. Competidores
  const c1 = await prisma.competidor.upsert({ where: { id: 1 }, update: { ranking: 1500 }, create: { id: 1, nome: 'ADRIANO MORAES', ranking: 1500, cidade: 'QUINTANA', uf: 'SP' } });
  const c2 = await prisma.competidor.upsert({ where: { id: 2 }, update: { ranking: 1400 }, create: { id: 2, nome: 'EDNEI CAMINHAS', ranking: 1400, cidade: 'S. PAULO', uf: 'SP' } });

  // 3. Animais
  const a1 = await prisma.animal.upsert({ where: { id: 1 }, update: {}, create: { id: 1, nome: 'REDUX', companhia: 'CIA 2M' } });
  const a2 = await prisma.animal.upsert({ where: { id: 2 }, update: {}, create: { id: 2, nome: 'ASTEROIDE', companhia: 'CIA CALIFORNIA' } });

  // 4. Etapa
  const etapa = await prisma.etapa.create({
    data: {
      nome: 'ETAPA DE ABERTURA',
      cidade: 'SÃO PAULO',
      estado: 'SP',
      dataInicio: new Date(),
      dataFinal: new Date(Date.now() + 86400000 * 3),
      ativa: true,
      temporadaId: temporada.id
    }
  });

  // 5. Round
  const round = await prisma.round.create({
    data: {
      numero: 1,
      etapaId: etapa.id,
      modalidade: 'Touro'
    }
  });

  // 6. Montarias (Notas reais para o ranking processar)
  await prisma.montaria.createMany({
    data: [
      {
        competidorId: c1.id,
        animalId: a1.id,
        roundId: round.id,
        etapaId: etapa.id,
        notaPeao: 45,
        notaAnimal: 45,
        notaTotal: 90,
        tempo: 8.0
      },
      {
        competidorId: c2.id,
        animalId: a2.id,
        roundId: round.id,
        etapaId: etapa.id,
        notaPeao: 44,
        notaAnimal: 44,
        notaTotal: 88,
        tempo: 8.0
      }
    ]
  });

  console.log('✅ Rankings processados e Arena Povoada!');
}

seed()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
