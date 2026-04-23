import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { updateRound } from "../../../actions";
import { Save, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

export default async function EditarRoundPage(props: { params: Promise<{ id: string, roundId: string }> }) {
  const params = await props.params;
  const etapaId = parseInt(params.id);
  const roundId = parseInt(params.roundId);

  const round = await prisma.round.findUnique({ 
    where: { id: roundId },
    include: { etapa: true }
  });

  if (!round) redirect(`/admin/etapas/${etapaId}`);

  const juizes = await prisma.juiz.findMany({ orderBy: { nome: 'asc' } });
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } }) || { numJuizes: 2 };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href={`/admin/etapas/${etapaId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', textDecoration: 'none' }}>
          <ArrowLeft size={20} /> Voltar para Etapa
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Editar Round: <span style={{ color: 'var(--primary)' }}>{round.numero} ({round.modalidade})</span></h1>
      </div>

      <div className="premium-card" style={{ maxWidth: '600px' }}>
        <form action={updateRound} className="grid-2">
          <input type="hidden" name="id" value={round.id} />
          <input type="hidden" name="etapaId" value={etapaId} />
          
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Número do Round</label>
            <input name="numero" type="number" required defaultValue={round.numero} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
          </div>

          <div style={{ gridColumn: 'span 2', padding: '1.25rem', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.2)', marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} /> Escala de Juízes do Round
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Juiz 1 (Responsável Notas Peão)</label>
                <select name="juiz1" defaultValue={round.juiz1Id ?? ""} style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
                  <option value="">Selecione o Juiz 1...</option>
                  {juizes.map((j: any) => <option key={`j1-${j.id}`} value={j.id}>{j.nome}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Juiz 2 (Responsável Notas Animal)</label>
                <select name="juiz2" defaultValue={round.juiz2Id ?? ""} style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
                  <option value="">Selecione o Juiz 2...</option>
                  {juizes.map((j: any) => <option key={`j2-${j.id}`} value={j.id}>{j.nome}</option>)}
                </select>
              </div>

              {config.numJuizes >= 3 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Juiz 3</label>
                  <select name="juiz3" defaultValue={round.juiz3Id ?? ""} style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
                    <option value="">Selecione o Juiz 3...</option>
                    {juizes.map((j: any) => <option key={`j3-${j.id}`} value={j.id}>{j.nome}</option>)}
                  </select>
                </div>
              )}

              {config.numJuizes >= 4 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Juiz 4</label>
                  <select name="juiz4" defaultValue={round.juiz4Id ?? ""} style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
                    <option value="">Selecione o Juiz 4...</option>
                    {juizes.map((j: any) => <option key={`j4-${j.id}`} value={j.id}>{j.nome}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
            <Save size={20} /> SALVAR ALTERAÇÕES
          </button>
        </form>
      </div>
    </div>
  );
}
