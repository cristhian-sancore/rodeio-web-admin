const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🤠 [SEED] Iniciando carga de dados de teste de elite v4...");

  // 1. Criar Temporada
  const temporada = await prisma.temporada.create({
    data: {
      titulo: "CAMPEONATO NACIONAL 2026",
      ano: 2026,
      ativa: true
    }
  });

  // 2. Criar Etapa
  const etapa = await prisma.etapa.create({
    data: {
      nome: "RODEIO DE BARRETOS - ELITE",
      cidade: "Barretos",
      estado: "SP",
      dataInicio: new Date(),
      dataFinal: new Date(),
      ativa: true,
      temporadaId: temporada.id
    }
  });

  // 3. Criar Round
  const round = await prisma.round.create({
    data: {
      numero: 1,
      etapaId: etapa.id,
      dataAgenda: new Date(),
      dataHora: new Date()
    }
  });

  // 4. Competidores
  const competidoresData = [
    { nome: "ADRIANO MORAES", cidade: "Quintana", uf: "SP" },
    { nome: "SILVANO ALVES", cidade: "Pilar do Sul", uf: "SP" },
    { nome: "GUILHERME MARCHI", cidade: "Itupeva", uf: "SP" },
    { nome: "JOSÉ VITOR LEME", cidade: "Ribas do Rio Pardo", uf: "MS" },
    { nome: "KAIQUE PACHECO", cidade: "Itatiba", uf: "SP" },
  ];

  const comps = [];
  for (const c of competidoresData) {
    const comp = await prisma.competidor.create({ data: c });
    comps.push(comp);
  }

  // 5. Animais
  const animaisData = [
    { nome: "BANDIDO", companhia: "Paulo Emílio", tipo: "Touro" },
    { nome: "AMETISTA", companhia: "Tércio Miranda", tipo: "Touro" },
    { nome: "FASCINAÇÃO", companhia: "Califórnia", tipo: "Touro" },
    { nome: "MISTÉRIO", companhia: "Guto Paglione", tipo: "Touro" },
  ];

  const ants = [];
  for (const a of animaisData) {
    const ant = await prisma.animal.create({ data: a });
    ants.push(ant);
  }

  // 6. Gerar Montarias
  console.log("🏇 Gerando montarias de 8 segundos...");
  for (let i = 0; i < comps.length; i++) {
    const notaP = 22 + Math.random() * 2;
    const notaA = 22 + Math.random() * 2;
    const notaT = (notaP + notaA) * 2;

    await prisma.montaria.create({
      data: {
        competidorId: comps[i].id,
        animalId: ants[i % ants.length].id,
        roundId: round.id,
        etapaId: etapa.id,
        j1Peao: notaP,
        j1Animal: notaA,
        j2Peao: notaP,
        j2Animal: notaA,
        notaPeao: notaP * 2,
        notaAnimal: notaA * 2,
        notaTotal: notaT,
        tempo: 8.0,
        dataHora: new Date()
      }
    });
  }

  console.log("✅ [SEED] Carga de elite concluída com sucesso! Divirta-se! 🏆🤠");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
