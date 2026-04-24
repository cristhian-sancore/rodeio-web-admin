'use client';

import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

export default function ChamadaOverlay() {
  const [montaria, setMontaria] = useState<any>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/overlay/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'UPDATE') {
        const isChamada = data.config?.overlayMode === 'CHAMADA';
        setActive(isChamada);
        if (data.montariaAtiva) {
          setMontaria(data.montariaAtiva);
        }
      }
    };

    return () => eventSource.close();
  }, []);

  if (!montaria) return null;

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
      <div className={`chamada-container ${active ? 'active' : ''}`} style={{
        width: '80%',
        maxWidth: '1200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '4rem',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.95) 100%)',
        borderRadius: '3rem',
        border: '4px solid var(--primary)',
        boxShadow: '0 0 50px rgba(212, 175, 55, 0.3)',
        transform: active ? 'scale(1)' : 'scale(0.8) translateY(100px)',
        opacity: active ? 1 : 0,
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        textAlign: 'center'
      }}>
        {/* Foto do Competidor */}
        <div style={{ 
          width: '300px', 
          height: '300px', 
          borderRadius: '50%', 
          border: '8px solid var(--primary)',
          overflow: 'hidden',
          marginBottom: '2rem',
          background: '#000',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          {montaria.competidor.fotoUrl ? (
             <img src={montaria.competidor.fotoUrl} alt={montaria.competidor.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
             <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={120} color="#333" />
             </div>
          )}
        </div>

        <h3 style={{ 
          fontSize: '2rem', 
          margin: 0, 
          color: 'var(--primary)', 
          textTransform: 'uppercase', 
          letterSpacing: '5px',
          fontWeight: '900' 
        }}>
          Próximo Competidor
        </h3>
        
        <h1 style={{ 
          fontSize: '5rem', 
          margin: '0.5rem 0', 
          fontWeight: '900', 
          lineHeight: '1.1',
          textShadow: '0 5px 15px rgba(0,0,0,0.5)'
        }}>
          {montaria.competidor.nome}
        </h1>

        <div style={{ 
          fontSize: '2rem', 
          color: '#888', 
          display: 'flex', 
          gap: '2rem', 
          marginTop: '1rem',
          background: 'rgba(255,255,255,0.05)',
          padding: '1rem 3rem',
          borderRadius: '100px'
        }}>
          <span>📍 {montaria.competidor.cidade} - {montaria.competidor.uf}</span>
          <span style={{ color: '#444' }}>|</span>
          <span>🏆 Rank: #{montaria.competidor.ranking || '-'}</span>
        </div>

        <div style={{ 
          marginTop: '3rem', 
          padding: '2rem', 
          width: '100%',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'center',
          gap: '4rem'
        }}>
           <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '1rem', color: '#666', textTransform: 'uppercase' }}>VAI MONTAR EM:</p>
              <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#fff' }}>{montaria.animal.nome}</h2>
           </div>
           <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '1rem', color: '#666', textTransform: 'uppercase' }}>CIA / TROPA:</p>
              <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#fff' }}>{montaria.animal.companhia}</h2>
           </div>
        </div>
      </div>

      <style jsx>{`
        .chamada-container {
          position: relative;
        }
        .chamada-container.active::before {
          content: '';
          position: absolute;
          inset: -10px;
          border-radius: 3.5rem;
          background: linear-gradient(45deg, var(--primary), transparent, var(--primary));
          z-index: -1;
          opacity: 0.3;
          animation: rotate 4s linear infinite;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
