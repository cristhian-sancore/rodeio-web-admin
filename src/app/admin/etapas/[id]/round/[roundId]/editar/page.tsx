import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { updateRound } from "../../../../actions";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditarRoundPage(props: { params: Promise<{ id: string, roundId: string }> }) {
  const params = await props.params;
  const eId = parseInt(params.id);
  const rId = parseInt(params.roundId);

  const [round, etapa, juizes, config] = await Promise.all([
    prisma.round.findUnique({ where: { id: rId } }),
    prisma.etapa.findUnique({ where: { id: eId } }),
    prisma.juiz.findMany({ orderBy: { nome: 'asc' } }),
    prisma.configuracao.findUnique({ where: { id: 1 } })
  ]);

  if (!round || !etapa) redirect(`/admin/etapas/${eId}`);

  const numJuizes = config?.numJuizes || 2;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href={`/admin/etapas/${eId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', textDecoration: 'none' }}>
          <ArrowLeft size={20} /> Voltar
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Editar Round: <span style={{ color: 'var(--primary)' }}>{round.numero}</span> da Etapa {etapa.nome}</h1>
      </div>

      <div className="premium-card" style={{ maxWidth: '800px' }}>
        <form action={updateRound} className="grid-2">
          <input type="hidden" name="id" value={round.id} />
          <input type="hidden" name="etapaId" value={etapa.id} />

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Nº do Round</label>
            <input name="numero" type="number" required defaultValue={round.numero} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
          </div>
          
          <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#d4af37', marginBottom: '1rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>Escalação de Juízes</h3>
          </div>

          <div style={{ gridColumn: numJuizes === 1 ? 'span 2' : 'span 1' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Escalar Juiz 1 (Fixo)</label>
            <select name="juiz1" defaultValue={round.juiz1Id || ''} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
              <option value="">Selecione o Juiz 1...</option>
              {juizes.map((j: any) => <option key={`j1-${j.id}`} value={j.id}>{j.nome}</option>)}
            </select>
          </div>

          {numJuizes >= 2 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Escalar Juiz 2</label>
              <select name="juiz2" defaultValue={round.juiz2Id || ''} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
                <option value="">Selecione o Juiz 2...</option>
                {juizes.map((j: any) => <option key={`j2-${j.id}`} value={j.id}>{j.nome}</option>)}
              </select>
            </div>
          )}

          {numJuizes === 4 && (
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Escalar Juiz 3</label>
                <select name="juiz3" defaultValue={round.juiz3Id || ''} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
                  <option value="">Selecione o Juiz 3...</option>
                  {juizes.map((j: any) => <option key={`j3-${j.id}`} value={j.id}>{j.nome}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Escalar Juiz 4</label>
                <select name="juiz4" defaultValue={round.juiz4Id || ''} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
                  <option value="">Selecione o Juiz 4...</option>
                  {juizes.map((j: any) => <option key={`j4-${j.id}`} value={j.id}>{j.nome}</option>)}
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
            <Save size={20} /> SALVAR ROUND
          </button>
        </form>
      </div>
    </div>
  );
}
