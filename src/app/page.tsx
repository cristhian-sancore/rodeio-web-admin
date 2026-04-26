export const dynamic = "force-dynamic";
import Link from 'next/link'
import { Trophy, TrendingUp, Play, Star, Award, Zap, ChevronRight, Users, PawPrint, ImageIcon, Layout } from 'lucide-react'
import './landing.css'
import { getTopHighlights, getCompetidorRanking, getChampionshipRanking } from '@/lib/ranking'
import { getReplayFileMap } from '@/lib/gdrive'
import { prisma } from '@/lib/db'
import { VideoPlayer } from '@/components/VideoPlayer'
import { NavbarPublic } from '@/components/NavbarPublic'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER' || session?.user?.role === 'SUPER_ADMIN';
  
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
    
    const checkMatch = (searchStr: string | null, targetStr: string) => {
      if (!searchStr) return true;
      const words = searchStr.split(' ').filter(w => w.length > 2);
      if (words.length >= 2) {
         return targetStr.includes(words[0]) && targetStr.includes(words[1]);
      }
      return targetStr.includes(searchStr);
    };

    const entry = Object.entries(replayMap).find(([name]) => {
      const upName = normalize(name);
      const matchedComp = checkMatch(searchComp, upName);
      const matchedAnimal = checkMatch(searchAnimal, upName);
      return (searchComp || searchAnimal) && matchedComp && matchedAnimal;
    });
    return entry ? entry[1] : null;
  };

  const roundAtivo = etapaAtiva ? await prisma.round.findFirst({ where: { etapaId: etapaAtiva.id, aberto: true } }) : null;
  const rankingNoite = roundAtivo ? await getCompetidorRanking('NOITE_COMPETIDOR', roundAtivo.id, etapaAtiva?.id, temporada?.id) : null;
  const rankingNoiteAnimal = roundAtivo ? await getAnimalRanking('NOITE_ANIMAL', roundAtivo.id, etapaAtiva?.id, temporada?.id) : null;
  const melhorNoiteComp = rankingNoite?.list?.[0];
  const melhorNoiteAni = rankingNoiteAnimal?.list?.[0];

  const highlightItemsMap: Record<string, any> = {
    'LIDER_ETAPA': { 
      label: 'LÍDER DA ETAPA', title: highlights?.etapaCompetidor?.nome || 'Nenhum competidor', 
      subtitle: highlights?.etapaNome, nota: highlights?.etapaCompetidor?.nota || '0.00', pos: '1º LUGAR',
      video: highlights?.etapaCompetidor ? findVideo(highlights.etapaCompetidor.nome, '') : null, 
      link: highlights?.etapaCompetidor ? `/competidores/${highlights.etapaCompetidor.competidorId}` : '#' 
    },
    'ANIMAL_ETAPA': { 
      label: 'MELHOR ANIMAL (ETAPA)', title: highlights?.etapaAnimal?.nome || 'Aguardando', 
      subtitle: highlights?.etapaAnimal?.info || 'Média min. 2 pulos', nota: highlights?.etapaAnimal?.nota || '0.00', pos: 'MELHOR MÉDIA',
      video: highlights?.etapaAnimal ? findVideo('', highlights.etapaAnimal.nome) : null,
      link: highlights?.etapaAnimal ? `/animais/${highlights.etapaAnimal.animalId}` : '#'
    },
    'CAMPEAO_TEMP': { 
      label: 'LÍDER DO CAMPEONATO', title: highlights?.campeonatoCompetidor?.nome || 'Nenhum competidor', 
      subtitle: highlights?.campeonatoNome, nota: highlights?.campeonatoCompetidor?.nota || '0.00', pos: '1º LUGAR GERAL',
      video: highlights?.campeonatoCompetidor ? findVideo(highlights.campeonatoCompetidor.nome, '') : null,
      link: highlights?.campeonatoCompetidor ? `/competidores/${highlights.campeonatoCompetidor.competidorId}` : '#'
    },
    'ANIMAL_TEMP': { 
      label: 'MELHOR ANIMAL (TEMPORADA)', title: highlights?.campeonatoAnimal?.nome || 'Aguardando', 
      subtitle: highlights?.campeonatoAnimal?.info || 'Média min. 2 pulos', nota: highlights?.campeonatoAnimal?.nota || '0.00', pos: 'RANKING GERAL',
      video: highlights?.campeonatoAnimal ? findVideo('', highlights.campeonatoAnimal.nome) : null,
      link: highlights?.campeonatoAnimal ? `/animais/${highlights.campeonatoAnimal.animalId}` : '#'
    },
    'MELHOR_NOITE_COMP': {
      label: 'MELHOR DA NOITE', title: melhorNoiteComp?.nome || 'Nenhum competidor', 
      subtitle: roundAtivo?.nome || 'Round Atual', nota: melhorNoiteComp?.nota || '0.00', pos: '1º LUGAR (NOITE)',
      video: melhorNoiteComp ? findVideo(melhorNoiteComp.nome, '') : null,
      link: melhorNoiteComp ? `/competidores/${melhorNoiteComp.competidorId}` : '#'
    },
    'MELHOR_NOITE_ANIMAL': {
      label: 'MELHOR TOURO DA NOITE', title: melhorNoiteAni?.nome || 'Aguardando', 
      subtitle: roundAtivo?.nome || 'Round Atual', nota: melhorNoiteAni?.nota || '0.00', pos: 'MELHOR MÉDIA (NOITE)',
      video: melhorNoiteAni ? findVideo('', melhorNoiteAni.nome) : null,
      link: melhorNoiteAni ? `/animais/${melhorNoiteAni.animalId}` : '#'
    }
  };

  const highlightItems = [highlightItemsMap['LIDER_ETAPA'], highlightItemsMap['ANIMAL_ETAPA'], highlightItemsMap['CAMPEAO_TEMP'], highlightItemsMap['ANIMAL_TEMP']];

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
      <NavbarPublic />

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
                  case 'BUTTON':
                    return (
                      <Link key={el.id} href={el.style?.link || '#'} style={{ 
                        ...elStyle,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: el.style?.background || '#ff4444', 
                        color: el.style?.color || '#fff', borderRadius: el.style?.borderRadius || '8px',
                        fontWeight: el.style?.fontWeight || 'bold', fontSize: `${el.style?.fontSize || 16}px`,
                        textDecoration: 'none', cursor: 'pointer'
                      }}>
                        {el.content}
                      </Link>
                    );
                  case 'DYNAMIC_CARD': {
                    const cardData = highlightItemsMap[el.content || 'LIDER_ETAPA'];
                    if (!cardData) return null;
                    return (
                      <div key={el.id} style={{ ...elStyle, display: 'flex', flexDirection: 'column' }}>
                        <Link href={cardData.link} style={{ display: 'block', textDecoration: 'none', background: '#111', borderRadius: '15px', overflow: 'hidden', height: '100%', border: '1px solid #222', transition: 'all 0.3s' }}>
                          <div style={{ height: '70%', background: '#050505', position: 'relative' }}>
                             {cardData.video ? (
                                <video src={`/api/replays/local/${cardData.video.id}.mp4`} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                             ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}><Play size={48} color="#fff" /></div>
                             )}
                             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, #111, transparent)' }} />
                          </div>
                          <div style={{ padding: '20px', height: '30%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 10, position: 'relative', marginTop: '-40px' }}>
                            <div style={{ display: 'inline-block', background: primaryColor, color: '#000', padding: '5px 15px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 900, marginBottom: '10px', alignSelf: 'flex-start' }}>{cardData.label}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 1.1 }}>{cardData.title}</div>
                            <div style={{ color: primaryColor, fontSize: '0.85rem', fontWeight: 800, marginTop: '8px', display: 'flex', gap: '10px' }}>
                               <span>{cardData.nota}</span>
                               <span style={{ color: '#666' }}>{cardData.pos}</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  }
                  case 'VIDEO': {
                    const isYouTube = el.content?.includes('youtube.com') || el.content?.includes('youtu.be');
                    const isDrive = el.content?.includes('drive.google.com');
                    const isDirectMp4 = el.content?.endsWith('.mp4');

                    let srcUrl = el.content;
                    if (isYouTube) {
                      const videoId = el.content.includes('v=') ? el.content.split('v=')[1].split('&')[0] : el.content.split('/').pop();
                      srcUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
                    } else if (isDrive) {
                      srcUrl = el.content.replace('/view', '/preview').split('?')[0];
                      if (!srcUrl.endsWith('/preview')) srcUrl += '/preview';
                    }

                    return (
                      <div key={el.id} style={{ ...elStyle, background: '#000', borderRadius: el.style?.borderRadius, overflow: 'hidden' }}>
                        {isDirectMp4 ? (
                          <video src={srcUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                        ) : (
                          <iframe width="100%" height="100%" src={srcUrl} title="Video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ pointerEvents: 'none' }}></iframe>
                        )}
                      </div>
                    );
                  }
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
                  <h1 className="hero-title" style={{ color: '#fff' }}>{config?.homeHeroTitle || block.title || 'RODEIO PRO'}</h1>
                  <p className="hero-subtitle" style={{ color: bStyle.accent || primaryColor }}>{config?.homeHeroSubtitle || block.subtitle || 'A maior plataforma de rodeios do Brasil'}</p>
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
              <section key={block.id} className="highlights-section" style={{ ...sectionStyle, background: bStyle.background || 'rgba(255,255,255,0.01)', borderRadius: `${bStyle.borderRadius || 60}px`, padding: '80px 40px' }}>
                <div className="section-header" style={{ textAlign: bStyle.align || 'left', marginBottom: '60px', display: 'flex', flexDirection: bStyle.align === 'center' ? 'column' : 'row', justifyContent: 'space-between', alignItems: bStyle.align === 'center' ? 'center' : 'flex-end' }}>
                  <div>
                    <h2 style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-2px', lineHeight: 0.9, marginBottom: '10px' }}>{block.title}</h2>
                    <p style={{ color: bStyle.accent || primaryColor, fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '3px' }}>{block.subtitle}</p>
                  </div>
                  {!((config as any)?.rankingCongelado) && (
                    <Link href="/ranking" className="btn-secondary" style={{ padding: '15px 35px', borderRadius: '50px', border: `1px solid ${primaryColor}44` }}>
                      VER CLASSIFICAÇÃO COMPLETA <ChevronRight size={18} />
                    </Link>
                  )}
                </div>

                <div className="highlights-grid" style={{ gap: '30px' }}>
                  {/* CARD ETAPA */}
                  <div className="premium-card" style={{ padding: '40px', background: 'linear-gradient(180deg, #0d0d0d 0%, #050505 100%)', borderRadius: '40px', border: '1px solid #1a1a1a', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                      <div style={{ borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: `${primaryColor}22`, padding: '10px', borderRadius: '12px' }}><Zap size={24} color={primaryColor} /></div>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Líderes da Etapa</h3>
                      </div>
                      <table style={{ width: '100%', borderSpacing: '0 15px', borderCollapse: 'separate' }}>
                        <tbody>
                          {rankingEtapa?.list?.slice(0, 5).map((r: any) => (
                            <tr key={r.pos} style={{ background: r.pos === 1 ? `${primaryColor}08` : 'transparent', borderRadius: '12px' }}>
                              <td style={{ padding: '12px 15px', borderRadius: '12px 0 0 12px', width: '50px' }}>
                                <div style={{ 
                                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: r.pos === 1 ? primaryColor : (r.pos <= 3 ? `${primaryColor}33` : '#111'),
                                  color: r.pos === 1 ? '#000' : (r.pos <= 3 ? primaryColor : '#444'),
                                  fontWeight: 900, fontSize: '0.8rem'
                                }}>{r.pos}</div>
                              </td>
                              <td style={{ padding: '12px 0', fontWeight: r.pos <= 3 ? 800 : 400, fontSize: r.pos === 1 ? '1.2rem' : '1rem' }}>
                                {r.nome}
                                {r.pos === 1 && <span style={{ marginLeft: '10px', fontSize: '0.7rem', color: primaryColor }}>🔥 LÍDER</span>}
                              </td>
                              <td style={{ padding: '12px 15px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                                <span style={{ color: r.pos === 1 ? primaryColor : '#fff', fontWeight: 900, fontSize: r.pos === 1 ? '1.4rem' : '1.1rem' }}>{r.nota}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>

                  {/* CARD CAMPEONATO */}
                  <div className="premium-card" style={{ padding: '40px', background: 'linear-gradient(180deg, #0d0d0d 0%, #050505 100%)', borderRadius: '40px', border: '1px solid #1a1a1a', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                      <div style={{ borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: `${primaryColor}22`, padding: '10px', borderRadius: '12px' }}><Trophy size={24} color={primaryColor} /></div>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Geral Campeonato</h3>
                      </div>
                      <table style={{ width: '100%', borderSpacing: '0 15px', borderCollapse: 'separate' }}>
                        <tbody>
                          {rankingChamp?.list?.slice(0, 5).map((r: any) => (
                            <tr key={r.pos} style={{ background: r.pos === 1 ? `${primaryColor}08` : 'transparent', borderRadius: '12px' }}>
                              <td style={{ padding: '12px 15px', borderRadius: '12px 0 0 12px', width: '50px' }}>
                                <div style={{ 
                                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: r.pos === 1 ? primaryColor : (r.pos <= 3 ? `${primaryColor}33` : '#111'),
                                  color: r.pos === 1 ? '#000' : (r.pos <= 3 ? primaryColor : '#444'),
                                  fontWeight: 900, fontSize: '0.8rem'
                                }}>{r.pos}</div>
                              </td>
                              <td style={{ padding: '12px 0', fontWeight: r.pos <= 3 ? 800 : 400, fontSize: r.pos === 1 ? '1.2rem' : '1rem' }}>
                                {r.nome}
                                {r.pos === 1 && <span style={{ marginLeft: '10px', fontSize: '0.7rem', color: primaryColor }}>🏆 CAMPEÃO ATUAL</span>}
                              </td>
                              <td style={{ padding: '12px 15px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                                <span style={{ color: r.pos === 1 ? primaryColor : '#fff', fontWeight: 900, fontSize: r.pos === 1 ? '1.4rem' : '1.1rem' }}>{r.nota}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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

      {isAdmin && (
        <Link 
          href="/admin/super/builder" 
          style={{ 
            position: 'fixed', bottom: '30px', right: '30px', 
            background: 'linear-gradient(135deg, #d4af37 0%, #aa8b2c 100%)', 
            color: '#000', padding: '15px 30px', borderRadius: '50px', 
            fontWeight: '950', display: 'flex', alignItems: 'center', gap: '10px', 
            boxShadow: '0 10px 30px rgba(212,175,55,0.4)', zIndex: 9999,
            textDecoration: 'none', transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Layout size={20} /> EDITAR DESIGN DO SITE
        </Link>
      )}
    </div>
  )
}
