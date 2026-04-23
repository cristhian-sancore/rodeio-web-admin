import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "@/app/admin/components/PrintButton";

export default async function SumulaImpressaoPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const etapaId = parseInt(params.id);

  const etapa = await prisma.etapa.findUnique({
    where: { id: etapaId },
    include: {
      temporada: true,
      rounds: {
        include: {
          montarias: {
            include: { competidor: true, animal: true },
            orderBy: { notaTotal: 'desc' }
          },
          juiz1: true, juiz2: true, juiz3: true, juiz4: true
        },
        orderBy: { numero: 'asc' }
      }
    }
  });

  if (!etapa) redirect('/admin/etapas');

  return (
    <div className="sumula-print-container">
      {/* Botões de Controle (Ocultos na Impressão) */}
      <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a1a', padding: '1rem', borderRadius: '8px' }}>
        <Link href={`/admin/etapas/${etapaId}`} style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={20} /> Voltar para Painel
        </Link>
        <PrintButton />
      </div>

      {etapa.rounds.map((round) => (
        <div key={round.id} className="sumula-page" style={{ background: '#fff', color: '#000', padding: '2cm', marginBottom: '2rem', border: '1px solid #ddd', pageBreakAfter: 'always' }}>
          {/* Cabeçalho do Round */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', margin: 0, textTransform: 'uppercase' }}>{etapa.nome}</h1>
              <p style={{ margin: '0.2rem 0', fontWeight: 'bold' }}>{etapa.cidade} - {etapa.estado} | {etapa.temporada.titulo}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>ROUND {round.numero}</h2>
              <p style={{ margin: '0.2rem 0' }}>{round.modalidade.toUpperCase()} | {round.dataAgenda.toLocaleDateString()}</p>
            </div>
          </div>

          {/* Listagem de Juízes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
            <div style={{ border: '1px solid #ccc', padding: '0.5rem' }}><strong>JUIZ 1:</strong> {round.juiz1?.nome || '---'}</div>
            <div style={{ border: '1px solid #ccc', padding: '0.5rem' }}><strong>JUIZ 2:</strong> {round.juiz2?.nome || '---'}</div>
            {round.juiz3Id && <div style={{ border: '1px solid #ccc', padding: '0.5rem' }}><strong>JUIZ 3:</strong> {round.juiz3?.nome}</div>}
            {round.juiz4Id && <div style={{ border: '1px solid #ccc', padding: '0.5rem' }}><strong>JUIZ 4:</strong> {round.juiz4?.nome}</div>}
          </div>

          {/* Tabela de Resultados */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th style={tableHeaderStyle}>POS</th>
                <th style={tableHeaderStyle}>COMPETIDOR</th>
                <th style={tableHeaderStyle}>ANIMAL</th>
                <th style={tableHeaderStyle}>CIA / BOIADA</th>
                <th style={tableHeaderStyle}>TEMPO</th>
                <th style={tableHeaderStyle}>J1</th>
                <th style={tableHeaderStyle}>J2</th>
                <th style={tableHeaderStyle}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {round.montarias.map((m, idx) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tableCellStyle}>{idx + 1}º</td>
                  <td style={{ ...tableCellStyle, fontWeight: 'bold' }}>{m.competidor.nome}</td>
                  <td style={tableCellStyle}>{m.animal.nome}</td>
                  <td style={tableCellStyle}>{m.animal.companhia}</td>
                  <td style={tableCellStyle}>{m.tempo}s</td>
                  <td style={tableCellStyle}>{m.j1Peao + m.j1Animal}</td>
                  <td style={tableCellStyle}>{m.j2Peao + m.j2Animal}</td>
                  <td style={{ ...tableCellStyle, fontWeight: '900', background: '#f9f9f9' }}>
                    {m.desclassificado ? 'DESC.' : m.notaTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Espaço para assinaturas */}
          <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', textAlign: 'center', fontSize: '0.7rem' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>ASSINATURA JUIZ 1</div>
            <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>ASSINATURA JUIZ 2</div>
            <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>SECRETARIA / DIRETORIA</div>
          </div>
        </div>
      ))}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .sumula-print-container { padding: 0 !important; }
          .sumula-page { 
            margin: 0 !important; 
            border: none !important; 
            box-shadow: none !important;
            width: 100% !important;
          }
        }
        .sumula-page {
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '0.5rem',
  textAlign: 'left',
  textTransform: 'uppercase',
  fontSize: '0.75rem'
};

const tableCellStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '0.5rem',
  textAlign: 'left'
};
