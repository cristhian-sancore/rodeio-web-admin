import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { updateJuiz } from "../../actions";
import { Save, ArrowLeft, UserCheck } from "lucide-react";
import Link from "next/link";

export default async function EditarJuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jId = parseInt(id);

  const juiz = await prisma.juiz.findUnique({ where: { id: jId } });
  if (!juiz) redirect('/admin/juizes');

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/juizes" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', textDecoration: 'none' }}>
          <ArrowLeft size={20} /> Voltar para Bancada
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Editar Juiz: <span style={{ color: 'var(--primary)' }}>{juiz.nome}</span></h1>
      </div>

      <div className="premium-card" style={{ maxWidth: '600px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          <UserCheck size={20} color="var(--primary)" /> Perfil do Oficial
        </h3>
        
        <form action={updateJuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <input type="hidden" name="id" value={juiz.id} />

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nome Completo</label>
            <input name="nome" type="text" required defaultValue={juiz.nome} style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Cidade</label>
              <input name="cidade" type="text" defaultValue={juiz.cidade || ''} style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>UF</label>
              <input name="uf" type="text" maxLength={2} defaultValue={juiz.uf || ''} style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem' }} placeholder="SP" />
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
