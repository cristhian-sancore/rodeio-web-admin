'use client';

import { useState, useEffect, useRef } from 'react';
import { Save } from 'lucide-react';

interface MontariaData {
  id: number;
  competidor: string;
  animal: string;
  companhia: string;
  juizNumero: number; // 1, 2, 3 ou 4
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/juiz/montaria-ativa', { cache: 'no-store' });
      const json = await res.json();
      
      if (json.active && json.data) {
        // Se mudou a montaria, resetar os campos
        if (!data || data.id !== json.data.id) {
          setNotaPeao(json.data.notaPeao > 0 ? json.data.notaPeao.toString() : '');
          setNotaAnimal(json.data.notaAnimal > 0 ? json.data.notaAnimal.toString() : '');
          setSaved(false);
        }
        setData(json.data);
        setError('');
      } else {
        setData(null);
        setNotaPeao('');
        setNotaAnimal('');
        setSaved(false);
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
        // Atualizar dados após salvar
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Conectando ao sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '480px',
        textAlign: 'center',
        marginBottom: '1.5rem'
      }}>
        <h1 style={{ 
          color: '#d4af37', 
          fontSize: '1.5rem', 
          fontWeight: '900', 
          letterSpacing: '2px',
          marginBottom: '0.25rem'
        }}>
          PAINEL DO JUIZ
        </h1>
        {data && (
          <p style={{ color: '#888', fontSize: '0.85rem' }}>
            {data.juizNome} • Juiz {data.juizNumero}
          </p>
        )}
      </div>

      {!data ? (
        <div style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid #333',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>🐂</div>
          <h2 style={{ color: '#888', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Aguardando Montaria
          </h2>
          <p style={{ color: '#555', fontSize: '0.85rem' }}>
            {error || 'O admin ainda não selecionou uma montaria. Esta tela atualiza automaticamente.'}
          </p>
          <div style={{ 
            marginTop: '2rem',
            width: '40px', height: '4px', 
            background: '#d4af37', 
            borderRadius: '2px',
            margin: '2rem auto 0',
            animation: 'pulse 2s infinite'
          }} />
        </div>
      ) : (
        <div style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(255,255,255,0.03)',
          border: saved ? '2px solid #22c55e' : '1px solid #333',
          borderRadius: '16px',
          overflow: 'hidden',
          transition: 'border 0.3s'
        }}>
          {/* Header - Competidor e Animal */}
          <div style={{ 
            background: 'linear-gradient(135deg, #1a1a1a, #222)', 
            padding: '1.5rem',
            borderBottom: '1px solid #333'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                  {data.competidor}
                </h2>
                <p style={{ color: '#d4af37', fontSize: '0.9rem', fontWeight: '600' }}>
                  🐂 {data.animal}
                </p>
                <p style={{ color: '#666', fontSize: '0.75rem' }}>
                  {data.companhia}
                </p>
              </div>
              {saved && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  ✓ SALVO
                </div>
              )}
            </div>
          </div>

          {/* Formulário de Notas */}
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Nota Peão */}
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  color: '#888', 
                  fontSize: '0.7rem', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                  letterSpacing: '1px'
                }}>
                  Nota Peão
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="25"
                  value={notaPeao}
                  onChange={(e) => { setNotaPeao(e.target.value); setSaved(false); }}
                  placeholder="0 - 25"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1.8rem',
                    fontWeight: '900',
                    textAlign: 'center',
                    background: '#111',
                    border: '2px solid #333',
                    borderRadius: '12px',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Nota Animal */}
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  color: '#888', 
                  fontSize: '0.7rem', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                  letterSpacing: '1px'
                }}>
                  Nota Touro
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="25"
                  value={notaAnimal}
                  onChange={(e) => { setNotaAnimal(e.target.value); setSaved(false); }}
                  placeholder="0 - 25"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1.8rem',
                    fontWeight: '900',
                    textAlign: 'center',
                    background: '#111',
                    border: '2px solid #333',
                    borderRadius: '12px',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Total */}
            <div style={{
              background: '#111',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '1rem',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <span style={{ color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total do Juiz</span>
              <div style={{ 
                color: '#d4af37', 
                fontSize: '2.5rem', 
                fontWeight: '900',
                lineHeight: 1
              }}>
                {((parseFloat(notaPeao || '0') + parseFloat(notaAnimal || '0'))).toFixed(1)}
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid #ff4444',
                color: '#ff4444',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                fontWeight: '800',
                background: saved ? '#22c55e' : '#d4af37',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                cursor: saving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background 0.3s',
                letterSpacing: '1px'
              }}
            >
              <Save size={20} />
              {saving ? 'SALVANDO...' : saved ? '✓ NOTA SALVA' : 'ENVIAR NOTA'}
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
