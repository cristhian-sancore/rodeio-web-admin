const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const pdfData = [
  { nome: 'CARLOS RAFAEL LANA', touro: 'IMPÉRIO', cia: 'BS' },
  { nome: 'JOÃO PEDRO COELHO', touro: 'HERDEIRO', cia: 'NSA' },
  { nome: 'PEDRO MONTEIRO LANA', touro: 'CHEFE DO ESTADO', cia: 'JP DO PH' },
  { nome: 'GEAN CARLOS PIRES', touro: 'REVOLTADO', cia: 'LÉO BATISTA' },
  { nome: 'MAICON RODRIGUES', touro: 'ALAMBIQUE', cia: 'CANAÃ BUCKING BULLS' },
  { nome: 'RAFAEL HILBERT', touro: 'BLECAUTE', cia: 'JP DO PH' },
  { nome: 'VITOR RAFAEL ORTOLAN', touro: 'DOCINHO', cia: 'BS' },
  { nome: 'CRISTIANO CRUVINEL', touro: 'SHOW DA NOITE', cia: 'DAVI REZENDE' },
  { nome: 'LEONARDO FELIPE', touro: 'TREMOR', cia: 'CANAÃ BUCKING BULLS' },
  { nome: 'MARCIO DOS SANTOS', touro: 'DRACULA', cia: 'NSA' },
  { nome: 'GABRIEL SEDEGUM', touro: 'SEQUESTRO', cia: 'DAVI REZENDE' },
  { nome: 'JHON KENNEDY', touro: 'DOIS ESTADO', cia: 'JP DO PH' },
  { nome: 'RYAN ANDRÉ', touro: 'BUMERANGUE', cia: 'NEW BULLS E RANCHO ORTIZ' },
  { nome: 'CARLOS ANDRADE', touro: 'REI DA SAFRA', cia: 'CANAÃ BUCKING BULLS' },
  { nome: 'MATHEUS ANDRADE', touro: 'AFRICANO', cia: 'DAVI REZENDE' },
  { nome: 'ÍTALO LEITE', touro: 'BLACK BULL', cia: 'JP DO PH' },
  { nome: 'GABRIEL SILVEIRA', touro: 'CONGRESSO', cia: 'NEW BULLS E RANCHO ORTIZ' },
  { nome: 'WINY PAULO', touro: 'GUERREIRO', cia: 'LÉO BATISTA' },
  { nome: 'MARCOS SILVÉRIO', touro: 'TERRORISTA', cia: 'NEW BULLS E RANCHO ORTIZ' },
  { nome: 'DANTTON VINÍCIUS', touro: 'PRISIONEIRO', cia: 'BS' },
  { nome: 'MAURINIO GUILHERME', touro: 'MAJOR', cia: 'NEW BULLS E RANCHO ORTIZ' },
  { nome: 'GUSTAVO NUNES', touro: 'BALADEIRO', cia: 'DAVI REZENDE' },
  { nome: 'GUSTAVO HENRIQUE', touro: 'X 9', cia: 'LÉO BATISTA' },
  { nome: 'EVERTON DOMINGOS', touro: 'MAGO', cia: 'NSA' }
];

const reservas = [
  { touro: 'ÁCIDO', cia: 'NEW BULLS E RANCHO ORTIZ' },
  { touro: 'CONTRABANDO', cia: 'JP DO PH' },
  { touro: 'TRADIÇÃO', cia: 'CIA CANAÃ BUCKING BULLS' },
  { touro: 'ANJO MAL', cia: 'DAVI REZENDE' },
  { touro: 'BATE ESTACA', cia: 'BS' },
  { touro: 'CARA METADE', cia: 'CIA NSA' },
  { touro: 'NEGO RUSSO', cia: 'LÉO BATISTA' }
];

async function importFromPdf() {
  console.log('🚀 Iniciando Importação do PDF: RIBAS.pdf');

  // 1. Buscar Etapa e Round Ativos
  const etapa = await prisma.etapa.findFirst({ where: { ativa: true } });
  const round = await prisma.round.findFirst({ where: { etapaId: etapa.id }, orderBy: { numero: 'desc' } });

  if (!etapa || !round) {
    console.error('❌ Erro: Nenhuma Etapa ou Round ativo encontrado para importar.');
    return;
  }

  console.log(`📌 Importando para: ${etapa.nome} - Round ${round.numero}`);

  for (const item of pdfData) {
    // 2. Garantir Competidor
    let competidor = await prisma.competidor.findFirst({ where: { nome: item.nome } });
    if (!competidor) {
      console.log(`+ Cadastrando Peão: ${item.nome}`);
      competidor = await prisma.competidor.create({ data: { nome: item.nome, ranking: 0 } });
    }

    // 3. Garantir Animal
    let animal = await prisma.animal.findFirst({ where: { nome: item.touro } });
    if (!animal) {
      console.log(`+ Cadastrando Touro: ${item.touro} (${item.cia})`);
      animal = await prisma.animal.create({ data: { nome: item.touro, companhia: item.cia } });
    }

    // 4. Criar Montaria (Sorteio)
    await prisma.montaria.create({
      data: {
        competidorId: competidor.id,
        animalId: animal.id,
        roundId: round.id,
        etapaId: etapa.id
      }
    });
  }

  // 5. Cadastrar Reservas
  for (let i = 0; i < reservas.length; i++) {
    const res = reservas[i];
    let animal = await prisma.animal.findFirst({ where: { nome: res.touro } });
    if (!animal) {
        console.log(`+ Cadastrando Reserva: ${res.touro} (${res.cia})`);
        animal = await prisma.animal.create({ data: { nome: res.touro, companhia: res.cia } });
    }

    await prisma.roundReserva.create({
        data: {
            roundId: round.id,
            animalId: animal.id,
            ordem: i + 1
        }
    });
  }

  console.log('✅ Importação Concluída com Sucesso!');
}

importFromPdf()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
