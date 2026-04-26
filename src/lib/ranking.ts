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
    const temp = ms[0].etapa.temporada;
    
    const classificacaoEtapa: Record<number, any> = {};
    
    ms.forEach(m => {
      // Stats Peão
      if (!statsPeoes[m.competidorId]) {
        statsPeoes[m.competidorId] = { id: m.competidorId, nome: m.competidor.nome, origem: `${m.competidor.cidade || ''}-${m.competidor.uf || ''}`, notaAcumulada: 0, pontosLiga: 0, tempoTotal: 0, paradas: 0, fotoUrl: m.competidor.fotoUrl };
      }
      statsPeoes[m.competidorId].notaAcumulada += m.notaTotal;
      statsPeoes[m.competidorId].tempoTotal += m.tempo;
      if (m.tempo >= 8) statsPeoes[m.competidorId].paradas += 1;

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

    // Ranking por Round para distribuir pontos de round (Top 5 CNAR)
    const roundsGroups: Record<number, any[]> = {};
    ms.forEach(m => {
      if (!roundsGroups[m.roundId]) roundsGroups[m.roundId] = [];
      roundsGroups[m.roundId].push(m);
    });

    Object.values(roundsGroups).forEach(rms => {
      const sortedRound = rms
        .filter(m => m.notaTotal > 0)
        .sort((a, b) => b.notaTotal - a.notaTotal);
      
      const ptsRound = [temp.ptsRound1, temp.ptsRound2, temp.ptsRound3, temp.ptsRound4, temp.ptsRound5];
      
      sortedRound.forEach((m, idx) => {
        if (idx < 5) {
          if (!classificacaoEtapa[m.competidorId]) classificacaoEtapa[m.competidorId] = { id: m.competidorId, pontos: 0, tempo: 0, cpts: 0 };
          classificacaoEtapa[m.competidorId].cpts += (ptsRound[idx] || 0);
          
          // Se for o primeiro, ainda ganha o bônus de melhor nota da noite (se configurado)
          if (idx === 0) classificacaoEtapa[m.competidorId].cpts += (temp.bonusMelhorNotaNoite || 0);
        }
      });
    });

    // Ranking da Etapa para distribuir pontos de classificação final da etapa
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

  const leaderNota = sortedPeoes[0] ? (etapaId ? sortedPeoes[0].notaAcumulada : sortedPeoes[0].pontosLiga) : 0;

  const peoes = sortedPeoes.map((p: any) => ({
    ...p,
    diff: (leaderNota - (etapaId ? p.notaAcumulada : p.pontosLiga)).toFixed(2)
  }));

  const touros = Object.values(statsAnimais)
    .filter((a: any) => {
      if (roundId) return true; // No ranking da noite, vale a maior nota (1 saída)
      return a.qtd >= 2; // Para Etapa/Campeonato (médias), exige consistência de 2 saídas
    })
    .sort((a: any, b: any) => b.media - a.media);

  const leaderTouro = touros[0]?.media || 0;
  const tourosFormatados = touros.map(t => ({
     ...t,
     diff: (leaderTouro - t.media).toFixed(2)
  }));

  return { peoes, touros: tourosFormatados };
}

export async function getTopHighlights() {
  const { peoes, touros } = await getRanking({});
  const temporada = await prisma.temporada.findFirst({ where: { ativa: true } });
  const etapa = await prisma.etapa.findFirst({ where: { ativa: true }, orderBy: { id: 'desc' } });

  return {
    etapaNome: etapa?.nome || 'Etapa Atual',
    campeonatoNome: temporada?.titulo || 'Campeonato 2026',
    etapaCompetidor: peoes[0] ? { nome: peoes[0].nome, nota: peoes[0].notaAcumulada.toFixed(2), competidorId: peoes[0].id } : null,
    etapaAnimal: touros[0] ? { nome: touros[0].nome, nota: touros[0].media.toFixed(2), animalId: touros[0].id, info: touros[0].cia } : null,
    campeonatoCompetidor: peoes[0] ? { nome: peoes[0].nome, nota: peoes[0].pontosLiga.toFixed(2), competidorId: peoes[0].id } : null,
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
