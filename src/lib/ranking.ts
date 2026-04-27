import { prisma } from "./db";

export async function getRanking(params: { roundId?: number; etapaId?: number; temporadaId?: number }) {
  const { roundId, etapaId, temporadaId } = params;

  // 1. Buscar montarias filtradas
  const montarias = await prisma.montaria.findMany({
    where: {
      removida: false,
      ...(roundId ? { roundId } : {}),
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
    const etapaObj = ms[0].etapa;
    const temp = etapaObj.temporada;

    // 🏁 Critério de Etapa Finalizada: Inativa OU (Passou da data e sem pendências)
    const agora = new Date();
    const dataFinal = new Date(etapaObj.dataFinal);
    const temPendencia = ms.some(m => m.notaTotal === 0 && !m.desclassificado && m.tempo === 0);
    const isEtapaFinalizada = !etapaObj.ativa || (agora > dataFinal && !temPendencia);
    
    const classificacaoEtapa: Record<number, any> = {};
    
    // 🏆 DECISÃO DE ACÚMULO GLOBAL: Só soma no campeonato se a etapa estiver encerrada
    // Se estivermos vendo o ranking de UMA ETAPA ESPECÍFICA (etapaId presente), somamos sempre.
    const isGlobalSeasonRanking = !!temporadaId && !etapaId;
    const shouldAccumulateToSeason = !isGlobalSeasonRanking || isEtapaFinalizada;

    ms.forEach(m => {
      // Stats Peão
      if (!statsPeoes[m.competidorId]) {
        statsPeoes[m.competidorId] = { id: m.competidorId, nome: m.competidor.nome, origem: `${m.competidor.cidade || ''}-${m.competidor.uf || ''}`, notaAcumulada: 0, pontosLiga: 0, tempoTotal: 0, paradas: 0, fotoUrl: m.competidor.fotoUrl };
      }

      // Se for ranking de etapa OU etapa finalizada, soma a arena
      if (shouldAccumulateToSeason) {
        statsPeoes[m.competidorId].notaAcumulada += m.notaTotal;
      }
      
      statsPeoes[m.competidorId].tempoTotal += m.tempo;
      if (m.tempo >= 8) statsPeoes[m.competidorId].paradas += 1;

      // Classificação interna da etapa para distribuir pontos de liga
      if (!classificacaoEtapa[m.competidorId]) classificacaoEtapa[m.competidorId] = { id: m.competidorId, pontos: 0, tempo: 0, cpts: 0 };
      classificacaoEtapa[m.competidorId].pontos += m.notaTotal;
      classificacaoEtapa[m.competidorId].tempo += m.tempo;
      
      // 🏆 NOTA DA ARENA: Base para pontos de liga
      classificacaoEtapa[m.competidorId].cpts += m.notaTotal; 
      
      // 🎁 BÔNUS DE NOTA 90+: Apenas se etapa finalizada
      if (isEtapaFinalizada && m.notaTotal >= 90) {
        classificacaoEtapa[m.competidorId].cpts += (temp?.bonusNotasAcima90 || 0);
      }

      // Stats Animais
      if (m.round.modalidade === 'Touro') {
        if (!statsAnimais[m.animalId]) {
          statsAnimais[m.animalId] = { id: m.animalId, nome: m.animal.nome, cia: m.animal.companhia, somaNotas: 0, qtd: 0 };
        }
        statsAnimais[m.animalId].somaNotas += m.notaAnimal;
        statsAnimais[m.animalId].qtd += 1;
      }
    });

    // Ranking por Round para distribuir pontos de round (Top 5 CNAR)
    // 🎁 PONTOS DE ROUND: Apenas se etapa finalizada
    if (isEtapaFinalizada) {
      const roundsGroups: Record<number, any[]> = {};
      ms.forEach(m => {
        if (!roundsGroups[m.roundId]) roundsGroups[m.roundId] = [];
        roundsGroups[m.roundId].push(m);
      });

      Object.values(roundsGroups).forEach(rms => {
        const sortedRound = rms
          .filter(m => m.notaTotal > 0)
          .sort((a, b) => b.notaTotal - a.notaTotal);
        
        const ptsRound = [temp?.ptsRound1, temp?.ptsRound2, temp?.ptsRound3, temp?.ptsRound4, temp?.ptsRound5];
        
        sortedRound.forEach((m, idx) => {
          if (idx < 5) {
            if (!classificacaoEtapa[m.competidorId]) classificacaoEtapa[m.competidorId] = { id: m.competidorId, pontos: 0, tempo: 0, cpts: 0 };
            classificacaoEtapa[m.competidorId].cpts += (ptsRound[idx] || 0);
            
            // Bônus de melhor nota da noite
            if (idx === 0) classificacaoEtapa[m.competidorId].cpts += (temp?.bonusMelhorNotaNoite || 0);
          }
        });
      });
    }

    // Ranking Final da Etapa para distribuir pontos de pódio
    const rankingSorted = Object.values(classificacaoEtapa).sort((a: any, b: any) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      return b.tempo - a.tempo;
    });

    const ptsEtapa = [temp?.ptsEtapa1, temp?.ptsEtapa2, temp?.ptsEtapa3, temp?.ptsEtapa4, temp?.ptsEtapa5, temp?.ptsEtapa6, temp?.ptsEtapa7, temp?.ptsEtapa8, temp?.ptsEtapa9, temp?.ptsEtapa10];
    rankingSorted.forEach((r: any, idx) => {
      // 🎁 PONTOS DE PÓDIO DA ETAPA: Apenas se etapa finalizada
      if (isEtapaFinalizada) {
        if (idx < 10) r.cpts += (ptsEtapa[idx] || 0);
        if (idx === 0) r.cpts += (temp?.bonusMelhorNotaEtapa || 0);
      }
      
      // SÓ ADICIONA À LIGA SE A ETAPA ESTIVER ENCERRADA (Ou se for consulta de etapa específica que usa pontos acumulados)
      if (shouldAccumulateToSeason && statsPeoes[r.id]) {
         statsPeoes[r.id].pontosLiga += r.cpts;
      }
    });
  });

  // Calcular médias dos animais
  Object.values(statsAnimais).forEach((a: any) => {
    a.media = a.qtd > 0 ? a.somaNotas / a.qtd : 0;
  });

  const sortedPeoes = Object.values(statsPeoes).sort((a: any, b: any) => {
    if (etapaId) {
      if (b.notaAcumulada !== a.notaAcumulada) return b.notaAcumulada - a.notaAcumulada;
      return b.tempoTotal - a.tempoTotal;
    } else {
      if (b.pontosLiga !== a.pontosLiga) return b.pontosLiga - a.pontosLiga;
      return b.notaAcumulada - a.notaAcumulada;
    }
  });

  const leaderNota = sortedPeoes[0] ? (etapaId ? (sortedPeoes[0].notaAcumulada || 0) : (sortedPeoes[0].pontosLiga || 0)) : 0;

  const peoes = sortedPeoes.map((p: any) => {
    const val = etapaId ? (p.notaAcumulada || 0) : (p.pontosLiga || 0);
    return {
      ...p,
      diff: (leaderNota - val).toFixed(2)
    };
  });

  const touros = Object.values(statsAnimais)
    .filter((a: any) => {
      if (roundId) return true; // No ranking da noite, vale a maior nota (1 saída)
      return a.qtd >= 1; // Permite touros com apenas 1 saída aparecerem na página inicial
    })
    .sort((a: any, b: any) => b.media - a.media);

  const leaderTouro = touros[0]?.media || 0;
  const tourosFormatados = touros.map(t => ({
     ...t,
     diff: (leaderTouro - (t.media || 0)).toFixed(2)
  }));

  return { peoes, touros: tourosFormatados };
}

export async function getTopHighlights() {
  const temporada = await prisma.temporada.findFirst({ where: { ativa: true } });
  const etapa = await prisma.etapa.findFirst({ where: { ativa: true }, orderBy: { id: 'desc' } });

  // Rankings SEPARADOS: um filtrado pela etapa ativa, outro pela temporada inteira
  const rankEtapa = etapa ? await getRanking({ etapaId: etapa.id }) : { peoes: [], touros: [] };
  const rankCamp = temporada ? await getRanking({ temporadaId: temporada.id }) : { peoes: [], touros: [] };

  return {
    etapaNome: etapa?.nome || 'Etapa Atual',
    campeonatoNome: temporada?.titulo || 'Campeonato 2026',
    etapaCompetidor: rankEtapa.peoes[0] ? { nome: rankEtapa.peoes[0].nome, nota: rankEtapa.peoes[0].notaAcumulada.toFixed(2), competidorId: rankEtapa.peoes[0].id } : null,
    etapaAnimal: rankEtapa.touros[0] ? { nome: rankEtapa.touros[0].nome, nota: rankEtapa.touros[0].media.toFixed(2), animalId: rankEtapa.touros[0].id, info: rankEtapa.touros[0].cia } : null,
    campeonatoCompetidor: rankCamp.peoes[0] ? { nome: rankCamp.peoes[0].nome, nota: rankCamp.peoes[0].pontosLiga.toFixed(2), competidorId: rankCamp.peoes[0].id } : null,
    campeonatoAnimal: rankCamp.touros[0] ? { nome: rankCamp.touros[0].nome, nota: rankCamp.touros[0].media.toFixed(2), animalId: rankCamp.touros[0].id, info: rankCamp.touros[0].cia } : null,
  };
}

export async function getCompetidorStageRank(etapaId: number, competidorId: number) {
  const { peoes } = await getRanking({ etapaId });
  const idx = peoes.findIndex((p: any) => p.id === competidorId);
  const firstPlacePoints = peoes[0]?.notaAcumulada || 0;
  const myPoints = peoes[idx]?.notaAcumulada || 0;
  
  return { 
    rank: idx + 1,
    diff: firstPlacePoints - myPoints,
    notaAcumulada: myPoints
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
  const isNoite = mode.includes('NOITE');
  
  const { peoes, touros } = await getRanking({ 
    roundId: isNoite ? roundId : undefined,
    etapaId: (isCampeonato || isNoite) ? undefined : etapaId, 
    temporadaId 
  });

  let title = "RANKING";
  if (mode === 'NOITE_COMPETIDOR') title = "CLASSIFICAÇÃO DA NOITE";
  if (mode === 'ETAPA_COMPETIDOR') title = "MELHORES DA ETAPA";
  if (mode === 'CAMPEONATO_COMPETIDOR') title = "RANKING DO CAMPEONATO";
  if (mode === 'NOITE_ANIMAL') title = "MELHORES TOUROS (NOITE)";
  if (mode === 'ETAPA_ANIMAL') title = "MELHORES TOUROS (ETAPA)";
  if (mode === 'CAMPEONATO_ANIMAL') title = "MELHORES TOUROS (TEMPORADA)";
  if (mode.includes('BOIADA')) title = "RANKING DE BOIADAS";

  if (mode.includes('ANIMAL')) {
     return { 
       title,
       list: touros.map((t: any, idx) => ({ 
         pos: idx + 1, 
         nome: t.nome, 
         info: t.cia, 
         nota: (t.media || 0).toFixed(2), 
         diff: t.diff || "0.00",
         animalId: t.id 
       })) 
     };
  }
  
  const leaderNota = peoes[0] ? (isCampeonato ? peoes[0].pontosLiga : peoes[0].notaAcumulada) : 0;
  
  return { 
    title,
    list: peoes.map((p, idx) => {
      const currentNota = isCampeonato ? p.pontosLiga : p.notaAcumulada;
      return { 
        pos: idx + 1, 
        nome: p.nome, 
        info: p.origem, 
        nota: (currentNota || 0).toFixed(2), 
        diff: (leaderNota - currentNota).toFixed(2),
        competidorId: p.id 
      };
    }) 
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
