'use client';

import { useState, useEffect } from 'react';
import { 
  Layout, 
  Plus, 
  Trash2, 
  Move, 
  Save, 
  Image as ImageIcon, 
  Type, 
  Palette, 
  Layers, 
  Monitor, 
  Smartphone,
  Eye,
  Settings,
  ChevronDown,
  ChevronUp,
  Copy,
  ArrowLeft,
  Search,
  X
} from 'lucide-react';
import Link from 'next/link';
import { saveConfig } from '@/app/admin/etapas/actions';

// --- CONFIGURAÇÃO DE TIPOS DE BLOCO ---
const LIBRARY_BLOCKS = [
  { type: 'HERO', label: 'Banner Principal', icon: ImageIcon, defaultTitle: 'GRANDE RODEIO', defaultSubtitle: 'A maior festa do peão da região' },
  { type: 'RANKING_HOME', label: 'Ranking da Noite', icon: Layout, defaultTitle: 'LÍDERES DA NOITE', defaultSubtitle: 'Confira as melhores montarias de hoje' },
  { type: 'RANKING_STAGE', label: 'Ranking da Etapa', icon: Layout, defaultTitle: 'CLASSIFICAÇÃO DA ETAPA', defaultSubtitle: 'Acumulado oficial do evento' },
  { type: 'FULL_RANKING', label: 'Tabela Completa', icon: Layout, defaultTitle: 'RANKING GERAL', defaultSubtitle: 'Championship Standings' },
  { type: 'LOWER_THIRD', label: 'Tarja de Atleta (vMix)', icon: Monitor, defaultTitle: 'GC de Atleta', defaultSubtitle: 'Overlay para vMix' },
  { type: 'COUNTDOWN', label: 'Contador Regressivo', icon: Settings, defaultTitle: 'FALTAM APENAS', defaultSubtitle: 'Para o início da grande final' },
  { type: 'SPONSORS', label: 'Patrocinadores', icon: ImageIcon, defaultTitle: 'NOSSOS APOIADORES', defaultSubtitle: 'Marcas que fazem o rodeio acontecer' },
  { type: 'GALLERY', label: 'Galeria de Fotos', icon: ImageIcon, defaultTitle: 'MELHORES MOMENTOS', defaultSubtitle: 'Registros da nossa arena' },
];

const FONTS = ['Inter', 'Outfit', 'Montserrat', 'Bebas Neue', 'Oswald', 'Roboto Condensed', 'Black Ops One'];

export default function DragDropBuilder() {
  const [config, setConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'HOME' | 'OVERLAYS'>('HOME');
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    async function load() {
      const res = await fetch('/api/public/config');
      const data = await res.json();
      setConfig(data);
      const initialBlocks = data?.siteLayouts?.[activeTab] || [];
      setBlocks(initialBlocks);
      setLoading(false);
    }
    load();
  }, [activeTab]);

  const saveLayout = async () => {
    setIsSaving(true);
    const formData = new FormData();
    const updatedLayouts = { ...config?.siteLayouts, [activeTab]: blocks };
    formData.append('siteLayouts', JSON.stringify(updatedLayouts));
    formData.append('primaryColor', config.primaryColor);
    formData.append('secondaryColor', config.secondaryColor);
    formData.append('fontFamily', config.fontFamily);
    formData.append('titulo', config.titulo);
    
    try {
      await saveConfig(formData);
      setIsSaving(false);
      alert('Design publicado com sucesso! 🚀');
    } catch (err) {
      alert('Erro ao publicar. Verifique o banco.');
      setIsSaving(false);
    }
  };

  // --- LÓGICA DE DRAG AND DROP ---
  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newBlocks = [...blocks];
    const draggedItem = newBlocks[draggedItemIndex];
    newBlocks.splice(draggedItemIndex, 1);
    newBlocks.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setBlocks(newBlocks);
  };

  const addBlockFromLibrary = (libBlock: any) => {
    const newBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type: libBlock.type,
      title: libBlock.defaultTitle,
      subtitle: libBlock.defaultSubtitle,
      visible: true,
      style: {
        background: activeTab === 'OVERLAYS' ? '#000000' : 'rgba(255,255,255,0.02)',
        accent: config?.primaryColor || '#D4AF37',
        align: 'center'
      }
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: any) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const duplicateBlock = (block: any) => {
    const newBlock = { ...block, id: Math.random().toString(36).substr(2, 9) };
    setBlocks([...blocks, newBlock]);
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  if (loading) return <div style={{ color: '#fff', padding: '2rem' }}>Carregando Editor Drag-and-Drop...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Google Fonts Loader */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;700;900&family=Montserrat:wght@400;700&family=Outfit:wght@400;700;900&family=Oswald:wght@400;700&family=Roboto+Condensed:wght@400;700&display=swap');
      `}} />

      {/* 🛠 BARRA SUPERIOR DE CONTROLE */}
      <div style={{ padding: '0.75rem 1.5rem', background: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/admin/super" style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontSize: '0.8rem' }}>
             <ArrowLeft size={16} /> VOLTAR
          </Link>
          <div style={{ width: '1px', height: '20px', background: '#222' }} />
          <div style={{ display: 'flex', background: '#111', padding: '4px', borderRadius: '10px', border: '1px solid #222' }}>
            <button onClick={() => setActiveTab('HOME')} style={tabStyle(activeTab === 'HOME')}>SITE PÚBLICO</button>
            <button onClick={() => setActiveTab('OVERLAYS')} style={tabStyle(activeTab === 'OVERLAYS')}>GRÁFICOS VMIX</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', background: '#111', padding: '4px', borderRadius: '10px' }}>
            <button onClick={() => setPreviewMode('desktop')} style={iconBtnStyle(previewMode === 'desktop')}><Monitor size={18} /></button>
            <button onClick={() => setPreviewMode('mobile')} style={iconBtnStyle(previewMode === 'mobile')}><Smartphone size={18} /></button>
          </div>
          <button onClick={saveLayout} disabled={isSaving} style={{ 
            background: config?.primaryColor || '#D4AF37', color: '#000', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', 
            fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem'
          }}>
            {isSaving ? 'PUBLICANDO...' : <><Save size={18} /> PUBLICAR DESIGN</>}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* 📚 BIBLIOTECA (ESQUERDA) */}
        <aside style={{ width: '300px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '1.5rem', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.7rem', color: '#444', fontWeight: '900', marginBottom: '1.5rem', letterSpacing: '1px' }}>BIBLIOTECA DE COMPONENTES</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {LIBRARY_BLOCKS.map((lib) => (
              <div 
                key={lib.type} 
                onClick={() => addBlockFromLibrary(lib)}
                style={{ 
                  padding: '12px', background: '#111', border: '1px solid #222', borderRadius: '10px', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = config?.primaryColor || '#D4AF37'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
              >
                <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <lib.icon size={16} color="#666" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{lib.label}</span>
                  <span style={{ fontSize: '0.6rem', color: '#444' }}>Clique para adicionar</span>
                </div>
                <Plus size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #1a1a1a' }}>
             <h3 style={{ fontSize: '0.7rem', color: '#444', fontWeight: '900', marginBottom: '1.5rem', letterSpacing: '1px' }}>ESTILO GLOBAL</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                   <label style={styleLabel}>TIPOGRAFIA MASTER</label>
                   <select value={config?.fontFamily} onChange={e => setConfig({...config, fontFamily: e.target.value})} style={styleInput}>
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                   </select>
                </div>
                <div>
                   <label style={styleLabel}>COR DE DESTAQUE</label>
                   <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="color" value={config?.primaryColor} onChange={e => setConfig({...config, primaryColor: e.target.value})} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer' }} />
                      <input value={config?.primaryColor} onChange={e => setConfig({...config, primaryColor: e.target.value})} style={{ ...styleInput, fontSize: '0.7rem' }} />
                   </div>
                </div>
                <div>
                   <label style={styleLabel}>COR DE FUNDO</label>
                   <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="color" value={config?.secondaryColor} onChange={e => setConfig({...config, secondaryColor: e.target.value})} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer' }} />
                      <input value={config?.secondaryColor} onChange={e => setConfig({...config, secondaryColor: e.target.value})} style={{ ...styleInput, fontSize: '0.7rem' }} />
                   </div>
                </div>
             </div>
          </div>
        </aside>

        {/* 🎭 CANVAS / PALCO (CENTRO) */}
        <main style={{ flex: 1, background: '#000', overflowY: 'auto', padding: '3rem 2rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            width: previewMode === 'desktop' ? '100%' : '375px', 
            minHeight: '100%', background: config?.secondaryColor || '#000', 
            borderRadius: previewMode === 'mobile' ? '40px' : '0',
            border: previewMode === 'mobile' ? '12px solid #222' : 'none',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            paddingBottom: '300px',
            fontFamily: `${config?.fontFamily}, sans-serif`,
            position: 'relative',
            boxShadow: '0 0 100px rgba(0,0,0,0.5)'
          }}>
            {blocks.length === 0 ? (
              <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#222' }}>
                 <Layers size={64} style={{ marginBottom: '1.5rem' }} />
                 <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Seu site está vazio</h2>
                 <p style={{ fontSize: '0.9rem' }}>Arraste componentes da biblioteca para começar a criar.</p>
              </div>
            ) : (
              blocks.map((block, index) => (
                <div 
                  key={block.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); }}
                  style={{ 
                    position: 'relative', 
                    padding: '4rem 2rem', 
                    background: block.style?.background || 'transparent',
                    border: selectedBlockId === block.id ? `2px solid ${config?.primaryColor || '#D4AF37'}` : '1px dashed rgba(255,255,255,0.02)',
                    cursor: 'grab',
                    transition: 'all 0.2s',
                    opacity: block.visible ? 1 : 0.3
                  }}
                >
                  {/* ALÇA DE MOVIMENTO E AÇÕES RÁPIDAS */}
                  {selectedBlockId === block.id && (
                    <div style={{ position: 'absolute', top: '-18px', right: '20px', display: 'flex', gap: '8px', zIndex: 100 }}>
                       <div style={quickActionStyle}><Move size={14} /></div>
                       <div onClick={(e) => { e.stopPropagation(); duplicateBlock(block); }} style={quickActionStyle} title="Duplicar"><Copy size={14} /></div>
                       <div onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} style={{ ...quickActionStyle, background: '#ff4444' }} title="Excluir"><Trash2 size={14} /></div>
                    </div>
                  )}

                  <div style={{ textAlign: block.style?.align || 'center' }}>
                     <h2 style={{ fontSize: previewMode === 'mobile' ? '1.8rem' : '3.5rem', fontWeight: 950, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '-1px', lineHeight: 1 }}>{block.title}</h2>
                     <p style={{ fontSize: previewMode === 'mobile' ? '0.9rem' : '1.3rem', color: block.style?.accent || config?.primaryColor || '#D4AF37', marginTop: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{block.subtitle}</p>
                     
                     {/* REPRESENTAÇÃO VISUAL DO COMPONENTE */}
                     <div style={{ marginTop: '3rem', minHeight: '120px', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.03)', padding: '2rem' }}>
                        <div style={{ fontSize: '0.6rem', color: '#444', letterSpacing: '4px', fontWeight: '900', marginBottom: '1rem' }}>CONTEÚDO DINÂMICO</div>
                        <div style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>{block.type}</div>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* ⚙️ INSPETOR (DIREITA) */}
        <aside style={{ width: '340px', background: '#0a0a0a', borderLeft: '1px solid #222', padding: '1.5rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
             <h3 style={{ fontSize: '0.7rem', color: '#444', fontWeight: '900', letterSpacing: '1px' }}>INSPETOR DE PROPRIEDADES</h3>
             {selectedBlockId && <button onClick={() => setSelectedBlockId(null)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><X size={18} /></button>}
          </div>
          
          {selectedBlock ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid #1a1a1a' }}>
                 <span style={{ fontSize: '0.6rem', color: '#444', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>ID DO COMPONENTE: {selectedBlock.id}</span>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '4px 10px', background: config?.primaryColor || '#D4AF37', color: '#000', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '900' }}>{selectedBlock.type}</div>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{activeTab === 'HOME' ? 'Web Block' : 'vMix Overlay'}</span>
                 </div>
              </div>

              <div>
                <label style={styleLabel}>TÍTULO EM DESTAQUE</label>
                <input value={selectedBlock.title} onChange={e => updateBlock(selectedBlock.id, { title: e.target.value })} style={styleInput} placeholder="Ex: GRANDE FINAL" />
              </div>

              <div>
                <label style={styleLabel}>SUBTÍTULO / SLOGAN</label>
                <textarea value={selectedBlock.subtitle} onChange={e => updateBlock(selectedBlock.id, { subtitle: e.target.value })} style={{ ...styleInput, height: '100px', resize: 'none' }} placeholder="Descreva o conteúdo desta seção..." />
              </div>

              <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '2rem' }}>
                <h5 style={{ fontSize: '0.7rem', color: config?.primaryColor || '#D4AF37', marginBottom: '1.25rem', fontWeight: '900' }}>CUSTOMIZAÇÃO DE ESTILO</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={styleLabel}>COR DE FUNDO DA SEÇÃO</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                           <input type="color" value={selectedBlock.style?.background || '#111111'} onChange={e => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, background: e.target.value } })} style={{ width: '40px', height: '40px', background: 'none', border: 'none', cursor: 'pointer' }} />
                           <input value={selectedBlock.style?.background || '#111111'} onChange={e => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, background: e.target.value } })} style={{ ...styleInput, fontSize: '0.7rem' }} />
                        </div>
                    </div>
                    <div>
                        <label style={styleLabel}>COR DE ACENTO (TEXTOS)</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                           <input type="color" value={selectedBlock.style?.accent || config?.primaryColor || '#D4AF37'} onChange={e => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, accent: e.target.value } })} style={{ width: '40px', height: '40px', background: 'none', border: 'none', cursor: 'pointer' }} />
                           <input value={selectedBlock.style?.accent || config?.primaryColor || '#D4AF37'} onChange={e => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, accent: e.target.value } })} style={{ ...styleInput, fontSize: '0.7rem' }} />
                        </div>
                    </div>

                    {selectedBlock.type === 'LOWER_THIRD' && (
                       <div>
                          <label style={styleLabel}>RÓTULO DO GC (EX: RANK ETAPA)</label>
                          <input value={selectedBlock.style?.labelText || 'RANK ETAPA'} onChange={e => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, labelText: e.target.value } })} style={styleInput} />
                       </div>
                    )}

                    <div>
                        <label style={styleLabel}>ALINHAMENTO DO CONTEÚDO</label>
                        <div style={{ display: 'flex', gap: '4px', background: '#111', padding: '4px', borderRadius: '10px', border: '1px solid #222' }}>
                           {['left', 'center', 'right'].map(a => (
                             <button 
                              key={a} 
                              onClick={() => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, align: a } })} 
                              style={{ 
                                flex: 1, padding: '10px', border: 'none', 
                                background: selectedBlock.style?.align === a ? '#222' : 'transparent', 
                                color: selectedBlock.style?.align === a ? '#fff' : '#444', 
                                borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' 
                              }}
                             >
                               {a === 'left' ? <AlignLeft size={16} /> : a === 'center' ? <AlignCenter size={16} /> : <AlignRight size={16} />}
                             </button>
                           ))}
                        </div>
                    </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => updateBlock(selectedBlock.id, { visible: !selectedBlock.visible })} style={{ 
                  width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #222', 
                  background: selectedBlock.visible ? 'rgba(255,255,255,0.02)' : '#1a1a1a', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.8rem', fontWeight: 'bold'
                }}>
                  {selectedBlock.visible ? <><Eye size={16} /> OCULTAR DO SITE</> : <><X size={16} /> BLOCO OCULTO</>}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#222', marginTop: '6rem' }}>
              <Settings size={64} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Nenhum bloco selecionado</p>
              <p style={{ fontSize: '0.7rem', marginTop: '5px' }}>Clique em um elemento no palco central para ajustar suas propriedades e cores.</p>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}

// --- ESTILOS AUXILIARES ---
const tabStyle = (active: boolean) => ({
  padding: '8px 24px',
  border: 'none',
  background: active ? '#222' : 'transparent',
  color: active ? '#fff' : '#444',
  borderRadius: '8px',
  fontSize: '0.7rem',
  fontWeight: '900',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  letterSpacing: '1px'
});

const iconBtnStyle = (active: boolean) => ({
  width: '38px', height: '38px', border: 'none', background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
  color: active ? '#fff' : '#333', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
});

const quickActionStyle = {
  width: '32px', height: '32px', background: '#111', color: '#fff', borderRadius: '8px', 
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #222',
  boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
};

const styleLabel = { fontSize: '0.65rem', color: '#444', fontWeight: '900', display: 'block', marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '1.5px' };
const styleInput = { width: '100%', background: '#111', border: '1px solid #1a1a1a', color: '#fff', padding: '14px', borderRadius: '12px', fontSize: '0.85rem', outline: 'none', transition: 'border-color 0.2s' };

// --- ICONS EXTRAS ---
function AlignLeft({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>; }
function AlignCenter({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>; }
function AlignRight({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>; }
