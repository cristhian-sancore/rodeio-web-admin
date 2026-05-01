import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCompetidorStageRank, getOverlayRankingData, getChampionshipRanking } from "@/lib/ranking";
import { getSafeConfig } from "@/lib/config-safe";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function getOverlayDataPayload() {
  try {
    const config = await getSafeConfig();

    if (!config) {
      return { active: false };
    }

    // Prioridade para Ranking se estiver ativo
    if (config.rankingMode && config.rankingMode !== 'OFF') {
      const activeMontaria = config.montariaAtivaId 
        ? await prisma.montaria.findUnique({ where: { id: config.montariaAtivaId }, select: { roundId: true, etapaId: true } })
        : null;

      const rankingData = await getOverlayRankingData(
        config.rankingMode, 
        activeMontaria?.roundId, 
        activeMontaria?.etapaId
      );

      return { 
        active: true, 
        mode: 'RANKING',
        rankingMode: config.rankingMode,
        rankingPage: config.rankingPage || 0,
        rankingData 
      };
    }

    if (!config?.montariaAtivaId) {
      return { active: false };
    }

    const montaria = await prisma.montaria.findUnique({
      where: { id: config.montariaAtivaId },
      include: {
        competidor: {
          include: { montarias: { where: { removida: false } } }
        },
        animal: {
          include: { montarias: { where: { removida: false } } }
        },
        round: { include: { juiz1: true, juiz2: true, juiz3: true, juiz4: true } }
      }
    });

    if (!montaria) {
      return { active: false };
    }

    // --- CÁLCULO DE ESTATÍSTICAS PARA A CHAMADA ---
    const etapaFull = await prisma.etapa.findUnique({ where: { id: montaria.etapaId }, select: { temporadaId: true } });
    const champRank = await getChampionshipRanking(etapaFull?.temporadaId || 1);
    const champList = Array.isArray(champRank?.list) ? champRank.list : [];
    const myChampPos = champList.find(r => r.competidorId === montaria.competidorId);
    
    const cMontarias = Array.isArray(montaria.competidor?.montarias) ? montaria.competidor.montarias : [];
    const paradas = cMontarias.filter(m => m.notaTotal > 8).length; 
    const totalMontarias = cMontarias.length;
    const percParadas = totalMontarias > 0 ? Math.round((paradas / totalMontarias) * 100) : 0;

    const aMontarias = Array.isArray(montaria.animal?.montarias) ? montaria.animal.montarias : [];
    const totalNotasAnimal = aMontarias.reduce((acc, m) => acc + m.notaAnimal, 0);
    const mediaAnimal = aMontarias.length > 0 ? (totalNotasAnimal / aMontarias.length).toFixed(2) : '0.00';

    const stageRankData = await getCompetidorStageRank(montaria.etapaId, montaria.competidorId) || { rank: 0, diff: 0, notaAcumulada: 0 };

    return {
      active: true,
      mode: config.overlayMode || 'ID', 
      numJuizes: config.numJuizes,
      rankingCongelado: (config as any).rankingCongelado,
      timerRunning: config.timerRunning,
      timerStartedAt: config.timerStartedAt,
      exibirCronometroNoOverlay: (config as any).exibirCronometroNoOverlay ?? true,
      serverTime: Date.now(),
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

        etapaRank: (stageRankData.rank || 0) > 0 ? `${stageRankData.rank}º` : '---',
        etapaDiff: (stageRankData.rank || 0) > 1 ? `-${(stageRankData.diff || 0).toFixed(2)}` : (stageRankData.rank === 1 ? 'LÍDER' : ''),
        etapaNotaAcumulada: (stageRankData.notaAcumulada || 0).toFixed(2),
        roundNumero: montaria.round.numero,
        
        // --- NOTAS INDIVIDUAIS E NOMES DOS JUIZES ---
        j1Nome: montaria.round.juiz1?.nome || 'J1',
        j1P: montaria.j1Peao,
        j1A: montaria.j1Animal,
        j1Total: (montaria.j1Peao + montaria.j1Animal).toFixed(2),

        j2Nome: montaria.round.juiz2?.nome || 'J2',
        j2P: montaria.j2Peao,
        j2A: montaria.j2Animal,
        j2Total: (montaria.j2Peao + montaria.j2Animal).toFixed(2),

        j3Nome: montaria.round.juiz3?.nome || 'J3',
        j3P: montaria.j3Peao,
        j3A: montaria.j3Animal,
        j3Total: (montaria.j3Peao + montaria.j3Animal).toFixed(2),

        j4Nome: montaria.round.juiz4?.nome || 'J4',
        j4P: montaria.j4Peao,
        j4A: montaria.j4Animal,
        j4Total: (montaria.j4Peao + montaria.j4Animal).toFixed(2),

        total: montaria.notaTotal.toFixed(2),
        tempo: montaria.tempo.toFixed(2),
        desclassificado: montaria.desclassificado
      }
    };

  } catch (error) {
    console.error("ERRO API OVERLAY:", error);
    return { active: false };
  }
}

export async function GET() {
  const data = await getOverlayDataPayload();
  return NextResponse.json(data);
}
