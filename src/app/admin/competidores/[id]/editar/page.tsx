import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { updateCompetidor } from "../../actions";
import { Save, ArrowLeft, User } from "lucide-react";
import Link from "next/link";

export default async function EditarCompetidorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cId = parseInt(id);

  const competidor = await prisma.competidor.findUnique({ where: { id: cId } });
  if (!competidor) redirect('/admin/competidores');

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/competidores" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', textDecoration: 'none' }}>
          <ArrowLeft size={20} /> Voltar para Competidores
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Editar Atleta: <span style={{ color: 'var(--primary)' }}>{competidor.nome}</span></h1>
      </div>

      <div className="premium-card" style={{ maxWidth: '600px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          <User size={20} color="var(--primary)" /> Perfil do Competidor
        </h3>
        
        <form action={updateCompetidor} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <input type="hidden" name="id" value={competidor.id} />

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nome Completo</label>
            <input name="nome" type="text" required defaultValue={competidor.nome} style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Cidade</label>
              <input name="cidade" type="text" defaultValue={competidor.cidade || ''} style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>UF</label>
              <input name="uf" type="text" maxLength={2} defaultValue={competidor.uf || ''} style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem' }} placeholder="SP" />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <Save size={20} /> SALVAR ALTERAÇÕES
          </button>
        </form>
      </div>
    </div>
  );
}
