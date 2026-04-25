export const dynamic = "force-dynamic";
import Link from 'next/link'
import { Trophy, TrendingUp, Play, Star, Award, Zap, ChevronRight, Users, PawPrint } from 'lucide-react'
import './landing.css'
import { getTopHighlights, getCompetidorRanking, getChampionshipRanking } from '@/lib/ranking'
import { getReplayFileMap } from '@/lib/gdrive'
import { prisma } from '@/lib/db'
import { VideoPlayer } from '@/components/VideoPlayer'

export default async function Home() {
  const highlights = await getTopHighlights();
  
  // Buscar temporada ativa para os rankings da home
  const temporada = await prisma.temporada.findFirst({ where: { ativa: true } });
  const etapaAtiva = await prisma.etapa.findFirst({ where: { ativa: true }, orderBy: { id: 'desc' } });
  
  // Buscar config do Google Drive para os vídeos
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  const folderId = config?.googleDriveFolderId || null;
  
  let replayMap: Record<string, { id: string, thumb: string | null }> = {};
  if (folderId) {
    replayMap = await getReplayFileMap(folderId);
  }

  // Buscar Rankings da Home (Top 5 para ser compacto)
  const rankingEtapa = etapaAtiva ? await getCompetidorRanking('ETAPA_COMPETIDOR', 0, etapaAtiva.id, temporada?.id || 0) : null;
  const rankingChamp = temporada ? await getChampionshipRanking(temporada.id) : null;

  // Função para buscar vídeo por nome de competidor e animal
  const findVideo = (compName: string, animalName: string) => {
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const searchComp = compName ? normalize(compName) : null;
    const searchAnimal = animalName ? normalize(animalName) : null;
    
    const entry = Object.entries(replayMap).find(([name]) => {
      const upName = normalize(name);
      const matchedComp = searchComp ? upName.includes(searchComp) : true;
      const matchedAnimal = searchAnimal ? upName.includes(searchAnimal) : true;
      return (searchComp || searchAnimal) && matchedComp && matchedAnimal;
    });
    return entry ? entry[1] : null;
  };

  const highlightItems = [
    { 
      label: 'LÍDER DA ETAPA', 
      title: highlights?.etapaCompetidor?.nome || 'Nenhum competidor', 
      subtitle: highlights?.etapaNome,
      nota: highlights?.etapaCompetidor?.nota || '0.00',
      pos: '1º LUGAR',
      video: highlights?.etapaCompetidor ? findVideo(highlights.etapaCompetidor.nome, '') : null, 
      link: highlights?.etapaCompetidor ? `/competidores/${highlights.etapaCompetidor.competidorId}` : '#' 
    },
    { 
      label: 'MELHOR ANIMAL (ETAPA)', 
      title: highlights?.etapaAnimal?.nome || 'Aguardando 2ª Saída', 
      subtitle: highlights?.etapaAnimal?.info || 'Média min. 2 pulos',
      nota: highlights?.etapaAnimal?.nota || '0.00',
      pos: 'MELHOR MÉDIA',
      video: highlights?.etapaAnimal ? findVideo('', highlights.etapaAnimal.nome) : null,
      link: highlights?.etapaAnimal ? `/animais/${highlights.etapaAnimal.animalId}` : '#'
    },
    { 
      label: 'LÍDER DO CAMPEONATO', 
      title: highlights?.campeonatoCompetidor?.nome || 'Nenhum competidor', 
      subtitle: highlights?.campeonatoNome,
      nota: highlights?.campeonatoCompetidor?.nota || '0.00',
      pos: '1º LUGAR GERAL',
      video: highlights?.campeonatoCompetidor ? findVideo(highlights.campeonatoCompetidor.nome, '') : null,
      link: highlights?.campeonatoCompetidor ? `/competidores/${highlights.campeonatoCompetidor.competidorId}` : '#'
    },
    { 
      label: 'MELHOR ANIMAL (TEMPORADA)', 
      title: highlights?.campeonatoAnimal?.nome || 'Aguardando 2ª Saída', 
      subtitle: highlights?.campeonatoAnimal?.info || 'Média min. 2 pulos',
      nota: highlights?.campeonatoAnimal?.nota || '0.00',
      pos: 'RANKING GERAL',
      video: highlights?.campeonatoAnimal ? findVideo('', highlights.campeonatoAnimal.nome) : null,
      link: highlights?.campeonatoAnimal ? `/animais/${highlights.campeonatoAnimal.animalId}` : '#'
    }
  ];

  // Layout dinâmico do Page Builder
  const layout = (config?.homeLayout as any[]) || [
    { id: 'hero', type: 'HERO', visible: true },
    { id: 'highlights', type: 'HIGHLIGHTS', visible: true },
    { id: 'rankings', type: 'RANKINGS', visible: true },
    { id: 'features', type: 'FEATURES', visible: true }
  ];

  return (
    <div className="landing-body">
      <nav className="landing-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            {config?.homeHeroTitle || "Rodeio Pro"}
          </Link>
          <div className="nav-links">
            <Link href="/live">
              <TrendingUp size={18} /> AO VIVO
            </Link>
            <Link href="/ranking">
              <Trophy size={18} /> RANKINGS
            </Link>
            <Link href="/competidores">
              <Users size={18} /> COMPETIDORES
            </Link>
            <Link href="/animais">
              <PawPrint size={18} /> BOIADA
            </Link>
          </div>
        </div>
      </nav>

      {layout.filter(block => block.visible).map((block) => {
        switch (block.type) {
          case 'HERO':
            return (
              <section key={block.id} className="hero">
                <div className="hero-bg" style={{ 
                  backgroundImage: config?.homeHeroImage ? `url(${config.homeHeroImage})` : "url('/hero-rodeo.png')" 
                }}></div>
                <div className="hero-content">
                  <h1 className="hero-title">{config?.homeHeroTitle || "Rodeio Pro"}</h1>
                  <p className="hero-subtitle">
                    {config?.homeHeroSubtitle || "A plataforma definitiva para gestão de eventos, pontuações em tempo real e integração total com transmissões vMix."}
                  </p>
                  <div className="cta-group">
                    <Link href="/live" className="btn-primary" style={{ background: '#ff4444', color: '#fff' }}>
                      <TrendingUp size={20} /> ARENA AO VIVO
                    </Link>
                    <Link href="/ranking" className="btn-primary">
                      <Trophy size={20} /> VER RANKINGS
                    </Link>
                    <Link href="/admin" className="btn-secondary">
                      Acessar Painel Admin
                    </Link>
                  </div>
                </div>
              </section>
            );

          case 'HIGHLIGHTS':
            return highlights && (
              <section key={block.id} className="highlights-section">
                <div className="section-header">
                  <h2>Destaques da Arena</h2>
                </div>
                <div className="highlights-grid">
                  {highlightItems.map((item, idx) => (
                    <div key={idx} className="highlight-card">
                      <div className="card-video-wrapper">
                        {item.video?.id ? (
                          <VideoPlayer 
                            videoId={item.video.id} 
                            thumbnail={item.video.thumb}
                          />
                        ) : (
                          <div className="video-placeholder">
                            <Play size={48} />
                            <p style={{ marginTop: '10px', fontSize: '0.8rem' }}>Vídeo em processamento...</p>
                          </div>
                        )}
                      </div>
                      <div className="card-content">
                        <div className="card-badge">{item.label}</div>
                        <div className="card-subtitle">{item.subtitle}</div>
                        <h3 className="card-title">{item.title}</h3>
                        <div className="card-stats">
                          <div className="stat-item">
                            <span className="stat-value">{item.nota}</span>
                            <span className="stat-label">Pontuação</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-value" style={{ color: 'var(--primary)' }}>{item.pos}</span>
                            <span className="stat-label">Posição</span>
                          </div>
                        </div>
                        <Link href={item.link} className="btn-secondary" style={{ marginTop: '20px', display: 'inline-flex', padding: '10px 20px', fontSize: '0.9rem', width: 'auto' }}>
                          Ver Perfil Completo
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'RANKINGS':
            return (
              <section key={block.id} className="highlights-section" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '60px', padding: '60px 40px' }}>
                <div className="section-header" style={{ textAlign: 'left', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Ranking Oficial</h2>
                    <p style={{ color: '#666' }}>{(config as any)?.rankingCongelado ? 'As notas recentes estão em processo de auditoria.' : 'Acompanhe os líderes em tempo real'}</p>
                  </div>
                  {!((config as any)?.rankingCongelado) && (
                    <Link href="/ranking" className="btn-secondary" style={{ padding: '12px 24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Ver Ranking Completo <ChevronRight size={16} />
                    </Link>
                  )}
                </div>

                {((config as any)?.rankingCongelado) ? (
                    <div style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(255,200,0,0.05)', border: '1px solid rgba(255,200,0,0.2)', borderRadius: '15px' }}>
                      <Trophy size={48} color="rgba(255,200,0,0.5)" style={{ marginBottom: '20px' }} />
                      <h3 style={{ color: '#D4AF37', fontSize: '1.5rem', marginBottom: '10px' }}>APURAÇÃO EM ANDAMENTO</h3>
                      <p style={{ color: '#aaa' }}>As posições do ranking estão temporariamente ocultas até o fechamento da correção de notas.<br/>Retorne em instantes para ver a tabela oficial atualizada.</p>
                    </div>
                ) : (
                <div className="highlights-grid">
                  <div className="premium-card" style={{ padding: '20px', background: '#0a0a0a' }}>
                      <div style={{ padding: '0 10px 15px', borderBottom: '1px solid #222', marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Zap size={20} color="var(--primary)" />
                        <h3 style={{ textTransform: 'uppercase', fontSize: '1.2rem' }}>Top 5 Etapa</h3>
                      </div>
                      <div className="table-responsive-wrapper">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            {rankingEtapa?.list?.slice(0, 5).map((r: any) => (
                              <tr key={r.pos} style={{ borderBottom: '1px solid #111' }}>
                                <td style={{ padding: '12px 10px', color: r.pos <= 3 ? 'var(--primary)' : '#666', fontWeight: 'bold' }}>#{r.pos}</td>
                                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{r.nome}</td>
                                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '900', color: 'var(--primary)' }}>{r.nota}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                  </div>

                  <div className="premium-card" style={{ padding: '20px', background: '#0a0a0a' }}>
                      <div style={{ padding: '0 10px 15px', borderBottom: '1px solid #222', marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Trophy size={20} color="var(--primary)" />
                        <h3 style={{ textTransform: 'uppercase', fontSize: '1.2rem' }}>Top 5 Campeonato</h3>
                      </div>
                      <div className="table-responsive-wrapper">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            {rankingChamp?.list?.slice(0, 5).map((r: any) => (
                              <tr key={r.pos} style={{ borderBottom: '1px solid #111' }}>
                                <td style={{ padding: '12px 10px', color: r.pos <= 3 ? 'var(--primary)' : '#666', fontWeight: 'bold' }}>#{r.pos}</td>
                                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{r.nome}</td>
                                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '900', color: 'var(--primary)' }}>{r.nota}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                  </div>
                </div>
                )}
              </section>
            );

          case 'FEATURES':
            return (
              <section key={block.id} className="features">
                <div className="feature-card">
                  <div className="feature-icon">📺</div>
                  <h3>Transmissão HD</h3>
                  <p>Acompanhe cada segundo das montarias com a melhor tecnologia de replay e informações em tempo real.</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">🤠</div>
                  <h3>Elite da Arena</h3>
                  <p>Conheça os competidores e animais que desafiam a gravidade em busca do título de campeão.</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">🏆</div>
                  <h3>Resultados Oficiais</h3>
                  <p>Ranking atualizado instantaneamente para você saber quem lidera a arena a cada saída de brete.</p>
                </div>
              </section>
            );
          
          case 'INFO':
            return (
              <section key={block.id} className="highlights-section" style={{ textAlign: 'center' }}>
                 <h2 style={{ fontSize: '3rem', marginBottom: '20px' }}>Sobre o Evento</h2>
                 <p style={{ color: '#888', maxWidth: '800px', margin: '0 auto', fontSize: '1.2rem', lineHeight: '1.8' }}>
                    O {config?.homeHeroTitle || "Rodeio Pro"} é uma das maiores competições de rodeio do país, 
                    reunindo os melhores atletas e as boiadas mais temidas em uma arena de alta tecnologia.
                 </p>
              </section>
            );

          case 'SPONSORS':
             return (
               <section key={block.id} className="highlights-section" style={{ background: '#000', padding: '40px' }}>
                  <div className="section-header">
                     <h2 style={{ fontSize: '1.5rem', opacity: 0.5 }}>Patrocinadores Oficiais</h2>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', opacity: 0.3 }}>
                     {/* Placeholders para patrocinadores */}
                     <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>SPONSOR A</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>SPONSOR B</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>SPONSOR C</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>SPONSOR D</div>
                  </div>
               </section>
             );

          default:
            return null;
        }
      })}

      <footer>
        <p>&copy; 2026 {config?.homeHeroTitle || "Rodeio Pro"} - A Emoção da Arena em Tempo Real.</p>
      </footer>
    </div>
  )
}
