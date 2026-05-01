'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Square, Timer } from 'lucide-react';
import { toggleTimer } from '../etapas/actions';

interface RideTimerProps {
  initialValue: number;
  onTimeUpdate?: (val: number) => void;
}

export default function RideTimer({ initialValue, onTimeUpdate }: RideTimerProps) {
  const [tempo, setTempo] = useState(initialValue);

  const _setTempo = (val: number) => {
    setTempo(val);
    if (onTimeUpdate) onTimeUpdate(val);
  };
  const [isRunning, setIsRunning] = useState(false);
  const justStoppedRef = useRef(false);
  const lockRef = useRef(false);
  const lastInitialRef = useRef(initialValue);
  const serverOffsetRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);

  const formatTempo = (t: any) => {
    const val = parseFloat(String(t));
    return isNaN(val) ? "0.00" : val.toFixed(2);
  };

  const start = async () => {
    setIsRunning(true);
    justStoppedRef.current = false;
    lockRef.current = false; 
    _setTempo(0);
    
    const t0 = Date.now();
    const res = await toggleTimer(true);
    const t1 = Date.now();
    
    if (res.success && res.timerStartedAt && res.serverTime) {
      const pingDeRede = (t1 - t0) / 2; // Estima latência de ida e volta
      const dataAvisoLocal = t1 - pingDeRede; // Que horas eram no celular quando o server computou
      
      serverOffsetRef.current = res.serverTime - dataAvisoLocal;
      startTimeRef.current = new Date(res.timerStartedAt).getTime();
      animate();
    } else {
      serverOffsetRef.current = 0;
      startTimeRef.current = Date.now();
      animate();
    }
  };

  const stop = async (finalVal?: number) => {
    setIsRunning(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    let valueToSave = finalVal;
    if (valueToSave === undefined) {
      // Cálculo preciso no momento exato do clique usando o offset do servidor
      if (startTimeRef.current) {
        valueToSave = (Date.now() + serverOffsetRef.current - startTimeRef.current) / 1000;
        if (valueToSave > 8) valueToSave = 8;
      } else {
        valueToSave = tempo;
      }
    }
    
    _setTempo(valueToSave);
    justStoppedRef.current = true;
    lockRef.current = true;
    
    // Sincronizar com o servidor
    await toggleTimer(false, valueToSave);
    
    // Liberar trava após 3 segundos para garantir que o banco persistiu e o overlay recebeu
    setTimeout(() => { lockRef.current = false; }, 3000);
  };

  const animate = () => {
    if (startTimeRef.current) {
      // Usar o offset do servidor para precisão absoluta
      const currentRemoteTime = Date.now() + serverOffsetRef.current;
      const elapsed = (currentRemoteTime - startTimeRef.current) / 1000;
      
      if (elapsed >= 8.00) {
        stop(8.00);
      } else {
        _setTempo(elapsed);
        requestRef.current = requestAnimationFrame(animate);
      }
    }
  };

  useEffect(() => {
    const calibrate = async () => {
       try {
         const t0 = Date.now();
         const res = await fetch(`/api/overlay/current?t=${Date.now()}`, { cache: 'no-store' });
         const json = await res.json();
         const t1 = Date.now();
         if (json.serverTime) {
            const ping = (t1 - t0) / 2;
            const freshOffset = json.serverTime - (t1 - ping);
            // Se o offset atual for 0, aceita o novo direto. Senão, suaviza.
            serverOffsetRef.current = serverOffsetRef.current === 0 ? freshOffset : (serverOffsetRef.current * 0.7) + (freshOffset * 0.3);
         }
       } catch(e) {}
    };
    calibrate();

    // Se trocou de peão, liberar trava e resetar
    if (initialValue !== lastInitialRef.current) {
      lockRef.current = false;
      justStoppedRef.current = false;
      lastInitialRef.current = initialValue;
      _setTempo(initialValue);
      return;
    }

    // Só aceita sync do servidor se não estiver rodando nem com a trava ativa
    if (!isRunning && !justStoppedRef.current && !lockRef.current) {
      _setTempo(initialValue);
    }
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [initialValue, isRunning]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <input 
          type="number"
          step="0.01"
          value={formatTempo(tempo)}
          onChange={(e) => _setTempo(parseFloat(e.target.value) || 0)}
          style={{ width: '100%', padding: '1rem', paddingRight: '4rem', background: '#000', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }} 
        />
        <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: tempo >= 8 ? 'var(--primary)' : '#444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Timer size={20} />
          {tempo >= 8 && <span style={{fontSize:'0.7rem', fontWeight:'900'}}>Pulo 8s!</span>}
        </div>
      </div>

      <button 
        type="button"
        onClick={() => isRunning ? stop() : start()}
        className={isRunning ? "btn-danger" : "btn-primary"}
        style={{ height: '52px', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px', transition: 'all 0.3s' }}
      >
        {isRunning ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        {isRunning ? 'PARAR' : 'INICIAR'}
      </button>
    </div>
  );
}
