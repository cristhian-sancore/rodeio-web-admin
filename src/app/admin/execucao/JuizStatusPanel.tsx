'use client';

import { useState, useEffect, useRef } from 'react';

interface JuizStatus {
  numero: number;
  nome: string;
  notaPeao: number;
  notaAnimal: number;
  enviou: boolean;
}

export default function JuizStatusPanel({ montariaId, numJuizes }: { montariaId: number, numJuizes: number }) {
  const [juizes, setJuizes] = useState<JuizStatus[]>([]);
  const [todosEnviaram, setTodosEnviaram] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/admin/juiz-status?montariaId=${montariaId}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.juizes) {
        setJuizes(json.juizes);
        setTodosEnviaram(json.todosEnviaram);
      }
    } catch (err) {
      console.error('Erro ao buscar status dos juízes:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [montariaId]);

  const juizesAtivos = juizes.filter(j => j.numero <= numJuizes);
  const enviaram = juizesAtivos.filter(j => j.enviou).length;

  return (
    <div style={{
      background: todosEnviaram ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255, 165, 0, 0.05)',
      border: `2px solid ${todosEnviaram ? '#22c55e' : '#ff8c00'}`,
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>{todosEnviaram ? '✅' : '⏳'}</span>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '800',
            color: todosEnviaram ? '#22c55e' : '#ff8c00',
            letterSpacing: '1px'
          }}>
            {todosEnviaram ? 'TODAS AS NOTAS RECEBIDAS' : 'AGUARDANDO JUÍZES'}
          </span>
        </div>
        <span style={{
          background: todosEnviaram ? '#22c55e' : '#ff8c00',
          color: '#000',
          padding: '0.2rem 0.6rem',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: '900'
        }}>
          {enviaram}/{juizesAtivos.length}
        </span>
      </div>

      {/* Status de cada juiz */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {juizesAtivos.map(j => (
          <div key={j.numero} style={{
            flex: 1,
            minWidth: '120px',
            background: j.enviou ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${j.enviou ? '#22c55e44' : '#333'}`,
            borderRadius: '8px',
            padding: '0.6rem 0.75rem',
            textAlign: 'center',
            transition: 'all 0.3s',
          }}>
            <div style={{
              fontSize: '0.65rem',
              fontWeight: '800',
              color: j.enviou ? '#22c55e' : '#666',
              marginBottom: '0.3rem',
              letterSpacing: '1px',
            }}>
              {j.nome}
            </div>
            {j.enviou ? (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.5rem', color: '#666' }}>PEÃO</div>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: '#22c55e' }}>{j.notaPeao.toFixed(2)}</div>
                </div>
                <div style={{ borderLeft: '1px solid #333', margin: '0 0.25rem' }} />
                <div>
                  <div style={{ fontSize: '0.5rem', color: '#666' }}>TOURO</div>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: '#22c55e' }}>{j.notaAnimal.toFixed(2)}</div>
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: '0.8rem',
                color: '#ff8c00',
                fontWeight: '600',
              }}>
                ⏳ Pendente
              </div>
            )}
          </div>
        ))}
      </div>

      {!todosEnviaram && (
        <div style={{
          marginTop: '0.75rem',
          fontSize: '0.7rem',
          color: '#666',
          textAlign: 'center',
          fontStyle: 'italic',
        }}>
          Atualiza automaticamente a cada 2 segundos
        </div>
      )}
    </div>
  );
}
