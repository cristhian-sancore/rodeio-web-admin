import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Plus, Trash2, User, Cat, Target, ArrowLeft, Save, AlertCircle, Edit, ListOrdered } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import SearchableSelect from "../../../../../components/SearchableSelect";

export default async function MontagemRoundPage({ params }: { params: { id: string, roundId: string } }) {
  const { id, roundId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const rId = parseInt(roundId);
  const eId = parseInt(id);

  const [round, competidores, animais, montarias, reservas] = await Promise.all([
    prisma.round.findUnique({ where: { id: rId }, include: { etapa: true } }),
    prisma.competidor.findMany({ orderBy: { nome: 'asc' } }),
    prisma.animal.findMany({ orderBy: { nome: 'asc' } }),
    prisma.montaria.findMany({
      where: { roundId: rId },
      include: { competidor: true, animal: true }
    }),
    prisma.roundReserva.findMany({
      where: { roundId: rId },
      include: { animal: true },
      orderBy: { ordem: 'asc' }
    })
  ]);

  if (!round) return <div>Round não encontrado.</div>;

  // Filtrar o plantel correto para a modalidade
  const animaisFiltrados = animais.filter(a => {
    if (round.modalidade === 'Cavalo' || round.modalidade === 'Cutiano') {
      return a.tipo.toLowerCase() === 'cavalo';
    }
    return a.tipo.toLowerCase() === 'touro';
  });

  async function addMontaria(formData: FormData) {
    'use server';
    const rawCompetidor = formData.get('competidorId');
    const rawAnimal = formData.get('animalId');
    console.log("Raw form data:", { rawCompetidor, rawAnimal, rId });

    const competidorId = parseInt(rawCompetidor as string);
    const animalId = parseInt(rawAnimal as string);

    if (isNaN(competidorId) || isNaN(animalId)) {
      console.log("INVALID IDS, cannot create montaria.");
      return; 
    }

    // Verificar duplicidade
    const existing = await prisma.montaria.findFirst({
      where: { competidorId, roundId: rId }
    });

    if (!existing) {
      await prisma.montaria.create({
        data: { competidorId, animalId, roundId: rId, etapaId: eId }
      });
    }
    revalidatePath(`/admin/etapas/${id}/round/${roundId}/montagem`);
  }

  async function deleteMontaria(mId: number) {
    'use server';
    await prisma.montaria.delete({ where: { id: mId } });
    revalidatePath(`/admin/etapas/${id}/round/${roundId}/montagem`);
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link href={`/admin/etapas/${id}`} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} /> Voltar para Etapa
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#fff' }}>Montar Sorteio: <span style={{ color: 'var(--primary)' }}>Round {round.numero}</span></h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>{round.etapa.nome} • Defina os confrontos entre atletas e animais.</p>
        </div>
      </div>

      <div className="responsive-grid">
        
        {/* Formulário de Adição */}
        <div className="premium-card" style={{ height: 'fit-content' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            <Target size={20} color="var(--primary)" /> Adicionar à Súmula
          </h3>
          
          <form action={addMontaria} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#888' }}>Atleta (Peão)</label>
              <SearchableSelect 
                name="competidorId" 
                placeholder="Pesquise pelo nome do Peão..." 
                options={competidores.map(c => ({
                  id: c.id, 
                  label: `${c.nome} ${montarias.some(m => m.competidorId === c.id) ? '🕒 (Já escalado)' : ''}`
                }))} 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#888' }}>Animal ({round.modalidade})</label>
              <SearchableSelect 
                name="animalId" 
                placeholder={`Procurar ${round.modalidade}...`} 
                options={animaisFiltrados.map(c => ({
                  id: c.id, 
                  label: `${c.nome} (${c.companhia})`
                }))} 
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}>
              <Plus size={20} /> ADICIONAR CONFRONTO
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', gap: '0.4rem', alignItems: 'center', margin: 0 }}>
              <AlertCircle size={14} /> Somente atletas não escalados aparecem como disponíveis.
            </p>
          </div>
        </div>

        {/* Lista de Montarias Montadas */}
        <div>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LayoutGrid size={20} color="var(--primary)" /> Súmula do Round ({montarias.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {montarias.map((m: any) => (
              <div key={m.id} className="premium-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', background: '#111', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem', border: '1px solid #333' }}>
                      <User size={20} color="var(--primary)" />
                    </div>
                    <span style={{ fontSize: '0.6rem', color: '#555', fontWeight: 'bold', textTransform: 'uppercase' }}>Peão</span>
                  </div>
                  
                  <div style={{ height: '30px', width: '1px', background: '#222' }} />
                  
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{m.competidor.nome}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <Cat size={14} color="#666" />
                      <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>{m.animal.nome}</span>
                      <span style={{ fontSize: '0.7rem', color: '#444' }}>({m.animal.companhia})</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Link href={`/admin/etapas/${id}/round/${roundId}/montaria/${m.id}/editar`} style={{ padding: '0.5rem', color: '#888', display: 'flex', alignItems: 'center' }}>
                    <Edit size={18} />
                  </Link>
                  <form action={async () => { 'use server'; await prisma.montaria.delete({ where: { id: m.id } }); revalidatePath(`/admin/etapas/${id}/round/${roundId}/montagem`); }}>
                    <button type="submit" style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '0.5rem', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={20} />
                    </button>
                  </form>
                </div>
              </div>
            ))}

            {montarias.length === 0 && (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', border: '2px dashed #222', borderRadius: '12px' }}>
                <p style={{ color: '#444', margin: 0 }}>Nenhum confronto montado para este round.</p>
                <p style={{ color: '#333', fontSize: '0.8rem', marginTop: '0.5rem' }}>Use o formulário ao lado para iniciar o sorteio.</p>
              </div>
            )}
          </div>

          {montarias.length > 0 && (
            <Link href={`/admin/execucao?roundId=${roundId}`} className="btn-primary" style={{ marginTop: '2rem', width: '100%', textDecoration: 'none', height: '56px', background: 'transparent', border: '2px solid var(--primary)', color: 'var(--primary)', display: 'flex', justifyContent: 'center' }}>
              PROSSEGUIR PARA LANÇAMENTO DE NOTAS <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
            </Link>
          )}

          {/* SESSÃO DO CURRAL DE RESERVA */}
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px dashed #222' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ff4444' }}>
              <ListOrdered size={20} color="#ff4444" /> Curral de Reserva (Repasses)
            </h3>

            <form action={async (formData) => { 'use server'; const { addRoundReserva } = await import('../../../../actions'); await addRoundReserva(formData); }} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <input type="hidden" name="roundId" value={roundId} />
              <input type="hidden" name="etapaId" value={id} />
              <div style={{ flex: 3 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#888' }}>{round.modalidade} Reserva</label>
                <SearchableSelect 
                  name="animalId" 
                  placeholder={`Buscar novo ${round.modalidade}...`} 
                  options={animaisFiltrados.map(c => ({
                    id: c.id, 
                    label: `${c.nome} (${c.companhia})`
                  }))} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#888' }}>Ordem</label>
                <input name="ordem" type="number" required defaultValue={reservas.length + 1} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '0.8rem' }}>
                <Plus size={18} />
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {reservas.map((r: any) => (
                <div key={r.id} style={{ padding: '1rem', background: '#111', borderRadius: '8px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: r.utilizado ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: r.utilizado ? '#666' : '#ff4444' }}>#{r.ordem}</div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{r.animal.nome} {r.utilizado && <span style={{ fontSize: '0.7rem', color: '#4CAF50', border: '1px solid currentColor', padding: '0.1rem 0.3rem', borderRadius: '4px', marginLeft: '0.5rem' }}>Já Utilizado</span>}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>{r.animal.companhia}</div>
                    </div>
                  </div>
                  <form action={async () => { 'use server'; const { deleteRoundReserva } = await import('../../../../actions'); await deleteRoundReserva(r.id, rId, eId); }}>
                    <button type="submit" style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </form>
                </div>
              ))}
              {reservas.length === 0 && (
                <div style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem', padding: '1rem' }}>
                  Nenhum animal listado como reserva extra para este round.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper icons
function LayoutGrid({ size, color, style }: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
}

function ArrowRight({ size, color }: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
}
