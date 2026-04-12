'use client';

import { useState, useEffect, useRef } from 'react';

interface OverlayData {
  active: boolean;
  numJuizes?: number;
  mode?: 'NOTA' | 'RANKING';
  rankingMode?: string;
  rankingPage?: number;
  rankingData?: {
    title: string;
    list: Array<{
      pos: number;
      nome: string;
      info: string;
      nota: string;
      extra: string;
    }>;
  };
  data?: {
    id: number;
    competidor: string;
    cidade?: string;
    animal: string;
    companhia: string;
    j1Nome: string; j1P: string; j1A: string; j1Total: string;
    j2Nome: string; j2P: string; j2A: string; j2Total: string;
    j3Nome: string; j3P: string; j3A: string; j3Total: string;
    j4Nome: string; j4P: string; j4A: string; j4Total: string;
    total: string;
    tempo: string;
    etapaRank?: string;
    etapaDiff?: string;
    desclassificado: boolean;
    motivo?: string;
  };
  timerRunning?: boolean;
  timerStartedAt?: string;
  serverTime?: number;
}

export default function OverlayNotaPage() {
  const [data, setData] = useState<OverlayData | null>(null);
  const [visible, setVisible] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [nameScale, setNameScale] = useState(1);
  const serverOffsetRef = useRef(0);
  const lastIdRef = useRef<number | null>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);

  // Efeito para ajustar o tamanho do nome do competidor
  useEffect(() => {
    if (nameRef.current) {
      const parent = nameRef.current.parentElement;
      if (parent) {
        const parentWidth = parent.clientWidth;
        const nameWidth = nameRef.current.scrollWidth;
        if (nameWidth > parentWidth) {
          setNameScale(parentWidth / nameWidth);
        } else {
          setNameScale(1);
        }
      }
    }
  }, [data?.data?.competidor]);

  useEffect(() => {
    const setTransparent = () => {
      document.documentElement.style.setProperty('background', 'transparent', 'important');
      document.documentElement.style.setProperty('background-color', 'transparent', 'important');
      document.body.style.setProperty('background', 'transparent', 'important');
      document.body.style.setProperty('background-color', 'transparent', 'important');
    };
    setTransparent();
    
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/overlay/current?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const json = await res.json();
        
        if (json.active) {
          if (json.serverTime) serverOffsetRef.current = json.serverTime - Date.now();
          setData(json);
          setVisible(true);
        } else {
          setVisible(false);
          setTimeout(() => setData(null), 500);
        }
      } catch (err) {
        console.error('Erro overlay:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    if (data?.data?.id && data.data.id !== lastIdRef.current) {
      lastIdRef.current = data.data.id;
      setElapsedTime(parseFloat(data.data.tempo) || 0);
    }
    const updateTimer = () => {
      if (data?.timerRunning && data.timerStartedAt) {
        const start = new Date(data.timerStartedAt).getTime();
        const currentRemoteTime = Date.now() + serverOffsetRef.current;
        const elapsed = (currentRemoteTime - start) / 1000;
        setElapsedTime(elapsed >= 8 ? 8 : elapsed);
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };
    if (data?.timerRunning) animationFrameId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(animationFrameId);
  }, [data?.timerRunning, data?.timerStartedAt, data?.data?.tempo, data?.data?.id]);

  if (!visible && !data) return null;

  const d = data?.data;
  const isRanking = data?.mode === 'RANKING';
  const numJuizes = data?.numJuizes || 2;
  const rankingPage = typeof data?.rankingPage === 'number' ? data.rankingPage : 0;
  const itemsPerPage = 10;

  // Lógica de Paginação do Ranking
  const displayRanking = isRanking && data.rankingData ? {
    ...data.rankingData,
    list: data.rankingData.list.slice(rankingPage * itemsPerPage, (rankingPage + 1) * itemsPerPage)
  } : null;

  const formatScore = (val: any) => {
    if (!val) return '0';
    const n = parseFloat(String(val));
    return isNaN(n) ? val : (n % 1 === 0 ? n.toFixed(0) : n.toString());
  };

  return (
    <div className={`overlay-wrapper ${visible ? 'active' : ''} ${isRanking ? 'ranking-mode' : 'nota-mode'}`}>
      <style jsx global>{`
        html, body { background: transparent !important; overflow: hidden; }
      `}</style>
      <style jsx>{`
        .overlay-wrapper {
          position: fixed;
          inset: 0;
          opacity: 0;
          transition: opacity 0.5s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
        }
        .overlay-wrapper.active { opacity: 1; }

        /* MODO NOTA (ESTILO GIGANTE PARA LED) */
        .nota-mode .nota-container {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%); /* Centralizado e Compacto */
          display: flex;
          align-items: stretch;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.6));
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          width: fit-content;
          min-width: 800px;
        }
        @keyframes slideUp { from { transform: translate(-50%, 100px); } to { transform: translate(-50%, 0); } }

        .info-card {
          background: linear-gradient(135deg, rgba(15, 15, 15, 0.98) 0%, rgba(5, 5, 5, 1) 100%);
          border-left: 12px solid #D4AF37;
          padding: 30px 60px 30px 50px;
          clip-path: polygon(0 0, 100% 0, 96% 100%, 0% 100%);
          min-width: 300px;
          flex: initial; /* Ajusta ao conteúdo */
        }
        .competidor-name-container {
          overflow: hidden;
          width: 100%;
        }
        .competidor-name { 
          color: #fff; 
          font-size: 4.5rem; 
          font-weight: 900; 
          text-transform: uppercase; 
          margin: 0; 
          letter-spacing: -1px;
          white-space: nowrap;
          display: inline-block;
          transform-origin: left center;
        }
        .animal-name { color: #D4AF37; font-size: 2.5rem; font-weight: 700; text-transform: uppercase; margin-top: 10px; display: block; }

        .judges-section {
          background: rgba(15, 15, 15, 0.95);
          backdrop-filter: blur(10px);
          margin-left: -40px;
          padding: 20px 50px 20px 90px;
          display: flex;
          gap: 40px;
          clip-path: polygon(40px 0, 100% 0, calc(100% - 30px) 100%, 0% 100%);
        }
        .judge-box { border-left: 4px solid #D4AF37; padding-left: 20px; min-width: 180px; }
        .judge-title { font-size: 1.5rem; color: #D4AF37; font-weight: 900; text-transform: uppercase; display: block; margin-bottom: 8px; }
        .judge-scores-row { display: flex; gap: 15px; font-size: 1.3rem; }
        .judge-score-label { font-size: 1rem; color: #D4AF37; font-weight: bold; }
        .judge-score-value { color: #fff; font-weight: 700; font-size: 1.8rem; }
        .subtotal { font-size: 3rem; color: #fff; font-weight: 900; margin-top: 8px; border-top: 2px solid rgba(212, 175, 55, 0.3); padding-top: 5px; }

        .final-score-card {
          min-width: 300px;
          background: linear-gradient(180deg, #F9D976 0%, #D4AF37 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 25px 50px 25px 70px;
          clip-path: polygon(40px 0, 100% 0, 100% 100%, 0% 100%);
          margin-left: -40px;
        }
        .rank-display { font-size: 2.5rem; font-weight: 950; color: #000; }
        .rank-diff { font-size: 1.3rem; font-weight: 900; color: #000; opacity: 0.6; }
        .total-label { font-size: 1.2rem; font-weight: 900; color: #000; }
        .total-value { font-size: 6rem; font-weight: 950; color: #000; letter-spacing: -3px; line-height: 1; }

        .tempo-badge {
          position: absolute;
          top: -55px;
          right: 250px;
          background: #000;
          color: #D4AF37;
          padding: 8px 30px;
          font-weight: 900;
          font-size: 1.8rem;
          border: 3px solid #D4AF37;
          clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
        }

        /* MODO RANKING (TELA CHEIA) */
        .ranking-mode {
          background: #000; /* Fundo Preto Sólido conforme solicitado */
        }
        .ranking-full {
          width: 94%;
          max-width: 1700px;
          height: 90%;
          display: flex;
          flex-direction: column;
        }

        .fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ranking-header {
           border-bottom: 3px solid #D4AF37;
           margin-bottom: 25px;
           padding-bottom: 15px;
           display: flex;
           justify-content: space-between;
           align-items: flex-end;
        }
        .ranking-title { font-size: 3.8rem; fontWeight: 950; color: #fff; text-transform: uppercase; letter-spacing: 1px; }
        .ranking-subtitle { font-size: 1.5rem; color: #D4AF37; fontWeight: 900; text-transform: uppercase; }

        .ranking-table { width: 100%; border-collapse: collapse; }
        .rank-row { border-bottom: 1px solid rgba(212, 175, 55, 0.1); height: 68px; transition: background 0.3s; }
        .rank-row:nth-child(even) { background: rgba(255,255,255,0.02); }
        
        .rank-cell { color: #fff; font-size: 2rem; fontWeight: 700; padding: 0 15px; }
        .rank-pos { color: #D4AF37; fontWeight: 900; width: 100px; }
        .rank-competidor { text-transform: uppercase; }
        .rank-info { font-size: 1.2rem; color: #888; display: block; }
        .rank-nota { text-align: right; color: #D4AF37; fontWeight: 900; font-size: 2.8rem; width: 200px; }
        .rank-extra { text-align: right; font-size: 1.3rem; color: #666; width: 100px; }

        .page-indicator {
          position: absolute;
          bottom: 40px;
          right: 5%;
          color: #D4AF37;
          font-size: 1.2rem;
          font-weight: 900;
          background: rgba(0,0,0,0.5);
          padding: 5px 20px;
          border-radius: 20px;
          border: 1px solid #D4AF37;
        }

        .desclassificado { position: absolute; top: -30px; left: 40px; background: #ff4444; color: #fff; padding: 5px 20px; font-weight: 900; z-index: 10; font-size: 0.9rem; }

        /* Ajuste do nome para evitar estouro */
        .competidor-name-container {
          overflow: hidden;
          width: 100%;
        }
        .competidor-name { 
          color: #fff; 
          font-size: 4.5rem; 
          font-weight: 900; 
          text-transform: uppercase; 
          margin: 0; 
          letter-spacing: -1px;
          white-space: nowrap;
          display: inline-block;
          transform-origin: left center;
        }
      `}</style>

      {isRanking ? (
        <div className="ranking-full fade-in">
           {displayRanking ? (
             <>
               <div className="ranking-header">
                  <h1 className="ranking-title">{displayRanking.title}</h1>
                  <div className="ranking-subtitle">Classificação Oficial</div>
               </div>
               <table className="ranking-table">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #D4AF37', textAlign: 'left' }}>
                      <th style={{ color: '#D4AF37', fontSize: '1.2rem', padding: '10px 20px' }}>POS</th>
                      <th style={{ color: '#D4AF37', fontSize: '1.2rem', padding: '10px 20px' }}>{displayRanking.title.includes('TOURO') ? 'TOURO / CIA' : 'COMPETIDOR / CIDADE'}</th>
                      <th style={{ color: '#D4AF37', fontSize: '1.2rem', padding: '10px 20px', textAlign: 'right' }}>{displayRanking.title.includes('TOURO') ? 'MÉDIA' : 'NOTA'}</th>
                      <th style={{ color: '#D4AF37', fontSize: '1.2rem', padding: '10px 20px', textAlign: 'right' }}>DIF.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRanking.list.map((r) => (
                      <tr key={r.pos} className="rank-row">
                        <td className="rank-cell rank-pos">#{r.pos}</td>
                        <td className="rank-cell rank-competidor">
                           {r.nome}
                           <span className="rank-info">{r.info}</span>
                        </td>
                        <td className="rank-cell rank-nota">{r.nota}</td>
                        <td className="rank-cell rank-extra" style={{ textAlign: 'right', color: r.extra === '-' ? '#444' : '#fff' }}>{r.extra}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </>
           ) : (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontSize: '2rem' }}>
                Carregando Ranking...
             </div>
           )}
        </div>
      ) : d ? (
        <div className="nota-container">
          {d.desclassificado && <div className="desclassificado">DESCLASSIFICADO</div>}
          <div className="tempo-badge">TEMPO: {elapsedTime.toFixed(2)}s</div>
          
          <div className="info-card">
             <div className="competidor-name-container">
               <h1 ref={nameRef} className="competidor-name" style={{ transform: `scale(${nameScale})` }}>{d.competidor}</h1>
             </div>
             <span className="animal-name">{d.animal}</span>
          </div>

          <div className="judges-section">
             {[1,2,3,4].slice(0, numJuizes).map(i => (
               <div key={i} className="judge-box">
                  <span className="judge-title">{(d as any)[`j${i}Nome`] || `J${i}`}</span>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', color: '#D4AF37', fontWeight: 'bold' }}>PEÃO</div>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '1.8rem' }}>{formatScore((d as any)[`j${i}P`])}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', color: '#D4AF37', fontWeight: 'bold' }}>ANIMAL</div>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '1.8rem' }}>{formatScore((d as any)[`j${i}A`])}</div>
                    </div>
                  </div>
                  <div className="subtotal">{formatScore((d as any)[`j${i}Total`])}</div>
               </div>
             ))}
          </div>

          <div className="final-score-card">
             {d.etapaRank && d.etapaRank !== '---' && (
               <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                 <span className="rank-display">{d.etapaRank}</span>
                 <span className="rank-diff" style={{ display: 'block' }}>
                   {d.etapaDiff === 'LÍDER' ? '🏆 LÍDER' : `DIF: ${d.etapaDiff}`}
                 </span>
               </div>
             )}
             <span className="total-label">NOTA DO DIA</span>
             <div className="total-value">{d.desclassificado ? '00.0' : formatScore(d.total)}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
