'use client';

import { useState } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExcelRankingBtn({ peoes, touros }: { peoes: any[], touros: any[] }) {
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    setLoading(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Peões
      const wsPeoes = XLSX.utils.json_to_sheet(peoes.map((p, idx) => ({
        Pos: idx + 1,
        Atleta: p.nome,
        Origem: p.origem,
        Paradas: p.paradas,
        'Tempo Total': p.tempoTotal.toFixed(1) + 's',
        'Pontos Liga (C.Pts)': p.pontosLiga.toFixed(1)
      })));
      XLSX.utils.book_append_sheet(wb, wsPeoes, "Ranking Atletas");

      // Sheet 2: Touros
      const wsTouros = XLSX.utils.json_to_sheet(touros.map((t, idx) => ({
        Pos: idx + 1,
        Animal: t.nome,
        Companhia: t.cia,
        'Média de Notas': t.media.toFixed(2),
        'Qtd Saídas': t.qtd
      })));
      XLSX.utils.book_append_sheet(wb, wsTouros, "Melhores Touros");

      XLSX.writeFile(wb, `Ranking_Campeonato_${new Date().getFullYear()}.xlsx`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleExport}
      disabled={loading}
      className="btn-primary" 
      style={{ 
        background: '#1a1a1a', 
        border: '1px solid #333', 
        color: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        textDecoration: 'none' 
      }}
    >
      <FileSpreadsheet size={18} color="#4CAF50" />
      {loading ? 'Gerando...' : 'Exportar Ranking Excel'}
    </button>
  );
}
