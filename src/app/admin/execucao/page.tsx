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
import { 
  updateMontariaNota, 
  updateRankingMode, 
  updateRankingPage, 
  updateOverlayMode,
  updateRankingCongelado
} from "../etapas/actions";
import SumulaList from "./SumulaList";
import { getCompetidorStageRank, getOverlayRankingData } from "@/lib/ranking";
import { getSafeConfig } from "@/lib/config-safe";
import RideTimer from "./RideTimer";
import JuizStatusPanel from "./JuizStatusPanel";
import ScoringForm from "./ScoringForm";

export const dynamic = 'force-dynamic';

export default async function ExecucaoPage({ searchParams }: { searchParams: Promise<{ roundId?: string, montariaId?: string, error?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { roundId, montariaId, error } = await searchParams;
  const user = session.user as any;
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

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
      where: { roundId: rId, removida: false },
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
        
        {/* MODO MANUAL / AUDITORIA */}
        <form style={{ display: 'flex', background: '#111', padding: '10px 15px', borderRadius: '8px', border: `1px solid ${(config as any).rankingCongelado ? '#ff4444' : '#333'}`, alignItems: 'center', gap: '15px' }}>
            <div>
               <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: (config as any).rankingCongelado ? '#ff4444' : '#888', textTransform: 'uppercase' }}>
                  Auditoria de Ranking
               </div>
               <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                  {(config as any).rankingCongelado ? 'Modo Manual Ativo (Paralisado)' : 'Modo Automático (Público Online)'}
               </div>
            </div>
            
            {(config as any).rankingCongelado ? (
                <button formAction={updateRankingCongelado.bind(null, false)} className="btn-secondary" style={{ background: '#222', color: '#fff' }}>
                   Restaurar Auto
                </button>
            ) : (
                <button formAction={updateRankingCongelado.bind(null, true)} className="btn-primary" style={{ background: '#ff4444', color: '#fff' }}>
                   Congelar Site & Overlay
                </button>
            )}
        </form>
      </div>

      {/* CONTROLE DE VISUALIZAÇÃO DO PEÃO (CHAMADA) */}
      <div className="premium-card" style={{ marginBottom: '2rem', background: '#0a0a0a', border: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <UserIcon size={20} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Formato da Chamada (VMIX)</h3>
        </div>
        
        <form style={{ display: 'flex', gap: '1rem' }}>
          <button 
            formAction={updateOverlayMode.bind(null, 'ID')} 
            className="btn-secondary" 
            style={{ 
              flex: 1, 
              background: config.overlayMode === 'ID' ? 'var(--primary)' : '#111', 
              color: config.overlayMode === 'ID' ? '#000' : '#fff',
              border: '1px solid #333',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <span style={{ fontWeight: 'bold' }}>IDENTIFICAÇÃO</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>RODAPÉ (LOWER THIRD)</span>
          </button>
 
          <button 
            formAction={updateOverlayMode.bind(null, 'CHAMADA')} 
            className="btn-secondary" 
            style={{ 
              flex: 1, 
              background: config.overlayMode === 'CHAMADA' ? 'var(--primary)' : '#111', 
              color: config.overlayMode === 'CHAMADA' ? '#000' : '#fff',
              border: '1px solid #333',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <span style={{ fontWeight: 'bold' }}>CHAMADA DE GALA</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>TELA CHEIA + ESTATÍSTICAS</span>
          </button>
        </form>
      </div>

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
            <button formAction={updateRankingMode.bind(null, 'NOITE_COMPETIDOR')} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'NOITE_COMPETIDOR' ? 'var(--primary)' : '#222', color: config.rankingMode === 'NOITE_COMPETIDOR' ? '#000' : '#fff' }}>
              Noite
            </button>
            <button formAction={updateRankingMode.bind(null, 'ETAPA_COMPETIDOR')} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'ETAPA_COMPETIDOR' ? 'var(--primary)' : '#222', color: config.rankingMode === 'ETAPA_COMPETIDOR' ? '#000' : '#fff' }}>
              Etapa
            </button>
            <button formAction={updateRankingMode.bind(null, 'CAMPEONATO_COMPETIDOR')} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'CAMPEONATO_COMPETIDOR' ? 'var(--primary)' : '#222', color: config.rankingMode === 'CAMPEONATO_COMPETIDOR' ? '#000' : '#fff' }}>
              Campeonato
            </button>
          </div>

          {/* LINHA 2: TOURO */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#666', width: '60px' }}>TOURO:</span>
            <button formAction={updateRankingMode.bind(null, 'NOITE_ANIMAL')} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'NOITE_ANIMAL' ? '#ff4444' : '#222', color: '#fff' }}>
              Noite
            </button>
            <button formAction={updateRankingMode.bind(null, 'ETAPA_ANIMAL')} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'ETAPA_ANIMAL' ? '#ff4444' : '#222', color: '#fff' }}>
              Etapa
            </button>
            <button formAction={updateRankingMode.bind(null, 'CAMPEONATO_ANIMAL')} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'CAMPEONATO_ANIMAL' ? '#ff4444' : '#222', color: '#fff' }}>
              Campeonato
            </button>
          </div>

          {/* LINHA 3: BOIADA */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#666', width: '60px' }}>BOIADA:</span>
            <button formAction={updateRankingMode.bind(null, 'NOITE_BOIADA')} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'NOITE_BOIADA' ? '#ff4444' : '#222', color: '#fff' }}>
              Noite
            </button>
            <button formAction={updateRankingMode.bind(null, 'ETAPA_BOIADA')} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'ETAPA_BOIADA' ? '#ff4444' : '#222', color: '#fff' }}>
              Etapa
            </button>
            <button formAction={updateRankingMode.bind(null, 'CAMPEONATO_BOIADA')} className="btn-secondary" style={{ flex: 1, minWidth: '140px', background: config.rankingMode === 'CAMPEONATO_BOIADA' ? '#ff4444' : '#222', color: '#fff' }}>
              Campeonato
            </button>
          </div>
          
          <div style={{ height: '1px', background: '#333', margin: '5px 0' }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
            {/* CONTROLE DE PAGINAÇÃO MANUAL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#000', padding: '5px 15px', borderRadius: '8px', border: '1px solid #333' }}>
              <button formAction={updateRankingPage.bind(null, -1)} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>◄ Anterior</button>
              <div style={{ textAlign: 'center', minWidth: '80px' }}>
                 <div style={{ fontSize: '0.6rem', color: '#666' }}>PÁGINA</div>
                 <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{((config as any).rankingPage || 0) + 1}</div>
              </div>
              <button formAction={updateRankingPage.bind(null, 1)} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Próxima ►</button>
            </div>

            <button formAction={updateRankingMode.bind(null, 'OFF')} className="btn-secondary" style={{ minWidth: '120px', background: '#000', color: '#666', border: '1px dashed #444' }}>
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

              <ScoringForm 
                montaria={selectedMontaria}
                round={round}
                numJuizes={numJuizes}
                notaMaxima={config.notaMaxima || 100}
                currentRankText={currentRankText}
                isAdmin={isAdmin}
                user={user}
              />
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
