'use client';

import { useState } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { importPdfAction } from '../../../../actions';

interface Props {
  roundId: number;
  etapaId: number;
}

export default function PdfImportBtn({ roundId, etapaId }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [count, setCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus('idle');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('roundId', roundId.toString());
    formData.append('etapaId', etapaId.toString());

    try {
      const res = await importPdfAction(formData);
      if (res.success) {
        setStatus('success');
        setCount(res.count || 0);
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setErrorMessage(res.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Falha na conexão');
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="premium-card" style={{ border: '1px dashed #333', background: 'rgba(212, 175, 55, 0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <FileText size={20} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Importar Sorteio (PDF)</h3>
      </div>

      <div style={{ position: 'relative' }}>
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleUpload} 
          disabled={loading}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }} 
        />
        <button 
          disabled={loading} 
          className="btn-secondary" 
          style={{ 
            width: '100%', 
            padding: '1rem', 
            border: '2px dashed #444', 
            background: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? (
            <span style={{ fontSize: '0.8rem' }}>Processando PDF...</span>
          ) : (
            <>
              <Upload size={24} color="#555" />
              <span style={{ fontSize: '0.75rem', color: '#888' }}>Clique ou arraste o PDF aqui</span>
            </>
          )}
        </button>
      </div>

      {status === 'success' && (
        <div style={{ marginTop: '1rem', color: '#4CAF50', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={14} /> Importação concluída! ({count} montarias)
        </div>
      )}

      {status === 'error' && (
        <div style={{ marginTop: '1rem', color: '#ff4444', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={14} /> <strong>Falha na Importação</strong>
          </div>
          <span style={{ fontSize: '0.7rem', opacity: 0.9, marginLeft: '1.4rem' }}>{errorMessage}</span>
        </div>
      )}

      <p style={{ fontSize: '0.6rem', color: '#444', marginTop: '10px' }}>
        * Suporta formato padrão de sorteio (Nº, Nome, Touro, Cia).
      </p>
    </div>
  );
}
