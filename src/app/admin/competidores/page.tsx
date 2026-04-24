import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { User, Trash2, Edit, Search, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createCompetidor, deleteCompetidor } from "./actions";
import ExcelActions from "./ExcelActions";

export default async function CompetidoresPage({ searchParams }: { searchParams: Promise<{ q?: string, error?: string }> }) {
  const { q, error } = await searchParams;

  const competidores = await prisma.competidor.findMany({
    where: q ? {
      nome: { contains: q }
    } : undefined,
    orderBy: { nome: 'asc' }
  });

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '2rem' }}>Cadastro de Competidores</h1>

      {error === 'COMPETIDOR_HAS_LINKS' && (
        <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '1rem', borderRadius: '8px', border: '1px solid currentColor', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span><b>Erro ao Excluir:</b> Este atleta não pode ser removido pois já possui histórico de montarias gravadas no sistema. Utilize o recurso "Editar" se precisar alterar seus dados.</span>
        </div>
      )}

      {/* Formulario de Cadastro */}
      <div className="premium-card" style={{ marginBottom: '3rem', maxWidth: '600px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#fff' }}>Novo Competidor (Atleta)</h2>
        <form action={createCompetidor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nome Completo</label>
            <input name="nome" type="text" required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} placeholder="Ex: João Silva" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Cidade</label>
              <input name="cidade" type="text" style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} placeholder="Ex: Fernandópolis" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>UF</label>
              <input name="uf" type="text" maxLength={2} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} placeholder="SP" />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Foto / Capturar Câmera</label>
            <input 
              name="foto" 
              type="file" 
              accept="image/*" 
              capture="environment" 
              style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px dashed #444', borderRadius: '8px', color: '#888' }} 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Cadastrar Atleta</button>
        </form>
      </div>

      {/* Lista de Competidores */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
             <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Atletas Cadastrados ({competidores.length})</h2>
             <ExcelActions data={competidores} />
          </div>
          
          <form method="GET" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#666" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input name="q" type="text" defaultValue={q || ''} placeholder="Pesquisar por nome..." style={{ padding: '0.5rem 0.5rem 0.5rem 2.2rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', width: '250px' }} />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.9rem' }}>Filtrar</button>
            {q && <Link href="/admin/competidores" style={{ color: '#ff4444', textDecoration: 'none', fontSize: '0.8rem', marginLeft: '0.5rem' }}>Limpar</Link>}
          </form>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {competidores.map((c: any) => (
            <div key={c.id} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '50px', height: '50px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', border: '1px solid #333' }}>
                  {c.fotoUrl ? (
                    <img src={c.fotoUrl} alt={c.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>{c.nome}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>{c.cidade || 'Não inf.'} - {c.uf || ''}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Link href={`/admin/competidores/${c.id}/editar`} style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: '#fff', cursor: 'pointer', border: '1px solid #333' }}>
                  <Edit size={16} />
                </Link>
                <form action={deleteCompetidor}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" style={{ padding: '6px', background: 'rgba(255,68,68,0.1)', borderRadius: '4px', color: '#ff4444', cursor: 'pointer', border: '1px solid currentColor' }}>
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            </div>
          ))}
          {competidores.length === 0 && (
            <p style={{ color: '#666', padding: '2rem', textAlign: 'center', width: '100%', gridColumn: 'span 2' }}>Nenhum atleta cadastrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}
