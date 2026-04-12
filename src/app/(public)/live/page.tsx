'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Timer, Trophy, Star, Shield, TrendingUp, User, Cat, Award } from 'lucide-react';

export default function LivePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/public/live');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Erro ao buscar dados ao vivo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>Preparando a Arena...</div>;

  const mount = data?.data;
  const isRanking = data?.mode === 'RANKING';
  const melhorNoite = data?.melhorNoite;
  const rankingEtapa = data?.rankingEtapa;

  return (
    <div className="fade-in">
      
      {/* DESTAQUE: Melhor da Noite */}
      {melhorNoite && (
        <div className="premium-card" style={{ 
          marginBottom: '2rem', 
          background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, rgba(10, 10, 10, 1) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem 2.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'var(--primary)', color: '#000', padding: '1rem', borderRadius: '50%', display: 'flex' }}>
              <Award size={32} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '1px' }}>MELHOR DA NOITE (MAIOR NOTA)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', textTransform: 'uppercase' }}>{melhorNoite.nome}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)' }}>{melhorNoite.nota}</div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>No Touro: <span style={{color: '#fff'}}>{melhorNoite.animal}</span></div>
          </div>
        </div>
      )}

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '2rem' }}>
        
        {/* Painel Central: Montaria ou Ranking */}
        <div>
          {mount && !isRanking ? (
             <div className="premium-card" style={{ padding: '2.5rem', borderLeft: '5px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05 }}>
                   <Trophy size={200} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4444', marginBottom: '0.5rem' }}>
                       <div style={{ width: '8px', height: '8px', background: '#ff4444', borderRadius: '50%', boxShadow: '0 0 8px #ff4444' }}></div>
                       <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>AO VIVO NA ARENA</span>
                    </div>
                    <h1 style={{ fontSize: '3.5rem', margin: '0', fontWeight: '900', textTransform: 'uppercase', lineHeight: 1 }}>{mount.competidor}</h1>
                    <p style={{ color: '#888', fontSize: '1.2rem', marginTop: '0.5rem' }}>{mount.cidade}</p>
                  </div>
                  
                  {data.timerRunning && (
                    <div style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary)', padding: '1.2rem 2rem', borderRadius: '15px', textAlign: 'center', border: '1px solid rgba(212, 175, 55, 0.4)' }}>
                      <Timer size={28} style={{ marginBottom: '0.5rem' }} />
                      <div style={{ fontSize: '2rem', fontWeight: '900', fontFamily: 'monospace' }}>{mount.tempo > 0 ? mount.tempo : '8.00'}s</div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.4rem', fontWeight: 'bold' }}>ANIMAL / COMPANHIA</label>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{mount.animal}</div>
                    <div style={{ color: 'var(--primary)', fontSize: '1rem', fontWeight: 'bold' }}>{mount.companhia}</div>
                  </div>
                  <div style={{ width: '150px', textAlign: 'right' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.4rem', fontWeight: 'bold' }}>NOTA ATUAL</label>
                    <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary)' }}>
                      {mount.total !== '0.00' ? mount.total : '---'}
                    </div>
                  </div>
                </div>
             </div>
          ) : (
            <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
               <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Trophy size={24} color="var(--primary)" /> 
                    {isRanking ? data.rankingData.title : "RANKING GERAL DA ETAPA (ACUMULADO)"}
                  </h2>
                  {!mount && !isRanking && (
                     <span style={{ fontSize: '0.75rem', color: '#666', background: '#111', padding: '4px 10px', borderRadius: '4px' }}>ARENA EM INTERVALO</span>
                  )}
               </div>
               
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#444', fontSize: '0.75rem', borderBottom: '1px solid #1a1a1a' }}>
                      <th style={{ padding: '1rem 2rem' }}>POS</th>
                      <th>COMPETIDOR</th>
                      <th style={{ textAlign: 'right', paddingRight: '2rem' }}>PONTOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(isRanking ? data.rankingData.list : rankingEtapa?.list || []).map((r: any) => (
                      <tr key={r.pos} style={{ borderBottom: '1px solid #0f0f0f', background: r.pos % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td style={{ padding: '1rem 2rem', fontWeight: '900', color: r.pos <= 3 ? 'var(--primary)' : '#444' }}>#{r.pos}</td>
                        <td style={{ padding: '1rem 0' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{r.nome}</div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>{r.info}</div>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '2rem', fontWeight: '900', fontSize: '1.3rem', color: 'var(--primary)' }}>{r.nota}</td>
                      </tr>
                    ))}
                    {(!isRanking && (!rankingEtapa || rankingEtapa.list.length === 0)) && (
                      <tr>
                        <td colSpan={3} style={{ padding: '5rem', textAlign: 'center', color: '#333' }}>Iniciando processamento dos rankings...</td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
          )}
        </div>

        {/* Sidebar Lateral */}
        <div>
          <div className="premium-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="var(--primary)" /> RESUMO DA ETAPA
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Líder da Etapa:</span>
                <span style={{ fontWeight: 'bold' }}>{rankingEtapa?.list?.[0]?.nome || '---'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Saldo de Notas:</span>
                <span style={{ fontWeight: 'bold' }}>90+ Ptos</span>
              </div>
            </div>
          </div>

          <Link href="/ranking" className="premium-card" style={{ textDecoration: 'none', display: 'block', marginBottom: '1rem', textAlign: 'center', border: '1px dotted #333' }}>
             <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>VER RANKING DO CAMPEONATO COMPLETO</p>
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
             <Link href="/competidores" className="premium-card" style={{ textDecoration: 'none', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <User color="var(--primary)" />
                <div>
                   <h4 style={{ margin: 0, color: '#fff' }}>ATLETAS</h4>
                   <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>Perfis e Desempenho</p>
                </div>
             </Link>
             <Link href="/animais" className="premium-card" style={{ textDecoration: 'none', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Cat color="var(--primary)" />
                <div>
                   <h4 style={{ margin: 0, color: '#fff' }}>BOIADA</h4>
                   <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>Médias e Histórico</p>
                </div>
             </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
