import { getOverlayRankingData } from "@/lib/ranking";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = await prisma.configuracao.findFirst();
    if (!config || !config.rankingMode || config.rankingMode === 'OFF') {
      return NextResponse.json({ active: false });
    }

    // Tentar descobrir o Round/Etapa ativo baseado na montaria selecionada
    let roundId = 0;
    let etapaId = 0;
    let temporadaId = 0;

    if (config.montariaAtivaId) {
      const m = await prisma.montaria.findUnique({
        where: { id: config.montariaAtivaId },
        include: { round: true, etapa: true }
      });
      if (m) {
        roundId = m.roundId;
        etapaId = m.etapaId;
        temporadaId = m.etapa.temporadaId;
      }
    }

    // Se não houver montaria ativa, pegamos o último round/etapa criados como fallback
    if (!roundId) {
      const lastRound = await prisma.round.findFirst({ orderBy: { id: 'desc' }, include: { etapa: true } });
      if (lastRound) {
        roundId = lastRound.id;
        etapaId = lastRound.etapaId;
        temporadaId = lastRound.etapa.temporadaId;
      }
    }

    const data = await getOverlayRankingData(config.rankingMode, roundId, etapaId, temporadaId);
    
    // Aplicar Paginação (10 por página)
    const page = config.rankingPage || 0;
    const itemsPerPage = 10;
    const pagedList = data.list.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    return NextResponse.json({
      active: true,
      title: data.title,
      mode: config.rankingMode,
      list: pagedList,
      totalItems: data.list.length,
      page,
      totalPages: Math.ceil(data.list.length / itemsPerPage)
    });
  } catch (err) {
    console.error('❌ ERRO NO API/OVERLAY/RANKING:', err);
    return NextResponse.json({ error: 'Falha ao buscar ranking do overlay' }, { status: 500 });
  }
}
