import { prisma } from "@/lib/db";
import { AlertCircle } from "lucide-react";
import { createAnimal } from "./actions";
import AnimalManager from "./AnimalManager";

export default async function AnimaisPage({ searchParams }: { searchParams: Promise<{ q?: string, error?: string }> }) {
  const { error } = await searchParams;

  try {
    const animais = await prisma.animal.findMany({
      orderBy: { nome: 'asc' }
    });

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-1px' }}>Gestão de <span style={{color:'var(--primary)' }}>Boiada / Cavalaria</span></h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Controle o plantel de animais, companhias e ranking de desempenho.</p>
      </div>

      {error === 'ANIMAL_HAS_LINKS' && (
        <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '1.5rem', borderRadius: '15px', border: '1px solid currentColor', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertCircle size={24} />
          <span><b style={{fontSize:'1.1rem'}}>Erro ao Excluir:</b> Este animal não pode ser removido pois já participou de um sorteio, montaria ou está na reserva de um round. Utilize o recurso "Editar" se precisar alterar o nome ou a companhia.</span>
        </div>
      )}

      <AnimalManager initialData={animais} createAction={createAnimal} />
    </div>
  );
  } catch (error) {
    console.error("[AnimaisPage] Erro:", error);
    return <div>Erro ao carregar lista de animais.</div>;
  }
}
