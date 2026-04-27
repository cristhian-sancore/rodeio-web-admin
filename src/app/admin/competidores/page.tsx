import { prisma } from "@/lib/db";
import { AlertCircle } from "lucide-react";
import { createCompetidor } from "./actions";
import CompetidorManager from "./CompetidorManager";

export default async function CompetidoresPage({ searchParams }: { searchParams: Promise<{ q?: string, error?: string }> }) {
  const { error } = await searchParams;

  const competidores = await prisma.competidor.findMany({
    orderBy: { nome: 'asc' }
  });

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-1px' }}>Gestão de <span style={{color:'var(--primary)'}}>Competidores</span></h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Gerencie o cadastro de atletas, fotos e histórico de montarias.</p>
      </div>

      {error === 'COMPETIDOR_HAS_LINKS' && (
        <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '1.5rem', borderRadius: '15px', border: '1px solid currentColor', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertCircle size={24} />
          <span><b style={{fontSize:'1.1rem'}}>Erro ao Excluir:</b> Este atleta não pode ser removido pois já possui histórico de montarias gravadas no sistema. Utilize o recurso "Editar" se precisar alterar seus dados.</span>
        </div>
      )}

      <CompetidorManager initialData={competidores} createAction={createCompetidor} />
    </div>
  );
}
