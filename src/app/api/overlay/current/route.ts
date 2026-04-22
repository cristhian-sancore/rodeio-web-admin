import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCompetidorStageRank, getOverlayRankingData } from "@/lib/ranking";
import { getSafeConfig } from "@/lib/config-safe";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Desativar cache do Next.js para esta rota

export async function GET() {
  try {
    const config = await getSafeConfig();

    if (!config) {
      return NextResponse.json({ active: false });
    }

    // Se o ranking estiver ativo, priorizamos os dados do ranking
    if (config.rankingMode && config.rankingMode !== 'OFF') {
      const rankingData = await getOverlayRankingData(config.rankingMode);
      return NextResponse.json({ 
        active: true, 
        mode: 'RANKING',
        rankingMode: config.rankingMode,
        rankingPage: config.rankingPage || 0,
        rankingData 
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        }
      });
    }

    if (!config?.montariaAtivaId) {
      return NextResponse.json({ active: false });
    }

    const montaria = await prisma.montaria.findUnique({
      where: { id: config.montariaAtivaId },
      include: {
        competidor: true,
        animal: true,
        round: {
          include: {
            juiz1: true,
            juiz2: true,
            juiz3: true,
            juiz4: true,
          }
        }
      }
    });

    if (!montaria) {
      return NextResponse.json({ active: false });
    }

    // Calcular Ranking da Etapa
    const stageRankData = await getCompetidorStageRank(montaria.etapaId, montaria.competidorId);
    const numJuizes = config.numJuizes;

    // Nota individual do juiz é exibida como foi dada (sem divisão)
    const formatValue = (val: number) => val.toFixed(1);

    // Total de um juiz = soma peão + animal (sem divisão)
    const calculateJudgeTotal = (p: number, a: number) => (p + a).toFixed(2);

    return new NextResponse(JSON.stringify({
      active: true,
      numJuizes: config.numJuizes,
      timerRunning: config.timerRunning,
      timerStartedAt: config.timerStartedAt,
      data: {
        id: montaria.id,
        competidor: montaria.competidor.nome,
        cidade: montaria.competidor.cidade,
        animal: montaria.animal.nome,
        companhia: montaria.animal.companhia,
        etapaRank: stageRankData.rank > 0 ? `${stageRankData.rank}º` : '---',
        etapaDiff: stageRankData.rank > 0 ? (stageRankData.rank === 1 ? 'LÍDER' : `-${stageRankData.diff.toFixed(2)}`) : '',
        j1Nome: montaria.round.juiz1?.nome || 'JUIZ 1',
        j2Nome: montaria.round.juiz2?.nome || 'JUIZ 2',
        j3Nome: montaria.round.juiz3?.nome || 'JUIZ 3',
        j4Nome: montaria.round.juiz4?.nome || 'JUIZ 4',
        j1P: formatValue((montaria.tempo < 8 || montaria.desclassificado) ? 0 : montaria.j1Peao),
        j1A: formatValue(montaria.j1Animal),
        j2P: formatValue((montaria.tempo < 8 || montaria.desclassificado) ? 0 : montaria.j2Peao),
        j2A: formatValue(montaria.j2Animal),
        j3P: formatValue((montaria.tempo < 8 || montaria.desclassificado) ? 0 : montaria.j3Peao),
        j3A: formatValue(montaria.j3Animal),
        j4P: formatValue((montaria.tempo < 8 || montaria.desclassificado) ? 0 : montaria.j4Peao),
        j4A: formatValue(montaria.j4Animal),
        j1Total: calculateJudgeTotal((montaria.tempo < 8 || montaria.desclassificado ? 0 : montaria.j1Peao), montaria.j1Animal),
        j2Total: calculateJudgeTotal((montaria.tempo < 8 || montaria.desclassificado ? 0 : montaria.j2Peao), montaria.j2Animal),
        j3Total: calculateJudgeTotal((montaria.tempo < 8 || montaria.desclassificado ? 0 : montaria.j3Peao), montaria.j3Animal),
        j4Total: calculateJudgeTotal((montaria.tempo < 8 || montaria.desclassificado ? 0 : montaria.j4Peao), montaria.j4Animal),
        total: montaria.notaTotal.toFixed(2),
        tempo: montaria.tempo.toFixed(2),
        desclassificado: montaria.desclassificado,
        motivo: montaria.motivo
      },
      serverTime: Date.now()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("ERRO API OVERLAY:", error);
    return NextResponse.json({ error: "Erro ao buscar montaria ativa" }, { status: 500 });
  }
}
