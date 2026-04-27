import { prisma } from "@/lib/db";
import CompetidorList from "./CompetidorList";

export default async function PublicCompetidoresPage() {
  const competidores = await prisma.competidor.findMany({
    include: {
      montarias: {
        select: {
          notaTotal: true,
          desclassificado: true
        }
      }
    },
    orderBy: { nome: 'asc' }
  });

  const competidoresComStats = competidores.map(c => {
    const paradas = c.montarias.filter(m => !m.desclassificado && m.notaTotal > 0).length;
    const totalMontarias = c.montarias.length;
    const aproveitamento = totalMontarias > 0 ? Math.round((paradas / totalMontarias) * 100) : 0;
    
    return {
      id: c.id,
      nome: c.nome,
      cidade: c.cidade,
      uf: c.uf,
      stats: {
        paradas,
        totalMontarias,
        aproveitamento
      }
    };
  });

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', fontWeight: 900 }}>Competidores</h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Encontre atletas pelo nome, cidade ou estado e acompanhe o desempenho oficial.</p>
      </div>

      <CompetidorList initialData={competidoresComStats} />
    </div>
  );
}
