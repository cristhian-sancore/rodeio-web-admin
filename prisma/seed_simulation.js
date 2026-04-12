const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando Simulação de Rodeio Profissional...");

  // 1. Criar Temporada
  const temporada = await prisma.temporada.create({
    data: {
      ano: 2026,
      titulo: "Simulação de Teste Pro - Barretos",
      ativa: true,
      premiaAte: 10,
    }
  });
  console.log(`✅ Temporada criada: ${temporada.titulo}`);

  // 2. Criar Etapa
  const etapa = await prisma.etapa.create({
    data: {
      nome: "Etapa Inaugural PG",
      cidade: "Barretos",
      estado: "SP",
      dataInicio: new Date(),
      dataFinal: new Date(Date.now() + 86400000 * 4),
      temporadaId: temporada.id,
      ativa: true
    }
  });
  console.log(`✅ Etapa criada: ${etapa.nome}`);

  // 3. Criar Round
  const round = await prisma.round.create({
    data: {
      numero: 1,
      etapaId: etapa.id,
      modalidade: "Touro",
      dataAgenda: new Date()
    }
  });
  console.log(`✅ Round ${round.numero} criado.`);

  // 4. Gerar 30 Competidores
  const competidoresNomes = [
    "José de Oliveira", "João Paulo Silveira", "Tiago dos Santos", "Marcos Pereira", "Lucas Lima",
    "Felipe Andrade", "Rafael Ferreira", "Gabriel Melo", "Rodrigo Costa", "Marcelo Silva",
    "Bruno Henrique", "Caio Vinícius", "Eduardo Souza", "Fernando Rocha", "Gustavo Lima",
    "Leonardo Alves", "Mateus Oliveira", "Natan Silva", "Otávio Mendes", "Paulo Borges",
    "Renato Garcia", "Samuel Antunes", "Victor Hugo", "William Silva", "Yuri Freitas",
    "Adriano Paiva", "Breno Lopes", "Cristiano Ronaldo", "Diego Souza", "Eliseu Martins"
  ];

  const competidores = await Promise.all(
    competidoresNomes.map((nome, index) => 
      prisma.competidor.create({
        data: {
          nome: `${nome} (${index + 1})`,
          cidade: "São José do Rio Preto",
          uf: "SP"
        }
      })
    )
  );
  console.log(`✅ ${competidores.length} Competidores cadastrados.`);

  // 5. Gerar 30 Animais (Touros)
  const tourosNomes = [
    "Agressivo", "Bipolar", "Carrasco", "Demônio", "Esquecido", "Fúria", "Gladiador", "Hulk", "Impacto", "Jangadeiro",
    "Kriptonita", "Lúcifer", "Matrix", "Nocaute", "Ouro Branco", "Pecado", "Quartel", "Relíquia", "Sentinela", "Tornado",
    "Urso", "Vortex", "Wolf", "Xerife", "Yakuza", "Zorro", "Assassino", "Besta", "Ciclone", "Diamante"
  ];
  const companhias = ["Cia 2M", "Cia Paulo Emílio", "Cia Califórnia", "Cia Tércio Miranda"];

  const animais = await Promise.all(
    tourosNomes.map((nome, index) => 
      prisma.animal.create({
        data: {
          nome: nome,
          companhia: companhias[index % companhias.length],
          tipo: "Touro"
        }
      })
    )
  );
  console.log(`✅ ${animais.length} Animais cadastrados.`);

  // 6. Gerar 30 Montarias
  const montarias = [];
  for (let i = 0; i < 30; i++) {
    const montaria = await prisma.montaria.create({
      data: {
        competidorId: competidores[i].id,
        animalId: animais[i].id,
        roundId: round.id,
        etapaId: etapa.id,
        notaTotal: 0,
        tempo: 0
      }
    });
    montarias.push(montaria);
  }
  console.log(`✅ ${montarias.length} Montarias geradas para o Round 1.`);

  // 7. Atualizar Configuração para a 1ª Montaria
  await prisma.configuracao.update({
    where: { id: 1 },
    data: {
      montariaAtivaId: montarias[0].id,
      timerRunning: false
    }
  });
  console.log("🎯 Sistema pronto! Primeira montaria ativada.");
}

main()
  .catch((e) => {
    console.error("❌ Erro na simulação:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
