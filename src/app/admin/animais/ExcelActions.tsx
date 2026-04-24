'use client';

import { useState } from 'react';
import { Upload, Download, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { importAnimais } from './actions';

export default function ExcelActions({ data }: { data: any[] }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(a => ({
      ID: a.id,
      Nome: a.nome,
      Companhia: a.companhia,
      Tipo: a.tipo
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Boiada_Cavalaria");
    XLSX.writeFile(wb, "animais_rodeio.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        const res = await importAnimais(jsonData);
        if (res.success) {
          setSuccess(`${res.count} animais importados com sucesso!`);
          setTimeout(() => setSuccess(null), 5000);
        } else {
          alert(res.error);
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
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      
      {success && (
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', 
          color: '#4CAF50', fontSize: '0.8rem', fontWeight: 'bold',
          background: 'rgba(76, 175, 80, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid currentColor'
        }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      <button 
        onClick={handleExport}
        className="btn-primary" 
        style={{ 
          background: '#222', border: '1px solid #333', 
          color: '#fff', padding: '0.6rem 1rem', fontSize: '0.85rem' 
        }}
      >
        <Download size={16} /> Exportar Excel
      </button>

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
          <Upload size={16} /> {loading ? 'Processando...' : 'Importar Excel'}
        </button>
      </div>

    </div>
  );
}
