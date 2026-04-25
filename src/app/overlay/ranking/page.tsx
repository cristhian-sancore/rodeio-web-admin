'use client';

import { useEffect, useState } from 'react';
import { Trophy, Star } from 'lucide-react';

export default function RankingOverlay() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [active, setActive] = useState(false);

  const fetchRanking = async () => {
    const res = await fetch('/api/public/ranking');
    const data = await res.json();
    setRanking(data.peoes.slice(0, 10));
  };

  useEffect(() => {
    fetchRanking();
    const eventSource = new EventSource('/api/overlay/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'UPDATE') {
        const isRanking = data.config?.overlayMode === 'RANKING';
        setActive(isRanking);
        if (isRanking) fetchRanking();
      }
    };

    return () => eventSource.close();
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      overflow: 'hidden',
      color: '#fff',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div className={`ranking-container ${active ? 'active' : ''}`} style={{
        width: '90%',
        maxWidth: '1400px',
        padding: '3rem',
        background: 'rgba(0,0,0,0.9)',
        borderRadius: '2rem',
        border: '3px solid var(--primary)',
        boxShadow: '0 0 40px rgba(0,0,0,0.8)',
        transform: active ? 'translateY(0)' : 'translateY(100vh)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
           <h1 style={{ margin: 0, fontSize: '3rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Trophy size={48} color="var(--primary)" /> RANKING DO CAMPEONATO
           </h1>
           <div style={{ background: 'var(--primary)', color: '#000', padding: '0.5rem 1.5rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.2rem' }}>
              TOP 10 ATLETAS
           </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
           {ranking.map((p, idx) => (
             <div key={p.id} style={{ 
               display: 'flex', 
               alignItems: 'center', 
               padding: '1rem 2rem', 
               background: idx < 3 ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.02)',
               borderRadius: '1rem',
               border: idx < 3 ? '1px solid var(--primary)' : '1px solid transparent',
               animation: active ? `slideIn 0.5s ease-out ${idx * 0.1}s forwards` : 'none',
               opacity: 0,
               transform: 'translateX(-50px)'
             }}>
                <div style={{ width: '60px', fontSize: '2rem', fontWeight: '900', color: idx < 3 ? 'var(--primary)' : '#444' }}>
                   #{idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                   <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{p.nome}</div>
                   <div style={{ fontSize: '1rem', color: '#888' }}>{p.origem}</div>
                </div>
                 <div style={{ textAlign: 'center', width: '120px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>PARADAS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{p.paradas}</div>
                 </div>
                 <div style={{ textAlign: 'center', width: '150px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#ff4444' }}>DIFERENÇA</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: idx === 0 ? 'var(--primary)' : '#ff4444' }}>
                      {idx === 0 ? 'LÍDER' : p.diff || '0.0'}
                    </div>
                 </div>
                 <div style={{ textAlign: 'right', width: '180px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>PONTOS</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)', lineHeight: 1 }}>{p.pontosLiga.toFixed(1)}</div>
                 </div>
             </div>
           ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
