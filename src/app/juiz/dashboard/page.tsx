'use client';

import { useState, useEffect, useRef } from 'react';

interface MontariaData {
  id: number;
  competidor: string;
  animal: string;
  companhia: string;
  juizNumero: number;
  juizNome: string;
  notaPeao: number;
  notaAnimal: number;
  tempo: number;
  desclassificado: boolean;
}

export default function JuizDashboardPage() {
  const [data, setData] = useState<MontariaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [notaPeao, setNotaPeao] = useState('');
  const [notaAnimal, setNotaAnimal] = useState('');
  const lastMontariaIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/juiz/montaria-ativa', { cache: 'no-store' });
      const json = await res.json();
      
      if (json.active && json.data) {
        if (lastMontariaIdRef.current !== json.data.id) {
          setNotaPeao(json.data.notaPeao > 0 ? json.data.notaPeao.toString() : '');
          setNotaAnimal(json.data.notaAnimal > 0 ? json.data.notaAnimal.toString() : '');
          setSaved(false);
          lastMontariaIdRef.current = json.data.id;
        }
        setData(json.data);
        setError('');
      } else {
        setData(null);
        setNotaPeao('');
        setNotaAnimal('');
        setSaved(false);
        lastMontariaIdRef.current = null;
        if (json.message) setError(json.message);
      }
    } catch (err) {
      console.error('Erro ao buscar montaria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/juiz/salvar-nota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montariaId: data.id,
          juizNumero: data.juizNumero,
          notaPeao: parseFloat(notaPeao || '0'),
          notaAnimal: parseFloat(notaAnimal || '0'),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(fetchData, 500);
      } else {
        setError(json.error || 'Erro ao salvar nota');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  const totalJuiz = (parseFloat(notaPeao || '0') + parseFloat(notaAnimal || '0'));

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p style={{ color: '#888', fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>Conectando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header fixo */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>PAINEL DO JUIZ</span>
        </div>
        {data && (
          <div style={styles.headerRight}>
            <span style={styles.juizBadge}>JUIZ {data.juizNumero}</span>
            <span style={styles.juizName}>{data.juizNome}</span>
          </div>
        )}
      </div>

      {!data ? (
        /* TELA DE ESPERA */
        <div style={styles.waitingContainer}>
          <div style={styles.waitingIcon}>🐂</div>
          <h2 style={styles.waitingTitle}>AGUARDANDO MONTARIA</h2>
          <p style={styles.waitingText}>
            {error || 'O admin ainda não selecionou uma montaria.'}
          </p>
          <p style={styles.waitingSubtext}>Esta tela atualiza automaticamente</p>
          <div style={styles.pulseBar} />
        </div>
      ) : (
        /* FORMULÁRIO DE NOTAS */
        <div style={styles.mainContent}>
          {/* Card do Competidor */}
          <div style={{
            ...styles.competidorCard,
            borderColor: saved ? '#22c55e' : '#d4af37'
          }}>
            <div style={styles.competidorName}>{data.competidor}</div>
            <div style={styles.animalRow}>
              <span style={styles.animalIcon}>🐂</span>
              <span style={styles.animalName}>{data.animal}</span>
            </div>
            <div style={styles.companhia}>{data.companhia}</div>
          </div>

          {saved && (
            <div style={styles.savedBanner}>
              ✓ NOTA ENVIADA COM SUCESSO
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Inputs de Nota */}
            <div style={styles.notasRow}>
              <div style={styles.notaBox}>
                <label style={styles.notaLabel}>PEÃO</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  max="25"
                  value={notaPeao}
                  onChange={(e) => { setNotaPeao(e.target.value); setSaved(false); }}
                  placeholder="0"
                  style={styles.notaInput}
                />
                <span style={styles.notaRange}>0 - 25</span>
              </div>

              <div style={styles.notaBox}>
                <label style={styles.notaLabel}>TOURO</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  max="25"
                  value={notaAnimal}
                  onChange={(e) => { setNotaAnimal(e.target.value); setSaved(false); }}
                  placeholder="0"
                  style={styles.notaInput}
                />
                <span style={styles.notaRange}>0 - 25</span>
              </div>
            </div>

            {/* Total */}
            <div style={styles.totalBox}>
              <span style={styles.totalLabel}>TOTAL</span>
              <span style={{
                ...styles.totalValue,
                color: totalJuiz > 0 ? '#d4af37' : '#444'
              }}>
                {totalJuiz.toFixed(1)}
              </span>
            </div>

            {error && (
              <div style={styles.errorBox}>{error}</div>
            )}

            {/* Botão Enviar */}
            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.submitBtn,
                background: saved ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'linear-gradient(135deg, #b8860b, #d4af37)',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'SALVANDO...' : saved ? '✓ NOTA SALVA' : '📋 ENVIAR NOTA'}
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scaleX(0.5); }
          50% { opacity: 1; transform: scaleX(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] { -moz-appearance: textfield; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    minHeight: '100dvh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    overflow: 'hidden',
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'clamp(0.75rem, 2vw, 1.5rem) clamp(1rem, 3vw, 2rem)',
    background: 'rgba(0,0,0,0.5)',
    borderBottom: '1px solid #222',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  headerTitle: {
    color: '#d4af37',
    fontSize: 'clamp(0.9rem, 2.5vw, 1.4rem)',
    fontWeight: '900',
    letterSpacing: '2px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(0.5rem, 2vw, 1rem)',
  },
  juizBadge: {
    background: '#d4af37',
    color: '#000',
    padding: '0.3rem 0.75rem',
    borderRadius: '6px',
    fontSize: 'clamp(0.7rem, 2vw, 1rem)',
    fontWeight: '900',
    letterSpacing: '1px',
  },
  juizName: {
    color: '#999',
    fontSize: 'clamp(0.75rem, 2vw, 1rem)',
    display: 'none', // hidden on very small screens
  },

  // Loading
  loadingBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #333',
    borderTopColor: '#d4af37',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  // Waiting
  waitingContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center' as const,
  },
  waitingIcon: {
    fontSize: 'clamp(4rem, 15vw, 8rem)',
    marginBottom: '1rem',
    opacity: 0.2,
  },
  waitingTitle: {
    color: '#aaa',
    fontSize: 'clamp(1.2rem, 4vw, 2rem)',
    fontWeight: '800',
    letterSpacing: '2px',
    marginBottom: '0.75rem',
  },
  waitingText: {
    color: '#666',
    fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
    maxWidth: '400px',
    lineHeight: 1.5,
  },
  waitingSubtext: {
    color: '#444',
    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
    marginTop: '0.5rem',
  },
  pulseBar: {
    marginTop: '2rem',
    width: 'clamp(60px, 15vw, 100px)',
    height: '5px',
    background: '#d4af37',
    borderRadius: '4px',
    animation: 'pulse 2s ease-in-out infinite',
  },

  // Main Content
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: 'clamp(0.75rem, 3vw, 2rem)',
    gap: 'clamp(0.75rem, 2vw, 1.5rem)',
    maxWidth: '700px',
    width: '100%',
    margin: '0 auto',
    justifyContent: 'center',
  },

  // Competidor Card
  competidorCard: {
    background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))',
    border: '2px solid #d4af37',
    borderRadius: 'clamp(12px, 3vw, 20px)',
    padding: 'clamp(1rem, 3vw, 2rem)',
    textAlign: 'center' as const,
    transition: 'border-color 0.3s',
  },
  competidorName: {
    color: '#fff',
    fontSize: 'clamp(1.5rem, 5vw, 2.8rem)',
    fontWeight: '900',
    letterSpacing: '1px',
    lineHeight: 1.1,
    marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
    textTransform: 'uppercase' as const,
  },
  animalRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '0.25rem',
  },
  animalIcon: {
    fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
  },
  animalName: {
    color: '#d4af37',
    fontSize: 'clamp(1.1rem, 3.5vw, 1.8rem)',
    fontWeight: '700',
  },
  companhia: {
    color: '#777',
    fontSize: 'clamp(0.8rem, 2.5vw, 1.1rem)',
  },

  savedBanner: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '2px solid #22c55e',
    color: '#22c55e',
    padding: 'clamp(0.5rem, 2vw, 1rem)',
    borderRadius: '12px',
    fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
    fontWeight: '800',
    textAlign: 'center' as const,
    letterSpacing: '1px',
  },

  // Form
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'clamp(0.75rem, 2vw, 1.25rem)',
  },

  notasRow: {
    display: 'flex',
    gap: 'clamp(0.75rem, 2vw, 1.5rem)',
  },

  notaBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.5rem',
  },
  notaLabel: {
    color: '#999',
    fontSize: 'clamp(0.8rem, 2.5vw, 1.2rem)',
    fontWeight: '800',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
  },
  notaInput: {
    width: '100%',
    padding: 'clamp(0.75rem, 3vw, 1.5rem)',
    fontSize: 'clamp(2rem, 8vw, 4rem)',
    fontWeight: '900',
    textAlign: 'center' as const,
    background: '#111',
    border: '3px solid #333',
    borderRadius: 'clamp(12px, 3vw, 20px)',
    color: '#fff',
    outline: 'none',
    caretColor: '#d4af37',
  },
  notaRange: {
    color: '#555',
    fontSize: 'clamp(0.65rem, 2vw, 0.85rem)',
  },

  // Total
  totalBox: {
    background: '#111',
    border: '2px solid #333',
    borderRadius: 'clamp(12px, 3vw, 20px)',
    padding: 'clamp(0.75rem, 2vw, 1.25rem)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 'clamp(1.5rem, 4vw, 2.5rem)',
    paddingRight: 'clamp(1.5rem, 4vw, 2.5rem)',
  },
  totalLabel: {
    color: '#777',
    fontSize: 'clamp(0.9rem, 2.5vw, 1.3rem)',
    fontWeight: '800',
    letterSpacing: '3px',
  },
  totalValue: {
    fontSize: 'clamp(2.5rem, 9vw, 5rem)',
    fontWeight: '900',
    lineHeight: 1,
  },

  errorBox: {
    background: 'rgba(255, 68, 68, 0.1)',
    border: '2px solid #ff4444',
    color: '#ff4444',
    padding: 'clamp(0.75rem, 2vw, 1rem)',
    borderRadius: '12px',
    fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)',
    textAlign: 'center' as const,
    fontWeight: '600',
  },

  submitBtn: {
    width: '100%',
    padding: 'clamp(1rem, 3vw, 1.75rem)',
    fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
    fontWeight: '900',
    color: '#000',
    border: 'none',
    borderRadius: 'clamp(12px, 3vw, 20px)',
    cursor: 'pointer',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    transition: 'all 0.3s',
    boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)',
  },
};
