'use client';

import { useState, useEffect } from 'react';
import { 
  Layout, 
  ArrowLeft, 
  Save, 
  Smartphone, 
  Monitor, 
  ChevronRight, 
  Home, 
  Trophy, 
  Users, 
  Cat, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown,
  Settings,
  Image as ImageIcon,
  Palette,
  Shield,
  Radio,
  Gavel,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import Link from 'next/link';
import { saveConfig } from '@/app/admin/etapas/actions';

const PAGES = [
  { id: 'HOME', label: 'Página Inicial', icon: <Home size={18} /> },
  { id: 'RANKING', label: 'Rankings Públicos', icon: <Trophy size={18} /> },
  { id: 'COMPETIDORES', label: 'Atletas', icon: <Users size={18} /> },
  { id: 'ANIMAIS', label: 'Boiada', icon: <Cat size={18} /> },
  { id: 'OVERLAYS', label: 'Gráficos (vMix)', icon: <Monitor size={18} color="#e74c3c" /> },
  { id: 'PAINEIS', label: 'Painéis (Juiz/Coment.)', icon: <Gavel size={18} color="#3498db" /> },
  { id: 'ADMIN', label: 'Painel Admin', icon: <Shield size={18} color="#2ecc71" /> },
];

const BLOCK_TYPES = [
  { type: 'HERO', label: 'Banner Principal', icon: '🖼️', pages: ['HOME'] },
  { type: 'HIGHLIGHTS', label: 'Destaques', icon: '🎬', pages: ['HOME'] },
  { type: 'RANKINGS', label: 'Ranking', icon: '🏆', pages: ['HOME', 'RANKING'] },
  { type: 'GALLERY', label: 'Galeria de Fotos', icon: '📷', pages: ['HOME', 'COMPETIDORES', 'ANIMAIS'] },
  { type: 'SPONSORS', label: 'Patrocinadores', icon: '🤝', pages: ['HOME'] },
  { type: 'LOWER_THIRD', label: 'Tarja de Atleta', icon: '🏷️', pages: ['OVERLAYS'] },
  { type: 'SCORE_BOARD', label: 'Placar de Notas', icon: '🔢', pages: ['OVERLAYS'] },
  { type: 'FULL_RANKING', label: 'Ranking Tela Cheia', icon: '📺', pages: ['OVERLAYS'] },
  { type: 'JUDGE_VOTE', label: 'Teclado de Notas', icon: '⌨️', pages: ['PAINEIS'] },
  { type: 'COMMENTATOR_FEED', label: 'Feed do Comentarista', icon: '🎙️', pages: ['PAINEIS'] },
  { type: 'STATS_CARD', label: 'Card de Estatísticas', icon: '📊', pages: ['PAINEIS', 'ADMIN'] },
];

export default function SiteBuilderPage() {
  const [activePage, setActivePage] = useState('HOME');
  const [layouts, setLayouts] = useState<any>({});
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [brand, setBrand] = useState({
    primaryColor: '#d4af37',
    secondaryColor: '#111111',
    fontFamily: 'Inter',
    logoUrl: '',
    siteName: 'RODEIO PRO'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');

  const GOOGLE_FONTS = ['Inter', 'Outfit', 'Roboto', 'Bebas Neue', 'Montserrat', 'Playfair Display'];

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/public/config');
      const config = await res.json();
      setLayouts(config.siteLayouts || {
        HOME: [{ id: 'h1', type: 'HERO', title: 'Banner Principal', subtitle: 'O Maior Espetáculo da Terra', visible: true, style: { background: '#111111', color: '#ffffff', align: 'center' } }],
        RANKING: [{ id: 'rr1', type: 'RANKINGS', title: 'Ranking Completo', visible: true }],
        COMPETIDORES: [{ id: 'cc1', type: 'GALLERY', title: 'Grid de Atletas', visible: true }],
        OVERLAYS: [{ id: 'lt1', type: 'LOWER_THIRD', title: 'GC de Atleta', visible: true }],
        PAINEIS: [{ id: 'jv1', type: 'JUDGE_VOTE', title: 'Interface de Votação', visible: true }],
        ADMIN: [{ id: 'st1', type: 'STATS_CARD', title: 'Resumo da Arena', visible: true }]
      });
      setBrand({
        primaryColor: config.primaryColor || '#d4af37',
        secondaryColor: config.secondaryColor || '#111111',
        fontFamily: config.fontFamily || 'Inter',
        logoUrl: config.logoUrl || '',
        siteName: config.titulo || 'RODEIO PRO'
      });
      setLoading(false);
    }
    load();
  }, []);

  const currentLayout = layouts[activePage] || [];

  function updateLayout(newLayout: any[]) {
    setLayouts({ ...layouts, [activePage]: newLayout });
  }

  function updateBlock(blockId: string, updates: any) {
    const newLayout = currentLayout.map((b: any) => 
      b.id === blockId ? { ...b, ...updates } : b
    );
    setLayouts({ ...layouts, [activePage]: newLayout });
    if (editingBlock?.id === blockId) {
      setEditingBlock({ ...editingBlock, ...updates });
    }
  }

  function addBlock(type: string) {
    const bt = BLOCK_TYPES.find(b => b.type === type);
    const newBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: bt?.label,
      subtitle: '',
      visible: true,
      style: { background: '#111', color: '#fff', align: 'center' }
    };
    setLayouts({ ...layouts, [activePage]: [...currentLayout, newBlock] });
  }

  async function handleSave() {
    setSaving(true);
    const formData = new FormData();
    formData.set('siteLayouts', JSON.stringify(layouts));
    formData.set('homeLayout', JSON.stringify(layouts.HOME || []));
    
    // Configurações Globais
    formData.set('titulo', brand.siteName);
    formData.set('primaryColor', brand.primaryColor);
    formData.set('secondaryColor', brand.secondaryColor);
    formData.set('fontFamily', brand.fontFamily);
    
    try {
      await saveConfig(formData);
      alert('✅ Layout e Estilos publicados com sucesso!');
    } catch (err) {
      alert('❌ Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ color: '#fff', padding: '2rem' }}>Carregando Master Builder...</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff', fontFamily: `${brand.fontFamily}, sans-serif` }}>
      
      {/* Google Fonts Loader */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;700;900&family=Montserrat:wght@400;700&family=Outfit:wght@400;700;900&family=Playfair+Display:wght@700&family=Roboto:wght@400;700&display=swap');
      `}} />

      {/* Top Bar */}
      <header style={{ height: '60px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', background: '#0a0a0a', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin/super" style={{ color: '#666' }}><ArrowLeft size={20} /></Link>
          <div style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Layout size={20} color={brand.primaryColor} /> CONSTRUTOR TOTAL <span style={{ color: '#333' }}>|</span> <span style={{ color: brand.primaryColor, fontSize: '0.8rem' }}>PRO DESIGN</span>
          </div>
        </div>

        <div style={{ display: 'flex', background: '#111', borderRadius: '8px', padding: '4px' }}>
          <button onClick={() => setPreviewMode('desktop')} style={{ ...styleModeBtn, background: previewMode === 'desktop' ? '#222' : 'transparent' }}><Monitor size={16} /></button>
          <button onClick={() => setPreviewMode('mobile')} style={{ ...styleModeBtn, background: previewMode === 'mobile' ? '#222' : 'transparent' }}><Smartphone size={16} /></button>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary" 
          style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: brand.primaryColor, color: '#000', fontWeight: 'bold' }}
        >
          <Save size={18} /> {saving ? 'Publicando...' : 'PUBLICAR DESIGN'}
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Sidebar: Navigation & Typography */}
        <aside style={{ width: '300px', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', background: '#0a0a0a', overflowY: 'auto' }}>
          
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #1a1a1a' }}>
             <h4 style={styleLabel}>Branding Global</h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                   <label style={styleLabel}>FONTE PRINCIPAL</label>
                   <select 
                    value={brand.fontFamily} 
                    onChange={e => setBrand({...brand, fontFamily: e.target.value})}
                    style={styleInput}
                   >
                     {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                   </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                   <div style={{ flex: 1 }}>
                      <label style={styleLabel}>PRIMÁRIA</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                         <input type="color" value={brand.primaryColor} onChange={e => setBrand({...brand, primaryColor: e.target.value})} style={{ padding: 0, width: '25px', height: '25px', border: 'none', background: 'none' }} />
                         <input value={brand.primaryColor} onChange={e => setBrand({...brand, primaryColor: e.target.value})} style={{ ...styleInput, fontSize: '0.7rem' }} />
                      </div>
                   </div>
                   <div style={{ flex: 1 }}>
                      <label style={styleLabel}>SECUNDÁRIA</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                         <input type="color" value={brand.secondaryColor} onChange={e => setBrand({...brand, secondaryColor: e.target.value})} style={{ padding: 0, width: '25px', height: '25px', border: 'none', background: 'none' }} />
                         <input value={brand.secondaryColor} onChange={e => setBrand({...brand, secondaryColor: e.target.value})} style={{ ...styleInput, fontSize: '0.7rem' }} />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <h4 style={styleLabel}>Menu de Páginas</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {PAGES.map(p => (
                <button 
                  key={p.id}
                  onClick={() => { setActivePage(p.id); setEditingBlock(null); }}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: activePage === p.id ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    color: activePage === p.id ? brand.primaryColor : '#888',
                    fontWeight: activePage === p.id ? 'bold' : 'normal',
                    fontSize: '0.85rem'
                  }}
                >
                  {p.icon} {p.label}
                  {activePage === p.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>

            <div style={{ marginTop: '2rem' }}>
               <h4 style={styleLabel}>Estrutura: {activePage}</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentLayout.map((block: any) => (
                    <div 
                      key={block.id} 
                      onClick={() => setEditingBlock(block)}
                      style={{ 
                        background: editingBlock?.id === block.id ? '#1a1a1a' : '#111', 
                        border: editingBlock?.id === block.id ? `1px solid ${brand.primaryColor}` : '1px solid #222', 
                        borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' 
                      }}
                    >
                        <div style={{ flex: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>{block.title}</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {block.visible ? <Eye size={12} color="#666" /> : <EyeOff size={12} color="#e74c3c" />}
                          <Settings size={12} color={editingBlock?.id === block.id ? brand.primaryColor : "#444"} />
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </aside>

        {/* Center: Real Preview */}
        <main style={{ flex: 1, padding: '2rem', background: '#000', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
           <div style={{ 
             width: previewMode === 'desktop' ? '100%' : '375px', 
             minHeight: '100%', 
             background: brand.secondaryColor, 
             borderRadius: '12px', 
             border: '4px solid #1a1a1a',
             boxShadow: '0 0 50px rgba(0,0,0,0.5)',
             transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
             display: 'flex',
             flexDirection: 'column',
             fontFamily: `${brand.fontFamily}, sans-serif`
           }}>
              {/* Preview Header */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                 <div style={{ fontWeight: '900', fontSize: '0.9rem', color: brand.primaryColor }}>{brand.siteName}</div>
                 <div style={{ display: 'flex', gap: '15px', fontSize: '0.65rem', color: '#888', fontWeight: 'bold' }}>
                    <span>HOME</span><span>RANKING</span><span>ARENA</span>
                 </div>
              </div>

              {/* Preview Content */}
              <div style={{ flex: 1 }}>
                 {currentLayout.filter((b: any) => b.visible).map((block: any) => (
                    <div 
                      key={block.id} 
                      style={{ 
                        background: block.style?.background || 'transparent', 
                        padding: '3rem 1.5rem',
                        textAlign: block.style?.align || 'center' as any,
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        position: 'relative'
                      }}
                    >
                       <div style={{ color: block.style?.color || '#fff' }}>
                          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.5rem', color: brand.primaryColor }}>{block.title}</h2>
                          {block.subtitle && <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>{block.subtitle}</p>}
                       </div>
                       
                       {block.type === 'RANKINGS' && (
                         <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '1rem', fontSize: '0.7rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                               <span>#1 JOÃO SILVA</span><span>92.50 pts</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem' }}>
                               <span>#2 PEDRO COSTA</span><span>91.75 pts</span>
                            </div>
                         </div>
                       )}

                       {editingBlock?.id === block.id && (
                         <div style={{ position: 'absolute', inset: 0, border: `2px solid ${brand.primaryColor}`, pointerEvents: 'none' }}></div>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        </main>

        {/* Right Sidebar: Editor or Library */}
        <aside style={{ width: '320px', borderLeft: '1px solid #222', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
           
           {editingBlock ? (
             /* Block Editor */
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <div style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Settings size={16} color={brand.primaryColor} /> EDITAR BLOCO
                   </div>
                   <button onClick={() => setEditingBlock(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>Fechar</button>
                </div>
                
                <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                         <label style={styleLabel}>VISIBILIDADE</label>
                         <button 
                          onClick={() => updateBlock(editingBlock.id, { visible: !editingBlock.visible })}
                          style={{ ...styleInput, background: editingBlock.visible ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)', color: editingBlock.visible ? '#2ecc71' : '#e74c3c', border: 'none' }}
                         >
                           {editingBlock.visible ? 'Bloco Visível' : 'Bloco Oculto'}
                         </button>
                      </div>
                      <div>
                         <label style={styleLabel}>TÍTULO DO BLOCO</label>
                         <input value={editingBlock.title} onChange={e => updateBlock(editingBlock.id, { title: e.target.value })} style={styleInput} />
                      </div>
                      <div>
                         <label style={styleLabel}>SUBTÍTULO</label>
                         <textarea value={editingBlock.subtitle} onChange={e => updateBlock(editingBlock.id, { subtitle: e.target.value })} style={{ ...styleInput, height: '80px', resize: 'none' }} />
                      </div>
                      <div style={{ borderTop: '1px solid #222', paddingTop: '1.5rem' }}>
                         <h5 style={{ fontSize: '0.7rem', color: brand.primaryColor, marginBottom: '1rem' }}>ESTILO DO COMPONENTE</h5>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {editingBlock.type.includes('OVERLAY') || ['LOWER_THIRD', 'SCORE_BOARD', 'FULL_RANKING'].includes(editingBlock.type) ? (
                              <>
                                <div>
                                   <label style={styleLabel}>COR DE DESTAQUE (BARRAS)</label>
                                   <div style={{ display: 'flex', gap: '8px' }}>
                                      <input type="color" value={editingBlock.style?.accent || brand.primaryColor} onChange={e => updateBlock(editingBlock.id, { style: { ...editingBlock.style, accent: e.target.value } })} style={{ width: '30px' }} />
                                      <input value={editingBlock.style?.accent || brand.primaryColor} onChange={e => updateBlock(editingBlock.id, { style: { ...editingBlock.style, accent: e.target.value } })} style={styleInput} />
                                   </div>
                                </div>
                                <div>
                                   <label style={styleLabel}>COR DO FUNDO</label>
                                   <div style={{ display: 'flex', gap: '8px' }}>
                                      <input type="color" value={editingBlock.style?.background || '#000000'} onChange={e => updateBlock(editingBlock.id, { style: { ...editingBlock.style, background: e.target.value } })} style={{ width: '30px' }} />
                                      <input value={editingBlock.style?.background || '#000000'} onChange={e => updateBlock(editingBlock.id, { style: { ...editingBlock.style, background: e.target.value } })} style={styleInput} />
                                   </div>
                                </div>
                                <div>
                                   <label style={styleLabel}>RÓTULO PERSONALIZADO (EX: RANK ETAPA)</label>
                                   <input value={editingBlock.style?.labelText || 'RANK ETAPA'} onChange={e => updateBlock(editingBlock.id, { style: { ...editingBlock.style, labelText: e.target.value } })} style={styleInput} placeholder="Texto que aparece na barra menor" />
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                   <label style={styleLabel}>COR DE FUNDO</label>
                                   <div style={{ display: 'flex', gap: '8px' }}>
                                      <input type="color" value={editingBlock.style?.background || '#111'} onChange={e => updateBlock(editingBlock.id, { style: { ...editingBlock.style, background: e.target.value } })} style={{ width: '30px' }} />
                                      <input value={editingBlock.style?.background || '#111'} onChange={e => updateBlock(editingBlock.id, { style: { ...editingBlock.style, background: e.target.value } })} style={styleInput} />
                                   </div>
                                </div>
                                <div>
                                   <label style={styleLabel}>ALINHAMENTO</label>
                                   <div style={{ display: 'flex', background: '#111', borderRadius: '8px', padding: '4px' }}>
                                      {['left', 'center', 'right'].map(a => (
                                        <button 
                                          key={a}
                                          onClick={() => updateBlock(editingBlock.id, { style: { ...editingBlock.style, align: a } })}
                                          style={{ flex: 1, padding: '5px', border: 'none', background: editingBlock.style?.align === a ? '#222' : 'transparent', color: '#fff', fontSize: '0.6rem', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                          {a.toUpperCase()}
                                        </button>
                                      ))}
                                   </div>
                                </div>
                              </>
                            )}
                         </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          if (confirm('Deseja excluir este bloco?')) {
                            updateLayout(currentLayout.filter((b: any) => b.id !== editingBlock.id));
                            setEditingBlock(null);
                          }
                        }}
                        style={{ marginTop: '2rem', padding: '0.8rem', background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem' }}
                      >
                         EXCLUIR COMPONENTE
                      </button>
                   </div>
                </div>
             </div>
           ) : (
             /* Block Library */
             <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                <h4 style={styleLabel}>Biblioteca de Blocos</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {BLOCK_TYPES.filter(bt => bt.pages.includes(activePage)).map(bt => (
                      <button 
                        key={bt.type}
                        onClick={() => addBlock(bt.type)}
                        style={{ 
                          background: '#111', border: '1px solid #222', padding: '1.2rem', borderRadius: '15px', cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.2s', color: '#fff'
                        }}
                      >
                         <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{bt.icon}</div>
                         <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{bt.label}</div>
                         <div style={{ fontSize: '0.65rem', color: '#555' }}>Adicionar à {activePage}</div>
                      </button>
                    ))}
                </div>
             </div>
           )}

        </aside>
      </div>
    </div>
  );
}

const styleModeBtn: React.CSSProperties = { border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const styleInput: React.CSSProperties = { width: '100%', padding: '0.6rem', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' };
const styleLabel: React.CSSProperties = { fontSize: '0.65rem', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' };
