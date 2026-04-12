const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Limpando dados antigos...");
    await prisma.montaria.deleteMany();
    await prisma.round.deleteMany();
    await prisma.etapa.deleteMany();
    await prisma.juiz.deleteMany();
    await prisma.competidor.deleteMany();
    await prisma.animal.deleteMany();
    await prisma.temporada.deleteMany();

    console.log("Iniciando carga de dados de teste (4 Juízes)...");

    // 1. Temporada
    const temporada = await prisma.temporada.create({
      data: { ano: 2026, titulo: "Temporada Pro 2026" }
    });

    // 2. Juízes
    const juizes = await Promise.all([
      prisma.juiz.create({ data: { nome: "Tiago Arantes", cidade: "Barretos", uf: "SP" } }),
      prisma.juiz.create({ data: { nome: "Marcelo Rocha", cidade: "Colorado", uf: "PR" } }),
      prisma.juiz.create({ data: { nome: "Elias José", cidade: "Rio Verde", uf: "GO" } }),
      prisma.juiz.create({ data: { nome: "Neto Silva", cidade: "Bauru", uf: "SP" } })
    ]);

    // 3. Competidor e Animal
    const peao = await prisma.competidor.create({ data: { nome: "Adriano Moraes", cidade: "Quintana", uf: "SP" } });
    const animal = await prisma.animal.create({ data: { nome: "Acarai", companhia: "Cia Paulo Emílio", tipo: "Touro" } });

    // 4. Etapa e Round
    const etapa = await prisma.etapa.create({
      data: {
        nome: "Grand Slam Barretos",
        cidade: "Barretos",
        estado: "SP",
        dataInicio: new Date("2026-08-20"),
        dataFinal: new Date("2026-08-24"),
        bonusMelhorNotaNoite: 5,
        bonusMelhorNotaEtapa: 10,
        premiaAte: 5,
        temporadaId: temporada.id
      }
    });

    const round = await prisma.round.create({
      data: { numero: 1, etapaId: etapa.id }
    });

    // 5. Montaria com 4 Juízes
    // J1: 22P + 23A = 45
    // J2: 23P + 23A = 46
    // J3: 22P + 22A = 44
    // J4: 23P + 23A = 46
    // Soma = 181. / 2 = 90.50
    // Lógica interna do sistema salva as médias quando são 4 juízes
    
    await prisma.montaria.create({
      data: {
        competidorId: peao.id,
        animalId: animal.id,
        roundId: round.id,
        j1Peao: 22, j1Animal: 23,
        j2Peao: 23, j2Animal: 23,
        j3Peao: 22, j3Animal: 22,
        j4Peao: 23, j4Animal: 23,
        notaPeao: 45,    // (22+23+22+23)/2
        notaAnimal: 45.5,  // (23+23+22+23)/2
        notaTotal: 90.5,
        tempo: 8.00
      }
    });

    console.log("Carga de teste finalizada com sucesso!");
    console.log("Nota do Adriano Moraes: 90.50 pts (Calculado com divisor de 4 juízes)");
  } catch (e) {
    console.error("Erro no seed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
