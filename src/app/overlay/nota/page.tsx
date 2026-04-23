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
        const parentWidth = d && data?.mode === 'ID' ? 350 : 800;
        const nameWidth = nameRef.current.scrollWidth;
        setNameScale(nameWidth > parentWidth ? parentWidth / nameWidth : 1);
    }
  }, [data?.data?.competidor, data?.mode]);

  if (!visible && !data) return null;

  const d = data?.data;
  const mode = data?.mode || 'ID';
  const numJuizes = data?.numJuizes || 2;

  const formatScore = (val: any) => {
    if (!val) return '0';
    const n = parseFloat(String(val));
    return isNaN(n) ? val : (n % 1 === 0 ? n.toFixed(0) : n.toString());
  };

  return (
    <div className={`overlay-master ${visible ? 'show' : 'hide'} mode-${mode}`}>
      <style jsx global>{`
        body { background: transparent !important; margin: 0; overflow: hidden; font-family: 'Oswald', sans-serif; }
        .overlay-master { position: fixed; inset: 0; transition: opacity 0.5s ease; opacity: 0; }
        .overlay-master.show { opacity: 1; }

        /* --- MODO ID (O SEU LT CLÁSSICO) --- */
        .mode-ID .nota-container {
          position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: stretch; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.6));
          width: fit-content; min-width: 800px;
        }
        .mode-ID .info-card {
          background: linear-gradient(135deg, rgba(15, 15, 15, 0.98) 0%, rgba(5, 5, 5, 1) 100%);
          border-left: 12px solid #D4AF37; padding: 30px 60px 30px 50px;
          clip-path: polygon(0 0, 100% 0, 96% 100%, 0% 100%); min-width: 300px;
        }
        .mode-ID .competidor-name { color: #fff; font-size: 4rem; font-weight: 900; text-transform: uppercase; margin: 0; white-space: nowrap; transform-origin: left center; }
        .mode-ID .animal-name { color: #D4AF37; font-size: 2.22rem; font-weight: 700; text-transform: uppercase; margin-top: 5px; display: block; }
        .mode-ID .judges-section {
          background: rgba(15, 15, 15, 0.95); backdrop-filter: blur(10px); margin-left: -40px;
          padding: 20px 50px 20px 90px; display: flex; gap: 40px;
          clip-path: polygon(40px 0, 100% 0, calc(100% - 30px) 100%, 0% 100%);
        }
        .mode-ID .judge-box { border-left: 4px solid #D4AF37; padding-left: 20px; min-width: 150px; }
        .mode-ID .judge-title { font-size: 1.2rem; color: #D4AF37; font-weight: 900; text-transform: uppercase; }
        .mode-ID .judge-score-value { color: #fff; font-weight: 700; font-size: 1.6rem; }
        .mode-ID .subtotal { font-size: 2.5rem; color: #fff; font-weight: 900; margin-top: 5px; border-top: 1px solid rgba(212, 175, 55, 0.3); }
        .mode-ID .final-score-card {
          min-width: 250px; background: linear-gradient(180deg, #F9D976 0%, #D4AF37 100%);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 20px 40px 20px 60px; clip-path: polygon(40px 0, 100% 0, 100% 100%, 0% 100%);
          margin-left: -40px;
        }
        .mode-ID .total-value { font-size: 5rem; font-weight: 950; color: #000; letter-spacing: -2px; line-height: 1; }
        .mode-ID .tempo-badge {
          position: absolute; top: -45px; right: 200px; background: #000; color: #D4AF37;
          padding: 5px 25px; font-weight: 900; font-size: 1.5rem; border: 2px solid #D4AF37;
          clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
        }

        /* --- MODO CHAMADA CARA DE COMPETIÇÃO --- */
        .mode-CHAMADA .chamada-fullscreen {
          position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(30,30,30,0.5) 0%, rgba(0,0,0,0.95) 100%);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }

        .chamada-grid {
          display: flex; align-items: center; justify-content: center;
          width: 100%; max-width: 1800px; height: 100%; position: relative;
        }

        .side-photo {
          width: 500px; height: 750px; position: relative;
          clip-path: polygon(15% 0, 100% 0, 85% 100%, 0 100%);
          border: 8px solid #D4AF37; overflow: hidden;
          box-shadow: 0 0 80px rgba(212,175,55,0.3);
          transition: transform 0.3s ease;
        }
        .side-photo img { width: 100%; height: 100%; object-fit: cover; animation: kenBurns 10s infinite alternate; }

        .photo-rider { animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; position: absolute; left: 5%; }
        .photo-bull { animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; position: absolute; right: 5%; }

        .center-info {
          z-index: 10; text-align: center; color: #fff; width: 800px;
          animation: popCenter 1s 0.3s backwards;
        }

        .vs-text {
          font-size: 6rem; font-weight: 950; color: #000;
          -webkit-text-stroke: 2px #D4AF37;
          text-shadow: 0 0 20px #D4AF37;
          font-style: italic; letter-spacing: -5px;
          animation: glitch 2s infinite;
        }
        .rider-name-full { font-size: 7rem; font-weight: 950; text-transform: uppercase; line-height: 0.85; margin: 20px 0 0; color: #fff; text-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .bull-name-full { font-size: 4rem; color: #D4AF37; font-weight: 800; margin: 10px 0; text-transform: uppercase; letter-spacing: 5px; }

        .stats-row {
          display: flex; justify-content: center; gap: 30px; margin-top: 50px;
        }
        .stat-card {
          background: rgba(212, 175, 55, 0.1);
          border: 2px solid #D4AF37;
          padding: 20px 40px;
          transform: skewX(-15deg);
          box-shadow: 10px 10px 0 rgba(212,175,55,0.2);
          animation: slideUpStat 0.5s calc(var(--delay) * 1s) backwards;
        }
        .stat-card > * { transform: skewX(15deg); }
        .stat-val { font-size: 3.5rem; color: #fff; font-weight: 950; display: block; line-height: 1; }
        .stat-lab { font-size: 0.9rem; color: #D4AF37; font-weight: 900; text-transform: uppercase; }

        /* ANIMAÇÕES */
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-500px) skewX(-10deg); } to { opacity: 1; transform: translateX(0) skewX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(500px) skewX(10deg); } to { opacity: 1; transform: translateX(0) skewX(0); } }
        @keyframes popCenter { from { opacity: 0; transform: scale(1.5); filter: blur(20px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }
        @keyframes slideUpStat { from { opacity: 0; transform: translateY(50px) skewX(-15deg); } to { opacity: 1; transform: translateY(0) skewX(-15deg); } }
        @keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.15); } }
        @keyframes glitch {
          0%, 100% { transform: scale(1); opacity: 1; }
          1% { transform: skew(5deg); opacity: 0.8; }
          2% { transform: skew(-5deg); opacity: 1; }
          3% { transform: none; }
        }
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
            {/* Foto Peão */}
            <div className="side-photo photo-rider">
              <img src={d.competidorFoto || 'https://rodeio.cristhiansancore.com.br/default-rider.png'} alt="Peão" />
              <div className="label">{d.competidorCidade || 'BRASIL'}</div>
            </div>

            {/* Centro Explosivo */}
            <div className="center-info">
              <div className="vs-text">CONFRONTO</div>
              <h1 className="rider-name-full">{d.competidor}</h1>
              <div className="bull-name-full">{d.animal}</div>
              
              <div className="stats-row">
                <div className="stat-card" style={{ '--delay': 0.6 } as any}>
                  <span className="stat-lab">RANKING</span>
                  <span className="stat-val">#{d.competidorRankChamp || '---'}</span>
                </div>
                <div className="stat-card" style={{ '--delay': 0.8 } as any}>
                  <span className="stat-lab">PARADAS</span>
                  <span className="stat-val">{d.competidorParadas || '0%'}</span>
                </div>
                <div className="stat-card" style={{ '--delay': 1.0 } as any}>
                  <span className="stat-lab">MÉDIA BOI</span>
                  <span className="stat-val">{d.animalMedia || '0'}</span>
                </div>
              </div>
            </div>

            {/* Foto Touro */}
            <div className="side-photo photo-bull">
               <img src={d.animalFoto || 'https://rodeio.cristhiansancore.com.br/default-bull.png'} alt="Touro" />
               <div className="label">{d.animalCompanhia || 'CIA CONTRATADA'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
