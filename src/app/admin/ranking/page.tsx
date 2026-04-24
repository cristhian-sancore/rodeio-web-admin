import { Trophy, Star, TrendingUp, User, Cat, Clock } from "lucide-react";
import { getSeasonRanking } from "@/lib/ranking";
import ExcelRankingBtn from "./ExcelRankingBtn";

export default async function RankingPage() {
  const { peoes: rankingFinalPeoes, touros: rankingFinalTouros } = await getSeasonRanking();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Trophy size={32} color="#d4af37" /> Ranking do Campeonato 2026
        </h1>
        <ExcelRankingBtn peoes={rankingFinalPeoes} touros={rankingFinalTouros} />
      </div>

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
