export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/db";
import { Trophy, User, Cat, Clock, Award } from "lucide-react";
import Link from "next/link";
import RankingFilters from "./RankingFilters";
import { getCompetidorRanking, getAnimalRanking, getChampionshipRanking } from "@/lib/ranking";
import { getSafeConfig } from "@/lib/config-safe";

interface PageProps {
  searchParams: Promise<{
    etapaId?: string;
    entity?: string;
    scope?: string;
    roundId?: string;
    modalidade?: string;
  }>;
}

export default async function PublicRankingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  try {
    // Dados base para os filtros
    const [etapas, allRounds] = await Promise.all([
      prisma.etapa.findMany({ 
        where: { ativa: true }, 
        orderBy: { dataInicio: 'desc' },
        select: { id: true, nome: true }
      }),
      prisma.round.findMany({
        orderBy: { dataAgenda: 'asc' },
        select: { id: true, numero: true, etapaId: true, modalidade: true }
      })
    ]);

    const currentEtapaId = parseInt(params.etapaId || (etapas[0]?.id?.toString() || "0"));
    const currentEntity = params.entity || 'peao';
    const currentScope = params.scope || 'campeonato';
    const modalidade = params.modalidade || 'Touro';
    
    // Buscar temporada ativa para o campeonato
    const temporada = await prisma.temporada.findFirst({ where: { ativa: true } });
    const temporadaId = temporada?.id || 1;

    let rankingResult: any = null;

    // Lógica de Busca Dinâmica
    try {
      if (currentEntity === 'peao') {
        if (currentScope === 'campeonato') {
          rankingResult = await getChampionshipRanking(temporadaId, modalidade);
        } else {
          const mode = currentScope === 'noite' ? 'NOITE_COMPETIDOR' : 'ETAPA_COMPETIDOR';
          const roundId = parseInt(params.roundId || "0");
          rankingResult = await getCompetidorRanking(mode, roundId, currentEtapaId, temporadaId, modalidade);
        }
      } else {
        const mode = currentScope === 'noite' ? 'NOITE_ANIMAL' : 
                    currentScope === 'etapa' ? 'ETAPA_ANIMAL' : 'CAMPEONATO_ANIMAL';
        const roundId = parseInt(params.roundId || "0");
        rankingResult = await getAnimalRanking(mode, roundId, currentEtapaId, temporadaId, modalidade);
      }
    } catch (err) {
      console.error("[RankingPage] Erro ao calcular ranking:", err);
      rankingResult = { title: "Ranking", list: [] };
    }

    const config = await getSafeConfig();
    const isCongelado = config?.rankingCongelado || false;

    if (isCongelado) {
      return (
        <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
            <Clock size={40} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Ranking em <span style={{color:'var(--primary)'}}>Conferência</span></h1>
          <p style={{ color: '#888', maxWidth: '500px', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Os resultados estão sendo auditados pela comissão técnica para garantir a precisão das notas. 
            <br/>Voltaremos em instantes com a classificação oficial.
          </p>
          <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#444', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Processamento de Auditoria CNAR
          </div>
        </div>
      );
    }

    const list = rankingResult?.list || [];

    return (
      <div className="fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Trophy size={48} color="var(--primary)" /> {rankingResult?.title || "Rankings"}
          </h1>
          <p style={{ color: '#888', fontSize: '1.2rem' }}>Acompanhe os resultados oficiais atualizados em tempo real.</p>
        </div>

        <RankingFilters etapas={etapas} rounds={allRounds} />

        <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(212, 175, 55, 0.05)', borderBottom: '1px solid #333', textAlign: 'left', color: 'var(--primary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1.25rem', width: '80px' }}>POS</th>
                  <th>{currentEntity === 'peao' ? 'ATLETA' : 'TOURO / CIA'}</th>
                  <th style={{ textAlign: 'center' }}>DIF.</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                    {currentScope === 'campeonato' && currentEntity === 'peao' ? 'C. PTS' : 
                    currentEntity === 'touro' ? 'MÉDIA' : 'PONTOS'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#444' }}>
                      Nenhum dado encontrado para esta seleção.
                    </td>
                  </tr>
                ) : (
                  list.map((item: any, idx: number) => (
                    <tr key={`${item.pos}-${item.nome}`} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '1.25rem', fontWeight: 'bold' }}>
                        <span style={{ color: item.pos <= 3 ? 'var(--primary)' : '#666' }}>#{item.pos}</span>
                      </td>
                      <td>
                        <Link 
                          href={currentEntity === 'peao' ? `/competidores/${item.competidorId}` : `/animais/${item.animalId}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <div style={{ fontWeight: 'bold', color: '#fff' }}>{item.nome}</div>
                        </Link>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>{item.info}</div>
                      </td>
                      <td style={{ textAlign: 'center', color: '#ff4444', fontWeight: 'bold' }}>
                        {idx === 0 ? 'LÍDER' : `-${item.diff}`}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1.25rem', fontWeight: '900', color: 'var(--primary)', fontSize: '1.2rem' }}>
                        {item.nota}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="premium-card" style={{ marginTop: '2rem', borderLeft: '3px solid var(--primary)' }}>
          <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>DICA DE COMPETIÇÃO</h4>
          <p style={{ fontSize: '0.8rem', color: '#888', lineHeight: '1.4' }}>
            O ranking de <strong>Atletas (Total)</strong> utiliza o sistema de Pontos de Liga (C.Pts), onde o desempenho em cada round e etapa se transforma em bônus acumulados. Já os rankings de <strong>Touros</strong> são baseados na média aritmética calculada pelos juízes.
          </p>
        </div>
      </div>
    );

  } catch (error) {
    console.error("[PublicRankingPage] Erro Fatal:", error);
    return (
      <div style={{ padding: '100px', textAlign: 'center', background: '#000', color: '#fff', minHeight: '100vh' }}>
         <h1 style={{ color: '#ff4444' }}>Erro ao Carregar Rankings</h1>
         <p>Não foi possível carregar os dados no momento. Por favor, tente novamente.</p>
         <Link href="/" className="btn-primary" style={{ marginTop: '2rem', display: 'inline-block' }}>Voltar para o Início</Link>
      </div>
    );
  }
}
