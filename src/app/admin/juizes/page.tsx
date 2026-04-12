import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { UserCheck, Plus, Trash2, Edit, Search, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createJuiz, deleteJuiz } from "./actions";

export default async function JuizesPage({ searchParams }: { searchParams: Promise<{ q?: string, error?: string }> }) {
  const { q, error } = await searchParams;

  const juizes = await prisma.juiz.findMany({
    where: q ? {
      nome: { contains: q }
    } : undefined,
    orderBy: { nome: 'asc' }
  });

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '2rem' }}>Cadastro de Juízes Oficiais</h1>

      {error === 'JUIZ_HAS_LINKS' && (
        <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '1rem', borderRadius: '8px', border: '1px solid currentColor', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span><b>Erro ao Excluir:</b> Este juiz não pode ser removido pois já possui um login associado ou atuou em rounds e tem notas registradas. É mais seguro Editar seus dados.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
        {/* Formulario */}
        <div className="premium-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Novo Juiz
          </h2>
          <form action={createJuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nome Completo</label>
              <input name="nome" type="text" required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '0.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Cidade</label>
                <input name="cidade" type="text" style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>UF</label>
                <input name="uf" type="text" maxLength={2} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} placeholder="SP" />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Salvar Juiz</button>
          </form>
        </div>

        {/* Lista */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Bancada de Juízes ({juizes.length})</h2>
            
            <form method="GET" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#666" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input name="q" type="text" defaultValue={q || ''} placeholder="Pesquisar..." style={{ padding: '0.5rem 0.5rem 0.5rem 2.2rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', width: '200px' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.9rem' }}>Filtrar</button>
              {q && <Link href="/admin/juizes" style={{ color: '#ff4444', textDecoration: 'none', fontSize: '0.8rem', marginLeft: '0.5rem' }}>Limpar</Link>}
            </form>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {juizes.map((j: any) => (
              <div key={j.id} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37' }}>
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>{j.nome}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{j.cidade} - {j.uf}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Link href={`/admin/juizes/${j.id}/editar`} style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: '#fff', cursor: 'pointer', border: '1px solid #333' }}>
                    <Edit size={16} />
                  </Link>
                  <form action={deleteJuiz}>
                    <input type="hidden" name="id" value={j.id} />
                    <button type="submit" style={{ padding: '6px', background: 'rgba(255,68,68,0.1)', borderRadius: '4px', color: '#ff4444', cursor: 'pointer', border: '1px solid currentColor' }}>
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {juizes.length === 0 && (
              <p style={{ color: '#666' }}>Nenhum juiz cadastrado para a temporada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
