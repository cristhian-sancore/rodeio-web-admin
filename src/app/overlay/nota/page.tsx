'use client';

import { useState, useEffect, useRef } from 'react';
import { deactivateVMixOverlay } from '@/app/admin/etapas/actions';

interface OverlayData {
  active: boolean;
  mode: 'ID' | 'CHAMADA' | 'RANKING'; 
  numJuizes?: number;
  rankingMode?: string;
  rankingPage?: number;
  rankingData?: {
    title: string;
    list: Array<{ pos: number; nome: string; info: string; nota: string; extra: string; diff: string; }>;
  };
  rankingCongelado?: boolean;
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
    etapaNotaAcumulada?: string;
    roundNumero?: number;
    desclassificado: boolean;
  };
  timerRunning?: boolean;
  timerStartedAt?: string;
  exibirCronometroNoOverlay?: boolean;
  serverTime?: number;
}

export default function OverlayNotaPage() {
  const [data, setData] = useState<OverlayData | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerVisible, setTimerVisible] = useState(false);
  const [rideStarted, setRideStarted] = useState(false);
  const [nameScale, setNameScale] = useState(1);
  const [lowerThirdForcedHide, setLowerThirdForcedHide] = useState(false);
  const timerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ltHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const serverOffsetRef = useRef(0);
  const nameRef = useRef<HTMLHeadingElement>(null);

  const d = data?.data;
  const isScored = !!d && (parseFloat(d.total) > 0 || d.desclassificado);
  const isPendingScore = !isScored;

  // Carregar Configurações do Construtor
  useEffect(() => {
    fetch('/api/public/config').then(res => res.json()).then(setConfig);
  }, []);

  // Mapear Estilo do Construtor para o Overlay
  const overlayStyle = (() => {
     if (!config?.siteLayouts?.OVERLAYS) return { accent: '#D4AF37', background: '#000000', labelRank: 'RANK ETAPA', labelDiff: 'DIFF LÍDER', labelScore: 'NOTA FINAL' };
     const mode = data?.mode || 'ID';
     let blockType = 'LOWER_THIRD';
     if (mode === 'RANKING') blockType = 'FULL_RANKING';
     if (mode === 'CHAMADA') blockType = 'CHAMADA';
     
     const block = config.siteLayouts.OVERLAYS.find((b: any) => b.type === blockType);
     return {
        accent: block?.style?.accent || config.primaryColor || '#D4AF37',
        background: block?.style?.background || '#000000',
        labelRank: block?.style?.labelText || 'RANK ETAPA',
        labelDiff: 'DIFF LÍDER',
        labelScore: 'NOTA FINAL',
        font: config.fontFamily || 'Inter',
        borderRadius: block?.style?.borderRadius ?? 0,
        opacity: block?.style?.opacity ?? 1,
        useGradient: block?.style?.useGradient ?? false,
        fontScale: block?.style?.fontScale ?? 1
     };
  })();

  // Escuta visibilidade do Lower Third e força a saída da tela após 60 segundos (60s)
  useEffect(() => {
    if (data?.mode === 'ID' && d) {
       setLowerThirdForcedHide(false);
       if (ltHideTimeoutRef.current) {
           clearTimeout(ltHideTimeoutRef.current);
           ltHideTimeoutRef.current = null;
       }
       ltHideTimeoutRef.current = setTimeout(() => {
           setLowerThirdForcedHide(true);
           deactivateVMixOverlay(); 
       }, 60000); 
    } else {
       if (ltHideTimeoutRef.current) {
           clearTimeout(ltHideTimeoutRef.current);
           ltHideTimeoutRef.current = null;
       }
    }
  }, [data?.mode, d?.id]);

  useEffect(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';

    const calibrateTime = async () => {
       try {
         const t0 = Date.now();
         const res = await fetch(`/api/overlay/current?t=${Date.now()}`, { cache: 'no-store' });
         const json = await res.json();
         const t1 = Date.now();
         
         if (json.serverTime) {
            const ping = (t1 - t0) / 2;
            const freshOffset = json.serverTime - (t1 - ping);
            serverOffsetRef.current = serverOffsetRef.current === 0 ? freshOffset : (serverOffsetRef.current * 0.7) + (freshOffset * 0.3);
         }
       } catch (e) {
          console.error("Erro ao calibrar tempo", e);
       }
    };

    calibrateTime();
    
    const connectSSE = () => {
      const eventSource = new EventSource('/api/overlay/stream');
      
      eventSource.onmessage = (event) => {
        try {
          const json = JSON.parse(event.data);
          if (json.active) {
            if (json.serverTime) {
               const currentOffset = json.serverTime - Date.now();
               serverOffsetRef.current = (serverOffsetRef.current * 0.8) + (currentOffset * 0.2);
            }
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

  // Lógica de Scale para Nomes Gigantes (REMOVIDO EM FAVOR DE 2 LINHAS)
  useEffect(() => {
    setNameScale(1);
  }, [data?.data?.competidor]);

  useEffect(() => {
    setRideStarted(false);
  }, [data?.data?.id]);

  // Regula o Cronômetro e Oculta 10s após interrompido
  useEffect(() => {
    if (data?.timerRunning) {
      setTimerVisible(true);
      setRideStarted(true);
      if (timerTimeoutRef.current) {
          clearTimeout(timerTimeoutRef.current);
          timerTimeoutRef.current = null;
      }
    } else if (elapsedTime > 0 || (d && parseFloat(d.tempo) > 0)) {
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
      timerTimeoutRef.current = setTimeout(() => {
          setTimerVisible(false);
          timerTimeoutRef.current = null;
          deactivateVMixOverlay(); 
      }, 10000); 
    } else {
      setTimerVisible(false);
    }
  }, [data?.timerRunning]);

  useEffect(() => {
    let animationFrameId: number;
    const updateTimer = () => {
      if (data?.timerRunning && data.timerStartedAt) {
        const start = new Date(data.timerStartedAt).getTime();
        const currentRemoteTime = Date.now() + serverOffsetRef.current;
        const elapsed = (currentRemoteTime - start) / 1000;
        
        if (elapsed >= 8) {
          setElapsedTime(8);
          setTimerVisible((prev) => {
             if (prev && !timerTimeoutRef.current) {
                 timerTimeoutRef.current = setTimeout(() => {
                     setTimerVisible(false);
                     timerTimeoutRef.current = null;
                     deactivateVMixOverlay(); 
                 }, 10000); 
             }
             return prev;
          });
        } else {
          setElapsedTime(elapsed);
          animationFrameId = requestAnimationFrame(updateTimer);
        }
      }
    };
    if (data?.timerRunning) animationFrameId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(animationFrameId);
  }, [data?.timerRunning, data?.timerStartedAt]);

  if (!visible && !data) return null;

  const mode = data?.mode || 'ID';
  const isRanking = mode === 'RANKING';
  const numJuizes = data?.numJuizes || 2;
  const rankingPage = typeof data?.rankingPage === 'number' ? data.rankingPage : 0;
  const itemsPerPage = 10;

  const displayRanking = isRanking && data?.rankingData ? {
    ...data.rankingData,
    list: data.rankingData.list?.slice(rankingPage * itemsPerPage, (rankingPage + 1) * itemsPerPage) || []
  } : null;

  const formatScore = (val: any) => {
    if (val === undefined || val === null) return '0.00';
    const n = parseFloat(String(val));
    return isNaN(n) ? val : n.toFixed(2);
  };

  return (
    <div className={`overlay-master ${visible ? 'show' : 'hide'} mode-${mode}`}>
      <style jsx global>{`
        html, body { background: transparent !important; margin: 0; overflow: hidden; font-family: '${overlayStyle.font}', sans-serif; }
        .overlay-master { position: fixed; inset: 0; transition: opacity 0.5s ease; opacity: 0; }
        .overlay-master.show { opacity: 1; }

        :root {
          --accent: ${overlayStyle.accent};
          --accent-gradient: ${overlayStyle.useGradient ? `linear-gradient(180deg, ${overlayStyle.accent} 0%, rgba(0,0,0,0.5) 100%)` : overlayStyle.accent};
          --bg-overlay: ${overlayStyle.background};
          --radius: ${overlayStyle.borderRadius}px;
          --opacity: ${overlayStyle.opacity};
          --font-scale: ${overlayStyle.fontScale};
        }

        .mode-ID .bottom-container {
          position: fixed; bottom: 80px; left: 0; width: 100%;
          display: flex; justify-content: center; align-items: flex-end;
          zoom: var(--font-scale); z-index: 10;
        }
        .mode-ID .bottom-container.hidden { opacity: 0; pointer-events: none; }

        /* LAYOUT 1: ANTES DA NOTA (VS) */
        .mode-ID .vs-layout {
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-overlay); opacity: var(--opacity);
          border-left: 12px solid var(--accent); border-right: 12px solid var(--accent);
          padding: 30px 60px; border-radius: var(--radius);
          box-shadow: 0 20px 60px rgba(0,0,0,0.8); gap: 60px;
          min-width: 900px;
        }
        .mode-ID .vs-layout .col-comp { text-align: right; flex: 1; }
        .mode-ID .vs-layout .col-anim { text-align: left; flex: 1; }
        .mode-ID .vs-layout h1 { color: #fff; font-size: 3.8rem; font-weight: 950; text-transform: uppercase; margin: 0; line-height: 1; }
        .mode-ID .vs-layout .sub { font-size: 1.8rem; color: var(--accent); font-weight: 900; text-transform: uppercase; margin-top: 10px; letter-spacing: 1px; }
        .mode-ID .vs-layout .vs-badge { font-size: 2.8rem; font-weight: 950; color: var(--accent); font-style: italic; text-shadow: 0 0 20px rgba(212,175,55,0.5); }

        /* LAYOUT 2: COM NOTA (SCORE) */
        .mode-ID .score-layout {
          display: flex; align-items: stretch;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          border-radius: var(--radius);
          background: rgba(15, 15, 15, 0.95); backdrop-filter: blur(10px);
        }
        .mode-ID .score-layout .info-block {
          background: var(--bg-overlay); opacity: var(--opacity);
          border-left: 14px solid var(--accent); padding: 25px 40px;
          min-width: 450px; max-width: 600px; display: flex; flex-direction: column; justify-content: center;
          border-radius: var(--radius) 0 0 var(--radius);
        }
        .mode-ID .score-layout .info-block h1 { color: #fff; font-size: 3rem; font-weight: 950; text-transform: uppercase; margin: 0; line-height: 0.9; }
        .mode-ID .score-layout .info-block .sub { font-size: 1.4rem; color: var(--accent); font-weight: 900; text-transform: uppercase; margin-top: 8px; letter-spacing: 1px; }
        .mode-ID .score-layout .info-block .animal-name { color: #fff; font-size: 2.2rem; font-weight: 950; text-transform: uppercase; margin-top: 15px; line-height: 1; }
        .mode-ID .score-layout .info-block .animal-cia { font-size: 1.3rem; color: #888; font-weight: 800; text-transform: uppercase; margin-top: 4px; }

        .mode-ID .score-layout .judges-block {
          padding: 15px 30px; display: flex; gap: 20px; align-items: center;
        }
        .mode-ID .score-layout .judge-box { border-left: 3px solid var(--accent); padding-left: 15px; display: flex; flex-direction: column; justify-content: center; min-width: 140px; }
        .mode-ID .score-layout .judge-title { font-size: 1rem; color: var(--accent); font-weight: 950; text-transform: uppercase; margin-bottom: 6px; }
        .mode-ID .score-layout .judge-scores { display: flex; justify-content: space-between; align-items: baseline; }
        .mode-ID .score-layout .judge-score-label { font-size: 0.9rem; color: var(--accent); font-weight: 900; margin-right: 4px; }
        .mode-ID .score-layout .judge-score-value { color: #fff; font-weight: 950; font-size: 2.4rem; line-height: 1; }
        .mode-ID .score-layout .judge-subtotal { font-size: 3.5rem; color: #fff; font-weight: 950; margin-top: 10px; border-top: 3px solid rgba(212, 175, 55, 0.3); padding-top: 10px; text-align: center; line-height: 1; }

        .mode-ID .score-layout .total-block {
          background: var(--accent-gradient);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 15px 40px; border-radius: 0 var(--radius) var(--radius) 0;
        }
        .mode-ID .score-layout .total-label { font-size: 1rem; font-weight: 900; color: #000; text-transform: uppercase; margin-bottom: 5px; }
        .mode-ID .score-layout .total-value { font-size: 7rem; font-weight: 950; color: #000; letter-spacing: -3px; line-height: 1; }
        
        .mode-ID .header-badges { position: absolute; top: -50px; left: 50%; transform: translateX(-50%); display: flex; gap: 15px; }
        .mode-ID .badge { 
          background: #000; color: var(--accent); padding: 10px 40px; font-weight: 900; font-size: 1.8rem; 
          border: 3px solid var(--accent); border-radius: 6px; box-shadow: 0 10px 20px rgba(0,0,0,0.5);
        }

        .timer-top-right {
          position: fixed; top: 40px; right: 40px;
          background: #000; border: 3px solid var(--accent); border-right: 15px solid var(--accent);
          color: #fff; display: flex; flex-direction: column; padding: 15px 30px;
          border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
          opacity: 1; transition: opacity 0.5s ease;
          clip-path: polygon(5% 0, 100% 0, 100% 100%, 0% 100%);
        }
        .timer-top-right.hidden { opacity: 0; pointer-events: none; }
        .timer-label { color: var(--accent); font-size: 1.8rem; font-weight: 900; text-transform: uppercase; margin-bottom: -5px; }
        .timer-value { font-size: 6rem; font-weight: 950; font-variant-numeric: tabular-nums; line-height: 1; }

        .mode-CHAMADA .chamada-fullscreen {
          position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(30,30,30,0.5) 0%, rgba(0,0,0,0.95) 100%);
          display: flex; align-items: center; justify-content: center;
        }
        .chamada-grid { display: flex; align-items: center; justify-content: center; width: 100%; max-width: 1800px; height: 100%; position: relative; }
        .side-photo { width: 450px; height: 650px; position: relative; clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%); border: 8px solid var(--accent); overflow: hidden; }
        .side-photo img { width: 100%; height: 100%; object-fit: cover; }
        .center-info { flex: 1; text-align: center; padding: 0 50px; }

        .mode-RANKING .ranking-wrapper {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          padding: 40px;
        }
        .mode-RANKING .ranking-full {
          width: 100%; max-width: 1840px; height: 100%; max-height: 1000px; display: flex; flex-direction: column; 
          background: rgba(10, 10, 10, 0.98); padding: 50px 60px; border-radius: 24px; border: 4px solid var(--accent);
        }
      `}</style>
      
      {/* CRONÔMETRO */}
      {(data?.timerRunning || elapsedTime > 0) && data?.exibirCronometroNoOverlay && (
        <div className={`timer-top-right ${!timerVisible ? 'hidden' : ''}`}>
           <span className="timer-label">TEMPO</span>
           <span className="timer-value">{elapsedTime.toFixed(2)}s</span>
        </div>
      )}

      {/* RANKING */}
      {isRanking && displayRanking && (
        <div className="ranking-wrapper">
          <div className="ranking-full">
              <div className="ranking-header">
                <h1 style={{ fontSize: '3.8rem', color: '#fff', margin: 0 }}>{displayRanking.title}</h1>
                <div style={{ color: 'var(--accent)', fontSize: '1.5rem', fontWeight: 900 }}>Classificação Oficial</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ borderBottom: '3px solid var(--accent)' }}>
                        <th style={{ color: 'var(--accent)', fontSize: '1.2rem', padding: '15px', textAlign: 'left' }}>POS</th>
                        <th style={{ color: 'var(--accent)', fontSize: '1.2rem', padding: '15px', textAlign: 'left' }}>NOME / INFO</th>
                        <th style={{ color: 'var(--accent)', fontSize: '1.2rem', padding: '15px', textAlign: 'center' }}>DIF. LÍDER</th>
                        <th style={{ color: 'var(--accent)', fontSize: '1.2rem', padding: '15px', textAlign: 'right' }}>NOTA</th>
                    </tr>
                </thead>
                <tbody>
                    {displayRanking.list.map((r: any, idx: number) => (
                        <tr key={r.pos} style={{ 
                            background: idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                            borderBottom: '1px solid rgba(212,175,55,0.1)', 
                            height: '75px' 
                        }}>
                            <td style={{ color: 'var(--accent)', fontSize: '2.5rem', fontWeight: 900, paddingLeft: '20px' }}>{r.pos}°</td>
                            <td style={{ color: '#fff', fontSize: '2rem', fontWeight: 700 }}>
                                {r.nome} <span style={{ fontSize: '1.2rem', color: '#888', fontWeight: 400 }}>{r.info}</span>
                            </td>
                            <td style={{ color: r.pos === 1 ? 'var(--primary)' : '#ff4444', fontSize: '2rem', fontWeight: 900, textAlign: 'center' }}>
                               {r.pos === 1 ? 'LÍDER' : `-${r.diff}`}
                            </td>
                            <td style={{ color: 'var(--accent)', fontSize: '2.8rem', fontWeight: 900, textAlign: 'right', paddingRight: '20px' }}>{r.nota}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOWER THIRD (ID) */}
      {mode === 'ID' && d && (
        <div className={`bottom-container ${lowerThirdForcedHide ? 'hidden' : ''}`}>
          
          {/* BADGES SUPERIORES */}
          <div className="header-badges">
            {!data?.rankingCongelado && d?.etapaRank && <div className="badge">{overlayStyle.labelRank}: {d.etapaRank}</div>}
            {!data?.rankingCongelado && d?.etapaDiff && <div className="badge">{overlayStyle.labelDiff}: {d.etapaDiff}</div>}
          </div>

          {isPendingScore ? (
            /* LAYOUT 1: VS (ANTES DA NOTA) */
            <div className="vs-layout">
               <div className="col-comp">
                  <h1>{d.competidor}</h1>
                  {d.competidorCidade && <div className="sub">{d.competidorCidade}</div>}
               </div>
               <div className="vs-badge">VS</div>
               <div className="col-anim">
                  <h1>{d.animal}</h1>
                  <div className="sub" style={{ color: '#888' }}>{d.animalCompanhia}</div>
               </div>
            </div>
          ) : (
            /* LAYOUT 2: SCORE (COM NOTA) */
            <div className="score-layout">
              <div className="info-block">
                  <h1>{d.competidor}</h1>
                  {d.competidorCidade && <div className="sub">{d.competidorCidade}</div>}
                  <div className="animal-name">{d.animal}</div>
                  <div className="animal-cia">{d.animalCompanhia}</div>
              </div>

              <div className="judges-block">
                 {[1,2,3,4].slice(0, numJuizes).map(i => (
                   <div key={i} className="judge-box">
                      <span className="judge-title">{(d as any)[`j${i}Nome`]}</span>
                      <div className="judge-scores">
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                          <span className="judge-score-label">P:</span>
                          <span className="judge-score-value">{formatScore((d as any)[`j${i}P`])}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                          <span className="judge-score-label">T:</span>
                          <span className="judge-score-value">{formatScore((d as any)[`j${i}A`])}</span>
                        </div>
                      </div>
                      <div className="judge-subtotal">{formatScore((d as any)[`j${i}Total`])}</div>
                   </div>
                 ))}
              </div>

              <div className="total-block">
                  <span className="total-label">{overlayStyle.labelScore}</span>
                  <div className="total-value">{d.desclassificado ? '0.00' : formatScore(d.total)}</div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* CHAMADA (FULL) */}
      {mode === 'CHAMADA' && d && (
        <div className="chamada-fullscreen">
          <div className="chamada-grid">
            <div className="side-photo photo-rider"><img src={d.competidorFoto} alt="P" /><div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '10px', background: 'rgba(0,0,0,0.8)', color: 'var(--accent)', textAlign: 'center', fontSize: '1.2rem', fontWeight: 900 }}>{d.competidorCidade}</div></div>
            <div className="center-info">
              <div style={{ fontSize: '5rem', fontWeight: 950, color: '#fff', textTransform: 'uppercase', fontStyle: 'italic' }}>CONFRONTO</div>
              <h1 style={{ fontSize: '6rem', fontWeight: 950, textTransform: 'uppercase', margin: '10px 0', color: '#fff' }}>{d.competidor}</h1>
              <div style={{ fontSize: '3.5rem', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>{d.animal}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' }}>
                <div style={{ border: '2px solid var(--accent)', padding: '15px 30px' }}><span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 900 }}>RANKING</span><span style={{ fontSize: '3rem', color: '#fff', fontWeight: 950, display: 'block' }}>{d.competidorRankChamp || '---'}</span></div>
                <div style={{ border: '2px solid var(--accent)', padding: '15px 30px' }}><span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 900 }}>MÉDIA BOI</span><span style={{ fontSize: '3rem', color: '#fff', fontWeight: 950, display: 'block' }}>{d.animalMedia || '0'}</span></div>
              </div>
            </div>
            <div className="side-photo photo-bull"><img src={d.animalFoto} alt="T" /><div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '10px', background: 'rgba(0,0,0,0.8)', color: 'var(--accent)', textAlign: 'center', fontSize: '1.2rem', fontWeight: 900 }}>{d.animalCompanhia}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
