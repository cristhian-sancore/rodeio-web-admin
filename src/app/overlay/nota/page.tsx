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
    list: Array<{ pos: number; nome: string; info: string; nota: string; extra: string; }>;
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
  serverTime?: number;
}

export default function OverlayNotaPage() {
  const [data, setData] = useState<OverlayData | null>(null);
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
  const hasAnyScore = !!d && (
      (d as any).j1P > 0 || (d as any).j1A > 0 || (d as any).j1Total > 0 ||
      (d as any).j2P > 0 || (d as any).j2A > 0 || (d as any).j2Total > 0 ||
      (d as any).j3P > 0 || (d as any).j3A > 0 || (d as any).j3Total > 0 ||
      (d as any).j4P > 0 || (d as any).j4A > 0 || (d as any).j4Total > 0
  );
  const shouldHideLowerThird = timerVisible || (rideStarted && !hasAnyScore);

  // Escuta visibilidade do Lower Third e força a saída da tela após 60 segundos (60s)
  useEffect(() => {
    if (!shouldHideLowerThird && data?.mode === 'ID' && d) {
       setLowerThirdForcedHide(false);
       if (ltHideTimeoutRef.current) {
           clearTimeout(ltHideTimeoutRef.current);
           ltHideTimeoutRef.current = null;
       }
       ltHideTimeoutRef.current = setTimeout(() => {
           setLowerThirdForcedHide(true);
           deactivateVMixOverlay(); // Desativa vMix quando atingir 60s
       }, 60000); // 60 segundos de permanência máxima do gráfico principal
    } else {
       if (ltHideTimeoutRef.current) {
           clearTimeout(ltHideTimeoutRef.current);
           ltHideTimeoutRef.current = null;
       }
    }
  }, [shouldHideLowerThird, data?.mode, d?.id]);

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
            console.log(`[Overlay] Calibrado! Ping: ${ping.toFixed(0)}ms, Offset: ${serverOffsetRef.current.toFixed(0)}ms`);
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
            // Calibração contínua baseada no sinal do servidor
            if (json.serverTime) {
               const currentOffset = json.serverTime - Date.now();
               // Média simples para evitar pulos bruscos no cronômetro
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

  // Lógica de Scale para Nomes Gigantes
  useEffect(() => {
    if (nameRef.current) {
        // Ignora a escala atual para medir tamanho real brute
        const originalTransform = nameRef.current.style.transform;
        nameRef.current.style.transform = 'none';
        
        const nameWidth = nameRef.current.scrollWidth;
        const maxAllowed = 800; // Pixels máximos até encostar nas notas
        
        if (nameWidth > maxAllowed) {
            setNameScale(maxAllowed / nameWidth);
        } else {
            setNameScale(1);
        }
        nameRef.current.style.transform = originalTransform;
    }
  }, [data?.data?.competidor]);

  useEffect(() => {
    // Nova montaria = Reseta o suspense do Lower Third
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
      // Backend parou o cronômetro ou tem nota (fechou o ride)
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
      timerTimeoutRef.current = setTimeout(() => {
          setTimerVisible(false);
          timerTimeoutRef.current = null;
          deactivateVMixOverlay(); // Desativa vMix quando o cronômetro sumir (10s após stop)
      }, 10000); // Fica 10s na tela depois de paralisar
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
          // Atingiu 8 segundos visuais
          setTimerVisible((prev) => {
             if (prev && !timerTimeoutRef.current) {
                 timerTimeoutRef.current = setTimeout(() => {
                     setTimerVisible(false);
                     timerTimeoutRef.current = null;
                     deactivateVMixOverlay(); // Desativa vMix
                 }, 10000); // Max Hide at delay
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
          width: max-content; min-width: 800px;
          opacity: 1; transition: opacity 0.5s ease;
        }
        .mode-ID .nota-container.hidden { opacity: 0; pointer-events: none; }
        .mode-ID .info-card {
          background: linear-gradient(135deg, rgba(15, 15, 15, 0.98) 0%, rgba(5, 5, 5, 1) 100%);
          border-left: 12px solid #D4AF37; padding: 30px 60px 30px 50px;
          clip-path: polygon(0 0, 100% 0, 96% 100%, 0% 100%); width: fit-content; min-width: 350px;
          max-width: 900px; overflow: visible; display: flex; flex-direction: column; justify-content: center;
        }
        .mode-ID .competidor-name { color: #fff; font-size: 3.5rem; font-weight: 950; text-transform: uppercase; margin: 0; white-space: nowrap; transform-origin: left center; }
        .mode-ID .animal-name { color: #D4AF37; font-size: 1.8rem; font-weight: 800; text-transform: uppercase; margin-top: 5px; display: block; border-top: 1px solid rgba(212,175,55,0.3); padding-top: 5px; width: 100%; }
        
        .mode-ID .judges-section {
          background: rgba(15, 15, 15, 0.95); backdrop-filter: blur(10px); margin-left: -40px;
          padding: 20px 40px 20px 80px; display: flex; gap: 40px;
          clip-path: polygon(40px 0, 100% 0, calc(100% - 30px) 100%, 0% 100%);
        }
        .mode-ID .judge-box { border-left: 5px solid #D4AF37; padding-left: 20px; min-width: 250px; display: flex; flex-direction: column; justify-content: space-between; }
        .mode-ID .judge-title { font-size: 1.6rem; color: #D4AF37; font-weight: 950; text-transform: uppercase; margin-bottom: 10px; display: block; background: rgba(0,0,0,0.4); padding: 5px 12px; border-radius: 4px; width: fit-content; letter-spacing: 1px; }
        .mode-ID .judge-score-label { font-size: 1.3rem; color: #D4AF37; font-weight: 900; text-transform: uppercase; opacity: 0.9; margin-right: 5px; }
        .mode-ID .judge-score-value { color: #fff; font-weight: 950; font-size: 2.8rem; line-height: 1; }
        .mode-ID .subtotal { font-size: 4rem; color: #fff; font-weight: 950; margin-top: 10px; border-top: 2px solid rgba(212, 175, 55, 0.4); padding-top: 10px; line-height: 1; text-align: center; }
        
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

        /* --- CRONÔMETRO INDEPENDENTE TOP-RIGHT --- */
        .timer-top-right {
          position: fixed; top: 40px; right: 40px;
          background: #000; border: 3px solid #D4AF37; border-right: 15px solid #D4AF37;
          color: #fff; display: flex; flex-direction: column; padding: 15px 30px;
          border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
          opacity: 1; transition: opacity 0.5s ease;
          clip-path: polygon(5% 0, 100% 0, 100% 100%, 0% 100%);
        }
        .timer-top-right.hidden { opacity: 0; pointer-events: none; }
        .timer-label { color: #D4AF37; font-size: 1.2rem; font-weight: 900; text-transform: uppercase; margin-bottom: -5px; }
        .timer-value { font-size: 4.5rem; font-weight: 950; font-variant-numeric: tabular-nums; line-height: 1; }

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
      
      {/* CRONÔMETRO INDEPENDENTE */}
      {(data?.timerRunning || elapsedTime > 0) && (
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
        <div className={`nota-container ${(shouldHideLowerThird || lowerThirdForcedHide) ? 'hidden' : ''}`}>
          {/* HEADER BADGES (RANK E DIFF) */}
          <div className="header-badges">
            {!data?.rankingCongelado && d?.etapaRank && <div className="badge badge-rank">RANK ETAPA: #{d.etapaRank}</div>}
            {!data?.rankingCongelado && d?.etapaDiff && <div className="badge badge-pos">DIFF LÍDER: {d.etapaDiff}</div>}
            {!data?.rankingCongelado && d?.etapaNotaAcumulada && (d.roundNumero || 0) > 1 && parseFloat(d.etapaNotaAcumulada) > 0 && (
              <div className="badge badge-acumulada" style={{ background: '#D4AF37', color: '#000' }}>SOMA ETAPA: {d.etapaNotaAcumulada}</div>
            )}
          </div>

          <div className="info-card">
             <h1 ref={nameRef} className="competidor-name" style={{ transform: `scale(${nameScale})` }}>{d.competidor}</h1>
             <span className="animal-name">{d.animal}</span>
          </div>

          <div className="judges-section">
             {[1,2,3,4].slice(0, numJuizes).map(i => (
               <div key={i} className="judge-box">
                  <span className="judge-title">{(d as any)[`j${i}Nome`]}</span>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '8px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span className="judge-score-label">P:</span>
                      <span className="judge-score-value">{formatScore((d as any)[`j${i}P`])}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span className="judge-score-label">T:</span>
                      <span className="judge-score-value">{formatScore((d as any)[`j${i}A`])}</span>
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
              <div style={{ fontSize: '6rem', fontWeight: 950, color: '#000', WebkitTextStroke: '2px #D4AF37', textShadow: '0 0 20px #D4AF37', fontStyle: 'italic', letterSpacing: '-5px' }}>CONFRONTO</div>
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
