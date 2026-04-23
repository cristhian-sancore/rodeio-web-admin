import { Calendar, MapPin, Trophy, Plus, LayoutGrid, AlertTriangle, Edit, Trash2, Printer } from "lucide-react";
import Link from "next/link";
import { createRound, deleteRound } from "../actions";
import { prisma } from "@/lib/db";

export default async function EtapaDetailPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;
  const hasError = searchParams?.error === 'ROUND_HAS_LINKS';
  const etapaId = parseInt(id);

  const etapa = await prisma.etapa.findUnique({
    where: { id: etapaId },
    include: {
      temporada: true,
      rounds: {
        include: {
          juiz1: true,
          juiz2: true,
          juiz3: true,
          juiz4: true,
          montarias: {
            include: { competidor: true, animal: true }
          }
        }
      }
    }
  });

  const juizes = await prisma.juiz.findMany({ orderBy: { nome: 'asc' } });
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } }) || { numJuizes: 2 };

  if (!etapa) return <div>Etapa não encontrada.</div>;

  const roundsTouros = etapa.rounds.filter(r => r.modalidade === 'Touro');
  const roundsCavalos = etapa.rounds.filter(r => r.modalidade === 'Cavalo' || r.modalidade === 'Cutiano');

  async function handleCreateRound(formData: FormData) {
    'use server';
    const modalidade = formData.get('modalidade') as string || 'Touro';
    
    let numero = parseInt(formData.get('numero') as string);
    if (isNaN(numero)) {
      const roundsDestaModalidade = modalidade === 'Touro' ? roundsTouros : roundsCavalos;
      numero = roundsDestaModalidade.length + 1;
    }
    
    const j1 = formData.get('juiz1') ? parseInt(formData.get('juiz1') as string) : undefined;
    const j2 = formData.get('juiz2') ? parseInt(formData.get('juiz2') as string) : undefined;
    const j3 = formData.get('juiz3') ? parseInt(formData.get('juiz3') as string) : undefined;
    const j4 = formData.get('juiz4') ? parseInt(formData.get('juiz4') as string) : undefined;
    const dataAgenda = formData.get('dataAgenda') ? new Date(formData.get('dataAgenda') as string) : undefined;

    await createRound(etapaId, numero, j1, j2, j3, j4, modalidade, dataAgenda);
  }

  return (
    <div>
      {/* Header da Etapa */}
      <div className="premium-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>{etapa.nome}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', color: '#888', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={16} color="#d4af37" /> {etapa.cidade} - {etapa.estado}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} color="#d4af37" /> {etapa.dataInicio.toLocaleDateString()} até {etapa.dataFinal.toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link 
              href={`/admin/etapas/${id}/sumula`} 
              className="btn-primary" 
              style={{ 
                padding: '1.2rem 2rem', 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                background: '#333',
                textDecoration: 'none'
              }}
            >
              <Printer size={24} /> IMPRIMIR SÚMULAS
            </Link>
            
            <Link 
              href={`/admin/etapas/${id}/classificacao`} 
              className="btn-primary" 
              style={{ 
                padding: '1.2rem 2rem', 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
                textDecoration: 'none'
              }}
            >
              <Trophy size={24} /> VER CLASSIFICAÇÕES
            </Link>
          </div>
        </div>
      </div>

      {hasError && (
        <div style={{ padding: '1rem', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', borderRadius: '8px', color: '#ff4444', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={24} />
          <div>
            <strong>Não foi possível excluir o Round!</strong>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Existem montarias ou notas vinculadas a ele. Apague os confrontos ou limpe a súmula deste round antes de fazer sua exclusão total.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Gestão de Rounds */}
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Cronograma de Rounds</h2>
          </div>
          
          <form action={handleCreateRound} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#111', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Modalidade</label>
                <select name="modalidade" style={{ width: '100%', padding: '0.6rem', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}>
                  <option value="Touro">Rodeio em Touros</option>
                  <option value="Cavalo">Rodeio em Cavalos</option>
                </select>
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Nº Round</label>
                <input name="numero" type="number" placeholder="Auto" style={{ width: '100%', padding: '0.6rem', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }} />
              </div>

              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Data Agenda</label>
                <input name="dataAgenda" type="date" defaultValue={etapa.dataInicio.toISOString().split('T')[0]} style={{ width: '100%', padding: '0.6rem', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }} />
              </div>
              
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Juiz 1 (Fixo)</label>
                <select name="juiz1" defaultValue={etapa.defaultJuiz1Id ?? etapa.temporada.defaultJuiz1Id ?? ""} style={{ width: '100%', padding: '0.6rem', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}>
                  <option value="">Selecione o Juiz 1...</option>
                  {juizes.map((j: any) => <option key={`j1-${j.id}`} value={j.id}>{j.nome}</option>)}
                </select>
              </div>

              {config.numJuizes >= 2 && (
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Juiz 2</label>
                  <select name="juiz2" defaultValue={etapa.defaultJuiz2Id ?? etapa.temporada.defaultJuiz2Id ?? ""} style={{ width: '100%', padding: '0.6rem', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}>
                    <option value="">Selecione o Juiz 2...</option>
                    {juizes.map((j: any) => <option key={`j2-${j.id}`} value={j.id}>{j.nome}</option>)}
                  </select>
                </div>
              )}
            </div>

            {config.numJuizes === 4 && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Juiz 3</label>
                  <select name="juiz3" style={{ width: '100%', padding: '0.6rem', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}>
                    <option value="">Selecione o Juiz 3...</option>
                    {juizes.map((j: any) => <option key={`j3-${j.id}`} value={j.id}>{j.nome}</option>)}
                  </select>
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Juiz 4</label>
                  <select name="juiz4" style={{ width: '100%', padding: '0.6rem', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}>
                    <option value="">Selecione o Juiz 4...</option>
                    {juizes.map((j: any) => <option key={`j4-${j.id}`} value={j.id}>{j.nome}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}></div>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ padding: '0.8rem', fontWeight: 'bold' }}>
              + CRIAR NOVO ROUND
            </button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Lista Touros */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#d4af37', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Rodeio em Touros</h3>
              {roundsTouros.map((round) => (
                <div key={round.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>ROUND {round.numero}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {round.dataAgenda.toLocaleDateString()} • {round.montarias.length} montarias
                    </div>
                    {/* Exibição da Escala de Juízes */}
                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {round.juiz1 && <span><b>J1:</b> {round.juiz1.nome}</span>}
                      {round.juiz2 && <span><b>J2:</b> {round.juiz2.nome}</span>}
                      {round.juiz3 && <span><b>J3:</b> {round.juiz3.nome}</span>}
                      {round.juiz4 && <span><b>J4:</b> {round.juiz4.nome}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/admin/etapas/${id}/round/${round.id}/editar`} style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '0.4rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Editar Round">
                      <Edit size={14} />
                    </Link>
                    <Link href={`/admin/etapas/${id}/round/${round.id}/montagem`} className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: '#333', textDecoration: 'none' }}>Montar</Link>
                    <Link href={`/admin/execucao?roundId=${round.id}`} className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}>Notas</Link>
                    <form action={deleteRound.bind(null, round.id, etapaId)}>
                      <button type="submit" style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Excluir"><Trash2 size={16} /></button>
                    </form>
                  </div>
                </div>
              ))}
              {roundsTouros.length === 0 && <p style={{ fontSize: '0.8rem', color: '#666' }}>Nenhum round de touro.</p>}
            </div>

            {/* Lista Cavalos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#4CAF50', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Rodeio em Cavalos</h3>
              {roundsCavalos.map((round) => (
                <div key={round.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>ROUND {round.numero}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {round.dataAgenda.toLocaleDateString()} • {round.montarias.length} montarias
                    </div>
                    {/* Exibição da Escala de Juízes */}
                    <div style={{ fontSize: '0.7rem', color: '#4CAF50', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {round.juiz1 && <span><b>J1:</b> {round.juiz1.nome}</span>}
                      {round.juiz2 && <span><b>J2:</b> {round.juiz2.nome}</span>}
                      {round.juiz3 && <span><b>J3:</b> {round.juiz3.nome}</span>}
                      {round.juiz4 && <span><b>J4:</b> {round.juiz4.nome}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/admin/etapas/${id}/round/${round.id}/editar`} style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '0.4rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Editar Round">
                      <Edit size={14} />
                    </Link>
                    <Link href={`/admin/etapas/${id}/round/${round.id}/montagem`} className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: '#333', textDecoration: 'none' }}>Montar</Link>
                    <Link href={`/admin/execucao?roundId=${round.id}`} className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}>Notas</Link>
                    <form action={deleteRound.bind(null, round.id, etapaId)}>
                      <button type="submit" style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Excluir"><Trash2 size={16} /></button>
                    </form>
                  </div>
                </div>
              ))}
              {roundsCavalos.length === 0 && <p style={{ fontSize: '0.8rem', color: '#666' }}>Nenhum round de cavalo.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
