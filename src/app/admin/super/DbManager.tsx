'use client';

import { useState } from 'react';
import { Terminal, Send, Trash2, Database, Download, Upload, AlertTriangle, ShieldAlert } from 'lucide-react';
import { executeRawSql } from '../etapas/actions';

export default function DbManager() {
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!sql.trim()) return;
    if (!confirm("AVISO: Executar SQL bruto pode corromper o sistema. Deseja continuar?")) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await executeRawSql(sql);
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error || "Erro desconhecido");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm("⚠️ PERIGO: Isso apagará TODOS os dados do rodeio (Etapas, Peões, Notas). Tem certeza absoluta?")) return;
    const password = prompt("Digite a senha MASTER para confirmar:");
    if (password !== 'RODEIOWEB_DESTROY') return alert("Senha incorreta");

    setLoading(true);
    try {
      const sqlToClear = `TRUNCATE TABLE "LogNota", "Montaria", "RoundReserva", "Round", "Etapa", "Temporada", "Competidor", "Animal" RESTART IDENTITY CASCADE;`;
      const res = await executeRawSql(sqlToClear);
      if (res.success) alert("Banco de dados limpo com sucesso!");
      else setError(res.error || "Erro ao limpar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* CARD DE FERRAMENTAS RÁPIDAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="premium-card" style={{ border: '1px solid #ff4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#ff4444', marginBottom: '1rem' }}>
            <ShieldAlert size={24} />
            <h3 style={{ margin: 0 }}>Zona de Perigo</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1.5rem' }}>Ações destrutivas e alterações estruturais no banco de dados.</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={clearDatabase} className="btn-secondary" style={{ flex: 1, color: '#ff4444', border: '1px solid #ff4444', height: 'auto', padding: '10px' }}>
              <Trash2 size={16} /> Limpar Banco (Zerar)
            </button>
          </div>
        </div>

        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--primary)', marginBottom: '1rem' }}>
            <Database size={24} />
            <h3 style={{ margin: 0 }}>Backup & Restauração</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1.5rem' }}>Gerencie as cópias de segurança do seu evento.</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button disabled className="btn-secondary" style={{ flex: 1, opacity: 0.5 }}>
              <Download size={16} /> Exportar SQL
            </button>
            <button disabled className="btn-secondary" style={{ flex: 1, opacity: 0.5 }}>
              <Upload size={16} /> Importar SQL
            </button>
          </div>
          <p style={{ fontSize: '0.6rem', color: '#555', marginTop: '10px', textAlign: 'center' }}>* Backup automatizado via Docker ativado.</p>
        </div>
      </div>

      {/* CONSOLE SQL */}
      <div className="premium-card" style={{ background: '#0a0a0a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <Terminal size={24} color="#4CAF50" />
          <h3 style={{ margin: 0 }}>Console SQL Interativo</h3>
        </div>

        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="Digite o comando SQL (Ex: SELECT * FROM 'Competidor')..."
            style={{ 
              width: '100%', 
              height: '150px', 
              background: '#000', 
              color: '#4CAF50', 
              fontFamily: 'monospace', 
              fontSize: '1rem',
              padding: '1rem',
              border: '1px solid #333',
              borderRadius: '8px'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            onClick={handleExecute}
            disabled={loading}
            className="btn-primary" 
            style={{ padding: '0.5rem 2rem', background: '#4CAF50' }}
          >
            {loading ? 'Executando...' : <><Send size={18} /> Executar Comando</>}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '1.5rem', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '1rem', border: '1px solid #ff4444', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
            <AlertTriangle size={16} /> ERRO: {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>RESULTADO DA CONSULTA:</h4>
            <div style={{ 
              maxHeight: '400px', 
              overflow: 'auto', 
              background: '#111', 
              border: '1px solid #222', 
              borderRadius: '8px',
              padding: '1rem' 
            }}>
              <pre style={{ fontSize: '0.8rem', color: '#ccc', margin: 0 }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
