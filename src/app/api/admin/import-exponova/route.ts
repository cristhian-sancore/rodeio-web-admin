import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Dados extraídos do PDF: RESULTADO 1ª NOITE EXPONOVA XAVANTINA
const MONTARIAS_PDF = [
  { competidor: "MATHEUS ANDRADE DA SILVA", cidade: "CAMPO VERDE", uf: "MT", animal: "DESORDEIRO", tropeiro: "CANAÃ BUCKING BULLS", tempo: 8.00, j1Animal: 22.25, j1Peao: 23.00, j2Animal: 22.50, j2Peao: 23.50 },
  { competidor: "FELIPE TEIXEIRA MOURA", cidade: "SANTA TEREZINHA", uf: "MT", animal: "REI DA SAFRA", tropeiro: "CANAÃ BUCKING BULLS", tempo: 8.00, j1Animal: 21.75, j1Peao: 22.25, j2Animal: 22.00, j2Peao: 22.25 },
  { competidor: "RAFAEL HILBET DE PAULA", cidade: "CAMPO NOVO DOS PARECIS", uf: "MT", animal: "FÓRMULA MÁGICA", tropeiro: "TROPICAL", tempo: 8.00, j1Animal: 21.75, j1Peao: 22.50, j2Animal: 21.50, j2Peao: 22.00 },
  { competidor: "GABRIEL PEREIRA SEDEGUM", cidade: "GAÚCHA DO NORTE", uf: "MT", animal: "FACEBOOK", tropeiro: "TURA", tempo: 8.00, j1Animal: 21.25, j1Peao: 22.00, j2Animal: 21.50, j2Peao: 22.00 },
  { competidor: "AYSLAN JEFERSON DOS REIS SANTOS", cidade: "NOVA BRASILÂNDIA", uf: "MT", animal: "POETA", tropeiro: "MUNDO NOVO", tempo: 8.00, j1Animal: 21.50, j1Peao: 22.00, j2Animal: 21.50, j2Peao: 21.75 },
  { competidor: "CARLOS DANIEL LIMA ANDRADE", cidade: "TANGARÁ DA SERRA", uf: "MT", animal: "ENVOLVIDO", tropeiro: "MUNDO NOVO", tempo: 8.00, j1Animal: 21.25, j1Peao: 21.75, j2Animal: 21.00, j2Peao: 21.50 },
  { competidor: "DANIEL FERREIRA NEVES XAVIER", cidade: "ÁGUA BOA", uf: "MT", animal: "TRADICIONAL", tropeiro: "MUNDO NOVO", tempo: 8.00, j1Animal: 20.75, j1Peao: 21.25, j2Animal: 21.00, j2Peao: 21.50 },
  { competidor: "JOÃO PEDRO COELHO DA COSTA", cidade: "SANTA TEREZINHA", uf: "MT", animal: "TÁ LEGAL", tropeiro: "TURA", tempo: 8.00, j1Animal: 20.50, j1Peao: 21.00, j2Animal: 21.25, j2Peao: 21.50 },
  { competidor: "GUSTAVO HENRIQUE LEMOS DOS SANTOS", cidade: "TANGARÁ DA SERRA", uf: "MT", animal: "DO JOB", tropeiro: "RANCHO COUNTRY", tempo: 8.00, j1Animal: 21.00, j1Peao: 20.50, j2Animal: 21.00, j2Peao: 21.25 },
  { competidor: "SAMUEL ALVES SANTOS", cidade: "CASTANHEIRA", uf: "MT", animal: "SEGREDO DE ESTADO", tropeiro: "RANCHO COUNTRY", tempo: 8.00, j1Animal: 20.25, j1Peao: 20.50, j2Animal: 20.50, j2Peao: 20.50 },
  { competidor: "GABRYEL SILVA MENDONÇA", cidade: "CAMPINÁPOLIS", uf: "MT", animal: "DOCE AMARGO", tropeiro: "CANAÃ BUCKING BULLS", tempo: 8.00, j1Animal: 19.75, j1Peao: 20.50, j2Animal: 20.00, j2Peao: 20.50 },
  { competidor: "PATRÍCIO DE SANTANA SANTOS", cidade: "NOVA XAVANTINA", uf: "MT", animal: "PÓ DA GAITA", tropeiro: "RANCHO COUNTRY", tempo: 8.00, j1Animal: 17.00, j1Peao: 17.75, j2Animal: 17.25, j2Peao: 18.00 },
  // Desclassificados (caiu ou falta)
  { competidor: "IAGO BERTOLLO ARAUJO", cidade: "PLANALTO DA SERRA", uf: "MT", animal: "CÓDIGO PENAL", tropeiro: "TURA", tempo: 0, j1Animal: 19.00, j1Peao: 0, j2Animal: 19.25, j2Peao: 0, desclassificado: true },
  { competidor: "LUIZ AFONSO DOS SANTOS ÁVILA", cidade: "NOVA XAVANTINA", uf: "MT", animal: "AMOR ANTIGO", tropeiro: "MUNDO NOVO", tempo: 7.06, j1Animal: 20.50, j1Peao: 0, j2Animal: 21.50, j2Peao: 0, desclassificado: true },
  { competidor: "ANTÔNIO CARLOS VALADARES GARCIA", cidade: "BRASNORTE", uf: "MT", animal: "CARRASCO", tropeiro: "CANAÃ BUCKING BULLS", tempo: 5.85, j1Animal: 21.50, j1Peao: 0, j2Animal: 21.00, j2Peao: 0, desclassificado: true },
  { competidor: "ALEXANDRE PEREIRA LIMA RODRIGUES", cidade: "ÁGUA BOA", uf: "MT", animal: "GARIMPO", tropeiro: "TURA", tempo: 5.60, j1Animal: 17.50, j1Peao: 0, j2Animal: 18.00, j2Peao: 0, desclassificado: true },
  { competidor: "RICARDO MARTINS DOS SANTOS", cidade: "BRASNORTE", uf: "MT", animal: "SOBRENATURAL", tropeiro: "TROPICAL", tempo: 5.59, j1Animal: 20.25, j1Peao: 0, j2Animal: 20.50, j2Peao: 0, desclassificado: true },
  { competidor: "HIGOR MORAIS DA SILVA", cidade: "NOVA XAVANTINA", uf: "MT", animal: "BALANTINES", tropeiro: "TROPICAL", tempo: 5.41, j1Animal: 22.50, j1Peao: 0, j2Animal: 22.25, j2Peao: 0, desclassificado: true },
  { competidor: "EDIVALDO DOS SANTOS LUZ", cidade: "COCALINHO", uf: "MT", animal: "GLADIADOR", tropeiro: "TURA", tempo: 5.39, j1Animal: 21.50, j1Peao: 0, j2Animal: 21.75, j2Peao: 0, desclassificado: true },
  { competidor: "JHON KENNEDY ARAUJO JESUS", cidade: "CAMPINÁPOLIS", uf: "MT", animal: "SAPATO APERTADO", tropeiro: "TURA", tempo: 4.97, j1Animal: 22.25, j1Peao: 0, j2Animal: 22.00, j2Peao: 0, desclassificado: true },
  { competidor: "PABLO DE FREITAS INOCÊNCIO", cidade: "NOVA XAVANTINA", uf: "MT", animal: "TREMOR", tropeiro: "CANAÃ BUCKING BULLS", tempo: 4.82, j1Animal: 21.75, j1Peao: 0, j2Animal: 21.75, j2Peao: 0, desclassificado: true },
  { competidor: "HUGO FLAVIO DA SILVA", cidade: "SANTA CRUZ DO MONTE CASTELO", uf: "PR", animal: "KONGO", tropeiro: "TROPICAL", tempo: 3.75, j1Animal: 22.00, j1Peao: 0, j2Animal: 21.50, j2Peao: 0, desclassificado: true },
  { competidor: "JOÃO VITOR DA SILVA BRITO", cidade: "NOVA XAVANTINA", uf: "MT", animal: "RELÍQUIA", tropeiro: "RANCHO COUNTRY", tempo: 3.46, j1Animal: 21.50, j1Peao: 0, j2Animal: 21.75, j2Peao: 0, desclassificado: true },
  { competidor: "HILDEVAN SILVA RIBEIRO", cidade: "VILA RICA", uf: "MT", animal: "TO LIGADO", tropeiro: "TROPICAL", tempo: 3.19, j1Animal: 21.75, j1Peao: 0, j2Animal: 21.00, j2Peao: 0, desclassificado: true },
  { competidor: "FABIO FELIPE SANTOS PEREIRA", cidade: "SANTA CRUZ DO MONTE CASTELO", uf: "PR", animal: "MENTOR", tropeiro: "MUNDO NOVO", tempo: 0, j1Animal: 0, j1Peao: 0, j2Animal: 0, j2Peao: 0, desclassificado: true },
  // ReRiders
  { competidor: "IAGO BERTOLLO ARAUJO", cidade: "PLANALTO DA SERRA", uf: "MT", animal: "ÁREA VIP", tropeiro: "TURA", tempo: 7.45, j1Animal: 22.00, j1Peao: 0, j2Animal: 21.75, j2Peao: 0, desclassificado: true },
  { competidor: "FABIO FELIPE SANTOS PEREIRA", cidade: "SANTA CRUZ DO MONTE CASTELO", uf: "PR", animal: "EVEREST", tropeiro: "CANAÃ BUCKING BULLS", tempo: 2.49, j1Animal: 21.50, j1Peao: 0, j2Animal: 21.50, j2Peao: 0, desclassificado: true },
];

export async function GET() {
  try {
    const log: string[] = [];

    // 1. Buscar temporada ativa
    const temporada = await prisma.temporada.findFirst({ where: { ativa: true } });
    if (!temporada) return NextResponse.json({ error: "Nenhuma temporada ativa encontrada" }, { status: 400 });
    log.push(`✅ Temporada: ${temporada.titulo} (ID: ${temporada.id})`);

    // 2. Criar Juízes (se não existirem)
    let juiz1 = await prisma.juiz.findFirst({ where: { nome: { contains: "ALEX", mode: "insensitive" } } });
    if (!juiz1) {
      juiz1 = await prisma.juiz.create({ data: { nome: "ALEX DA SILVA DE ARAÚJO" } });
      log.push(`✅ Juiz 1 criado: ${juiz1.nome} (ID: ${juiz1.id})`);
    } else {
      log.push(`♻️ Juiz 1 já existe: ${juiz1.nome} (ID: ${juiz1.id})`);
    }

    let juiz2 = await prisma.juiz.findFirst({ where: { nome: { contains: "ANDERSON DANIEL", mode: "insensitive" } } });
    if (!juiz2) {
      juiz2 = await prisma.juiz.create({ data: { nome: "ANDERSON DANIEL REZENDE" } });
      log.push(`✅ Juiz 2 criado: ${juiz2.nome} (ID: ${juiz2.id})`);
    } else {
      log.push(`♻️ Juiz 2 já existe: ${juiz2.nome} (ID: ${juiz2.id})`);
    }

    // 3. Criar Etapa "Nova Xavantina"
    let etapa = await prisma.etapa.findFirst({ where: { nome: { contains: "Nova Xavantina", mode: "insensitive" } } });
    if (!etapa) {
      etapa = await prisma.etapa.create({
        data: {
          nome: "Nova Xavantina",
          cidade: "Nova Xavantina",
          estado: "MT",
          dataInicio: new Date("2026-05-01"),
          dataFinal: new Date("2026-05-04"),
          ativa: true,
          temporadaId: temporada.id,
          defaultJuiz1Id: juiz1.id,
          defaultJuiz2Id: juiz2.id,
        }
      });
      log.push(`✅ Etapa criada: ${etapa.nome} (ID: ${etapa.id})`);
    } else {
      log.push(`♻️ Etapa já existe: ${etapa.nome} (ID: ${etapa.id})`);
    }

    // 4. Criar Round 1
    let round = await prisma.round.findFirst({ where: { etapaId: etapa.id, numero: 1 } });
    if (!round) {
      round = await prisma.round.create({
        data: {
          numero: 1,
          etapaId: etapa.id,
          modalidade: "Touro",
          juiz1Id: juiz1.id,
          juiz2Id: juiz2.id,
        }
      });
      log.push(`✅ Round 1 criado (ID: ${round.id})`);
    } else {
      log.push(`♻️ Round 1 já existe (ID: ${round.id})`);
    }

    // 5. Importar cada montaria
    let created = 0;
    let competidoresCriados = 0;
    let animaisCriados = 0;

    for (const m of MONTARIAS_PDF) {
      // Buscar ou criar Competidor
      let competidor = await prisma.competidor.findFirst({
        where: { nome: { equals: m.competidor, mode: "insensitive" } }
      });
      if (!competidor) {
        competidor = await prisma.competidor.create({
          data: { nome: m.competidor, cidade: m.cidade, uf: m.uf }
        });
        competidoresCriados++;
      }

      // Buscar ou criar Animal
      let animal = await prisma.animal.findFirst({
        where: { nome: { equals: m.animal, mode: "insensitive" } }
      });
      if (!animal) {
        animal = await prisma.animal.create({
          data: { nome: m.animal, companhia: m.tropeiro, tipo: "Touro" }
        });
        animaisCriados++;
      }

      // Calcular notas
      const isDesclassificado = m.desclassificado || false;
      const notaPeao = m.j1Peao + m.j2Peao;
      const notaAnimal = m.j1Animal + m.j2Animal;
      const notaTotal = isDesclassificado ? 0 : (m.j1Peao + m.j1Animal + m.j2Peao + m.j2Animal);

      // Criar Montaria
      await prisma.montaria.create({
        data: {
          competidorId: competidor.id,
          animalId: animal.id,
          roundId: round.id,
          etapaId: etapa.id,
          j1Peao: m.j1Peao,
          j1Animal: m.j1Animal,
          j2Peao: m.j2Peao,
          j2Animal: m.j2Animal,
          notaPeao: notaPeao,
          notaAnimal: notaAnimal,
          notaTotal: notaTotal,
          tempo: m.tempo,
          desclassificado: isDesclassificado,
        }
      });
      created++;
    }

    log.push(`\n📊 RESUMO DA IMPORTAÇÃO:`);
    log.push(`   Competidores criados: ${competidoresCriados}`);
    log.push(`   Animais criados: ${animaisCriados}`);
    log.push(`   Montarias inseridas: ${created}`);
    log.push(`\n🏁 IMPORTAÇÃO CONCLUÍDA COM SUCESSO!`);

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    console.error("ERRO NA IMPORTAÇÃO:", error);
    return NextResponse.json({ 
      error: error.message, 
      stack: error.stack?.split("\n").slice(0, 5) 
    }, { status: 500 });
  }
}
