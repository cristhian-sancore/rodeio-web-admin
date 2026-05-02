'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, AlertTriangle, Lock, Monitor } from 'lucide-react';
import { updateMontariaNota, applyRepasse, sendManualToOverlay } from '@/app/admin/etapas/actions';
import RideTimer from './RideTimer';
import { VideoPlayer } from '@/components/VideoPlayer';

interface ScoringFormProps {
  montaria: any;
  round: any;
  numJuizes: number;
  notaMaxima: number;
  currentRankText: string;
  isAdmin: boolean;
  user: any;
  replayMap?: Record<string, { id: string, thumb: string | null }>;
  hasGDriveConfig?: boolean;
}

export default function ScoringForm({ 
  montaria, 
  round, 
  numJuizes, 
  notaMaxima, 
  currentRankText,
  isAdmin,
  user,
  replayMap = {},
  hasGDriveConfig = false
}: ScoringFormProps) {
  const [jStatus, setJStatus] = useState<any[]>([]);
  const [tempo, setTempo] = useState(montaria.tempo || 0);
  const [loading, setLoading] = useState(false);
  const [notified, setNotified] = useState(false);
  const [desclassificado, setDesclassificado] = useState(montaria.desclassificado || false);
  const [motivo, setMotivo] = useState(montaria.motivo || '');
  
  // Track focused fields to avoid overwriting while typing
  const focusedField = useRef<string | null>(null);
  
  // Refs para os inputs para que possamos atualizar o valor visualmente sem perder o foco se o usuário estiver digitando
  // Na verdade, se o juiz enviar, queremos que o valor apareça no input do admin
  const [notas, setNotas] = useState({
    j1p: montaria.j1Peao || 0, j1a: montaria.j1Animal || 0,
    j2p: montaria.j2Peao || 0, j2a: montaria.j2Animal || 0,
    j3p: montaria.j3Peao || 0, j3a: montaria.j3Animal || 0,
    j4p: montaria.j4Peao || 0, j4a: montaria.j4Animal || 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/admin/juiz-status?montariaId=${montaria.id}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.juizes) {
        setJStatus(json.juizes);
        
        // Atualizar as notas locais se elas mudaram no banco (enviadas pelos juízes)
        const newNotas: any = { ...notas };
        let mudou = false;
        
        json.juizes.forEach((j: any) => {
          const pKey = `j${j.numero}p` as keyof typeof notas;
          const aKey = `j${j.numero}a` as keyof typeof notas;
          
          if (j.enviou) {
            // Only update if the field is not focused
            if (focusedField.current !== pKey && notas[pKey] !== j.notaPeao) { 
              newNotas[pKey] = j.notaPeao; mudou = true; 
            }
            if (focusedField.current !== aKey && notas[aKey] !== j.notaAnimal) { 
              newNotas[aKey] = j.notaAnimal; mudou = true; 
            }
          }
        });
        
        if (mudou) setNotas(newNotas);

        // Sync global fields if not focused
        if (focusedField.current !== 'tempo' && json.tempo !== undefined && tempo !== json.tempo) setTempo(json.tempo);
        if (focusedField.current !== 'desclassificado' && json.desclassificado !== undefined && desclassificado !== json.desclassificado) setDesclassificado(json.desclassificado);
        if (focusedField.current !== 'motivo' && json.motivo !== undefined && motivo !== json.motivo) setMotivo(json.motivo);
      }
    } catch (err) {
      console.error('Erro ao atualizar notas em tempo real:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [montaria.id]);

  const handleSendToOverlay = async () => {
    setLoading(true);
    try {
      await sendManualToOverlay(montaria.id);
      setNotified(true);
      setTimeout(() => setNotified(false), 3000);
    } catch (err) {
      alert("Erro ao enviar para overlay");
    } finally {
      setLoading(false);
    }
  };

  const isJ1 = isAdmin || (user.juizId && round.juiz1Id === user.juizId);
  const isJ2 = (numJuizes >= 2) && (isAdmin || (user.juizId && round.juiz2Id === user.juizId));
  const isJ3 = (numJuizes >= 4) && (isAdmin || (user.juizId && round.juiz3Id === user.juizId));
  const isJ4 = (numJuizes >= 4) && (isAdmin || (user.juizId && round.juiz4Id === user.juizId));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const total = Object.values(notas).reduce((a, b) => a + (b || 0), 0);
    const isZero = total === 0;
    const is8s = tempo >= 8;
    const isDesq = (e.currentTarget.elements.namedItem('desclassificado') as HTMLInputElement).checked;

    if (is8s && isZero && !isDesq) {
      if (!confirm("⚠️ ALERTA: O tempo foi de 8 segundos mas todas as notas estão ZERADAS. Deseja gravar assim mesmo sem marcar como 'Desclassificado'?")) {
        e.preventDefault();
        return;
      }
    }
  };

  const searchKeyComp = (montaria.competidor?.nome || "").toUpperCase();
  const searchKeyAnimal = (montaria.animal?.nome || "").toUpperCase();
  
  const replayFileEntry = Object.entries(replayMap).find(([name]) => {
    if (!name) return false;
    const upName = name.toUpperCase();
    const normalize = (str: string) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalize(upName).includes(normalize(searchKeyComp)) && 
           normalize(upName).includes(normalize(searchKeyAnimal));
  });
  
  const replayFile = replayFileEntry ? replayFileEntry[1] : null;
  const localName = replayFileEntry ? replayFileEntry[0] : null;

  return (
    <form action={updateMontariaNota} onSubmit={handleSubmit}>
      <input type="hidden" name="montariaId" value={montaria.id} />
      <input type="hidden" name="numJuizes" value={numJuizes} />
      <input type="hidden" name="tempo" value={tempo} />
      
      {/* Visual Peão vs Touro */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', background: '#121212', borderRadius: '12px', border: '1px solid #222' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <span style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', fontWeight: 'bold' }}>Peão Selecionado</span>
          <h3 style={{ margin: '5px 0 0', color: '#fff' }}>{montaria.competidor?.nome || 'PEÃO NÃO INFORMADO'}</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Ranking Etapa: <strong style={{color:'var(--primary)'}}>{currentRankText}</strong></p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '1.2rem', fontWeight: '900' }}>VS</div>
        <div style={{ flex: 1, minWidth: '200px', textAlign: 'right' }}>
          <span style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', fontWeight: 'bold' }}>Animal Escalado</span>
          <h3 style={{ margin: '5px 0 0', color: 'var(--primary)' }}>{montaria.animal?.nome || 'ANIMAL NÃO INFORMADO'}</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cia: {montaria.animal?.companhia || '---'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem' }}>Configuração</label>
          <div style={{ padding: '0.75rem', background: '#222', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', border: '1px solid #333' }}>
            {numJuizes} Juiz(es) - Max {notaMaxima} Pts
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem' }}>Cronômetro</label>
          <RideTimer initialValue={montaria.tempo || 0} onTimeUpdate={setTempo} />
        </div>
      </div>

      <div className="responsive-grid" style={{ marginBottom: '2.5rem' }}>
        {[1, 2, 3, 4].map(num => {
          if (num > numJuizes && numJuizes !== 3) return null; 
          if (numJuizes === 3 && num > 3) return null;

          const canEdit = (num === 1 && isJ1) || (num === 2 && isJ2) || (num === 3 && isJ3) || (num === 4 && isJ4);
          const pKey = `j${num}p` as keyof typeof notas;
          const aKey = `j${num}a` as keyof typeof notas;
          
          return (
            <div key={num} className="premium-card" style={{ 
              padding: '1rem', 
              background: canEdit ? 'rgba(212, 175, 55, 0.03)' : '#121212', 
              border: canEdit ? '1.5px solid var(--primary)' : '1px solid #1a1a1a', 
              opacity: canEdit ? 1 : 0.6,
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: canEdit ? 'var(--primary)' : '#666' }}>
                  {num === 1 ? (round.juiz1?.nome || 'JUIZ 1') : 
                   num === 2 ? (round.juiz2?.nome || 'JUIZ 2') : 
                   num === 3 ? (round.juiz3?.nome || 'JUIZ 3') : 
                   (round.juiz4?.nome || 'JUIZ 4')}
                </span>
                {!canEdit && <Lock size={14} color="#333" />}
              </div>
              {numJuizes === 1 ? (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.6rem', color: '#555', textAlign: 'center', fontWeight: 'bold' }}>NOTA FINAL (0 A 100)</p>
                    <input 
                      type="number" 
                      step="0.25" 
                      value={notas[pKey] !== undefined ? (notas[pKey] + notas[aKey]) * 2 : ''}
                      onFocus={() => focusedField.current = pKey}
                      onBlur={() => focusedField.current = null}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setNotas({...notas, [pKey]: val / 4, [aKey]: val / 4});
                      }}
                      readOnly={!canEdit} 
                      style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '900', background: '#000 !important' }} 
                    />
                    <input type="hidden" name={`j${num}Peao`} value={notas[pKey]} />
                    <input type="hidden" name={`j${num}Animal`} value={notas[aKey]} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.6rem', color: '#555', textAlign: 'center', fontWeight: 'bold' }}>PEÃO</p>
                    <input 
                      name={`j${num}Peao`} 
                      type="number" 
                      step="0.25" 
                      value={notas[pKey] !== undefined ? notas[pKey] : ''}
                      onFocus={() => focusedField.current = pKey}
                      onBlur={() => focusedField.current = null}
                      onChange={e => setNotas({...notas, [pKey]: parseFloat(e.target.value) || 0})}
                      readOnly={!canEdit} 
                      style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: '900', background: '#000 !important' }} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.6rem', color: '#555', textAlign: 'center', fontWeight: 'bold' }}>TOURO</p>
                    <input 
                      name={`j${num}Animal`} 
                      type="number" 
                      step="0.25" 
                      value={notas[aKey] !== undefined ? notas[aKey] : ''}
                      onFocus={() => focusedField.current = aKey}
                      onBlur={() => focusedField.current = null}
                      onChange={e => setNotas({...notas, [aKey]: parseFloat(e.target.value) || 0})}
                      readOnly={!canEdit} 
                      style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: '900', background: '#000 !important' }} 
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '1rem', background: 'rgba(255, 68, 68, 0.05)', borderRadius: '10px', border: '1px solid rgba(255, 68, 68, 0.2)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <input 
            type="checkbox" 
            name="desclassificado" 
            id="des" 
            checked={desclassificado} 
            onFocus={() => focusedField.current = 'desclassificado'}
            onBlur={() => focusedField.current = null}
            onChange={(e) => setDesclassificado(e.target.checked)} 
            style={{ width: '20px', height: '20px' }} 
          />
          <label htmlFor="des" style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} /> DESCLASSIFICAÇÃO / ZERO NOTA
          </label>
        </div>
        <input 
          name="motivo" 
          type="text" 
          value={motivo} 
          onFocus={() => focusedField.current = 'motivo'}
          onBlur={() => focusedField.current = null}
          onChange={(e) => setMotivo(e.target.value)} 
          placeholder="Motivo da desclassificação..." 
          style={{ background: '#111 !important', fontSize: '0.8rem' }} 
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1.5rem', fontSize: '1.1rem' }}>
            <Save size={24} /> GRAVAR NOTA OFICIAL
          </button>
          
          <button 
            type="button"
            onClick={handleSendToOverlay}
            disabled={loading}
            className="btn-secondary" 
            style={{ 
              flex: 1, 
              padding: '1.5rem', 
              fontSize: '1rem', 
              background: notified ? '#22c55e' : '#000', 
              color: notified ? '#000' : 'var(--primary)',
              border: '2px solid var(--primary)',
              transition: 'all 0.3s'
            }}
          >
            <Monitor size={20} /> {notified ? 'ENVIADO!' : 'OVERLAY'}
          </button>
        </div>

        <button 
          formAction={async () => { if(confirm("Confirmar Repasse (Troca de Touro)?")) await applyRepasse(montaria.id, round.id); }} 
          className="btn-primary" 
          style={{ padding: '1.25rem', fontSize: '1rem', background: 'transparent', border: '2px solid #ff4444', color: '#ff4444' }}
        >
          🔄 SOLICITAR REPASSE (TROCAR ANIMAL)
        </button>
      </div>
    </form>
  );
}
