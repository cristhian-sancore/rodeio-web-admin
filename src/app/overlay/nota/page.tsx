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
  const serverOffsetRef = useRef(0);

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
    if (val === undefined || val === null) return '00,00';
    const n = parseFloat(String(val));
    return isNaN(n) ? val : n.toFixed(2).replace('.', ',');
  };

  return (
    <div key={d?.id} className={`overlay-master ${visible ? 'show' : 'hide'} mode-${mode}`}>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700;900&display=swap" rel="stylesheet" />
      <style jsx global>{`
        html, body { background: transparent !important; margin: 0; overflow: hidden; font-family: 'Oswald', sans-serif; }
        .overlay-master { position: fixed; inset: 0; opacity: 0; transition: opacity 0.5s ease; }
        .overlay-master.show { opacity: 1; }

        /* --- MODO ID --- */
        .mode-ID .lt-container {
          position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: flex-end; filter: drop-shadow(0 15px 30px rgba(0,0,0,0.8));
          animation: slideUpLT 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .mode-ID .rider-photo-mini { width: 140px; height: 140px; border: 4px solid #D4AF37; background: #000; clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%); margin-right: -15px; position: relative; z-index: 5; }
        .mode-ID .rider-photo-mini img { width: 100%; height: 100%; object-fit: cover; }
        .mode-ID .scores-table { background: #fff; display: flex; align-items: stretch; height: 120px; clip-path: polygon(2% 0, 100% 0, 98% 100%, 0 100%); border-bottom: 5px solid #D4AF37; }
        .mode-ID .row-labels { padding: 10px 20px; display: flex; flex-direction: column; justify-content: space-around; background: #000; color: #fff; font-weight: 700; font-size: 0.8rem; border-right: 2px solid #D4AF37; }
        .mode-ID .judge-col { border-right: 1px solid #ddd; padding: 0 15px; display: flex; flex-direction: column; justify-content: center; min-width: 120px; }
        .mode-ID .judge-name-top { font-size: 1rem; font-weight: 950; color: #000; text-align: center; text-transform: uppercase; border-bottom: 1px solid #D4AF37; margin-bottom: 5px; }
        .mode-ID .score-val { font-size: 1.8rem; font-weight: 900; color: #222; text-align: center; display: block; line-height: 1; }
        .mode-ID .total-col { background: #000; padding: 0 40px; display: flex; flex-direction: column; justify-content: center; clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%); margin-left: -5px; border-left: 2px solid #D4AF37; }
        .mode-ID .total-val-giant { font-size: 5rem; font-weight: 950; color: #D4AF37; line-height: 1; }
        .mode-ID .rider-info-badge { background: #D4AF37; color: #000; padding: 10px 30px; margin-left: -20px; height: fit-content; transform: skewX(-15deg); border: 2px solid #000; align-self: center; }

        /* --- MODO CHAMADA (ANIMAÇÃO CONFRONTO) --- */
        .mode-CHAMADA .full-call { position: absolute; inset: 0; background: radial-gradient(circle at center, #222 0%, #000 100%); display: flex; flex-direction: column; overflow: hidden; }
        
        .mode-CHAMADA .call-header { 
          height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; 
          animation: dropHeader 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .mode-CHAMADA .side-card-rider { 
          animation: confrontationLeft 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .mode-CHAMADA .side-card-bull { 
          animation: confrontationRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .mode-CHAMADA .vs-box { 
          font-size: 6rem; font-weight: 950; color: #000; background: #D4AF37; padding: 20px 40px; 
          transform: skewX(-10deg); border: 4px solid #fff; 
          animation: vsImpact 0.5s 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
          box-shadow: 0 0 50px rgba(212,175,55,0.6);
        }
        
        .mode-CHAMADA .footer-bar { 
          height: 140px; background: rgba(0,0,0,0.9); border-top: 5px solid #D4AF37; 
          display: flex; justify-content: center; align-items: center; gap: 20px; 
          animation: slideUpFooter 0.6s 0.8s backwards;
        }
        .mode-CHAMADA .info-badge { 
          background: #111; color: #fff; padding: 10px 40px; transform: skewX(-15deg); border: 2px solid #D4AF37; 
          animation: badgeStagger 0.4s calc(0.9s + (var(--i) * 0.1s)) backwards;
        }

        /* ANIMAÇÕES ESPECÍFICAS CONFRONTO */
        @keyframes confrontationLeft { from { opacity: 0; transform: translateX(-600px) scale(0.8); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes confrontationRight { from { opacity: 0; transform: translateX(600px) scale(0.8); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes vsImpact { 0% { transform: scale(0) skewX(-10deg); opacity: 0; } 70% { transform: scale(1.3) skewX(-10deg); } 100% { transform: scale(1) skewX(-10deg); opacity: 1; } }
        @keyframes dropHeader { from { top: -250px; opacity: 0; } to { top: 0; opacity: 1; } }
        @keyframes slideUpFooter { from { transform: translateY(150px); } to { transform: translateY(0); } }
        @keyframes badgeStagger { from { opacity: 0; transform: translateY(50px) skewX(-15deg); } to { opacity: 1; transform: translateY(0) skewX(-15deg); } }
        @keyframes slideUpLT { from { transform: translate(-50%, 150px); } to { transform: translate(-50%, 0); } }

        /* MODO RANKING */
        .mode-RANKING .rank-page { position: absolute; inset: 0; background: linear-gradient(135deg, #111 0%, #000 100%); display: flex; padding: 60px; animation: fadeIn 0.8s ease; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* RANKING */}
      {isRanking && displayRanking && (
        <div className="rank-page">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
             <img src={d?.competidorFoto || '/default-rider.png'} style={{ width: '100%', height: '90%', objectFit: 'contain', filter: 'drop-shadow(0 0 30px #D4AF37)' }} />
             <div style={{ background: '#D4AF37', color: '#000', padding: '20px 40px', fontSize: '3rem', fontWeight: 950, transform: 'skewX(-15deg)', width: 'fit-content', border: '4px solid #fff' }}>LÍDER | {formatScore(displayRanking.list[0]?.nota)}</div>
          </div>
          <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <h1 style={{ color: '#D4AF37', fontSize: '4.5rem', margin: '0 0 20px 0', textTransform: 'uppercase', borderBottom: '5px solid #D4AF37' }}>CLASSIFICAÇÃO</h1>
             {displayRanking.list.map((r, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '2px solid #D4AF37', display: 'grid', gridTemplateColumns: '100px 1fr 150px', alignItems: 'center', height: '65px', transform: 'skewX(-15deg)', overflow: 'hidden' }}>
                   <div style={{ background: '#D4AF37', color: '#000', height: '100%', display: 'flex', alignItems: 'center', justify-content: 'center', font-size: '2rem', font-weight: 950 }}>{r.pos}º</div>
                   <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, paddingLeft: '30px', transform: 'skewX(15deg)', textTransform: 'uppercase' }}>{r.nome}</div>
                   <div style={{ color: '#D4AF37', fontSize: '2.2rem', fontWeight: 900, textAlign: 'right', paddingRight: '30px', transform: 'skewX(15deg)' }}>{formatScore(r.nota)}</div>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* LOWER THIRD (ID) */}
      {mode === 'ID' && d && (
        <div className="lt-container">
          <div className="rider-photo-mini">
             <img src={d.competidorFoto} />
          </div>
          <div className="scores-table">
             <div className="row-labels">
                <div>ANIMAL</div>
                <div style={{ background: '#D4AF37', color: '#000', padding: '2px 5px' }}>COMPETIDOR</div>
             </div>
             {[1,2,3,4].slice(0, numJuizes).map(i => (
                <div key={i} className="judge-col">
                   <div className="judge-name-top">{(d as any)[`j${i}Nome`]}</div>
                   <div className="score-val" style={{ color: '#777' }}>{formatScore((d as any)[`j${i}A`]).split(',')[0]}</div>
                   <div className="score-val">{formatScore((d as any)[`j${i}P`]).split(',')[0]}</div>
                </div>
             ))}
             <div className="total-col">
                <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1.2rem' }}>TOTAL</div>
                <div className="total-val-giant">{formatScore(d.total).split(',')[0]}</div>
             </div>
          </div>
          <div className="rider-info-badge">
             <div style={{ transform: 'skewX(15deg)', fontWeight: 950, fontSize: '1.5rem' }}>{d.competidor}</div>
             <div style={{ transform: 'skewX(15deg)', fontSize: '0.9rem', textAlign: 'center', background: '#000', color: '#fff', marginTop: '2px' }}>{d.competidorCidade}</div>
          </div>
        </div>
      )}

      {/* CHAMADA GALA (VS) */}
      {mode === 'CHAMADA' && d && (
        <div className="full-call">
           <div className="call-header">
              <div style={{ color: '#D4AF37', fontSize: '6rem', margin: 0, fontWeight: 950, letterSpacing: '5px', textShadow: '0 0 20px rgba(212,175,55,0.5)' }}>SEMI FINAL</div>
              <div style={{ background: '#fff', color: '#000', padding: '5px 50px', fontWeight: 900, transform: 'skewX(-20deg)', fontSize: '1.2rem' }}>RODEIO PRO 2026</div>
           </div>
           <div style={{ flex: 1, display: 'flex', justifyContent: 'center', align-items: 'center', gap: '50px', padding: '0 50px' }}>
              <div className="side-card-rider" style={{ width: '450px', textAlign: 'center' }}>
                 <div style={{ border: '5px solid #D4AF37', borderRadius: '20px', overflow: 'hidden', height: '500px', background: '#111' }}>
                    <img src={d.competidorFoto} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                 </div>
                 <h2 style={{ color: '#fff', fontSize: '3.5rem', margin: '20px 0 0', textTransform: 'uppercase' }}>{d.competidor}</h2>
                 <p style={{ color: '#D4AF37', fontSize: '1.5rem', fontWeight: 700 }}>{d.competidorCidade}</p>
              </div>
              
              <div className="vs-box">VS</div>
              
              <div className="side-card-bull" style={{ width: '450px', textAlign: 'center' }}>
                 <div style={{ border: '5px solid #fff', borderRadius: '20px', overflow: 'hidden', height: '500px', background: '#111' }}>
                    <img src={d.animalFoto} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                 </div>
                 <h2 style={{ color: '#D4AF37', fontSize: '3.5rem', margin: '20px 0 0', textTransform: 'uppercase' }}>{d.animal}</h2>
                 <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>{d.animalCompanhia}</p>
              </div>
           </div>
           <div className="footer-bar">
              <div className="info-badge" style={{ '--i': 1 } as any}>RANKING: <b style={{ color: '#D4AF37' }}>#{d.competidorRankChamp}</b></div>
              <div className="info-badge" style={{ '--i': 2 } as any}>PARADAS: <b style={{ color: '#D4AF37' }}>{d.competidorParadas}</b></div>
              <div className="info-badge" style={{ '--i': 3 } as any}>MÉDIA BOI: <b style={{ color: '#D4AF37' }}>{d.animalMedia}</b></div>
           </div>
        </div>
      )}
    </div>
  );
}
