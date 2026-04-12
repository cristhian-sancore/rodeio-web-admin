import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Cat, Trash2, Shield, Edit, Search, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createAnimal, deleteAnimal } from "./actions";

export default async function AnimaisPage({ searchParams }: { searchParams: Promise<{ q?: string, error?: string }> }) {
  const { q, error } = await searchParams;

  const animais = await prisma.animal.findMany({
    where: q ? {
      OR: [
        { nome: { contains: q } },
        { companhia: { contains: q } }
      ]
    } : undefined,
    orderBy: { nome: 'asc' }
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Plantel de Animais</h1>
        <Link href="/admin/animais/ranking" className="btn-primary" style={{ textDecoration: 'none', background: '#222', border: '1px solid #333' }}>
          Ver Ranking da Boiada
        </Link>
      </div>

      {error === 'ANIMAL_HAS_LINKS' && (
        <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '1rem', borderRadius: '8px', border: '1px solid currentColor', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span><b>Erro ao Excluir:</b> Este animal não pode ser removido pois já participou de um sorteio, montaria ou está na reserva de um round. Utilize o recurso "Editar" se precisar alterar o nome ou a companhia.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
        {/* Formulario */}
        <div className="premium-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#fff' }}>Novo Touro / Cavalo</h2>
          <form action={createAnimal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nome do Animal</label>
              <input name="nome" type="text" required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} placeholder="Ex: Bandido" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Companhia / Tropa</label>
              <input name="companhia" type="text" required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} placeholder="Ex: Cia Paulo Emílio" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Tipo</label>
              <select name="tipo" required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
                <option value="Touro">Touro</option>
                <option value="Cavalo">Cavalo</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Cadastrar Animal</button>
          </form>
        </div>

        {/* Lista */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Boiada/Tropa ({animais.length})</h2>
            
            <form method="GET" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#666" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input name="q" type="text" defaultValue={q || ''} placeholder="Pesquisar..." style={{ padding: '0.5rem 0.5rem 0.5rem 2.2rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', width: '200px' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.9rem' }}>Filtrar</button>
              {q && <Link href="/admin/animais" style={{ color: '#ff4444', textDecoration: 'none', fontSize: '0.8rem', marginLeft: '0.5rem' }}>Limpar</Link>}
            </form>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {animais.map((a: any) => (
              <div key={a.id} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37' }}>
                    {a.tipo === 'Touro' ? <Cat size={20} /> : <Shield size={20} />}
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>{a.nome}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{a.companhia}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Link href={`/admin/animais/${a.id}/editar`} style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: '#fff', cursor: 'pointer', border: '1px solid #333' }}>
                    <Edit size={16} />
                  </Link>
                  <form action={deleteAnimal}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" style={{ padding: '6px', background: 'rgba(255,68,68,0.1)', borderRadius: '4px', color: '#ff4444', cursor: 'pointer', border: '1px solid currentColor' }}>
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {animais.length === 0 && (
              <p style={{ color: '#666', padding: '2rem', textAlign: 'center', width: '100%' }}>Nenhum animal cadastrado no plantel.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
