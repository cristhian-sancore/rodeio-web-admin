import { prisma } from "./db";
import { getSafeConfig } from "./config-safe";

/**
 * Calcula a posição atual de um competidor no ranking acumulado da etapa.
 * Retorna: { rank, diff, leaderScore }
 */
export async function getCompetidorStageRank(etapaId: number, competidorId: number): Promise<{ rank: number; diff: number; leaderScore: number }> {
  try {
    const montarias = await prisma.montaria.findMany({
      where: { etapaId },
      include: {
        round: { select: { modalidade: true } }
      }
    });

    if (montarias.length === 0) return { rank: 0, diff: 0, leaderScore: 0 };

    const alvo = montarias.find(m => m.competidorId === competidorId);
    if (!alvo) return { rank: 0, diff: 0, leaderScore: 0 };
    const modalidadeAlvo = alvo.round.modalidade;

    const competidoresMap: Record<number, { pontos: number, tempo: number }> = {};

    montarias.forEach(m => {
      if (m.round.modalidade !== modalidadeAlvo) return;
      if (!competidoresMap[m.competidorId]) {
        competidoresMap[m.competidorId] = { pontos: 0, tempo: 0 };
      }
      competidoresMap[m.competidorId].pontos += m.notaTotal;
      competidoresMap[m.competidorId].tempo += m.tempo;
    });

    const ranking = Object.entries(competidoresMap)
      .map(([id, stats]) => ({
        id: parseInt(id),
        ...stats
      }))
      .sort((a, b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        return b.tempo - a.tempo;
      });

    const position = ranking.findIndex(r => r.id === competidorId);
    const rank = position !== -1 ? position + 1 : 0;
    const leaderScore = ranking.length > 0 ? ranking[0].pontos : 0;
    const myScore = competidoresMap[competidorId]?.pontos || 0;
    const diff = leaderScore - myScore;

    return { rank, diff, leaderScore };
  } catch (error) {
    console.error("Erro ao calcular ranking da etapa:", error);
    return { rank: 0, diff: 0, leaderScore: 0 };
  }
}

/**
 * Busca o Ranking para o Overlay baseada no modo selecionado.
 */
export async function getOverlayRankingData(mode: string, roundId?: number) {
  if (!mode || mode === 'OFF') return null;

  try {
    const config = await getSafeConfig();
    if (!config) return null;

    // Se não passou roundId, tenta pegar da montaria ativa se houver
    let rId = roundId;
    if (!rId && config.montariaAtivaId) {
      const m = await prisma.montaria.findUnique({ where: { id: config.montariaAtivaId }, select: { roundId: true } });
      rId = m?.roundId;
    }

    if (!rId) {
      // Tenta pegar o último round da etapa ativa
      const activeEtapa = await prisma.etapa.findFirst({ where: { ativa: true }, orderBy: { id: 'desc' } });
      if (activeEtapa) {
        const round = await prisma.round.findFirst({ where: { etapaId: activeEtapa.id }, orderBy: { id: 'desc' } });
        rId = round?.id;
      }
    }

    if (!rId) {
      // Pega o último round cadastrado em todo o sistema como última instância
      const lastRound = await prisma.round.findFirst({ orderBy: { id: 'desc' }, include: { etapa: { include: { temporada: true } } } });
      rId = lastRound?.id;
      if (lastRound) {
        const etapaId = lastRound.etapaId;
        const temporadaId = lastRound.etapa.temporadaId;
        const modalidade = lastRound.modalidade || 'Touro';
        if (mode.includes('COMPETIDOR')) {
          return await getCompetidorRanking(mode, lastRound.id, etapaId, temporadaId, modalidade);
        } else if (mode.includes('ANIMAL') || mode.includes('BOIADA')) {
          return await getAnimalRanking(mode, lastRound.id, etapaId, temporadaId, modalidade);
        }
      }
    }

    if (!rId) return null;

    const currentRound = await prisma.round.findUnique({ 
      where: { id: rId },
      include: { etapa: { include: { temporada: true } } }
    });

    if (!currentRound) return null;

    const etapaId = currentRound.etapaId;
    const temporadaId = currentRound.etapa.temporadaId;
    const modalidade = currentRound.modalidade || 'Touro';

    if (mode.includes('COMPETIDOR')) {
      return await getCompetidorRanking(mode, rId, etapaId, temporadaId, modalidade);
    } else if (mode.includes('ANIMAL') || mode.includes('BOIADA')) {
      return await getAnimalRanking(mode, rId, etapaId, temporadaId, modalidade);
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar dados de ranking para overlay:", error);
    return null;
  }
}

export async function getCompetidorRanking(mode: string, roundId: number, etapaId: number, temporadaId: number, modalidade: string = 'Touro') {
  let where: any = {};
  let title = "";

  if (mode === 'NOITE_COMPETIDOR') {
    where = { roundId };
    title = `RANKING DA NOITE (${modalidade.toUpperCase()})`;
  } else if (mode === 'ETAPA_COMPETIDOR') {
    where = { etapaId };
    title = `RANKING DA ETAPA (${modalidade.toUpperCase()})`;
  } else if (mode === 'CAMPEONATO_COMPETIDOR') {
    // Redireciona para a função oficial de campeonato que calcula bônus e CPTs
    return await getChampionshipRanking(temporadaId, modalidade);
  }

  const montariasRaw = await prisma.montaria.findMany({
    where,
    include: { 
      competidor: true,
      round: true
    }
  });

  // Filtrar modalidade no JS para garantir normalização total (case-insensitive e espaços)
  const targetMod = modalidade.trim().toUpperCase();
  const montarias = montariasRaw.filter(m => 
    m.round.modalidade.trim().toUpperCase() === targetMod
  );

  const map: Record<number, { id: number, nome: string, cidade: string, pontos: number, tempo: number }> = {};
  montarias.forEach(m => {
    if (!map[m.competidorId]) {
      map[m.competidorId] = { 
        id: m.competidorId,
        nome: m.competidor.nome, 
        cidade: `${m.competidor.cidade || ''} - ${m.competidor.uf || ''}`, 
        pontos: 0, 
        tempo: 0 
      };
    }
    map[m.competidorId].pontos += m.notaTotal;
    map[m.competidorId].tempo += m.tempo;
  });

  const list = Object.values(map)
    .sort((a: any, b: any) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      return b.tempo - a.tempo;
    });

  const leaderScore = list.length > 0 ? (list[0] as any).pontos : 0;

  return { 
    title, 
    list: list.map((item: any, idx) => ({
      pos: idx + 1,
      competidorId: item.id,
      nome: item.nome,
      info: item.cidade,
      nota: item.pontos.toFixed(2),
      extra: idx === 0 ? "-" : (leaderScore - item.pontos).toFixed(2)
    }))
  };
}

export async function getAnimalRanking(mode: string, roundId: number, etapaId: number, temporadaId: number, modalidade: string = 'Touro') {
  let where: any = {};
  let title = "";
  // Para ranking de noite, não exige mínimo de saídas
  // Para etapa e campeonato, exige mínimo 2 saídas
  let minSaidas = 1;

  if (mode === 'NOITE_ANIMAL') {
    where = { roundId };
    title = `MELHORES TOUROS (NOITE) - ${modalidade.toUpperCase()}`;
  } else if (mode === 'ETAPA_ANIMAL') {
    where = { etapaId };
    title = `MELHORES TOUROS (ETAPA) - ${modalidade.toUpperCase()}`;
    minSaidas = 2;
  } else if (mode === 'CAMPEONATO_ANIMAL') {
    where = { etapa: { temporadaId } };
    title = `MELHORES TOUROS (TEMPORADA) - ${modalidade.toUpperCase()}`;
    minSaidas = 2;
  } else if (mode === 'NOITE_BOIADA') {
    return await getBoiadaRanking({ roundId }, `MELHOR BOIADA (NOITE) - ${modalidade.toUpperCase()}`, modalidade);
  } else if (mode === 'ETAPA_BOIADA') {
    return await getBoiadaRanking({ etapaId }, `MELHOR BOIADA (ETAPA) - ${modalidade.toUpperCase()}`, modalidade);
  } else if (mode === 'CAMPEONATO_BOIADA') {
    return await getBoiadaRanking({ etapa: { temporadaId } }, `MELHOR BOIADA (TEMPORADA) - ${modalidade.toUpperCase()}`, modalidade);
  }

  const montariasRaw = await prisma.montaria.findMany({
    where,
    include: { 
      animal: true,
      round: true
    }
  });

  const targetMod = modalidade.trim().toUpperCase();
  const montarias = montariasRaw.filter(m => 
    m.round.modalidade.trim().toUpperCase() === targetMod
  );

  const map: Record<number, { id: number, nome: string, cia: string, soma: number, qtd: number }> = {};
  montarias.forEach(m => {
    if (!map[m.animalId]) {
      map[m.animalId] = { 
        id: m.animalId,
        nome: m.animal.nome, 
        cia: m.animal.companhia, 
        soma: 0, 
        qtd: 0 
      };
    }
    map[m.animalId].soma += m.notaAnimal;
    map[m.animalId].qtd += 1;
  });

  const list = Object.values(map)
    // Filtrar pelo mínimo de saídas exigido
    .filter((item: any) => item.qtd >= minSaidas)
    .map((item: any) => ({
      ...item,
      media: item.qtd > 0 ? (item.soma / item.qtd) : 0
    }))
    .sort((a: any, b: any) => b.media - a.media);

  const leaderMedia = list.length > 0 ? (list[0] as any).media : 0;

  return { 
    title, 
    list: list.map((item: any, idx) => ({
      pos: idx + 1,
      animalId: item.id,
      nome: item.nome,
      info: `${item.cia} (${item.qtd} saída${item.qtd > 1 ? 's' : ''})`,
      nota: item.media.toFixed(2),
      extra: idx === 0 ? "-" : (leaderMedia - item.media).toFixed(2)
    }))
  };
}

/**
 * Ranking de Melhor Boiada (agrupa por companhia)
 * Soma todas as notas dos touros da companhia e divide pelo total de saídas
 */
export async function getBoiadaRanking(where: any, title: string, modalidade: string = 'Touro') {
  const montariasRaw = await prisma.montaria.findMany({
    where,
    include: { 
      animal: true,
      round: true
    }
  });

  const targetMod = modalidade.trim().toUpperCase();
  const montarias = montariasRaw.filter(m => 
    m.round.modalidade.trim().toUpperCase() === targetMod
  );

  // Agrupar por companhia
  const map: Record<string, { cia: string, soma: number, qtd: number, touros: Set<number> }> = {};
  montarias.forEach(m => {
    const cia = m.animal.companhia.trim();
    if (!map[cia]) {
      map[cia] = { cia, soma: 0, qtd: 0, touros: new Set() };
    }
    map[cia].soma += m.notaAnimal;
    map[cia].qtd += 1;
    map[cia].touros.add(m.animalId);
  });

  const list = Object.values(map)
    .map((item: any) => ({
      ...item,
      numTouros: item.touros.size,
      media: item.qtd > 0 ? (item.soma / item.qtd) : 0
    }))
    .sort((a: any, b: any) => b.media - a.media);

  const leaderMedia = list.length > 0 ? (list[0] as any).media : 0;

  return { 
    title, 
    list: list.map((item: any, idx) => ({
      pos: idx + 1,
      nome: item.cia,
      info: `${item.numTouros} touro${item.numTouros > 1 ? 's' : ''} • ${item.qtd} saída${item.qtd > 1 ? 's' : ''}`,
      nota: item.media.toFixed(2),
      extra: idx === 0 ? "-" : (leaderMedia - item.media).toFixed(2)
    }))
  };
}


/**
 * Calcula o Ranking do Campeonato (Pontos de Liga C.Pts)
 */
export async function getChampionshipRanking(temporadaId: number, modalidade: string = 'Touro') {
  const etapas = await prisma.etapa.findMany({
    where: { temporadaId },
    include: {
      temporada: true,
      rounds: {
        where: { modalidade },
        include: {
          montarias: {
            include: { competidor: true }
          }
        }
      }
    }
  });

  const targetMod = modalidade.trim().toUpperCase();
  const statsPeoes: Record<number, any> = {};

  etapas.forEach((etapa: any) => {
    const temp = etapa.temporada;
    const classificacaoEtapa: Record<number, any> = {};

    etapa.rounds.forEach((round: any) => {
      if (round.modalidade.trim().toUpperCase() !== targetMod) return;

      round.montarias.forEach((m: any) => {
        // Ignorar montarias desclassificadas na soma de notas
        if (m.desclassificado) return;

        if (!statsPeoes[m.competidorId]) {
          statsPeoes[m.competidorId] = { id: m.competidorId, nome: m.competidor.nome, cidade: `${m.competidor.cidade || ''} - ${m.competidor.uf || ''}`, pontosLiga: 0, paradas: 0, tempoTotal: 0 };
        }
        
        if (!classificacaoEtapa[m.competidorId]) {
          classificacaoEtapa[m.competidorId] = { id: m.competidorId, pontos: 0, tempo: 0, cpts: 0 };
        }
        
        classificacaoEtapa[m.competidorId].pontos += m.notaTotal;
        classificacaoEtapa[m.competidorId].tempo += m.tempo;
        
        // Bônus Notas Altas (CPTs) - EXCLUSIVO TOURO
        if (targetMod === 'TOURO' && m.notaTotal >= 90) {
          classificacaoEtapa[m.competidorId].cpts += (temp.bonusNotasAcima90 || 0);
        }
        
        // ADICIONA NOTA REAL À PONTUAÇÃO DO CAMPEONATO (REGRA PADRÃO)
        statsPeoes[m.competidorId].pontosLiga += m.notaTotal; 
        statsPeoes[m.competidorId].tempoTotal += m.tempo;
        if (m.notaTotal > 0) statsPeoes[m.competidorId].paradas += 1;
      });

      // Pontos por Posição no Round (Top 5 recebem CPTs) - EXCLUSIVO TOURO
      if (targetMod === 'TOURO') {
        const sortedRound = [...round.montarias]
          .filter((m: any) => m.notaTotal > 0 && !m.desclassificado)
          .sort((a: any, b: any) => b.notaTotal - a.notaTotal)
          .slice(0, 5);

        const ptsRound = [temp.ptsRound1, temp.ptsRound2, temp.ptsRound3, temp.ptsRound4, temp.ptsRound5];
        sortedRound.forEach((m: any, idx: number) => {
          if (classificacaoEtapa[m.competidorId]) {
            classificacaoEtapa[m.competidorId].cpts += (ptsRound[idx] || 0);
            if (idx === 0) {
              // Adicional para o Melhor da Noite
              classificacaoEtapa[m.competidorId].cpts += (temp.bonusMelhorNotaNoite || 0);
            }
          }
        });
      }
    });

    // Pontos por Posição na Etapa (Top 10 recebem CPTs) - EXCLUSIVO TOURO
    if (targetMod === 'TOURO') {
      const rankingEtapa = Object.values(classificacaoEtapa).sort((a: any, b: any) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        return b.tempo - a.tempo;
      });

      const ptsEtapa = [temp.ptsEtapa1, temp.ptsEtapa2, temp.ptsEtapa3, temp.ptsEtapa4, temp.ptsEtapa5, temp.ptsEtapa6, temp.ptsEtapa7, temp.ptsEtapa8, temp.ptsEtapa9, temp.ptsEtapa10];
      rankingEtapa.forEach((r: any, idx) => {
        if (idx < 10) r.cpts += (ptsEtapa[idx] || 0);
        if (idx === 0) {
            // Adicional para o Campeão da Etapa
            r.cpts += (temp.bonusMelhorNotaEtapa || 0);
        }
        
        // Finalmente adicionamos a soma de bônus da etapa (CPTs) à pontuação global de campeonato
        if (statsPeoes[r.id]) {
          statsPeoes[r.id].pontosLiga += r.cpts;
        }
      });
    }
  });

  const results = Object.values(statsPeoes)
    .sort((a: any, b: any) => {
      if (b.pontosLiga !== a.pontosLiga) return b.pontosLiga - a.pontosLiga;
      return b.tempoTotal - a.tempoTotal;
    });

  const leaderScore = results.length > 0 ? (results[0] as any).pontosLiga : 0;

  const list = results.map((p: any, idx: number) => ({
      pos: idx + 1,
      competidorId: p.id,
      nome: p.nome,
      info: p.cidade,
      nota: p.pontosLiga.toFixed(1),
      extra: idx === 0 ? "-" : (leaderScore - p.pontosLiga).toFixed(1)
    }));

  const title = targetMod === 'TOURO' 
    ? `RANKING DO CAMPEONATO (TOURO)` 
    : `SOMA ACUMULADA DA TEMPORADA (${targetMod})`;

  return { title, list };
}

/**
 * Busca o melhor competidor de um round específico (Melhor da Noite).
 */
export async function getBestOfRound(roundId: number) {
  try {
    const melhor = await prisma.montaria.findFirst({
      where: { 
        roundId, 
        desclassificado: false, 
        notaTotal: { gt: 0 } 
      },
      include: { competidor: true, animal: true },
      orderBy: { notaTotal: 'desc' }
    });
    
    if (!melhor) return null;

    return {
      nome: melhor.competidor.nome,
      nota: melhor.notaTotal.toFixed(2),
      animal: melhor.animal.nome,
      companhia: melhor.animal.companhia
    };
  } catch (err) {
    return null;
  }
}
/**
 * Busca os 4 destaques principais (Líderes de Etapa e Campeonato)
 */
export async function getTopHighlights() {
  try {
    const config = await getSafeConfig();
    const activeTemporada = await prisma.temporada.findFirst({ where: { ativa: true }, orderBy: { id: 'desc' } });
    const activeEtapa = await prisma.etapa.findFirst({ where: { ativa: true, temporadaId: activeTemporada?.id }, orderBy: { id: 'desc' } });
    
    // Pegar o último round da etapa ativa para usar como referência
    const lastRound = activeEtapa ? await prisma.round.findFirst({ where: { etapaId: activeEtapa.id }, orderBy: { id: 'desc' } }) : null;

    const highlights = {
      etapaCompetidor: null as any,
      campeonatoCompetidor: null as any,
      etapaAnimal: null as any,
      campeonatoAnimal: null as any,
      etapaNome: activeEtapa?.nome || 'Etapa Atual',
      campeonatoNome: activeTemporada?.titulo || 'Campeonato Atual'
    };

    if (activeEtapa && lastRound) {
      const stageCompRank = await getCompetidorRanking('ETAPA_COMPETIDOR', lastRound.id, activeEtapa.id, activeTemporada?.id || 0);
      highlights.etapaCompetidor = stageCompRank.list[0] || null;

      const stageAnimalRank = await getAnimalRanking('ETAPA_ANIMAL', lastRound.id, activeEtapa.id, activeTemporada?.id || 0);
      highlights.etapaAnimal = stageAnimalRank.list[0] || null;
    }

    if (activeTemporada) {
      const champCompRank = await getChampionshipRanking(activeTemporada.id);
      highlights.campeonatoCompetidor = champCompRank.list[0] || null;

      const champAnimalRank = await getAnimalRanking('CAMPEONATO_ANIMAL', lastRound?.id || 0, activeEtapa?.id || 0, activeTemporada.id);
      highlights.campeonatoAnimal = champAnimalRank.list[0] || null;
    }

    return highlights;
  } catch (err) {
    console.error("Erro ao buscar destaques:", err);
    return null;
  }
}
