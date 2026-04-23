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
    j1Nome?: string; j1P?: string; j1A?: string; j1Total?: string;
    j2Nome?: string; j2P?: string; j2A?: string; j2Total?: string;
    j3Nome?: string; j3P?: string; j3A?: string; j3Total?: string;
    j4Nome?: string; j4P?: string; j4A?: string; j4Total?: string;
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
    
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/overlay/current?t=${Date.now()}`, { cache: 'no-store' });
        const json = await res.json();
        if (json.active) {
          if (json.serverTime) serverOffsetRef.current = json.serverTime - Date.now();
          setData(json);
          setVisible(true);
        } else {
          setVisible(false);
          setTimeout(() => setData(null), 500);
        }
      } catch (err) { console.error('Erro overlay:', err); }
    };
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
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
        const parentWidth = 350; // Largura base do LT
        const nameWidth = nameRef.current.scrollWidth;
        setNameScale(nameWidth > parentWidth ? parentWidth / nameWidth : 1);
    }
  }, [data?.data?.competidor]);

  if (!visible && !data) return null;

  const d = data?.data;
  const mode = data?.mode || 'ID';
  const isRanking = mode === 'RANKING';
  const numJuizes = data?.numJuizes || 2;

  const formatScore = (val: any) => {
    if (!val) return '0';
    const n = parseFloat(String(val));
    return isNaN(n) ? val : (n % 1 === 0 ? n.toFixed(0) : n.toString());
  };

  return (
    <div className={`overlay-master ${visible ? 'show' : 'hide'} mode-${mode}`}>
      <style jsx global>{`
        body { background: transparent !important; margin: 0; overflow: hidden; font-family: 'Inter', sans-serif; }
        .overlay-master { position: fixed; inset: 0; transition: opacity 0.5s ease; opacity: 0; }
        .overlay-master.show { opacity: 1; }

        /* --- ESTILO ORIGINAL DO LOWER THIRD (PRESERVADO) --- */
        .mode-ID .nota-container {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: stretch;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.6));
          width: fit-content;
          min-width: 800px;
        }

        .mode-ID .info-card {
          background: linear-gradient(135deg, rgba(15, 15, 15, 0.98) 0%, rgba(5, 5, 5, 1) 100%);
          border-left: 12px solid #D4AF37;
          padding: 30px 60px 30px 50px;
          clip-path: polygon(0 0, 100% 0, 96% 100%, 0% 100%);
          min-width: 300px;
        }
        .mode-ID .competidor-name { color: #fff; font-size: 4rem; font-weight: 900; text-transform: uppercase; margin: 0; white-space: nowrap; transform-origin: left center; }
        .mode-ID .animal-name { color: #D4AF37; font-size: 2.22rem; font-weight: 700; text-transform: uppercase; margin-top: 5px; display: block; }

        .mode-ID .judges-section {
          background: rgba(15, 15, 15, 0.95);
          backdrop-filter: blur(10px);
          margin-left: -40px;
          padding: 20px 50px 20px 90px;
          display: flex;
          gap: 40px;
          clip-path: polygon(40px 0, 100% 0, calc(100% - 30px) 100%, 0% 100%);
        }
        .mode-ID .judge-box { border-left: 4px solid #D4AF37; padding-left: 20px; min-width: 150px; }
        .mode-ID .judge-title { font-size: 1.2rem; color: #D4AF37; font-weight: 900; text-transform: uppercase; }
        .mode-ID .judge-score-value { color: #fff; font-weight: 700; font-size: 1.6rem; }
        .mode-ID .subtotal { font-size: 2.5rem; color: #fff; font-weight: 900; margin-top: 5px; border-top: 1px solid rgba(212, 175, 55, 0.3); }

        .mode-ID .final-score-card {
          min-width: 250px;
          background: linear-gradient(180deg, #F9D976 0%, #D4AF37 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 40px 20px 60px;
          clip-path: polygon(40px 0, 100% 0, 100% 100%, 0% 100%);
          margin-left: -40px;
        }
        .mode-ID .total-value { font-size: 5rem; font-weight: 950; color: #000; letter-spacing: -2px; line-height: 1; }
        .mode-ID .tempo-badge {
          position: absolute; top: -45px; right: 200px; background: #000; color: #D4AF37;
          padding: 5px 25px; font-weight: 900; font-size: 1.5rem; border: 2px solid #D4AF37;
          clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
        }

        /* --- ESTILO NOVO PARA CHAMADA (FULL SCREEN) --- */
        .mode-CHAMADA .chamada-fullscreen {
          position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.95) 100%);
          display: flex; align-items: center; justify-content: center;
          animation: zoomIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .chamada-grid { display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 40px; width: 90%; max-width: 1600px; height: 600px; align-items: center; }
        .side-photo { width: 100%; height: 100%; border: 6px solid #D4AF37; border-radius: 30px; overflow: hidden; box-shadow: 0 0 50px rgba(212,175,55,0.4); position: relative; }
        .side-photo img { width: 100%; height: 100%; object-fit: cover; }
        .side-photo .label { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: #D4AF37; text-align: center; font-weight: 900; padding: 10px; font-size: 1.2rem; }
        .center-info { display: flex; flex-direction: column; align-items: center; text-align: center; color: #fff; }
        .vs-text { font-size: 3rem; font-weight: 900; color: #D4AF37; font-style: italic; margin-bottom: 20px; }
        .name-rider { font-size: 5rem; font-weight: 950; text-transform: uppercase; line-height: 1; margin: 0; }
        .name-animal { font-size: 3rem; color: #D4AF37; font-weight: 800; margin-top: 10px; text-transform: uppercase; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; width: 100%; margin-top: 30px; }
        .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.3); border-radius: 15px; padding: 20px; }
        .stat-val { font-size: 2.5rem; color: #ffd700; font-weight: 900; display: block; }
        .stat-lab { font-size: 0.8rem; color: #aaa; text-transform: uppercase; font-weight: bold; }

        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {mode === 'ID' && d && (
        <div className="nota-container">
          <div className="tempo-badge">TEMPO: {elapsedTime.toFixed(2)}s</div>
          <div className="info-card">
             <h1 ref={nameRef} className="competidor-name" style={{ transform: `scale(${nameScale})` }}>{d.competidor}</h1>
             <span className="animal-name">{d.animal}</span>
          </div>
          <div className="judges-section">
             {[1,2,3,4].slice(0, numJuizes).map(i => (
               <div key={i} className="judge-box">
                  <span className="judge-title">{(d as any)[`j${i}Nome`] || `J${i}`}</span>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '1.6rem' }}>{formatScore((d as any)[`j${i}P`])}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '1.6rem' }}>{formatScore((d as any)[`j${i}A`])}</div>
                    </div>
                  </div>
                  <div className="subtotal">{formatScore((d as any)[`j${i}Total`])}</div>
               </div>
             ))}
          </div>
          <div className="final-score-card">
              <span style={{ fontSize: '1rem', fontWeight: '900', color: '#000' }}>NOTA FINAL</span>
              <div className="total-value">{d.desclassificado ? '00.0' : formatScore(d.total)}</div>
          </div>
        </div>
      )}

      {mode === 'CHAMADA' && d && (
        <div className="chamada-fullscreen">
          <div className="chamada-grid">
            <div className="side-photo"><img src={d.competidorFoto || '/default-rider.png'} /><div className="label">{d.competidorCidade}</div></div>
            <div className="center-info">
              <div className="vs-text">CONFRONTO</div>
              <h1 className="name-rider">{d.competidor}</h1>
              <div className="name-animal">{d.animal}</div>
              <div className="stats-grid">
                <div className="stat-box"><span className="stat-lab">RANKING</span><span className="stat-val">{d.competidorRankChamp || '---'}</span></div>
                <div className="stat-box"><span className="stat-lab">PARADAS %</span><span className="stat-val">{d.competidorParadas || '0%'}</span></div>
                <div className="stat-box"><span className="stat-lab">MÉDIA ANIMAL</span><span className="stat-val">{d.animalMedia || '0'}</span></div>
              </div>
            </div>
            <div className="side-photo"><img src={d.animalFoto || '/default-bull.png'} /><div className="label">{d.animalCompanhia}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
