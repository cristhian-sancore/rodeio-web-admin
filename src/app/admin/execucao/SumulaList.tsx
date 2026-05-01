'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle2, Timer, Radio } from 'lucide-react';
import { updateMontariaAtiva } from '@/app/admin/etapas/actions';

export default function SumulaList({ montarias, roundId, selectedId }: { montarias: any[], roundId: number, selectedId?: number }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [showFinished, setShowFinished] = useState(false);
  const router = useRouter();

  const handleSelect = async (mId: number) => {
    try {
      setErrorVisible(false);
      await updateMontariaAtiva(mId);
      router.push(`/admin/execucao?roundId=${roundId}&montariaId=${mId}`);
    } catch (err: any) {
      if (err.message === "AGUARDANDO_NOTAS_JUIZES") {
        setErrorVisible(true);
        setTimeout(() => setErrorVisible(false), 5000);
      } else {
        console.error("Erro ao selecionar montaria:", err);
      }
    }
  };

  const filtered = montarias.filter(m => {
    const isDone = (m.notaTotal > 0 || m.desclassificado);
    // Se NÃO estiver em modo "mostrar finalizados", e a montaria ESTIVER pronta, oculta (a menos que seja a selecionada)
    if (!showFinished && isDone && selectedId !== m.id) return false;
    
    const text = `${m.competidor.nome} ${m.animal.nome} ${m.animal.companhia}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {errorVisible && (
        <div style={{
          background: 'rgba(255, 68, 68, 0.15)',
          border: '1px solid #ff4444',
          color: '#ff4444',
          padding: '0.75rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          marginBottom: '1rem',
          textAlign: 'center',
          fontWeight: 'bold',
          animation: 'shake 0.5s'
        }}>
          ⚠️ AGUARDANDO NOTAS DOS JUÍZES! <br/>
          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>A montaria atual ainda não foi finalizada.</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
          />
          <Search size={16} color="#888" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
        <button 
          onClick={() => setShowFinished(!showFinished)}
          style={{
            padding: '0.5rem 0.8rem',
            background: showFinished ? 'var(--primary)' : '#222',
            color: showFinished ? '#000' : '#888',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          {showFinished ? 'OCULTAR FINALIZADOS' : 'VER TUDO'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '65vh', overflowY: 'auto', paddingRight: '0.5rem' }}>

        {filtered.map((m: any) => {
          const isSelected = selectedId === m.id;
          const isDone = m.notaTotal > 0 || m.desclassificado;
          return (
            <div 
              key={m.id} 
              onClick={() => handleSelect(m.id)}
              className="premium-card"
              style={{ 
                padding: '1rem', 
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--primary)' : (isDone ? '1px solid #1a1a1a' : '1px dashed #333'),
                background: isSelected ? 'rgba(212, 175, 55, 0.05)' : (isDone ? '#181818' : '#111'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: isDone && !isSelected ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: '#111', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone ? '#4CAF50' : '#444' }}>
                  {isDone ? <CheckCircle2 size={24} /> : <Timer size={24} />}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: isSelected ? 'var(--primary)' : '#fff' }}>{m.competidor.nome}</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>{m.animal.nome} ({m.animal.companhia})</p>
                </div>
              </div>
              {isDone && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: m.notaTotal > 0 ? 'var(--primary)' : '#ff4444' }}>{m.notaTotal.toFixed(2)}</div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ color: '#666', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>Nenhum resultado encontrado.</p>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
