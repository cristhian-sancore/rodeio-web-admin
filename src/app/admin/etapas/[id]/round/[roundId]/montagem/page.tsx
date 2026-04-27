import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Plus, Trash2, User, Cat, Target, ArrowLeft, Edit, ListOrdered, Trophy, LayoutGrid, ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  addMontariaAction, 
  removeMontariaSorteio, 
  addRoundReserva, 
  deleteRoundReserva,
  importTopClassifiedRiders,
  importRidersFromPreviousRound
} from "../../../../actions";
import SearchableSelect from "../../../../../components/SearchableSelect";
import ExcelRoundActions from "./ExcelRoundActions";

import SorteioManager from "./SorteioManager";
import { createCompetidor } from "../../../../../competidores/actions";
import { createAnimal } from "../../../../../animais/actions";

export default async function MontagemRoundPage({ params }: { params: Promise<{ id: string, roundId: string }> }) {
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
      where: { roundId: rId, removida: false },
      include: { competidor: true, animal: true },
      orderBy: { id: 'asc' }
    }),
    prisma.roundReserva.findMany({
      where: { roundId: rId },
      include: { animal: true },
      orderBy: { ordem: 'asc' }
    })
  ]);

  const hasPreviousRound = round && round.numero > 1;
  if (!round) return <div>Round não encontrado.</div>;

  const animaisFiltrados = animais.filter(a => {
    if (round.modalidade === 'Cavalo' || round.modalidade === 'Cutiano') {
      return a.tipo.toLowerCase() === 'cavalo';
    }
    return a.tipo.toLowerCase() === 'touro';
  });

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
        <div style={{ minWidth: '350px' }}>
           <ExcelRoundActions roundId={rId} etapaId={eId} data={montarias} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        
        {/* Formulário de Adição (Coluna Estreita) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <PdfImportBtn roundId={rId} etapaId={eId} />

          <SorteioManager 
            roundId={rId}
            etapaId={eId}
            modalidade={round.modalidade}
            competidores={competidores}
            animais={animaisFiltrados}
            montarias={montarias}
            addMontariaAction={addMontariaAction}
            createCompetidorAction={createCompetidor}
            createAnimalAction={createAnimal}
          />

          {hasPreviousRound && (
             <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Trophy size={14} color="var(--primary)" /> Importar do Round Anterior:
                 </p>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <form action={importTopClassifiedRiders.bind(null, eId, rId, 10)}>
                        <button type="submit" className="btn-secondary" style={{ width: '100%', fontSize: '0.7rem' }}>Top 10</button>
                    </form>
                    <form action={importTopClassifiedRiders.bind(null, eId, rId, 15)}>
                        <button type="submit" className="btn-secondary" style={{ width: '100%', fontSize: '0.7rem' }}>Top 15</button>
                    </form>
                 </div>
                 <form action={importRidersFromPreviousRound.bind(null, eId, rId)}>
                     <button type="submit" className="btn-secondary" style={{ width: '100%', border: '1px dashed #444' }}>Importar Todos</button>
                 </form>
             </div>
          )}

          {/* Curral de Reserva */}
          <div className="premium-card" style={{ borderLeft: '3px solid #ff4444' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', color: '#ff4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ListOrdered size={18} /> Reservas ({reservas.length})
            </h3>
            <form action={addRoundReserva} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <input type="hidden" name="roundId" value={roundId} />
              <input type="hidden" name="etapaId" value={id} />
              <SearchableSelect 
                name="animalId" 
                placeholder="Animal Reserva..." 
                options={animaisFiltrados.map(c => ({ id: c.id, label: `${c.nome} (${c.companhia})` }))} 
              />
              <input name="ordem" type="number" required defaultValue={reservas.length + 1} style={{ background: '#000', border: '1px solid #333', padding: '0.5rem', borderRadius: '4px', color: '#fff' }} />
              <button type="submit" className="btn-primary" style={{ background: '#ff4444', border: 'none' }}>+ RESERVA</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {reservas.map((r: any) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#050505', padding: '0.5rem', borderRadius: '4px', border: '1px solid #111' }}>
                  <span style={{ fontSize: '0.8rem' }}>#{r.ordem} {r.animal.nome}</span>
                  <form action={deleteRoundReserva.bind(null, r.id, rId, eId)}>
                    <button type="submit" style={{ background: 'none', border: 'none', color: '#666' }}><Trash2 size={14} /></button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grade de Montarias (Coluna Larga) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <LayoutGrid size={20} color="var(--primary)" /> Súmula do Round ({montarias.length})
            </h3>
            {montarias.length > 0 && (
              <Link href={`/admin/execucao?roundId=${roundId}`} className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '0.5rem 1.5rem' }}>
                INICIAR NOTAS <ArrowRight size={16} />
              </Link>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {montarias.map((m: any, idx: number) => (
              <div key={m.id} className="premium-card" style={{ padding: '1rem', position: 'relative', background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                <div style={{ position: 'absolute', top: '-10px', left: '15px', background: 'var(--primary)', color: '#000', fontSize: '0.6rem', fontWeight: '950', padding: '2px 8px', borderRadius: '4px' }}>
                  {idx + 1}º
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                   <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', background: '#000', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #222' }}>
                        <User size={16} color="var(--primary)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#fff' }}>{m.competidor.nome}</div>
                        <div style={{ fontSize: '0.55rem', color: '#444', fontWeight: 'bold' }}>COMPETIDOR</div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: '0.2rem' }}>
                      <Link href={`/admin/etapas/${id}/round/${roundId}/montaria/${m.id}/editar`} style={{ color: '#444' }}><Edit size={14} /></Link>
                      <form action={removeMontariaSorteio.bind(null, m.id, rId, eId)}>
                        <button type="submit" style={{ background: 'none', border: 'none', color: '#444' }}><Trash2 size={14} /></button>
                      </form>
                   </div>
                </div>

                <div style={{ background: '#000', padding: '0.75rem', borderRadius: '8px', border: '1px solid #111', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <Cat size={16} color="var(--primary)" />
                   <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '900' }}>{m.animal.nome}</div>
                      <div style={{ fontSize: '0.6rem', color: '#333' }}>{m.animal.companhia}</div>
                   </div>
                </div>
              </div>
            ))}

            {montarias.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', border: '2px dashed #111', borderRadius: '12px' }}>
                <p style={{ color: '#444' }}>Nenhum confronto montado.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
