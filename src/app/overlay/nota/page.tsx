'use client';

import { useState, useEffect, useRef } from 'react';

interface OverlayData {
  active: boolean;
  mode: 'ID' | 'CHAMADA' | 'RANKING'; // ID=LT, CHAMADA=FullScreen
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
    competidorFoto: string;
    competidorCidade: string;
    competidorRankChamp: string;
    competidorParadas: string;
    animal: string;
    animalFoto: string;
    animalCompanhia: string;
    animalMedia: string;
    j1Total: string; j2Total: string; j3Total: string; j4Total: string;
    total: string;
    tempo: string;
    etapaRank: string;
    etapaDiff: string;
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
  const serverOffsetRef = useRef(0);

  useEffect(() => {
    // Garantir fundo transparente
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

  if (!visible && !data) return null;

  const d = data?.data;
  const mode = data?.mode || 'ID';
  const isRanking = mode === 'RANKING';

  return (
    <div className={`overlay-master ${visible ? 'show' : 'hide'}`}>
      <style jsx global>{`
        body { background: transparent !important; margin: 0; overflow: hidden; font-family: 'Inter', sans-serif; }
        .overlay-master { position: fixed; inset: 0; transition: opacity 0.5s ease; opacity: 0; }
        .overlay-master.show { opacity: 1; }
        
        /* 1. MODO CHAMADA (FULL SCREEN) */
        .chamada-fullscreen {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.95) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: zoomIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .chamada-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr 1fr;
          gap: 40px;
          width: 90%;
          max-width: 1600px;
          height: 600px;
          align-items: center;
        }

        .side-photo {
          width: 100%;
          height: 100%;
          border: 6px solid #D4AF37;
          border-radius: 30px;
          overflow: hidden;
          box-shadow: 0 0 50px rgba(212, 175, 55, 0.4);
          position: relative;
        }
        .side-photo img { width: 100%; height: 100%; object-fit: cover; }
        .side-photo .label { 
          position: absolute; bottom: 0; left: 0; right: 0; 
          background: rgba(0,0,0,0.8); color: #D4AF37; 
          text-align: center; font-weight: 900; padding: 10px; font-size: 1.2rem;
        }

        .center-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: #fff;
        }

        .vs-text { font-size: 4rem; font-weight: 900; color: #D4AF37; font-style: italic; margin-bottom: 20px; }
        .main-names { margin-bottom: 40px; }
        .name-rider { font-size: 5rem; font-weight: 950; text-transform: uppercase; line-height: 1; margin: 0; }
        .name-animal { font-size: 3rem; color: #D4AF37; font-weight: 800; margin-top: 10px; text-transform: uppercase; }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          width: 100%;
        }
        .stat-box {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.3);
          border-radius: 15px; padding: 20px;
        }
        .stat-val { font-size: 2.5rem; color: #ffd700; font-weight: 900; display: block; }
        .stat-lab { font-size: 0.8rem; color: #aaa; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }

        /* 2. MODO IDENTIFICAÇÃO (LOWER THIRD) */
        .id-lower-third {
          position: absolute;
          bottom: 50px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 1200px;
          display: flex;
          align-items: stretch;
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lt-main-bar {
          background: linear-gradient(90deg, rgba(15,15,15,0.98) 0%, rgba(5,5,5,1) 100%);
          border-left: 10px solid #D4AF37;
          border-radius: 15px 0 0 15px;
          padding: 20px 40px;
          display: flex;
          align-items: center;
          gap: 30px;
          flex: 1;
          box-shadow: 0 15px 40px rgba(0,0,0,0.8);
        }

        .lt-rider-photo { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #D4AF37; overflow: hidden; flex-shrink: 0; }
        .lt-rider-photo img { width: 100%; height: 100%; object-fit: cover; }

        .lt-names-group h1 { color: #fff; font-size: 3rem; margin: 0; font-weight: 950; text-transform: uppercase; line-height: 1; }
        .lt-names-group p { color: #D4AF37; font-size: 1.5rem; margin: 5px 0 0; font-weight: 700; text-transform: uppercase; }

        .lt-stats-sidebar {
          background: #D4AF37;
          padding: 20px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border-radius: 0 15px 15px 0;
          color: #000;
          min-width: 250px;
        }

        .lt-stat-item { text-align: center; line-height: 1.1; }
        .lt-stat-item b { font-size: 2.22rem; font-weight: 950; display: block; }
        .lt-stat-item span { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; }

        /* Animações */
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 50px); } to { opacity: 1; transform: translate(-50%, 0); } }

        /* Timer e Desclassificação */
        .status-badge {
          position: absolute; top: -40px; right: 0; background: #000; border: 2px solid #D4AF37;
          color: #D4AF37; padding: 5px 20px; font-weight: 900; font-size: 1.5rem; border-radius: 10px 10px 0 0;
        }
        .desc-badge { background: #ff4444; color: #fff; border: none; }

      `}</style>

      {!isRanking && d && mode === 'CHAMADA' && (
        <div className="chamada-fullscreen">
          <div className="chamada-grid">
            {/* Foto Peão */}
            <div className="side-photo" style={{ animation: 'slideLeft 0.8s ease' }}>
              <img src={d.competidorFoto} alt="Rider" />
              <div className="label">{d.competidorCidade}</div>
            </div>

            {/* Info Central */}
            <div className="center-info">
              <div className="vs-text">CONFRONTO</div>
              <div className="main-names">
                <h1 className="name-rider">{d.competidor}</h1>
                <div className="name-animal">{d.animal}</div>
              </div>

              <div className="stats-grid">
                <div className="stat-box">
                  <span className="stat-lab">RANKING CPTO.</span>
                  <span className="stat-val">{d.competidorRankChamp}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-lab">PARADAS %</span>
                  <span className="stat-val">{d.competidorParadas}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-lab">MÉDIA ANIMAL</span>
                  <span className="stat-val">{d.animalMedia}</span>
                </div>
              </div>
            </div>

            {/* Foto Animal */}
            <div className="side-photo" style={{ animation: 'slideRight 0.8s ease' }}>
              <img src={d.animalFoto} alt="Bull" />
              <div className="label">{d.animalCompanhia}</div>
            </div>
          </div>
        </div>
      )}

      {!isRanking && d && mode === 'ID' && (
        <div className="id-lower-third">
          <div className="lt-main-bar">
            {d.desclassificado ? (
              <div className="status-badge desc-badge">DESCLASSIFICADO</div>
            ) : (
               <div className="status-badge">{elapsedTime.toFixed(2)}s</div>
            )}
            <div className="lt-rider-photo">
              <img src={d.competidorFoto} alt="Rider" />
            </div>
            <div className="lt-names-group">
              <h1>{d.competidor}</h1>
              <p>{d.animal} ({d.animalCompanhia})</p>
            </div>
          </div>
          <div className="lt-stats-sidebar">
            <div className="lt-stat-item">
               <span>POSIÇÃO ATUAL</span>
               <b>{d.etapaRank}</b>
            </div>
          </div>
        </div>
      )}

      {/* Caso de Ranking se for necessário futuramente adicionar algo aqui */}
    </div>
  );
}
