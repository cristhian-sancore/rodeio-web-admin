'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle2, Timer, Radio } from 'lucide-react';
import { updateMontariaAtiva } from '../etapas/actions';

export default function SumulaList({ montarias, roundId, selectedId }: { montarias: any[], roundId: number, selectedId?: number }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = montarias.filter(m => {
    const text = `${m.competidor.nome} ${m.animal.nome} ${m.animal.companhia}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <input 
          type="text" 
          placeholder="Buscar peão ou animal..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
        />
        <Search size={18} color="#888" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '65vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
        {filtered.map((m: any) => {
          const isSelected = selectedId === m.id;
          const isDone = m.notaTotal > 0 || m.desclassificado;
          return (
            <Link 
              key={m.id} 
              href={`/admin/execucao?roundId=${roundId}&montariaId=${m.id}`}
              onClick={() => updateMontariaAtiva(m.id)}
              className="premium-card"
              style={{ 
                padding: '1rem', 
                textDecoration: 'none',
                border: isSelected ? '2px solid var(--primary)' : (isDone ? '1px solid #1a1a1a' : '1px dashed #333'),
                background: isSelected ? 'rgba(212, 175, 55, 0.05)' : (isDone ? '#181818' : '#111'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: isDone && !isSelected ? 0.6 : 1
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
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ color: '#666', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>Nenhum resultado encontrado.</p>
        )}
      </div>
    </div>
  );
}
