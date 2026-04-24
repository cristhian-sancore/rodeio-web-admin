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
