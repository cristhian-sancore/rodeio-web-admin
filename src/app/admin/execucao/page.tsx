import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { 
  Save, LayoutGrid, User as UserIcon, Cat, Clock, 
  AlertTriangle, Lock, ArrowRight, Calendar, BookmarkCheck,
  Search, CheckCircle2, Timer, Trophy
} from "lucide-react";
import Link from "next/link";
import { updateMontariaNota, updateRankingMode, updateRankingPage } from "../etapas/actions";
import SumulaList from "./SumulaList";
import { getCompetidorStageRank, getOverlayRankingData } from "@/lib/ranking";
import { getSafeConfig } from "@/lib/config-safe";
import RideTimer from "./RideTimer";
import JuizStatusPanel from "./JuizStatusPanel";

export default async function ExecucaoPage({ searchParams }: { searchParams: Promise<{ roundId?: string, montariaId?: string, error?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { roundId, montariaId, error } = await searchParams;
  const user = session.user as any;
  const isAdmin = user.role === 'ADMIN';

  if (user.role === 'COMENTARISTA') redirect('/admin');

  // --- SELEÇÃO DE ROUND ---
  if (!roundId) {
    const etapas = await (prisma as any).etapa.findMany({
      where: { ativa: true },
      include: {
        rounds: {
          orderBy: { numero: 'asc' },
          include: { _count: { select: { montarias: true } } }
        }
      },
      orderBy: { dataInicio: 'desc' }
    });

    const now = new Date();
    // Se for antes das 6 da manhã, ainda consideramos o "dia operacional" de ontem
    const operationalDate = new Date(now);
    if (now.getHours() < 6) {
      operationalDate.setDate(operationalDate.getDate() - 1);
    }
    const todayStr = operationalDate.toISOString().split('T')[0];

    // Se for Juiz, filtrar apenas rounds ativos para hoje (considerando a margem até 6h)
    const etapasFiltradas = isAdmin ? etapas : etapas.map((etapa: any) => ({
      ...etapa,
      rounds: etapa.rounds.filter((r: any) => {
        if (!r.dataAgenda) return false;
        const roundDateStr = r.dataAgenda.toISOString().split('T')[0];
        return roundDateStr === todayStr;
      })
    })).filter((etapa: any) => etapa.rounds.length > 0);

    return (
      <div className="fade-in">
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.8rem', color: 'var(--primary)' }}>Célula de Lançamento em Tempo Real</h1>
        <p style={{ color: '#888', marginBottom: '2.5rem' }}>{isAdmin ? 'O rodeio é dinâmico. Selecione o Round para acessar a súmula de campo.' : 'Painel do Juiz: Lançamento de notas para os rounds de hoje.'}</p>
        
        <div className="responsive-grid">
          {etapasFiltradas.map((etapa: any) => (
            <div key={etapa.id} className="premium-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '42px', height: '42px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} color="var(--primary)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{etapa.nome}</h2>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>{etapa.cidade} - {etapa.estado}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {etapa.rounds.map((round: any) => (
                  <Link 
                    key={round.id} 
                    href={`/admin/execucao?roundId=${round.id}`} 
                    className="premium-card" 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      textDecoration: 'none', 
                      background: '#151515', 
                      padding: '1rem',
                      border: '1px solid #222'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>ROUND {round.numero}</h4>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{round._count.montarias} montarias escaladas</p>
                    </div>
                    <ArrowRight size={18} color="var(--primary)" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rId = roundId ? parseInt(roundId) : NaN;
  if (isNaN(rId)) return <div>Round inválido.</div>;

  const round = await (prisma as any).round.findUnique({
    where: { id: rId },
    include: { 
      etapa: true,
      juiz1: true,
      juiz2: true,
      juiz3: true,
      juiz4: true
    }
  });

  if (!round) return <div>Round não encontrado.</div>;

  // --- BUSCA DE DADOS ---
  const [juizes, montarias] = await Promise.all([
    (prisma as any).juiz.findMany({ orderBy: { nome: 'asc' } }),
    (prisma as any).montaria.findMany({
      where: { roundId: rId },
      orderBy: [
        { notaTotal: 'asc' }, // Montarias sem nota primeiro
        { dataHora: 'desc' }
      ],
      include: { competidor: true, animal: true }
    })
  ]);

  const selectedMontaria = montariaId ? montarias.find((m: any) => m.id === parseInt(montariaId)) : null;

  const config = await getSafeConfig() || { numJuizes: 2, rankingMode: 'OFF', rankingPage: 0 };
  const numJuizes = config.numJuizes;

  const isJ1 = isAdmin || (user.juizId && round.juiz1Id === user.juizId);
  const isJ2 = (numJuizes >= 2) && (isAdmin || (user.juizId && round.juiz2Id === user.juizId));
  const isJ3 = (numJuizes >= 4) && (isAdmin || (user.juizId && round.juiz3Id === user.juizId));
  const isJ4 = (numJuizes >= 4) && (isAdmin || (user.juizId && round.juiz4Id === user.juizId));

  // Cálculo de Ranking Dinâmico para a Cédula
  let currentRankText = "---";
  if (selectedMontaria) {
    const rankData = await getCompetidorStageRank(round.etapaId, selectedMontaria.competidorId);
    currentRankText = rankData.rank > 0 ? `${rankData.rank}º` : "---";
  }

  // Ação agora importada de "../etapas/actions"

  return (
    <div className="fade-in">
      {/* Top Banner */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#fff' }}>Lançamento de Campo: <span style={{color:'var(--primary)'}}>Round {round.numero}</span></h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>{round.etapa.nome} • Busque o peão na súmula abaixo para pontuar.</p>
        </div>
      </div>

      {/* CONTROLE DE RANKING NO OVERLAY */}
      <div className="premium-card" style={{ marginBottom: '2rem', background: '#111', borderColor: config.rankingMode !== 'OFF' ? 'var(--primary)' : '#222' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Trophy size={20} color={config.rankingMode !== 'OFF' ? 'var(--primary)' : '#666'} />
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Controle de Ranking no Overlay</h3>
          {config.rankingMode !== 'OFF' && (
            <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              ATIVO: {config.rankingMode}
            </span>
          )}
        </div>
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* LINHA 1: PEÃO */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#666', width: '60px' }}>PEÃO:</span>
            <button formAction={async () => { 'use server'; await updateRankingMode('NOITE_COMPETIDOR'); }} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'NOITE_COMPETIDOR' ? 'var(--primary)' : '#222', color: config.rankingMode === 'NOITE_COMPETIDOR' ? '#000' : '#fff' }}>
              Noite
            </button>
            <button formAction={async () => { 'use server'; await updateRankingMode('ETAPA_COMPETIDOR'); }} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'ETAPA_COMPETIDOR' ? 'var(--primary)' : '#222', color: config.rankingMode === 'ETAPA_COMPETIDOR' ? '#000' : '#fff' }}>
              Etapa
            </button>
            <button formAction={async () => { 'use server'; await updateRankingMode('CAMPEONATO_COMPETIDOR'); }} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'CAMPEONATO_COMPETIDOR' ? 'var(--primary)' : '#222', color: config.rankingMode === 'CAMPEONATO_COMPETIDOR' ? '#000' : '#fff' }}>
              Campeonato
            </button>
          </div>

          {/* LINHA 2: TOURO */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#666', width: '60px' }}>TOURO:</span>
            <button formAction={async () => { 'use server'; await updateRankingMode('NOITE_ANIMAL'); }} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'NOITE_ANIMAL' ? '#ff4444' : '#222', color: '#fff' }}>
              Noite
            </button>
            <button formAction={async () => { 'use server'; await updateRankingMode('ETAPA_ANIMAL'); }} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'ETAPA_ANIMAL' ? '#ff4444' : '#222', color: '#fff' }}>
              Etapa
            </button>
            <button formAction={async () => { 'use server'; await updateRankingMode('CAMPEONATO_ANIMAL'); }} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'CAMPEONATO_ANIMAL' ? '#ff4444' : '#222', color: '#fff' }}>
              Campeonato
            </button>
          </div>

          {/* LINHA 3: BOIADA */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#666', width: '60px' }}>BOIADA:</span>
            <button formAction={async () => { 'use server'; await updateRankingMode('NOITE_BOIADA'); }} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'NOITE_BOIADA' ? '#ff4444' : '#222', color: '#fff' }}>
              Noite
            </button>
            <button formAction={async () => { 'use server'; await updateRankingMode('ETAPA_BOIADA'); }} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'ETAPA_BOIADA' ? '#ff4444' : '#222', color: '#fff' }}>
              Etapa
            </button>
            <button formAction={async () => { 'use server'; await updateRankingMode('CAMPEONATO_BOIADA'); }} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'CAMPEONATO_BOIADA' ? '#ff4444' : '#222', color: '#fff' }}>
              Campeonato
            </button>
          </div>
          
          <div style={{ height: '1px', background: '#333', margin: '5px 0' }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
            {/* CONTROLE DE PAGINAÇÃO MANUAL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#000', padding: '5px 15px', borderRadius: '8px', border: '1px solid #333' }}>
              <button formAction={async () => { 'use server'; await updateRankingPage(-1); }} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>◄ Anterior</button>
              <div style={{ textAlign: 'center', minWidth: '80px' }}>
                 <div style={{ fontSize: '0.6rem', color: '#666' }}>PÁGINA</div>
                 <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{((config as any).rankingPage || 0) + 1}</div>
              </div>
              <button formAction={async () => { 'use server'; await updateRankingPage(1); }} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Próxima ►</button>
            </div>

            <button formAction={async () => { 'use server'; await updateRankingMode('OFF'); }} className="btn-secondary" style={{ minWidth: '120px', background: '#000', color: '#666', border: '1px dashed #444' }}>
              LIMPAR OVERLAY
            </button>
          </div>
        </form>
      </div>

      {error === 'SEM_RESERVA' && (
        <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '1rem', borderRadius: '8px', border: '1px solid currentColor', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={20} />
          <span><b>Erro:</b> O Repasse não pôde ser ativado pois o Curral de Reservas deste round está vazio. Adicione um animal na tela de Súmulas.</span>
        </div>
      )}

      <div className="performance-grid">
        
        {/* COLUNA 1: SÚMULA DE CAMPO (LISTA RÁPIDA) */}
        <div className="sumula-column">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={20} color="var(--primary)" /> Súmula Escalada
          </h3>
          <SumulaList montarias={montarias} roundId={rId} selectedId={selectedMontaria?.id} />
        </div>

        {/* COLUNA 2: CÉDULA DE PONTUAÇÃO (FORMULÁRIO DINÂMICO) */}
        <div>
          {selectedMontaria ? (
            <div className="premium-card fade-in" style={{ borderColor: 'var(--primary)' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '2rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <BookmarkCheck size={26} /> Cédula de Pontuação
              </h2>

              <JuizStatusPanel montariaId={selectedMontaria.id} numJuizes={numJuizes} />

              <form key={selectedMontaria.id} action={updateMontariaNota}>
                <input type="hidden" name="montariaId" value={selectedMontaria.id} />
                
                {/* Visual Peão vs Touro */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', background: '#121212', borderRadius: '12px', border: '1px solid #222' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', fontWeight: 'bold' }}>Peão Selecionado</span>
                    <h3 style={{ margin: '5px 0 0', color: '#fff' }}>{selectedMontaria.competidor.nome}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Ranking atual na Etapa: <strong style={{color:'var(--primary)'}}>{currentRankText}</strong></p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '1.2rem', fontWeight: '900' }}>VS</div>
                  <div style={{ flex: 1, minWidth: '200px', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', fontWeight: 'bold' }}>Animal Escalado</span>
                    <h3 style={{ margin: '5px 0 0', color: 'var(--primary)' }}>{selectedMontaria.animal.nome}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cia: {selectedMontaria.animal.companhia}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem' }}>Sistema de Arbitragem</label>
                    <div style={{ padding: '0.75rem', background: '#222', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', border: '1px solid #333' }}>
                      {numJuizes} Juiz(es) - Max {config.notaMaxima} Pts
                    </div>
                    <input type="hidden" name="numJuizes" value={numJuizes} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem' }}>Tempo de Prova</label>
                    <RideTimer initialValue={selectedMontaria.tempo || 0} />
                  </div>
                </div>

                <div className="responsive-grid" style={{ marginBottom: '2.5rem' }}>
                  {[1, 2, 3, 4].map(num => {
                    // Só mostra o juiz se ele estiver configurado para a etapa
                    if (num > numJuizes && numJuizes !== 3) return null; 
                    if (numJuizes === 3 && num > 3) return null; // Suporte para 3 juízes se necessário

                    const canEdit = (num === 1 && isJ1) || (num === 2 && isJ2) || (num === 3 && isJ3) || (num === 4 && isJ4);
                    const valP = (selectedMontaria as any)[`j${num}Peao`];
                    const valA = (selectedMontaria as any)[`j${num}Animal`];
                    return (
                      <div key={num} className="premium-card" style={{ padding: '1rem', background: canEdit ? 'rgba(212, 175, 55, 0.03)' : '#121212', border: canEdit ? '1.5px solid var(--primary)' : '1px solid #1a1a1a', opacity: canEdit ? 1 : 0.4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '900', color: canEdit ? 'var(--primary)' : '#444' }}>
                            {num === 1 ? (round.juiz1?.nome || 'JUIZ 1') : 
                             num === 2 ? (round.juiz2?.nome || 'JUIZ 2') : 
                             num === 3 ? (round.juiz3?.nome || 'JUIZ 3') : 
                             (round.juiz4?.nome || 'JUIZ 4')}
                          </span>
                          {!canEdit && <Lock size={14} color="#333" />}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 5px 0', fontSize: '0.6rem', color: '#555', textAlign: 'center', fontWeight: 'bold' }}>TECNICA PEÃO</p>
                            <input name={`j${num}Peao`} type="number" step="0.25" min="0" max="25" defaultValue={valP || ''} readOnly={!canEdit} style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: '900', background: '#000 !important' }} placeholder="0" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 5px 0', fontSize: '0.6rem', color: '#555', textAlign: 'center', fontWeight: 'bold' }}>FORÇA ANIMAL</p>
                            <input name={`j${num}Animal`} type="number" step="0.25" min="0" max="25" defaultValue={valA || ''} readOnly={!canEdit} style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: '900', background: '#000 !important' }} placeholder="0" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ padding: '1rem', background: 'rgba(255, 68, 68, 0.05)', borderRadius: '10px', border: '1px solid rgba(255, 68, 68, 0.2)', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <input type="checkbox" name="desclassificado" id="des" defaultChecked={selectedMontaria.desclassificado} style={{ width: '20px', height: '20px' }} />
                    <label htmlFor="des" style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={18} /> DESCLASSIFICAÇÃO / ZERO NOTA
                    </label>
                  </div>
                  <input name="motivo" type="text" defaultValue={selectedMontaria.motivo || ''} placeholder="Motivo (ex: Toque com mão livre)" style={{ background: '#111 !important', fontSize: '0.8rem' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1.5rem', fontSize: '1.1rem' }}>
                    <Save size={24} /> GRAVAR NOTA OFICIAL
                  </button>
                  <button formAction={async () => { 'use server'; const { applyRepasse } = await import('../etapas/actions'); await applyRepasse(selectedMontaria.id, rId); }} className="btn-primary" style={{ flex: 1, padding: '1.5rem', fontSize: '1.1rem', background: 'transparent', border: '2px solid #ff4444', color: '#ff4444' }}>
                    🔄 DAR REPASSE (TROCAR ANIMAL)
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #222', borderRadius: '15px', color: '#444' }}>
              <Search size={48} style={{ marginBottom: '1rem' }} />
              <h3>Aguardando seleção...</h3>
              <p style={{ fontSize: '0.85rem' }}>Clique em um peão na súmula ao lado para abrir a cédula de notas.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
