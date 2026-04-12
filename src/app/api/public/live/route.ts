import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCompetidorStageRank, getOverlayRankingData, getBestOfRound } from "@/lib/ranking";

export const dynamic = 'force-dynamic';
export const revalidate = 0; 

export async function GET() {
  try {
    const config = await prisma.configuracao.findUnique({
      where: { id: 1 },
      select: { 
        montariaAtivaId: true, 
        numJuizes: true,
        timerRunning: true,
        timerStartedAt: true,
        rankingMode: true
      }
    });

    // Dados base para o portal público
    let publicData: any = {
      active: false,
      mode: 'IDLE'
    };
    
    // Tentar descobrir Round e Etapa para os dados extras
    let rId: number | undefined;
    let eId: number | undefined;

    if (config?.montariaAtivaId) {
      const mAtiva = await prisma.montaria.findUnique({ where: { id: config.montariaAtivaId }, select: { roundId: true, etapaId: true } });
      rId = mAtiva?.roundId;
      eId = mAtiva?.etapaId;
    }

    if (!rId) {
      const lastRound = await prisma.round.findFirst({ orderBy: { id: 'desc' } });
      rId = lastRound?.id;
      eId = lastRound?.etapaId;
    }

    if (rId && eId) {
      const [melhorNoite, rankingEtapa] = await Promise.all([
        getBestOfRound(rId),
        getOverlayRankingData('ETAPA_COMPETIDOR', rId)
      ]);
      publicData.melhorNoite = melhorNoite;
      publicData.rankingEtapa = rankingEtapa;
    }

    // Se o ranking estiver ativo no admin
    if (config?.rankingMode && config.rankingMode !== 'OFF') {
      const rankingData = await getOverlayRankingData(config.rankingMode);
      publicData.active = true;
      publicData.mode = 'RANKING';
      publicData.rankingMode = config.rankingMode;
      publicData.rankingData = rankingData;
    }

    // Se houver montaria ativa
    if (config?.montariaAtivaId) {
      const montaria = await prisma.montaria.findUnique({
        where: { id: config.montariaAtivaId },
        include: {
          competidor: true,
          animal: true,
        }
      });

      if (montaria) {
        publicData.active = true;
        publicData.mode = publicData.mode === 'RANKING' ? 'RANKING' : 'MOUNT';
        publicData.timerRunning = config.timerRunning;
        publicData.timerStartedAt = config.timerStartedAt;
        publicData.data = {
          id: montaria.id,
          competidor: montaria.competidor.nome,
          cidade: montaria.competidor.cidade,
          animal: montaria.animal.nome,
          companhia: montaria.animal.companhia,
          total: montaria.notaTotal.toFixed(2),
          tempo: montaria.tempo.toFixed(2),
          desclassificado: montaria.desclassificado
        };
      }
    }

    return NextResponse.json(publicData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    });
  } catch (error) {
    console.error("ERRO API PUBLIC LIVE:", error);
    return NextResponse.json({ error: "Erro ao gerar dados públicos" }, { status: 500 });
  }
}
