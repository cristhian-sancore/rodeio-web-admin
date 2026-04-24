import { prisma } from "./db";

export async function getSeasonRanking() {
  const etapas = await prisma.etapa.findMany({
    include: {
      temporada: true,
      rounds: {
        include: {
          montarias: {
            include: { competidor: true, animal: true }
          }
        }
      }
    }
  });

  const competidores = await prisma.competidor.findMany();
  const statsPeoes: Record<number, any> = {};
  competidores.forEach((c: any) => {
    statsPeoes[c.id] = { id: c.id, nome: c.nome, origem: `${c.cidade || ''} - ${c.uf || ''}`, pontosLiga: 0, paradas: 0, tempoTotal: 0 };
  });

  const statsAnimais: Record<number, any> = {};

  etapas.forEach((etapa: any) => {
    const temp = etapa.temporada;
    const classificacaoTouroEtapa: Record<number, any> = {};

    etapa.rounds.forEach((round: any) => {
      const isTouro = round.modalidade === 'Touro';
      round.montarias.forEach((m: any) => {
        if (isTouro) {
          if (!statsAnimais[m.animalId]) {
            statsAnimais[m.animalId] = { id: m.animalId, nome: m.animal.nome, cia: m.animal.companhia, somaNotas: 0, qtd: 0 };
          }
          statsAnimais[m.animalId].somaNotas += m.notaAnimal;
          statsAnimais[m.animalId].qtd += 1;

          if (!classificacaoTouroEtapa[m.competidorId]) {
            classificacaoTouroEtapa[m.competidorId] = { id: m.competidorId, pontos: 0, tempo: 0, cpts: 0 };
          }
          classificacaoTouroEtapa[m.competidorId].pontos += m.notaTotal;
          classificacaoTouroEtapa[m.competidorId].tempo += m.tempo;
          if (m.notaTotal >= 90) classificacaoTouroEtapa[m.competidorId].cpts += (temp.bonusNotasAcima90 || 0);
          statsPeoes[m.competidorId].tempoTotal += m.tempo;
          if (m.notaTotal > 0) statsPeoes[m.competidorId].paradas += 1;
        }
      });

      const sortedRound = [...round.montarias].filter((m: any) => m.notaTotal > 0 && round.modalidade === 'Touro').sort((a: any, b: any) => b.notaTotal - a.notaTotal).slice(0, 5);
      const ptsRound = [temp.ptsRound1, temp.ptsRound2, temp.ptsRound3, temp.ptsRound4, temp.ptsRound5];
      sortedRound.forEach((m: any, idx: number) => {
        if (classificacaoTouroEtapa[m.competidorId]) {
          classificacaoTouroEtapa[m.competidorId].cpts += (ptsRound[idx] || 0);
          if (idx === 0) classificacaoTouroEtapa[m.competidorId].cpts += (temp.bonusMelhorNotaNoite || 0);
        }
      });
    });

    const rankingEtapa = Object.values(classificacaoTouroEtapa).sort((a: any, b: any) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      return b.tempo - a.tempo;
    });

    const ptsEtapa = [temp.ptsEtapa1, temp.ptsEtapa2, temp.ptsEtapa3, temp.ptsEtapa4, temp.ptsEtapa5, temp.ptsEtapa6, temp.ptsEtapa7, temp.ptsEtapa8, temp.ptsEtapa9, temp.ptsEtapa10];
    rankingEtapa.forEach((r: any, idx) => {
      if (idx < 10) r.cpts += (ptsEtapa[idx] || 0);
      if (idx === 0) r.cpts += (temp.bonusMelhorNotaEtapa || 0);
      if (statsPeoes[r.id]) statsPeoes[r.id].pontosLiga += r.cpts;
    });
  });

  const peoes = Object.values(statsPeoes).filter((p: any) => p.pontosLiga > 0 || p.tempoTotal > 0).sort((a: any, b: any) => {
    if (b.pontosLiga !== a.pontosLiga) return b.pontosLiga - a.pontosLiga;
    return b.tempoTotal - a.tempoTotal;
  });

  const touros = Object.values(statsAnimais).map((a: any) => ({ ...a, media: a.somaNotas / a.qtd })).sort((a: any, b: any) => b.media - a.media);

  return { peoes, touros };
}

export async function getTopHighlights() {
  const { peoes, touros } = await getSeasonRanking();
  const temporada = await prisma.temporada.findFirst({ where: { ativa: true } });
  const etapa = await prisma.etapa.findFirst({ where: { ativa: true }, orderBy: { id: 'desc' } });

  return {
    etapaNome: etapa?.nome || 'Etapa Atual',
    campeonatoNome: temporada?.nome || 'Campeonato 2026',
    etapaCompetidor: peoes[0] ? { nome: peoes[0].nome, nota: peoes[0].pontosLiga.toFixed(1), competidorId: peoes[0].id } : null,
    etapaAnimal: touros[0] ? { nome: touros[0].nome, nota: touros[0].media.toFixed(2), animalId: touros[0].id, info: touros[0].cia } : null,
    campeonatoCompetidor: peoes[0] ? { nome: peoes[0].nome, nota: peoes[0].pontosLiga.toFixed(1), competidorId: peoes[0].id } : null,
    campeonatoAnimal: touros[0] ? { nome: touros[0].nome, nota: touros[0].media.toFixed(2), animalId: touros[0].id, info: touros[0].cia } : null,
  };
}

export async function getCompetidorStageRank(etapaId: number, competidorId: number) {
  const { peoes } = await getSeasonRanking();
  const idx = peoes.findIndex((p: any) => p.id === competidorId);
  const firstPlacePoints = peoes[0]?.pontosLiga || 0;
  const myPoints = peoes[idx]?.pontosLiga || 0;
  
  return { 
    rank: idx + 1,
    diff: firstPlacePoints - myPoints
  };
}

export async function getBestOfRound(roundId: number) {
  const montaria = await prisma.montaria.findFirst({
    where: { roundId, desclassificado: false },
    orderBy: { notaTotal: 'desc' },
    include: { competidor: true, animal: true }
  });
  if (!montaria) return null;
  return { nome: montaria.competidor.nome, animal: montaria.animal.nome, nota: montaria.notaTotal.toFixed(2) };
}

export async function getOverlayRankingData(mode: string, roundId?: number, etapaId?: number, temporadaId?: number) {
  const { peoes, touros } = await getSeasonRanking();
  if (mode.includes('ANIMAL')) {
     return { list: touros.map((t, idx) => ({ pos: idx + 1, nome: t.nome, info: t.cia, nota: t.media.toFixed(2), animalId: t.id })) };
  }
  return { list: peoes.map((p, idx) => ({ pos: idx + 1, nome: p.nome, info: p.origem, nota: p.pontosLiga.toFixed(1), competidorId: p.id })) };
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
