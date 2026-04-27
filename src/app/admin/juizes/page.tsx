import { prisma } from "@/lib/db";
import { AlertCircle } from "lucide-react";
import { createJuiz } from "./actions";
import JuizManager from "./JuizManager";

export default async function JuizesPage({ searchParams }: { searchParams: Promise<{ q?: string, error?: string }> }) {
  const { error } = await searchParams;

  const juizes = await prisma.juiz.findMany({
    orderBy: { nome: 'asc' }
  });

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-1px' }}>Bancada de <span style={{color:'var(--primary)'}}>Juízes Oficiais</span></h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Gerencie os oficiais de arena responsáveis pelas notas oficiais.</p>
      </div>

      {error === 'JUIZ_HAS_LINKS' && (
        <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '1.5rem', borderRadius: '15px', border: '1px solid currentColor', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertCircle size={24} />
          <span><b style={{fontSize:'1.1rem'}}>Erro ao Excluir:</b> Este juiz não pode ser removido pois já possui um login associado ou atuou em rounds e tem notas registradas. É mais seguro Editar seus dados.</span>
        </div>
      )}

      <JuizManager initialData={juizes} createAction={createJuiz} />
    </div>
  );
}
