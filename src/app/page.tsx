export const dynamic = "force-dynamic";
import Link from 'next/link'
import { Trophy, TrendingUp, Play, Star, Award, Zap, ChevronRight, Users, PawPrint, ImageIcon } from 'lucide-react'
import './landing.css'
import { getTopHighlights, getCompetidorRanking, getChampionshipRanking } from '@/lib/ranking'
import { getReplayFileMap } from '@/lib/gdrive'
import { prisma } from '@/lib/db'
import { VideoPlayer } from '@/components/VideoPlayer'

export default async function Home() {
  const highlights = await getTopHighlights();
  
  const temporada = await prisma.temporada.findFirst({ where: { ativa: true } });
  const etapaAtiva = await prisma.etapa.findFirst({ where: { ativa: true }, orderBy: { id: 'desc' } });
  
  let config: any = null;
  try {
    config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  } catch (err) {
    console.error("Erro ao carregar config na Home:", err);
  }
  const folderId = config?.googleDriveFolderId || null;
  
  let replayMap: Record<string, { id: string, thumb: string | null }> = {};
  if (folderId) {
    replayMap = await getReplayFileMap(folderId);
  }

  const rankingEtapa = etapaAtiva ? await getCompetidorRanking('ETAPA_COMPETIDOR', 0, etapaAtiva.id, temporada?.id || 0) : null;
  const rankingChamp = temporada ? await getChampionshipRanking(temporada.id) : null;

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

  const siteLayouts = config?.siteLayouts as any;
  const homeLayoutFromSite = (siteLayouts && Array.isArray(siteLayouts.HOME)) ? siteLayouts.HOME : null;
  const legacyLayout = (Array.isArray(config?.homeLayout) && (config.homeLayout as any[]).length > 0) ? (config.homeLayout as any[]) : null;

  const layout = homeLayoutFromSite || legacyLayout || [
    { id: 'hero', type: 'HERO', visible: true },
    { id: 'highlights', type: 'HIGHLIGHTS', visible: true },
    { id: 'rankings', type: 'RANKINGS', visible: true }
  ];

  const primaryColor = config?.primaryColor || '#D4AF37';

  return (
    <div className="landing-body" style={{ fontFamily: config?.fontFamily || 'Inter' }}>
      <nav className="landing-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo" style={{ color: primaryColor }}>
            {config?.titulo || "Rodeio Pro"}
          </Link>
          <div className="nav-links">
            <Link href="/live"><TrendingUp size={18} /> AO VIVO</Link>
            <Link href="/ranking"><Trophy size={18} /> RANKINGS</Link>
            <Link href="/competidores"><Users size={18} /> COMPETIDORES</Link>
            <Link href="/animais"><PawPrint size={18} /> BOIADA</Link>
          </div>
        </div>
      </nav>

      {layout.filter(block => block.visible).map((block) => {
        const bStyle = block.style || {};
        const elements = block.elements || [];

        if (elements && elements.length > 0) {
          return (
            <section key={block.id} style={{
              height: '500px',
              background: bStyle.background || '#111',
              borderRadius: `${bStyle.borderRadius || 0}px`,
              position: 'relative',
              overflow: 'hidden',
              margin: '2rem 0'
            }}>
              {elements.map((el: any) => {
                const elStyle: React.CSSProperties = {
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  width: el.type === 'TEXT' ? 'auto' : el.w,
                  height: el.type === 'TEXT' ? 'auto' : el.h,
                  zIndex: el.zIndex || 1,
                  opacity: el.style?.opacity || 1
                };

                switch (el.type) {
                  case 'TEXT':
                    return (
                      <div key={el.id} style={{ 
                        ...elStyle, 
                        fontSize: `${el.style?.fontSize || 24}px`, 
                        fontWeight: el.style?.fontWeight || '900',
                        color: el.style?.color,
                        textAlign: el.style?.textAlign as any,
                        fontFamily: config?.fontFamily
                      }}>
                        {el.content}
                      </div>
                    );
                  case 'SHAPE_RECT':
                  case 'SHAPE_CIRCLE':
                    return (
                      <div key={el.id} style={{ 
                        ...elStyle, 
                        background: el.style?.background, 
                        borderRadius: el.style?.borderRadius 
                      }} />
                    );
                  case 'IMAGE':
                    return <img key={el.id} src={el.content} style={{ ...elStyle, objectFit: 'contain' }} alt="" />;
                  default:
                    return null;
                }
              })}
            </section>
          );
        }

        const sectionStyle: React.CSSProperties = {
          background: bStyle.background || 'transparent',
          textAlign: (bStyle.align || 'center') as any,
          borderRadius: `${bStyle.borderRadius || 0}px`,
          opacity: bStyle.opacity || 1,
          zoom: bStyle.fontScale || 1,
          position: 'relative'
        };

        switch (block.type) {
          case 'HERO':
            return (
              <section key={block.id} className="hero" style={sectionStyle}>
                <div className="hero-bg" style={{ 
                  backgroundImage: config?.homeHeroImage ? `url(${config.homeHeroImage})` : "url('/hero-rodeo.png')",
                  opacity: 0.4
                }}></div>
                <div className="hero-content" style={{ 
                  margin: bStyle.align === 'left' ? '0 auto 0 0' : (bStyle.align === 'right' ? '0 0 0 auto' : '0 auto'),
                }}>
                  <h1 className="hero-title" style={{ color: '#fff' }}>{block.title}</h1>
                  <p className="hero-subtitle" style={{ color: bStyle.accent || primaryColor }}>{block.subtitle}</p>
                  <div className="cta-group" style={{ justifyContent: bStyle.align === 'left' ? 'flex-start' : (bStyle.align === 'right' ? 'flex-end' : 'center') }}>
                    <Link href="/live" className="btn-primary" style={{ background: '#ff4444', color: '#fff' }}><TrendingUp size={20} /> AO VIVO</Link>
                    <Link href="/ranking" className="btn-primary"><Trophy size={20} /> RANKINGS</Link>
                  </div>
                </div>
              </section>
            );

          case 'HIGHLIGHTS':
            return highlights && (
              <section key={block.id} className="highlights-section" style={sectionStyle}>
                <div className="section-header" style={{ textAlign: bStyle.align || 'left' }}>
                  <h2 style={{ fontSize: '2.5rem' }}>{block.title}</h2>
                  <p style={{ color: bStyle.accent || primaryColor, fontWeight: 'bold' }}>{block.subtitle}</p>
                </div>
                <div className="highlights-grid">
                  {highlightItems.map((item, idx) => (
                    <div key={idx} className="highlight-card" style={{ borderRadius: `${bStyle.borderRadius || 12}px` }}>
                      <div className="card-video-wrapper">{item.video?.id ? <VideoPlayer videoId={item.video.id} thumbnail={item.video.thumb}/> : <div className="video-placeholder"><Play size={48} /></div>}</div>
                      <div className="card-content">
                        <div className="card-badge" style={{ background: bStyle.accent || primaryColor }}>{item.label}</div>
                        <h3 className="card-title">{item.title}</h3>
                        <div className="card-stats">
                           <div className="stat-item"><span className="stat-value">{item.nota}</span></div>
                           <div className="stat-item"><span className="stat-value" style={{ color: bStyle.accent || primaryColor }}>{item.pos}</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'RANKINGS':
            return (
              <section key={block.id} className="highlights-section" style={{ ...sectionStyle, background: bStyle.background || 'rgba(255,255,255,0.02)', borderRadius: `${bStyle.borderRadius || 60}px`, padding: '60px 40px' }}>
                <div className="section-header" style={{ textAlign: bStyle.align || 'left', marginBottom: '40px', display: 'flex', flexDirection: bStyle.align === 'center' ? 'column' : 'row', justifyContent: 'space-between', alignItems: bStyle.align === 'center' ? 'center' : 'flex-end' }}>
                  <div><h2 style={{ fontSize: '2.5rem' }}>{block.title}</h2><p style={{ color: bStyle.accent || primaryColor }}>{block.subtitle}</p></div>
                  {!((config as any)?.rankingCongelado) && <Link href="/ranking" className="btn-secondary">Ver Tudo <ChevronRight size={16} /></Link>}
                </div>
                <div className="highlights-grid">
                  <div className="premium-card" style={{ padding: '20px', background: '#0a0a0a', borderRadius: `${(bStyle.borderRadius || 12) / 2}px` }}>
                      <div style={{ borderBottom: '1px solid #222', marginBottom: '15px', display: 'flex', gap: '10px' }}><Zap size={20} color={primaryColor} /><h3 style={{ textTransform: 'uppercase' }}>Etapa</h3></div>
                      <table style={{ width: '100%' }}><tbody>{rankingEtapa?.list?.slice(0, 5).map((r: any) => (<tr key={r.pos}><td style={{ color: r.pos <= 3 ? primaryColor : '#666' }}>#{r.pos}</td><td>{r.nome}</td><td style={{ textAlign: 'right', color: primaryColor }}>{r.nota}</td></tr>))}</tbody></table>
                  </div>
                  <div className="premium-card" style={{ padding: '20px', background: '#0a0a0a', borderRadius: `${(bStyle.borderRadius || 12) / 2}px` }}>
                      <div style={{ borderBottom: '1px solid #222', marginBottom: '15px', display: 'flex', gap: '10px' }}><Trophy size={20} color={primaryColor} /><h3 style={{ textTransform: 'uppercase' }}>Campeonato</h3></div>
                      <table style={{ width: '100%' }}><tbody>{rankingChamp?.list?.slice(0, 5).map((r: any) => (<tr key={r.pos}><td style={{ color: r.pos <= 3 ? primaryColor : '#666' }}>#{r.pos}</td><td>{r.nome}</td><td style={{ textAlign: 'right', color: primaryColor }}>{r.nota}</td></tr>))}</tbody></table>
                  </div>
                </div>
              </section>
            );

          case 'SPONSORS':
             return (
               <section key={block.id} className="highlights-section" style={{ ...sectionStyle, background: bStyle.background || '#000' }}>
                  <div className="section-header"><h2>{block.title}</h2><p>{block.subtitle}</p></div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', opacity: 0.3, marginTop: '2rem' }}>
                     <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>SPONSOR A</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>SPONSOR B</div>
                  </div>
               </section>
             );

          case 'GALLERY':
            return (
              <section key={block.id} className="highlights-section" style={sectionStyle}>
                <div className="section-header"><h2>{block.title}</h2><p style={{ color: bStyle.accent || primaryColor }}>{block.subtitle}</p></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                  {[1,2,3,4,5,6].map(i => (<div key={i} style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.02)', borderRadius: `${(bStyle.borderRadius || 15)}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={32} color="#222" /></div>))}
                </div>
              </section>
            );

          case 'COUNTDOWN':
            return (
              <section key={block.id} className="highlights-section" style={sectionStyle}>
                <div className="section-header"><h2>{block.title}</h2><p style={{ color: bStyle.accent || primaryColor }}>{block.subtitle}</p></div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem' }}>
                  {[ {l: 'DIAS', v: '02'}, {l: 'HORAS', v: '14'}, {l: 'MIN', v: '35'}, {l: 'SEG', v: '10'} ].map((t, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '3.5rem', fontWeight: '900', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: `${(bStyle.borderRadius || 15)}px` }}>{t.v}</div>
                      <span style={{ fontSize: '0.75rem', color: bStyle.accent || primaryColor, marginTop: '10px' }}>{t.l}</span>
                    </div>
                  ))}
                </div>
              </section>
            );

          default: return null;
        }
      })}

      <footer style={{ background: '#050505', padding: '40px', textAlign: 'center', borderTop: '1px solid #111' }}>
        <p style={{ color: '#444' }}>&copy; 2026 {config?.titulo || "Rodeio Pro"} - Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
