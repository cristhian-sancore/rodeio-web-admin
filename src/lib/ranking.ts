import { prisma } from "./db";

export async function getRanking(params: { etapaId?: number; temporadaId?: number }) {
  const { etapaId, temporadaId } = params;

  // 1. Buscar montarias filtradas
  const montarias = await prisma.montaria.findMany({
    where: {
      removida: false,
      ...(etapaId ? { etapaId } : {}),
      ...(temporadaId ? { etapa: { temporadaId } } : {}),
    },
    include: { competidor: true, animal: true, round: true, etapa: { include: { temporada: true } } }
  });

  const statsPeoes: Record<number, any> = {};
  const statsAnimais: Record<number, any> = {};

  // Agrupar por Etapa para calcular pontos de liga (apenas se estivermos olhando a temporada inteira ou quisermos os bônus)
  const etapaGroups: Record<number, any[]> = {};
  montarias.forEach(m => {
    if (!etapaGroups[m.etapaId]) etapaGroups[m.etapaId] = [];
    etapaGroups[m.etapaId].push(m);
  });

  // Processar cada etapa para calcular ranking de etapa e pontos de liga
  Object.keys(etapaGroups).forEach(id => {
    const eId = parseInt(id);
    const ms = etapaGroups[eId];
    const temp = ms[0].etapa.temporada;
    
    const classificacaoEtapa: Record<number, any> = {};
    
    ms.forEach(m => {
      // Stats Peão
      if (!statsPeoes[m.competidorId]) {
        statsPeoes[m.competidorId] = { id: m.competidorId, nome: m.competidor.nome, origem: `${m.competidor.cidade || ''}-${m.competidor.uf || ''}`, notaAcumulada: 0, pontosLiga: 0, tempoTotal: 0 };
      }
      statsPeoes[m.competidorId].notaAcumulada += m.notaTotal;
      statsPeoes[m.competidorId].tempoTotal += m.tempo;

      // Classificação interna da etapa para distribuir pontos de liga
      if (!classificacaoEtapa[m.competidorId]) classificacaoEtapa[m.competidorId] = { id: m.competidorId, pontos: 0, tempo: 0, cpts: 0 };
      classificacaoEtapa[m.competidorId].pontos += m.notaTotal;
      classificacaoEtapa[m.competidorId].tempo += m.tempo;
      classificacaoEtapa[m.competidorId].cpts += m.notaTotal; // 🏆 NOTA DA ARENA SOMA NO CAMPEONATO (Padrão CNAR)
      
      if (m.notaTotal >= 90) classificacaoEtapa[m.competidorId].cpts += (temp.bonusNotasAcima90 || 0);

      // Stats Animais
      if (m.round.modalidade === 'Touro') {
        if (!statsAnimais[m.animalId]) {
          statsAnimais[m.animalId] = { id: m.animalId, nome: m.animal.nome, cia: m.animal.companhia, somaNotas: 0, qtd: 0 };
        }
        statsAnimais[m.animalId].somaNotas += m.notaAnimal;
        statsAnimais[m.animalId].qtd += 1;
      }
    });

    // Ranking da Etapa para distribuir pontos de campeonato
    const rankingSorted = Object.values(classificacaoEtapa).sort((a: any, b: any) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      return b.tempo - a.tempo;
    });

    const ptsEtapa = [temp.ptsEtapa1, temp.ptsEtapa2, temp.ptsEtapa3, temp.ptsEtapa4, temp.ptsEtapa5, temp.ptsEtapa6, temp.ptsEtapa7, temp.ptsEtapa8, temp.ptsEtapa9, temp.ptsEtapa10];
    rankingSorted.forEach((r: any, idx) => {
      if (idx < 10) r.cpts += (ptsEtapa[idx] || 0);
      if (idx === 0) r.cpts += (temp.bonusMelhorNotaEtapa || 0);
      if (statsPeoes[r.id]) statsPeoes[r.id].pontosLiga += r.cpts;
    });
  });

  const peoes = Object.values(statsPeoes).sort((a: any, b: any) => {
    if (etapaId) {
      // Se for ranking de ETAPA, ordena por nota acumulada
      if (b.notaAcumulada !== a.notaAcumulada) return b.notaAcumulada - a.notaAcumulada;
      return b.tempoTotal - a.tempoTotal;
    } else {
      // Se for ranking de CAMPEONATO, ordena por pontos de liga
      if (b.pontosLiga !== a.pontosLiga) return b.pontosLiga - a.pontosLiga;
      return b.notaAcumulada - a.notaAcumulada;
    }
  });

  const touros = Object.values(statsAnimais).map((a: any) => ({ ...a, media: a.somaNotas / (a.qtd || 1) })).sort((a: any, b: any) => b.media - a.media);

  return { peoes, touros };
}

export async function getTopHighlights() {
  const { peoes, touros } = await getRanking({});
  const temporada = await prisma.temporada.findFirst({ where: { ativa: true } });
  const etapa = await prisma.etapa.findFirst({ where: { ativa: true }, orderBy: { id: 'desc' } });

  return {
    etapaNome: etapa?.nome || 'Etapa Atual',
    campeonatoNome: temporada?.titulo || 'Campeonato 2026',
    etapaCompetidor: peoes[0] ? { nome: peoes[0].nome, nota: peoes[0].notaAcumulada.toFixed(1), competidorId: peoes[0].id } : null,
    etapaAnimal: touros[0] ? { nome: touros[0].nome, nota: touros[0].media.toFixed(2), animalId: touros[0].id, info: touros[0].cia } : null,
    campeonatoCompetidor: peoes[0] ? { nome: peoes[0].nome, nota: peoes[0].pontosLiga.toFixed(1), competidorId: peoes[0].id } : null,
    campeonatoAnimal: touros[0] ? { nome: touros[0].nome, nota: touros[0].media.toFixed(2), animalId: touros[0].id, info: touros[0].cia } : null,
  };
}

export async function getCompetidorStageRank(etapaId: number, competidorId: number) {
  const { peoes } = await getRanking({ etapaId });
  const idx = peoes.findIndex((p: any) => p.id === competidorId);
  const firstPlacePoints = peoes[0]?.notaAcumulada || 0;
  const myPoints = peoes[idx]?.notaAcumulada || 0;
  
  return { 
    rank: idx + 1,
    diff: firstPlacePoints - myPoints
  };
}

export async function getBestOfRound(roundId: number) {
  const montaria = await prisma.montaria.findFirst({
    where: { roundId, desclassificado: false, removida: false },
    orderBy: { notaTotal: 'desc' },
    include: { competidor: true, animal: true }
  });
  if (!montaria) return null;
  return { nome: montaria.competidor.nome, animal: montaria.animal.nome, nota: montaria.notaTotal.toFixed(2) };
}

export async function getOverlayRankingData(mode: string, roundId?: number, etapaId?: number, temporadaId?: number) {
  const isCampeonato = mode.includes('CAMPEONATO');
  const { peoes, touros } = await getRanking({ etapaId: isCampeonato ? undefined : etapaId, temporadaId });

  if (mode.includes('ANIMAL')) {
     return { list: touros.map((t, idx) => ({ pos: idx + 1, nome: t.nome, info: t.cia, nota: t.media.toFixed(2), animalId: t.id })) };
  }
  
  return { 
    list: peoes.map((p, idx) => ({ 
      pos: idx + 1, 
      nome: p.nome, 
      info: p.origem, 
      nota: (isCampeonato ? p.pontosLiga : p.notaAcumulada).toFixed(1), 
      competidorId: p.id 
    })) 
  };
}

export async function getCompetidorRanking(mode: string, roundId?: number, etapaId?: number, temporadaId?: number, modalidade?: string) {
   return getOverlayRankingData(mode, roundId, etapaId, temporadaId);
}

export async function getAnimalRanking(mode: string, roundId?: number, etapaId?: number, temporadaId?: number, modalidade?: string) {
   return getOverlayRankingData(mode, roundId, etapaId, temporadaId);
}

export async function getChampionshipRanking(temporadaId: number, modalidade?: string) {
   return getOverlayRankingData('CAMPEONATO_COMPETIDOR', undefined, undefined, temporadaId);
}

export async function getSeasonRanking() {
   return getRanking({});
}
