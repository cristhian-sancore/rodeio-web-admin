import { prisma } from "@/lib/db";
import { Trophy, Star, TrendingUp, User, Cat, Clock } from "lucide-react";

export default async function RankingPage() {
  // Busca todas as etapas e seus rounds para calcular o acumulado
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

  // 1. Acumuladores para PEÕES (Pontos de Liga C.Pts)
  const statsPeoes: Record<number, { 
    id: number, 
    nome: string, 
    origem: string, 
    pontosLiga: number, 
    paradas: number,
    tempoTotal: number
  }> = {};

  competidores.forEach((c: any) => {
    statsPeoes[c.id] = { id: c.id, nome: c.nome, origem: `${c.cidade || ''} - ${c.uf || ''}`, pontosLiga: 0, paradas: 0, tempoTotal: 0 };
  });

  // 2. Acumuladores para ANIMAIS (Média Global)
  const statsAnimais: Record<number, { id: number, nome: string, cia: string, somaNotas: number, qtd: number }> = {};

  etapas.forEach((etapa: any) => {
    const temp = etapa.temporada;
    const classificacaoTouroEtapa: Record<number, any> = {};

    etapa.rounds.forEach((round: any) => {
      const isTouro = round.modalidade === 'Touro';
      
      round.montarias.forEach((m: any) => {
        // Estatísticas do Touro (Animais)
        if (isTouro) {
          if (!statsAnimais[m.animalId]) {
            statsAnimais[m.animalId] = { id: m.animalId, nome: m.animal.nome, cia: m.animal.companhia, somaNotas: 0, qtd: 0 };
          }
          statsAnimais[m.animalId].somaNotas += m.notaAnimal;
          statsAnimais[m.animalId].qtd += 1;
        }

        // Pontos de Montaria (Peão - Apenas Touros no Campeonato)
        if (isTouro) {
          if (!classificacaoTouroEtapa[m.competidorId]) {
            classificacaoTouroEtapa[m.competidorId] = { id: m.competidorId, pontos: 0, tempo: 0, cpts: 0 };
          }
          classificacaoTouroEtapa[m.competidorId].pontos += m.notaTotal;
          classificacaoTouroEtapa[m.competidorId].tempo += m.tempo;
          
          // Bônus 90+ na etapa
          if (m.notaTotal >= 90) classificacaoTouroEtapa[m.competidorId].cpts += (temp.bonusNotasAcima90 || 0);

          // Totais globais
          statsPeoes[m.competidorId].tempoTotal += m.tempo;
          if (m.notaTotal > 0) statsPeoes[m.competidorId].paradas += 1;
        }
      });

      // Pontos por Posição no Round
      const sortedRound = [...round.montarias]
        .filter((m: any) => m.notaTotal > 0 && round.modalidade === 'Touro')
        .sort((a: any, b: any) => b.notaTotal - a.notaTotal)
        .slice(0, 5);

      const ptsRound = [temp.ptsRound1, temp.ptsRound2, temp.ptsRound3, temp.ptsRound4, temp.ptsRound5];
      sortedRound.forEach((m: any, idx: number) => {
        if (classificacaoTouroEtapa[m.competidorId]) {
          classificacaoTouroEtapa[m.competidorId].cpts += (ptsRound[idx] || 0);
          if (idx === 0) classificacaoTouroEtapa[m.competidorId].cpts += (temp.bonusMelhorNotaNoite || 0);
        }
      });
    });

    // Pontos por Posição na Etapa
    const rankingEtapa = Object.values(classificacaoTouroEtapa).sort((a: any, b: any) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      return b.tempo - a.tempo;
    });

    const ptsEtapa = [temp.ptsEtapa1, temp.ptsEtapa2, temp.ptsEtapa3, temp.ptsEtapa4, temp.ptsEtapa5, temp.ptsEtapa6, temp.ptsEtapa7, temp.ptsEtapa8, temp.ptsEtapa9, temp.ptsEtapa10];
    rankingEtapa.forEach((r: any, idx) => {
      if (idx < 10) r.cpts += (ptsEtapa[idx] || 0);
      if (idx === 0) r.cpts += (temp.bonusMelhorNotaEtapa || 0);
      
      if (statsPeoes[r.id]) {
        statsPeoes[r.id].pontosLiga += r.cpts;
      }
    });
  });

  const rankingFinalPeoes = Object.values(statsPeoes)
    .filter(p => p.pontosLiga > 0 || p.tempoTotal > 0)
    .sort((a, b) => {
      if (b.pontosLiga !== a.pontosLiga) return b.pontosLiga - a.pontosLiga;
      return b.tempoTotal - a.tempoTotal;
    });

  const rankingFinalTouros = Object.values(statsAnimais)
    .map(a => ({ ...a, media: a.somaNotas / a.qtd }))
    .sort((a, b) => b.media - a.media)
    .slice(0, 20);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Trophy size={32} color="#d4af37" /> Ranking do Campeonato 2026
      </h1>

      <div className="responsive-grid" style={{ gap: '2rem', alignItems: 'start', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
        {/* Lado Esquerdo: Ranking de Peões */}
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={20} color="#d4af37" /> Classificação Atletas (Touros)
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', color: '#666' }}>Pos</th>
                  <th style={{ padding: '1rem', color: '#666' }}>Atleta (Peão)</th>
                  <th style={{ padding: '1rem', color: '#666', textAlign: 'center' }}>Paradas</th>
                  <th style={{ padding: '1rem', color: '#666', textAlign: 'center' }}>Tempo</th>
                  <th style={{ padding: '1rem', color: '#d4af37', textAlign: 'right', background: 'rgba(212, 175, 55, 0.05)' }}>C.Pts (Liga)</th>
                </tr>
              </thead>
              <tbody>
                {rankingFinalPeoes.map((c, index) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a', background: index === 0 ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: index < 1 ? '#d4af37' : '#fff' }}>#{index + 1}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{c.nome}</div>
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>{c.origem}</div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{c.paradas}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>{c.tempoTotal.toFixed(1)}s</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: '#d4af37', background: 'rgba(212, 175, 55, 0.05)' }}>{c.pontosLiga.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lado Direito: Melhor Touro */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="premium-card" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d4af37', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cat size={20} /> Melhores Touros (Média)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {rankingFinalTouros.map((t, index) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: index === 0 ? 'rgba(212, 175, 55, 0.1)' : '#1a1a1a', borderRadius: '8px', border: index === 0 ? '1px solid #d4af37' : '1px solid #333' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '24px', fontWeight: 'bold', color: index === 0 ? '#d4af37' : '#666' }}>#{index + 1}</div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{t.nome}</div>
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>{t.cia}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#d4af37' }}>{t.media.toFixed(2)}</div>
                    <div style={{ fontSize: '0.6rem', color: '#666' }}>{t.qtd} saídas</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card">
            <h3 style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={14} /> Critérios de Campeonato
            </h3>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.75rem', color: '#888', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Peões: Somatória de pontos de liga (C.Pts) ganhos em cada etapa.</li>
              <li>Touros: Melhor média aritmética de todas as apresentações oficiais.</li>
              <li>Desempate Atletas: Maior tempo de permanência acumulado.</li>
              <li>Apenas modalidade Touros possui ranking de campeonato.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
