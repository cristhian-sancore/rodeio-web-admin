'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para monitoramento
    console.error('CRITICAL_RENDER_ERROR:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      color: '#fff',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'rgba(255, 68, 68, 0.1)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <AlertTriangle size={40} color="#ff4444" />
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
        Ops! Ocorreu um <span style={{ color: '#ff4444' }}>Erro de Renderização</span>
      </h1>
      
      <p style={{ color: '#888', maxWidth: '500px', lineHeight: 1.6, marginBottom: '2rem' }}>
        O sistema encontrou uma inconsistência temporária nos dados. 
        Isso pode acontecer devido a uma oscilação na conexão com o banco de dados.
      </p>

      {error.digest && (
        <div style={{ 
          background: '#111', 
          padding: '0.5rem 1rem', 
          borderRadius: '8px', 
          fontSize: '0.7rem', 
          color: '#444',
          marginBottom: '2rem',
          fontFamily: 'monospace'
        }}>
          ID do Erro: {error.digest}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            background: 'var(--primary, #d4af37)',
            color: '#000',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 20px rgba(212, 175, 55, 0.2)'
          }}
        >
          <RefreshCcw size={18} /> TENTAR NOVAMENTE
        </button>

        <a
          href="/"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: '1px solid #333',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontWeight: 'bold',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Home size={18} /> IR PARA O INÍCIO
        </a>
      </div>

      <div style={{ marginTop: '4rem', fontSize: '0.7rem', color: '#222', textTransform: 'uppercase', letterSpacing: '2px' }}>
        Sistema de Recuperação Automática - Rodeio Pro
      </div>
    </div>
  );
}
