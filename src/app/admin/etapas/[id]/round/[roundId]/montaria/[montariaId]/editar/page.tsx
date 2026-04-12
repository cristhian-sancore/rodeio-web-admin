import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { updateMontariaSorteio } from "../../../../../../actions";
import { Save, ArrowLeft, Target } from "lucide-react";
import Link from "next/link";
import SearchableSelect from "../../../../../../../components/SearchableSelect";

export default async function EditarMontariaPage(props: { params: Promise<{ id: string, roundId: string, montariaId: string }> }) {
  const params = await props.params;
  const eId = parseInt(params.id);
  const rId = parseInt(params.roundId);
  const mId = parseInt(params.montariaId);

  const [montaria, round, competidores, animais] = await Promise.all([
    prisma.montaria.findUnique({ where: { id: mId }, include: { competidor: true, animal: true } }),
    prisma.round.findUnique({ where: { id: rId }, include: { etapa: true } }),
    prisma.competidor.findMany({ orderBy: { nome: 'asc' } }),
    prisma.animal.findMany({ orderBy: { nome: 'asc' } })
  ]);

  if (!montaria || !round) redirect(`/admin/etapas/${eId}/round/${rId}/montagem`);

  // Precisamos também saber das outras montarias para evitar dupla escalação visual,
  // mas vamos apenas exibir um aviso caso o competidor escolhido já esteja no round.
  const outrasMontarias = await prisma.montaria.findMany({
    where: { roundId: rId, id: { not: mId } }
  });

  const animaisFiltrados = animais.filter(a => {
    if (round.modalidade === 'Cavalo' || round.modalidade === 'Cutiano') {
      return a.tipo.toLowerCase() === 'cavalo';
    }
    return a.tipo.toLowerCase() === 'touro';
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href={`/admin/etapas/${eId}/round/${rId}/montagem`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', textDecoration: 'none' }}>
          <ArrowLeft size={20} /> Voltar para Súmula
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Editar Escalação: <span style={{ color: 'var(--primary)' }}>{montaria.competidor.nome}</span></h1>
      </div>

      <div className="premium-card" style={{ maxWidth: '600px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          <Target size={20} color="var(--primary)" /> Substituição de Atleta / Animal
        </h3>
        
        <form action={updateMontariaSorteio} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <input type="hidden" name="montariaId" value={montaria.id} />
          <input type="hidden" name="roundId" value={round.id} />
          <input type="hidden" name="etapaId" value={round.etapaId} />

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#888' }}>Atleta (Peão)</label>
            <SearchableSelect 
              name="competidorId"
              defaultValue={montaria.competidorId}
              placeholder="Procurar Atleta..." 
              options={competidores.map(c => ({
                id: c.id, 
                label: `${c.nome} ${outrasMontarias.some(m => m.competidorId === c.id) ? '🕒 (Já escalado noutra)' : ''}`
              }))} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#888' }}>Animal ({round.modalidade})</label>
            <SearchableSelect 
              name="animalId"
              defaultValue={montaria.animalId}
              placeholder={`Trocar de ${round.modalidade}...`} 
              options={animaisFiltrados.map((c: any) => ({
                id: c.id, 
                label: `${c.nome} (${c.companhia})`
              }))} 
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <Save size={20} /> SALVAR ALTERAÇÃO
          </button>
        </form>
      </div>
    </div>
  );
}
