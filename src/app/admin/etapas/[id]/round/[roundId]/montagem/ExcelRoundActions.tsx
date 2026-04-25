'use client';

import { useState } from 'react';
import { Upload, Download, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { importRoundMontariasAction, importRoundPdfAction } from '../../../../actions';

interface ExcelRoundActionsProps {
  roundId: number;
  etapaId: number;
  data: any[];
}

export default function ExcelRoundActions({ roundId, etapaId, data }: ExcelRoundActionsProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number; totalErrors?: number; errors?: string[] | null; error?: string } | null>(null);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(m => ({
      Competidor: m.competidor.nome,
      Animal: m.animal.nome,
      Companhia: m.animal.companhia
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sorteio_Round");
    XLSX.writeFile(wb, `sorteio_round_${roundId}.xlsx`);
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await importRoundPdfAction(roundId, etapaId, formData);
      setResult(res as any);
      if (res.success) {
        setTimeout(() => setResult(null), 10000);
      }
    } catch (err) {
      alert("Erro ao processar PDF.");
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        const res = await importRoundMontariasAction(roundId, etapaId, jsonData);
        setResult(res as any);
        
        if (res.success) {
          setTimeout(() => setResult(null), 10000);
        }
      } catch (err) {
        alert("Erro ao processar planilha.");
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleExport}
          className="btn-secondary" 
          style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
        >
          <Download size={16} /> Exportar
        </button>

        <div style={{ position: 'relative' }}>
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handlePdfImport}
            style={{ 
              position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 
            }} 
            disabled={loading}
          />
          <button 
            className="btn-primary" 
            style={{ 
              background: '#e74c3c', color: '#fff', 
              padding: '0.6rem 1rem', fontSize: '0.85rem' 
            }}
          >
            <FileText size={16} /> {loading ? 'Lendo PDF...' : 'Importar PDF'}
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleImport}
            style={{ 
              position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 
            }} 
            disabled={loading}
          />
          <button 
            className="btn-primary" 
            style={{ 
              background: 'var(--primary)', color: '#000', 
              padding: '0.6rem 1rem', fontSize: '0.85rem' 
            }}
          >
            <Upload size={16} /> {loading ? '...' : 'Importar Excel'}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '10px', 
          background: result.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 68, 68, 0.1)',
          border: `1px solid ${result.success ? '#4CAF50' : '#ff4444'}`,
          fontSize: '0.85rem'
        }}>
          {result.error && <div style={{ color: '#ff4444' }}>{result.error}</div>}
          
          {result.success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: result.success ? '#4CAF50' : '#ff4444', marginBottom: '0.5rem' }}>
             {result.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
             {result.count} montarias importadas com sucesso!
          </div>
          )}
          
          {result.totalErrors && result.totalErrors > 0 ? (
            <div style={{ color: '#ffbb33', marginTop: '0.5rem' }}>
               <strong>Atenção ({result.totalErrors} erros):</strong>
               <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {result.errors?.map((err, i) => <li key={i}>{err}</li>)}
                  {result.totalErrors > 5 && <li>... e outros {result.totalErrors - 5} erros.</li>}
               </ul>
            </div>
          ) : null}
        </div>
      )}

    </div>
  );
}
