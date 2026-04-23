import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCompetidorStageRank, getOverlayRankingData, getChampionshipRanking } from "@/lib/ranking";
import { getSafeConfig } from "@/lib/config-safe";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const config = await getSafeConfig();

    if (!config) {
      return NextResponse.json({ active: false });
    }

    // Prioridade para Ranking se estiver ativo
    if (config.rankingMode && config.rankingMode !== 'OFF') {
      const rankingData = await getOverlayRankingData(config.rankingMode);
      return NextResponse.json({ 
        active: true, 
        mode: 'RANKING',
        rankingMode: config.rankingMode,
        rankingPage: config.rankingPage || 0,
        rankingData 
      });
    }

    if (!config?.montariaAtivaId) {
      return NextResponse.json({ active: false });
    }

    const montaria = await prisma.montaria.findUnique({
      where: { id: config.montariaAtivaId },
      include: {
        competidor: {
          include: { montarias: true }
        },
        animal: {
          include: { montarias: true }
        },
        round: { include: { juiz1: true, juiz2: true, juiz3: true, juiz4: true } }
      }
    });

    if (!montaria) {
      return NextResponse.json({ active: false });
    }

    // --- CÁLCULO DE ESTATÍSTICAS PARA A CHAMADA ---
    
    // Peão: Ranking no Campeonato, % de Paradas
    const champRank = await getChampionshipRanking(montaria.round.etapaId); // Usamos etapaId para buscar temporadaId internamente
    const myChampPos = champRank?.list?.find(r => r.competidorId === montaria.competidorId);
    
    const paradas = montaria.competidor.montarias.filter(m => m.notaTotal > 0).length;
    const totalMontarias = montaria.competidor.montarias.length;
    const percParadas = totalMontarias > 0 ? Math.round((paradas / totalMontarias) * 100) : 0;

    // Animal: Média Histórica
    const totalNotasAnimal = montaria.animal.montarias.reduce((acc, m) => acc + m.notaAnimal, 0);
    const mediaAnimal = montaria.animal.montarias.length > 0 ? (totalNotasAnimal / montaria.animal.montarias.length).toFixed(2) : '0.00';

    const stageRankData = await getCompetidorStageRank(montaria.etapaId, montaria.competidorId);

    return NextResponse.json({
      active: true,
      mode: config.overlayMode || 'ID', // ID ou CHAMADA
      numJuizes: config.numJuizes,
      timerRunning: config.timerRunning,
      timerStartedAt: config.timerStartedAt,
      data: {
        id: montaria.id,
        competidor: montaria.competidor.nome,
        competidorFoto: (montaria.competidor as any).fotoUrl || 'https://rodeio.cristhiansancore.com.br/default-rider.png',
        competidorCidade: montaria.competidor.cidade,
        competidorRankChamp: myChampPos ? `${myChampPos.pos}º` : '---',
        competidorParadas: `${percParadas}%`,
        
        animal: montaria.animal.nome,
        animalFoto: (montaria.animal as any).fotoUrl || 'https://rodeio.cristhiansancore.com.br/default-animal.png',
        animalCompanhia: montaria.animal.companhia,
        animalMedia: mediaAnimal,

        etapaRank: stageRankData.rank > 0 ? `${stageRankData.rank}º` : '---',
        etapaDiff: stageRankData.rank > 1 ? `-${stageRankData.diff.toFixed(2)}` : (stageRankData.rank === 1 ? 'LÍDER' : ''),
        
        // Notas (Simplificado para o JSON do gráfico)
        j1Total: (montaria.j1Peao + montaria.j1Animal).toFixed(1),
        j2Total: (montaria.j2Peao + montaria.j2Animal).toFixed(1),
        j3Total: (montaria.j3Peao + montaria.j3Animal).toFixed(1),
        j4Total: (montaria.j4Peao + montaria.j4Animal).toFixed(1),
        total: montaria.notaTotal.toFixed(2),
        tempo: montaria.tempo.toFixed(2),
        desclassificado: montaria.desclassificado
      }
    });

  } catch (error) {
    console.error("ERRO API OVERLAY:", error);
    return NextResponse.json({ active: false });
  }
}
