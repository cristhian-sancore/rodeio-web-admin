'use client';

import { useState, useEffect, useRef } from 'react';

interface OverlayData {
  active: boolean;
  mode: 'ID' | 'CHAMADA' | 'RANKING'; 
  numJuizes?: number;
  rankingMode?: string;
  rankingPage?: number;
  rankingData?: {
    title: string;
    list: Array<{ pos: number; nome: string; info: string; nota: string; extra: string; }>;
  };
  data?: {
    id: number;
    competidor: string;
    competidorFoto?: string;
    competidorCidade?: string;
    competidorRankChamp?: string;
    competidorParadas?: string;
    animal: string;
    animalFoto?: string;
    animalCompanhia?: string;
    animalMedia?: string;
    j1Nome?: string; j1P?: number; j1A?: number; j1Total?: string;
    j2Nome?: string; j2P?: number; j2A?: number; j2Total?: string;
    j3Nome?: string; j3P?: number; j3A?: number; j3Total?: string;
    j4Nome?: string; j4P?: number; j4A?: number; j4Total?: string;
    total: string;
    tempo: string;
    etapaRank?: string;
    etapaDiff?: string;
    desclassificado: boolean;
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
  const nameRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    
    const connectSSE = () => {
      const eventSource = new EventSource('/api/overlay/stream');
      
      eventSource.onmessage = (event) => {
        try {
          const json = JSON.parse(event.data);
          if (json.active) {
            if (json.serverTime) serverOffsetRef.current = json.serverTime - Date.now();
            setData(json);
            setVisible(true);
          } else {
            setVisible(false);
            setTimeout(() => setData(null), 500);
          }
        } catch (err) {
          console.error('Erro no payload SSE', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('Erro SSE. Reconectando...', err);
        eventSource.close();
        setTimeout(connectSSE, 2000);
      };

      return eventSource;
    };

    const es = connectSSE();
    return () => es.close();
  }, []);

  useEffect(() => {
    let animationFrameId: number;
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
  }, [data?.timerRunning, data?.timerStartedAt]);

  useEffect(() => {
    if (nameRef.current) {
        const parentWidth = data?.mode === 'ID' ? 350 : 800;
        const nameWidth = nameRef.current.scrollWidth;
        setNameScale(nameWidth > parentWidth ? parentWidth / nameWidth : 1);
    }
  }, [data?.data?.competidor, data?.mode]);

  if (!visible && !data) return null;

  const d = data?.data;
  const mode = data?.mode || 'ID';
  const isRanking = mode === 'RANKING';
  const numJuizes = data?.numJuizes || 2;
  const rankingPage = typeof data?.rankingPage === 'number' ? data.rankingPage : 0;
  const itemsPerPage = 10;

  const displayRanking = isRanking && data.rankingData ? {
    ...data.rankingData,
    list: data.rankingData.list.slice(rankingPage * itemsPerPage, (rankingPage + 1) * itemsPerPage)
  } : null;

  const formatScore = (val: any) => {
    if (val === undefined || val === null) return '0';
    const n = parseFloat(String(val));
    return isNaN(n) ? val : (n % 1 === 0 ? n.toFixed(0) : n.toString());
  };

  return (
    <div className={`overlay-master ${visible ? 'show' : 'hide'} mode-${mode}`}>
      <style jsx global>{`
        html, body { background: transparent !important; margin: 0; overflow: hidden; font-family: 'Inter', sans-serif; }
        .overlay-master { position: fixed; inset: 0; transition: opacity 0.5s ease; opacity: 0; }
        .overlay-master.show { opacity: 1; }

        /* --- MODO ID (DESIGN ORIGINAL RESTAURADO) --- */
        .mode-ID .nota-container {
          position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: stretch; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.6));
          width: fit-content; min-width: 800px;
        }
        .mode-ID .info-card {
          background: linear-gradient(135deg, rgba(15, 15, 15, 0.98) 0%, rgba(5, 5, 5, 1) 100%);
          border-left: 12px solid #D4AF37; padding: 30px 60px 30px 50px;
          clip-path: polygon(0 0, 100% 0, 96% 100%, 0% 100%); min-width: 350px;
        }
        .mode-ID .competidor-name { color: #fff; font-size: 3.5rem; font-weight: 950; text-transform: uppercase; margin: 0; white-space: nowrap; transform-origin: left center; }
        .mode-ID .animal-name { color: #D4AF37; font-size: 1.8rem; font-weight: 800; text-transform: uppercase; margin-top: 5px; display: block; border-top: 1px solid rgba(212,175,55,0.3); padding-top: 5px; }
        
        .mode-ID .judges-section {
          background: rgba(15, 15, 15, 0.95); backdrop-filter: blur(10px); margin-left: -40px;
          padding: 20px 40px 20px 80px; display: flex; gap: 30px;
          clip-path: polygon(40px 0, 100% 0, calc(100% - 30px) 100%, 0% 100%);
        }
        .mode-ID .judge-box { border-left: 3px solid #D4AF37; padding-left: 15px; min-width: 140px; display: flex; flex-direction: column; justify-content: space-between; }
        .mode-ID .judge-title { font-size: 1rem; color: #D4AF37; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; display: block; background: rgba(0,0,0,0.3); padding: 2px 5px; }
        .mode-ID .judge-score-label { font-size: 0.75rem; color: #D4AF37; font-weight: bold; text-transform: uppercase; opacity: 0.8; }
        .mode-ID .judge-score-value { color: #fff; font-weight: 700; font-size: 1.4rem; line-height: 1; }
        .mode-ID .subtotal { font-size: 2.6rem; color: #fff; font-weight: 950; margin-top: 4px; border-top: 1px solid rgba(212, 175, 55, 0.3); padding-top: 4px; line-height: 1; }
        
        .mode-ID .final-score-card {
          min-width: 250px; background: linear-gradient(180deg, #F9D976 0%, #D4AF37 100%);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 20px 40px 20px 60px; clip-path: polygon(40px 0, 100% 0, 100% 100%, 0% 100%);
          margin-left: -40px;
        }
        .mode-ID .total-value { font-size: 5rem; font-weight: 950; color: #000; letter-spacing: -2px; line-height: 1; }
        
        .mode-ID .header-badges { position: absolute; top: -45px; left: 0; display: flex; gap: 10px; }
        .mode-ID .badge { 
          background: #000; color: #D4AF37; padding: 5px 25px; font-weight: 900; font-size: 1.3rem; 
          border: 2px solid #D4AF37; clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
        }
        .mode-ID .badge-pos { background: #D4AF37; color: #000; }

        /* --- MODO CHAMADA --- */
        .mode-CHAMADA .chamada-fullscreen {
          position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(30,30,30,0.5) 0%, rgba(0,0,0,0.95) 100%);
          display: flex; align-items: center; justify-content: center;
        }
        .chamada-grid { display: flex; align-items: center; justify-content: center; width: 100%; max-width: 1800px; height: 100%; position: relative; }
        .side-photo { width: 500px; height: 750px; position: relative; clip-path: polygon(15% 0, 100% 0, 85% 100%, 0 100%); border: 8px solid #D4AF37; overflow: hidden; box-shadow: 0 0 80px rgba(212,175,55,0.3); }
        .side-photo img { width: 100%; height: 100%; object-fit: cover; animation: kenBurns 10s infinite alternate; }
        .name-rider-full { font-size: 7rem; font-weight: 950; text-transform: uppercase; line-height: 0.85; margin: 20px 0 0; color: #fff; }

        /* --- MODO RANKING --- */
        .mode-RANKING .ranking-wrapper {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          padding: 40px;
        }
        .mode-RANKING .ranking-full {
          width: 100%; max-width: 1840px; height: 100%; max-height: 1000px; display: flex; flex-direction: column; 
          background: rgba(10, 10, 10, 0.98); padding: 50px 60px; border-radius: 24px; border: 4px solid #D4AF37;
          box-shadow: 0 0 50px rgba(212, 175, 55, 0.2);
          animation: popCenter 0.5s ease-out;
        }

        @keyframes popCenter { from { opacity: 0; transform: scale(1.5); filter: blur(20px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }
      `}</style>

      {/* RANKING */}
      {isRanking && displayRanking && (
        <div className="ranking-wrapper">
          <div className="ranking-full">
              <div className="ranking-header">
                <h1 style={{ fontSize: '3.8rem', color: '#fff', margin: 0 }}>{displayRanking.title}</h1>
                <div style={{ color: '#D4AF37', fontSize: '1.5rem', fontWeight: 900 }}>Classificação Oficial</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ borderBottom: '3px solid #D4AF37' }}>
                        <th style={{ color: '#D4AF37', fontSize: '1.2rem', padding: '15px', textAlign: 'left' }}>POS</th>
                        <th style={{ color: '#D4AF37', fontSize: '1.2rem', padding: '15px', textAlign: 'left' }}>NOME / INFO</th>
                        <th style={{ color: '#D4AF37', fontSize: '1.2rem', padding: '15px', textAlign: 'right' }}>NOTA</th>
                    </tr>
                </thead>
                <tbody>
                    {displayRanking.list.map((r) => (
                        <tr key={r.pos} style={{ borderBottom: '1px solid rgba(212,175,55,0.2)', height: '70px' }}>
                            <td style={{ color: '#D4AF37', fontSize: '2.5rem', fontWeight: 900 }}>#{r.pos}</td>
                            <td style={{ color: '#fff', fontSize: '2rem', fontWeight: 700 }}>
                                {r.nome} <span style={{ fontSize: '1.2rem', color: '#888', fontWeight: 400 }}>{r.info}</span>
                            </td>
                            <td style={{ color: '#D4AF37', fontSize: '2.8rem', fontWeight: 900, textAlign: 'right' }}>{r.nota}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOWER THIRD (ID) */}
      {mode === 'ID' && d && (
        <div className="nota-container">
          {/* HEADER BADGES (TEMPO, RANK E DIFF) */}
          <div className="header-badges">
            <div className="badge">TEMPO: {elapsedTime.toFixed(2)}s</div>
            <div className="badge badge-pos">ETAPA: {d.etapaRank}</div>
            {d.etapaDiff && <div className="badge">DIFF LÍDER: {d.etapaDiff}</div>}
          </div>

          <div className="info-card">
             <h1 ref={nameRef} className="competidor-name" style={{ transform: `scale(${nameScale})` }}>{d.competidor}</h1>
             <span className="animal-name">{d.animal}</span>
          </div>

          <div className="judges-section">
             {[1,2,3,4].slice(0, numJuizes).map(i => (
               <div key={i} className="judge-box">
                  <span className="judge-title">{(d as any)[`j${i}Nome`]}</span>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '4px' }}>
                    <div style={{ flex: 1 }}>
                      <span className="judge-score-label">P:</span>
                      <span className="judge-score-value"> {formatScore((d as any)[`j${i}P`])}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span className="judge-score-label">T:</span>
                      <span className="judge-score-value"> {formatScore((d as any)[`j${i}A`])}</span>
                    </div>
                  </div>
                  <div className="subtotal">{formatScore((d as any)[`j${i}Total`])}</div>
               </div>
             ))}
          </div>
          <div className="final-score-card">
              <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#000' }}>NOTA FINAL</span>
              <div className="total-value">{d.desclassificado ? '00.0' : formatScore(d.total)}</div>
          </div>
        </div>
      )}

      {/* CHAMADA (FULL) */}
      {mode === 'CHAMADA' && d && (
        <div className="chamada-fullscreen">
          <div className="chamada-grid">
            <div className="side-photo photo-rider"><img src={d.competidorFoto} alt="P" /><div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '10px', background: 'rgba(0,0,0,0.8)', color: '#D4AF37', textAlign: 'center', fontSize: '1.2rem', fontWeight: 900 }}>{d.competidorCidade}</div></div>
            <div className="center-info">
              <div style={{ fontSize: '6rem', fontWeight: 950, color: '#000', WebkitTextStroke: '2px #D4AF37', textShadow: '0 0 20px #D4AF37', fontStyle: 'italic', fontStyle: 'italic', letterSpacing: '-5px' }}>CONFRONTO</div>
              <h1 style={{ fontSize: '7rem', fontWeight: 950, textTransform: 'uppercase', lineHeight: 0.85, margin: '20px 0 0', color: '#fff' }}>{d.competidor}</h1>
              <div style={{ fontSize: '4rem', color: '#D4AF37', fontWeight: 800, margin: '10px 0', textTransform: 'uppercase' }}>{d.animal}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '50px' }}>
                <div style={{ border: '2px solid #D4AF37', background: 'rgba(212,175,55,0.1)', padding: '20px 40px', transform: 'skewX(-15deg)' }}><span style={{ transform: 'skewX(15deg)', display: 'block', fontSize: '0.9rem', color: '#D4AF37', fontWeight: 900 }}>RANKING</span><span style={{ transform: 'skewX(15deg)', display: 'block', fontSize: '3.5rem', color: '#fff', fontWeight: 950 }}>#{d.competidorRankChamp || '---'}</span></div>
                <div style={{ border: '2px solid #D4AF37', background: 'rgba(212,175,55,0.1)', padding: '20px 40px', transform: 'skewX(-15deg)' }}><span style={{ transform: 'skewX(15deg)', display: 'block', fontSize: '0.9rem', color: '#D4AF37', fontWeight: 900 }}>PARADAS</span><span style={{ transform: 'skewX(15deg)', display: 'block', fontSize: '3.5rem', color: '#fff', fontWeight: 950 }}>{d.competidorParadas || '0%'}</span></div>
                <div style={{ border: '2px solid #D4AF37', background: 'rgba(212,175,55,0.1)', padding: '20px 40px', transform: 'skewX(-15deg)' }}><span style={{ transform: 'skewX(15deg)', display: 'block', fontSize: '0.9rem', color: '#D4AF37', fontWeight: 900 }}>MÉDIA BOI</span><span style={{ transform: 'skewX(15deg)', display: 'block', fontSize: '3.5rem', color: '#fff', fontWeight: 950 }}>{d.animalMedia || '0'}</span></div>
              </div>
            </div>
            <div className="side-photo photo-bull"><img src={d.animalFoto} alt="T" /><div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '10px', background: 'rgba(0,0,0,0.8)', color: '#D4AF37', textAlign: 'center', fontSize: '1.2rem', fontWeight: 900 }}>{d.animalCompanhia}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
