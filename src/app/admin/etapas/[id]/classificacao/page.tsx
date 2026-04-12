import { Calendar, MapPin, Trophy, Star, Cat, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function EtapaClassificacaoPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;
  const etapaId = parseInt(id);

  if (isNaN(etapaId)) return <div>ID da Etapa inválido.</div>;

  const etapa = await prisma.etapa.findUnique({
    where: { id: etapaId },
    include: {
      rounds: {
        include: {
          montarias: {
            include: { competidor: true, animal: true }
          }
        }
      }
    }
  });

  if (!etapa) return <div>Etapa não encontrada.</div>;

  // Parâmetros de Filtro
  const modalidadeAtiva = searchParams?.modalidade || 'Touro';
  const currentRoundId = searchParams?.roundId ? parseInt(searchParams.roundId) : (etapa.rounds.length > 0 ? etapa.rounds[etapa.rounds.length - 1].id : null);
  const roundSelecionado = etapa.rounds.find(r => r.id === currentRoundId);

  // Cálculo da classificação (SOMA LIMPA)
  const statsPeoes: Record<number, any> = {};
  const statsAnimais: Record<number, any> = {};
  const statsCompanhias: Record<string, any> = {};

  etapa.rounds.forEach((round: any) => {
    // Filtramos apenas a modalidade ativa selecionada pelo botão
    if (round.modalidade !== modalidadeAtiva) return;

    const isRoundSelecionado = round.id === currentRoundId;

    round.montarias.forEach((m: any) => {
      // Ranking ETAPA (Peões)
      if (!statsPeoes[m.competidorId]) {
        statsPeoes[m.competidorId] = { id: m.competidorId, nome: m.competidor.nome, pontos: 0, tempo: 0, paradas: 0, pontosNoite: 0, tempoNoite: 0, paradasNoite: 0 };
      }
      statsPeoes[m.competidorId].pontos += m.notaTotal;
      statsPeoes[m.competidorId].tempo += m.tempo;
      if (m.notaTotal > 0) statsPeoes[m.competidorId].paradas += 1;

      if (isRoundSelecionado) {
        statsPeoes[m.competidorId].pontosNoite = m.notaTotal;
        statsPeoes[m.competidorId].tempoNoite = m.tempo;
        statsPeoes[m.competidorId].paradasNoite = m.notaTotal > 0 ? 1 : 0;
      }

      // Ranking ANIMAIS (Etapa)
      if (!statsAnimais[m.animalId]) {
        statsAnimais[m.animalId] = { id: m.animalId, nome: m.animal.nome, companhia: m.animal.companhia, somaNotas: 0, qtd: 0, notaNoite: 0 };
      }
      statsAnimais[m.animalId].somaNotas += m.notaAnimal;
      statsAnimais[m.animalId].qtd += 1;

      if (isRoundSelecionado) {
        statsAnimais[m.animalId].notaNoite = m.notaAnimal;
      }

      // Ranking COMPANHIAS (Etapa)
      const keyCia = m.animal.companhia;
      if (!statsCompanhias[keyCia]) {
        statsCompanhias[keyCia] = { nome: m.animal.companhia, somaNotas: 0, qtd: 0 };
      }
      statsCompanhias[keyCia].somaNotas += m.notaAnimal;
      statsCompanhias[keyCia].qtd += 1;
    });
  });

  const sortRank = (a: any, b: any, isNoite: boolean) => {
    const pA = isNoite ? a.pontosNoite : a.pontos;
    const pB = isNoite ? b.pontosNoite : b.pontos;
    const tA = isNoite ? a.tempoNoite : a.tempo;
    const tB = isNoite ? b.tempoNoite : b.tempo;

    if (pB !== pA) return pB - pA;
    return tB - tA;
  };

  const isAcumulado = !searchParams?.roundId;
  const rankingFinalPeoes = Object.values(statsPeoes).sort((a,b) => sortRank(a, b, !isAcumulado));
  const rankingFinalAnimais = Object.values(statsAnimais)
    .map(a => ({ ...a, metric: isAcumulado ? (a.somaNotas / a.qtd) : a.notaNoite }))
    .sort((a,b) => b.metric - a.metric);

  const rankingFinalCompanhias = Object.values(statsCompanhias).map(c => ({ ...c, media: c.somaNotas / c.qtd })).sort((a,b) => b.media - a.media);

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Header com Navegação e Switch de Modalidade */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href={`/admin/etapas/${id}`} style={{ color: '#888', background: '#1a1a1a', padding: '0.6rem', borderRadius: '8px', border: '1px solid #333', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Resultados: {etapa.nome}</h1>
              <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>Classificação Oficial / Soma Limpa</p>
            </div>
          </div>

          {/*Botões de Modalidade (TOURO vs CAVALO) */}
          <div style={{ display: 'flex', background: '#111', borderRadius: '12px', padding: '6px', border: '1px solid #333', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            <Link 
              href={`?modalidade=Touro`} 
              style={{ 
                padding: '0.8rem 1.8rem', borderRadius: '10px', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.6rem',
                background: modalidadeAtiva === 'Touro' ? '#d4af37' : 'transparent', color: modalidadeAtiva === 'Touro' ? '#000' : '#888', transition: 'all 0.2s' 
              }}
            >
              🐂 RODEIO EM TOUROS
            </Link>
            <Link 
              href={`?modalidade=Cavalo`} 
              style={{ 
                padding: '0.8rem 1.8rem', borderRadius: '10px', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.6rem',
                background: modalidadeAtiva === 'Cavalo' ? '#4CAF50' : 'transparent', color: modalidadeAtiva === 'Cavalo' ? '#000' : '#888', transition: 'all 0.2s' 
              }}
            >
              🐎 RODEIO EM CAVALOS
            </Link>
          </div>
        </div>

        {/* Seletor de Noite (Filtra apenas rounds da modalidade ativa) */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#1a1a1a', padding: '1rem', borderRadius: '12px', border: '1px solid #333' }}>
          <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Período:</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href={`?modalidade=${modalidadeAtiva}`} style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 'bold', background: !searchParams?.roundId ? '#333' : 'transparent', color: !searchParams?.roundId ? '#fff' : '#666', border: '1px solid #333' }}>
              Acumulado Etapa
            </Link>
            {etapa.rounds.filter(r => r.modalidade === modalidadeAtiva).map(r => (
              <Link 
                key={r.id} 
                href={`?modalidade=${modalidadeAtiva}&roundId=${r.id}`} 
                style={{ 
                  padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 'bold', 
                  background: currentRoundId === r.id && searchParams?.roundId ? '#333' : 'transparent', 
                  color: currentRoundId === r.id && searchParams?.roundId ? '#fff' : '#666', 
                  border: currentRoundId === r.id && searchParams?.roundId ? '1px solid #555' : '1px solid #222' 
                }}
              >
                Noite {r.numero}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="responsive-grid" style={{ gap: '2rem', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
        
        {/* COLUNA ESQUERDA: Atletas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          <div className="premium-card" style={{ borderTop: `4px solid ${modalidadeAtiva === 'Touro' ? '#d4af37' : '#4CAF50'}`, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #222', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.4rem', color: modalidadeAtiva === 'Touro' ? '#d4af37' : '#4CAF50', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                <Star size={24} /> 
                Classificação Atletas: {modalidadeAtiva === 'Touro' ? 'Touros' : 'Cavalos'} 
                <span style={{ color: '#666', fontSize: '0.9rem', fontWeight: 'normal' }}>
                  ({searchParams?.roundId ? `Resultado Noite ${roundSelecionado?.numero}` : 'Acumulado Total'})
                </span>
              </h2>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', color: '#666', fontSize: '0.75rem', textTransform: 'uppercase' }}>Pos</th>
                  <th style={{ padding: '1rem', color: '#666', fontSize: '0.75rem', textTransform: 'uppercase' }}>Atleta (Peão)</th>
                  {!searchParams?.roundId && <th style={{ padding: '1rem', color: '#666', fontSize: '0.75rem', textAlign: 'center' }}>Válidas</th>}
                  <th style={{ padding: '1rem', color: '#666', fontSize: '0.75rem', textAlign: 'center' }}>Tempo</th>
                  <th style={{ padding: '1rem', color: modalidadeAtiva === 'Touro' ? '#d4af37' : '#4CAF50', fontSize: '0.8rem', textAlign: 'right', textTransform: 'uppercase' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {rankingFinalPeoes.map((r, index) => {
                  const pts = isAcumulado ? r.pontos : r.pontosNoite;
                  const tempo = isAcumulado ? r.tempo : r.tempoNoite;
                  const paradas = isAcumulado ? r.paradas : r.paradasNoite;

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #1a1a1a', background: index === 0 ? `rgba(${modalidadeAtiva === 'Touro' ? '212, 175, 55' : '76, 175, 80'}, 0.05)` : 'transparent' }}>
                      <td style={{ padding: '1.2rem 1rem', fontWeight: 'bold', fontSize: '1.1rem', color: index === 0 ? (modalidadeAtiva === 'Touro' ? '#d4af37' : '#4CAF50') : '#fff' }}>
                        {index + 1}º
                      </td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{r.nome}</div>
                      </td>
                      {!searchParams?.roundId && <td style={{ padding: '1.2rem 1rem', textAlign: 'center', color: paradas > 0 ? '#4CAF50' : '#888' }}>{paradas}</td>}
                      <td style={{ padding: '1.2rem 1rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>{tempo.toFixed(1)}s</td>
                      <td style={{ padding: '1.2rem 1rem', textAlign: 'right', fontWeight: '900', fontSize: '1.4rem', color: index === 0 ? (modalidadeAtiva === 'Touro' ? '#d4af37' : '#4CAF50') : '#fff' }}>
                        {pts.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Ranking de Tempo (Desempate) */}
          <div className="premium-card" style={{ borderTop: '4px solid #8e44ad' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#8e44ad', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} /> Melhores Tempos (Desempate {modalidadeAtiva})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {rankingFinalPeoes.sort((a,b) => b.tempo - a.tempo).slice(0,6).map((r, i) => (
                <div key={`tempo-${r.id}`} style={{ padding: '0.8rem', background: '#111', borderRadius: '8px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#888' }}>{i+1}. {r.nome}</span>
                  <span style={{ fontWeight: 'bold', color: '#8e44ad' }}>{r.tempo.toFixed(1)}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Animais */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="premium-card" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cat size={22} color={modalidadeAtiva === 'Touro' ? '#d4af37' : '#4CAF50'} /> 
              Melhores {modalidadeAtiva === 'Touro' ? 'Touros' : 'Cavalos'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {rankingFinalAnimais.slice(0,10).map((a, i) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: i === 0 ? 'rgba(255,255,255,0.03)' : '#111', borderRadius: '10px', border: '1px solid #222' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{i + 1}º - {a.nome}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>{a.companhia}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: modalidadeAtiva === 'Touro' ? '#d4af37' : '#4CAF50', fontSize: '1.1rem' }}>
                      {a.metric.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#444' }}>{isAcumulado ? 'Média' : 'Nota'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1.5rem' }}>
              Melhor {modalidadeAtiva === 'Touro' ? 'Boiada' : 'Tropa'} (Média)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {rankingFinalCompanhias.slice(0,8).map((c, i) => (
                <div key={c.nome} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #1a1a1a', fontSize: '0.9rem' }}>
                  <span style={{ color: '#888' }}>{i + 1}. {c.nome}</span>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>{c.media.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
