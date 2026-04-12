import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { updateEtapa } from "../../actions";
import { Save, ArrowLeft, Gavel } from "lucide-react";
import Link from "next/link";

export default async function EditarEtapaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const mId = parseInt(params.id);
  const etapa = await prisma.etapa.findUnique({ where: { id: mId } });
  if (!etapa) redirect('/admin/etapas');

  const juizes = await prisma.juiz.findMany({ orderBy: { nome: 'asc' } });

  const temporadas = await prisma.temporada.findMany({
    orderBy: { ano: 'desc' }
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href={`/admin/etapas/${mId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', textDecoration: 'none' }}>
          <ArrowLeft size={20} /> Voltar
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Editar Etapa: <span style={{ color: 'var(--primary)' }}>{etapa.nome}</span></h1>
      </div>

      <div className="premium-card" style={{ maxWidth: '800px' }}>
        <form action={updateEtapa} className="grid-2">
          <input type="hidden" name="id" value={etapa.id} />
          
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Vincular a qual Circuito / Temporada?</label>
            <select name="temporadaId" required defaultValue={etapa.temporadaId} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
              {temporadas.map((t: any) => (
                <option key={t.id} value={t.id}>{t.titulo} ({t.ano})</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nome do Evento</label>
            <input name="nome" type="text" required defaultValue={etapa.nome} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Cidade</label>
            <input name="cidade" type="text" required defaultValue={etapa.cidade} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>UF</label>
            <input name="estado" type="text" maxLength={2} required defaultValue={etapa.estado} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Data de Início</label>
            <input name="dataInicio" type="date" required defaultValue={etapa.dataInicio.toISOString().substring(0, 10)} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Data Final</label>
            <input name="dataFinal" type="date" required defaultValue={etapa.dataFinal.toISOString().substring(0, 10)} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
          </div>

          <div style={{ gridColumn: 'span 2', padding: '1.25rem', background: 'rgba(33, 150, 243, 0.05)', borderRadius: '10px', border: '1px solid rgba(33, 150, 243, 0.2)', marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: '#2196F3', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Gavel size={18} /> Juízes Padrão desta Etapa (Opcional)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Juiz 1 Padrão</label>
                <select name="defaultJuiz1Id" defaultValue={etapa.defaultJuiz1Id ?? ""} style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
                  <option value="">Seguir padrão da Temporada...</option>
                  {juizes.map((j: any) => (
                    <option key={`j1-${j.id}`} value={j.id}>{j.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Juiz 2 Padrão</label>
                <select name="defaultJuiz2Id" defaultValue={etapa.defaultJuiz2Id ?? ""} style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
                  <option value="">Seguir padrão da Temporada...</option>
                  {juizes.map((j: any) => (
                    <option key={`j2-${j.id}`} value={j.id}>{j.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#666' }}>Se deixado vazio, o sistema usará automaticamente os juízes configurados no Circuito.</p>
          </div>

          <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
            <Save size={20} /> SALVAR ALTERAÇÕES
          </button>
        </form>
      </div>
    </div>
  );
}
