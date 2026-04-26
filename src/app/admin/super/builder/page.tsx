'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Layout, Plus, Trash2, Move, Save, Image as ImageIcon, Type, Palette, Layers, 
  Monitor, Smartphone, Eye, Settings, ChevronDown, ChevronUp, Copy, ArrowLeft, 
  Search, X, Square, Circle, Triangle, MousePointer2, Maximize2, Wand2, Play, Trophy, Zap
} from 'lucide-react';
import Link from 'next/link';
import { saveConfig } from '@/app/admin/etapas/actions';
import { removeBackgroundAction } from './actions';

// --- TIPOS DE ELEMENTOS ---
const ELEMENT_TYPES = [
  { type: 'TEXT', label: 'Texto', icon: Type, defaultContent: 'Clique para editar o texto' },
  { type: 'SHAPE_RECT', label: 'Retângulo', icon: Square, defaultContent: '' },
  { type: 'SHAPE_CIRCLE', label: 'Círculo', icon: Circle, defaultContent: '' },
  { type: 'IMAGE', label: 'Imagem/Logo', icon: ImageIcon, defaultContent: '/hero-rodeo.png' },
];

const FONTS = ['Inter', 'Outfit', 'Montserrat', 'Bebas Neue', 'Oswald', 'Roboto Condensed', 'Black Ops One'];

export default function VisualLiveBuilder() {
  const [config, setConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'HOME' | 'OVERLAYS'>('HOME');
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    async function load() {
      const res = await fetch('/api/public/config');
      const data = await res.json();
      setConfig(data);
      const initialBlocks = data?.siteLayouts?.[activeTab] || [];
      
      // Se não houver blocos, inicializar com o padrão
      if (initialBlocks.length === 0 && activeTab === 'HOME') {
         setBlocks([
           { id: 'b1', type: 'HERO', elements: [{ id: 'e1', type: 'TEXT', x: 100, y: 150, w: 600, h: 100, content: 'GRANDE RODEIO MASTER', zIndex: 10, style: { color: '#fff', fontSize: 64, fontWeight: '950' } }], style: { background: '#050505' } },
           { id: 'b2', type: 'RANKINGS', elements: [], style: { background: '#0a0a0a' } }
         ]);
      } else {
         setBlocks(initialBlocks.map((b: any) => ({ ...b, elements: b.elements || [] })));
      }
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
    formData.append('removeBgApiKey', config.removeBgApiKey || '');
    
    try {
      await saveConfig(formData);
      setIsSaving(false);
      alert('Design publicado com sucesso! O site agora está em modo de edição visual. 🚀');
    } catch (err) {
      alert('Erro ao publicar.');
      setIsSaving(false);
    }
  };

  const addElementToBlock = (blockId: string, type: string) => {
    const typeInfo = ELEMENT_TYPES.find(t => t.type === type);
    const newElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 100,
      y: 100,
      w: type.startsWith('SHAPE') ? 150 : 300,
      h: type.startsWith('SHAPE') ? 100 : 50,
      content: typeInfo?.defaultContent || '',
      zIndex: (blocks.find(b => b.id === blockId)?.elements?.length || 0) + 1,
      style: {
        color: '#ffffff',
        background: type === 'SHAPE_RECT' ? config?.primaryColor || '#D4AF37' : 'transparent',
        fontSize: 24,
        fontWeight: '900',
        borderRadius: type === 'SHAPE_CIRCLE' ? '100%' : '0px',
        opacity: 1,
        textAlign: 'center'
      }
    };

    setBlocks(blocks.map(b => b.id === blockId ? { ...b, elements: [...(b.elements || []), newElement] } : b));
    setSelectedElementId(newElement.id);
  };

  const updateElement = (blockId: string, elementId: string, updates: any) => {
    setBlocks(blocks.map(b => b.id === blockId ? {
      ...b,
      elements: b.elements.map((el: any) => el.id === elementId ? { ...el, ...updates } : el)
    } : b));
  };

  const updateBlockStyle = (blockId: string, styleUpdates: any) => {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, style: { ...b.style, ...styleUpdates } } : b));
  };

  const deleteElement = (blockId: string, elementId: string) => {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, elements: b.elements.filter((el: any) => el.id !== elementId) } : b));
    setSelectedElementId(null);
  };

  // --- RENDERIZADOR DE ELEMENTO ---
  const VisualElement = ({ blockId, element }: { blockId: string, element: any }) => {
    const isSelected = selectedElementId === element.id;
    
    const onMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedElementId(element.id);
      setSelectedBlockId(blockId);
      setIsDragging(true);

      const startX = e.clientX - element.x;
      const startY = e.clientY - element.y;

      const onMouseMove = (moveE: MouseEvent) => {
        updateElement(blockId, element.id, {
          x: moveE.clientX - startX,
          y: moveE.clientY - startY
        });
      };

      const onMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const renderContent = () => {
      switch (element.type) {
        case 'TEXT':
          return <div style={{ 
            fontSize: `${element.style?.fontSize || 24}px`, 
            fontWeight: element.style?.fontWeight || '900',
            color: element.style?.color,
            textAlign: element.style?.textAlign as any,
            fontFamily: config?.fontFamily,
            lineHeight: 1.1
          }}>{element.content}</div>;
        case 'SHAPE_RECT':
        case 'SHAPE_CIRCLE':
          return <div style={{ width: '100%', height: '100%', background: element.style?.background, borderRadius: element.style?.borderRadius, opacity: element.style?.opacity }} />;
        case 'IMAGE':
          return <img src={element.content} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />;
        default: return null;
      }
    };

    return (
      <div 
        onMouseDown={onMouseDown}
        style={{ 
          position: 'absolute', left: element.x, top: element.y, 
          width: element.type === 'TEXT' ? 'auto' : element.w, 
          height: element.type === 'TEXT' ? 'auto' : element.h,
          zIndex: element.zIndex || 1,
          cursor: isDragging ? 'grabbing' : 'grab',
          border: isSelected ? `2px solid ${config?.primaryColor || '#D4AF37'}` : '1px solid transparent',
          padding: element.type === 'TEXT' ? '10px' : '0',
          transition: isDragging ? 'none' : 'border 0.2s'
        }}
      >
        {renderContent()}
        {isSelected && (
          <div style={{ position: 'absolute', top: -35, left: 0, background: '#111', padding: '6px 12px', borderRadius: '8px', display: 'flex', gap: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', zIndex: 1000 }}>
             <button onClick={(e) => { e.stopPropagation(); deleteElement(blockId, element.id); }} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}><Trash2 size={14}/></button>
             <button onClick={(e) => { e.stopPropagation(); updateElement(blockId, element.id, { zIndex: (element.zIndex || 1) + 1 }); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Layers size={14}/></button>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>🚀 Abrindo Modo de Edição Visual...</div>;

  const selectedElement = blocks.flatMap(b => b.elements).find(el => el.id === selectedElementId);
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#050505', color: '#fff', overflow: 'hidden' }}>
      
      {/* 🛠 BARRA SUPERIOR DE DESIGN */}
      <header style={{ height: '60px', background: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', zIndex: 100 }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/admin/super" style={{ color: '#444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '900' }}>
            <ArrowLeft size={16} /> SAIR DO EDITOR
          </Link>
          <div style={{ width: '1px', height: '24px', background: '#222' }} />
          <div style={{ display: 'flex', background: '#111', padding: '4px', borderRadius: '12px' }}>
            <button onClick={() => setActiveTab('HOME')} style={tabStyle(activeTab === 'HOME')}>SITE AO VIVO</button>
            <button onClick={() => setActiveTab('OVERLAYS')} style={tabStyle(activeTab === 'OVERLAYS')}>TRANSMISSÃO</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
           <div style={{ display: 'flex', gap: '8px', background: '#111', padding: '4px', borderRadius: '10px' }}>
              <button onClick={() => setPreviewMode('desktop')} style={iconBtnStyle(previewMode === 'desktop')}><Monitor size={18} /></button>
              <button onClick={() => setPreviewMode('mobile')} style={iconBtnStyle(previewMode === 'mobile')}><Smartphone size={18} /></button>
           </div>
           <button onClick={saveLayout} disabled={isSaving} style={{ 
             background: config?.primaryColor || '#D4AF37', color: '#000', border: 'none', padding: '10px 24px', 
             borderRadius: '10px', fontWeight: '950', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
           }}>
             {isSaving ? 'PUBLICANDO...' : <><Save size={18} /> PUBLICAR DESIGN</>}
           </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* 📚 BIBLIOTECA (ESQUERDA) */}
        <aside style={{ width: '280px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
           <h3 style={{ fontSize: '0.7rem', color: '#444', fontWeight: '900', letterSpacing: '2px', marginBottom: '20px' }}>ADICIONAR AO DESIGN</h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {ELEMENT_TYPES.map(type => (
                <div 
                  key={type.type} 
                  onClick={() => {
                    if (!selectedBlockId) alert('Clique em uma seção no centro para ativá-la!');
                    else addElementToBlock(selectedBlockId, type.type);
                  }}
                  style={{ 
                    background: '#111', padding: '20px', borderRadius: '15px', border: '1px solid #222', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = config?.primaryColor}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
                >
                  <type.icon size={24} color={config?.primaryColor} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{type.label}</span>
                </div>
              ))}
           </div>

           <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #1a1a1a' }}>
              <h3 style={{ fontSize: '0.7rem', color: '#444', fontWeight: '900', marginBottom: '20px' }}>BRANDING GLOBAL</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div>
                    <label style={styleLabel}>FONTE PRINCIPAL</label>
                    <select value={config?.fontFamily} onChange={e => setConfig({...config, fontFamily: e.target.value})} style={styleInput}>
                       {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                 </div>
                 <div>
                    <label style={styleLabel}>CHAVE REMOVE.BG</label>
                    <input type="password" value={config?.removeBgApiKey || ''} onChange={e => setConfig({...config, removeBgApiKey: e.target.value})} style={styleInput} placeholder="API Key para Recorte" />
                 </div>
              </div>
           </div>
        </aside>

        {/* 🎭 CANVAS / PALCO VIVO (CENTRO) */}
        <main style={{ flex: 1, background: '#000', overflowY: 'auto', padding: '40px', display: 'flex', justifyContent: 'center' }}>
           <div style={{ 
             width: previewMode === 'desktop' ? '100%' : '375px', 
             minHeight: '100%', 
             background: config?.secondaryColor || '#050505',
             transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
             position: 'relative'
           }}>
              {blocks.map((block) => (
                <section 
                  key={block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                  style={{ 
                    height: '600px', 
                    background: block.style?.background || 'transparent', 
                    position: 'relative', 
                    overflow: 'hidden',
                    border: selectedBlockId === block.id ? `2px solid ${config?.primaryColor}` : '1px solid rgba(255,255,255,0.02)',
                    marginBottom: '20px',
                    borderRadius: '20px'
                  }}
                >
                  {/* LABEL DO BLOCO */}
                  <div style={{ position: 'absolute', top: 15, left: 15, padding: '5px 12px', background: 'rgba(0,0,0,0.8)', borderRadius: '6px', fontSize: '0.6rem', fontWeight: '900', color: '#444', zIndex: 100 }}>
                     SEÇÃO: {block.type}
                  </div>

                  {/* ELEMENTOS REAIS DO CANVAS */}
                  {block.elements.map((el: any) => (
                    <VisualElement key={el.id} blockId={block.id} element={el} />
                  ))}

                  {/* PLACEHOLDER DE CONTEÚDO DINÂMICO (PARA DAR O "FEEL" DE SITE REAL) */}
                  {block.type === 'RANKINGS' && (
                    <div style={{ padding: '100px 40px', opacity: 0.3, pointerEvents: 'none' }}>
                       <h2 style={{ fontSize: '3rem', fontWeight: 900 }}>RANKING OFICIAL</h2>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '40px' }}>
                          {[1,2,3,4].map(i => <div key={i} style={{ height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }} />)}
                       </div>
                    </div>
                  )}

                  {block.elements.length === 0 && block.type === 'HERO' && (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1, flexDirection: 'column' }}>
                       <Maximize2 size={64} />
                       <p>Clique aqui e adicione textos e formas</p>
                    </div>
                  )}
                </section>
              ))}
           </div>
        </main>

        {/* ⚙️ INSPETOR DE PROPRIEDADES (DIREITA) */}
        <aside style={{ width: '340px', background: '#0a0a0a', borderLeft: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
           {selectedElement ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <h3 style={{ fontSize: '0.8rem', fontWeight: '950', color: config?.primaryColor }}>PROPRIEDADES DO ELEMENTO</h3>
                   <button onClick={() => setSelectedElementId(null)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><X size={20}/></button>
                </div>

                {selectedElement.type === 'TEXT' && (
                  <>
                    <div>
                       <label style={styleLabel}>TEXTO DO ELEMENTO</label>
                       <textarea value={selectedElement.content} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { content: e.target.value })} style={{ ...styleInput, height: '120px' }} />
                    </div>
                    <div>
                       <label style={styleLabel}>TAMANHO DA FONTE ({selectedElement.style?.fontSize}px)</label>
                       <input type="range" min="10" max="300" value={selectedElement.style?.fontSize} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value) } })} style={{ width: '100%' }} />
                    </div>
                    <div>
                       <label style={styleLabel}>COR DO TEXTO</label>
                       <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input type="color" value={selectedElement.style?.color} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, color: e.target.value } })} style={{ width: '40px', height: '40px', background: 'none', border: 'none', cursor: 'pointer' }} />
                          <input value={selectedElement.style?.color} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, color: e.target.value } })} style={styleInput} />
                       </div>
                    </div>
                  </>
                )}

                {selectedElement.type === 'IMAGE' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <label style={styleLabel}>URL DA IMAGEM</label>
                    <input value={selectedElement.content} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { content: e.target.value })} style={styleInput} />
                    <button 
                      onClick={async () => {
                        if (!config.removeBgApiKey) return alert('Configure sua API Key na barra esquerda!');
                        const btn = document.activeElement as HTMLButtonElement;
                        btn.innerText = 'PROCESSANDO...';
                        try {
                           const res = await removeBackgroundAction(selectedElement.content);
                           updateElement(selectedBlockId!, selectedElement.id, { content: res });
                        } catch (e: any) { alert(e.message); }
                        btn.innerText = 'REMOVER FUNDO (AI)';
                      }}
                      style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      ✨ REMOVER FUNDO (AI)
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                       <div><label style={styleLabel}>LARGURA</label><input type="number" value={selectedElement.w} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { w: parseInt(e.target.value) })} style={styleInput} /></div>
                       <div><label style={styleLabel}>ALTURA</label><input type="number" value={selectedElement.h} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { h: parseInt(e.target.value) })} style={styleInput} /></div>
                    </div>
                  </div>
                )}

                {(selectedElement.type === 'SHAPE_RECT' || selectedElement.type === 'SHAPE_CIRCLE') && (
                  <>
                    <div>
                       <label style={styleLabel}>COR DE PREENCHIMENTO</label>
                       <input type="color" value={selectedElement.style?.background} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, background: e.target.value } })} style={{ width: '100%', height: '40px', background: 'none', border: 'none', cursor: 'pointer' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                       <div><label style={styleLabel}>LARGURA</label><input type="number" value={selectedElement.w} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { w: parseInt(e.target.value) })} style={styleInput} /></div>
                       <div><label style={styleLabel}>ALTURA</label><input type="number" value={selectedElement.h} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { h: parseInt(e.target.value) })} style={styleInput} /></div>
                    </div>
                  </>
                )}

                <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '20px' }}>
                   <label style={styleLabel}>OPACIDADE ({selectedElement.style?.opacity})</label>
                   <input type="range" min="0" max="1" step="0.1" value={selectedElement.style?.opacity} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, opacity: parseFloat(e.target.value) } })} style={{ width: '100%' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                   <button onClick={() => deleteElement(selectedBlockId!, selectedElement.id)} style={{ flex: 1, background: '#1a1a1a', color: '#ff4444', border: '1px solid #222', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>EXCLUIR</button>
                   <button onClick={() => {
                     const el = { ...selectedElement, id: Math.random().toString(36).substr(2, 9), x: selectedElement.x + 20, y: selectedElement.y + 20 };
                     setBlocks(blocks.map(b => b.id === selectedBlockId ? { ...b, elements: [...b.elements, el] } : b));
                     setSelectedElementId(el.id);
                   }} style={{ flex: 1, background: '#1a1a1a', color: '#fff', border: '1px solid #222', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>DUPLICAR</button>
                </div>
             </div>
           ) : selectedBlock ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: '950', color: config?.primaryColor }}>CONFIGURAÇÃO DA SEÇÃO</h3>
                <div>
                   <label style={styleLabel}>COR DE FUNDO DA SEÇÃO</label>
                   <input type="color" value={selectedBlock.style?.background || '#050505'} onChange={e => updateBlockStyle(selectedBlock.id, { background: e.target.value })} style={{ width: '100%', height: '50px', background: 'none', border: 'none', cursor: 'pointer' }} />
                </div>
                <p style={{ fontSize: '0.7rem', color: '#444' }}>Dica: Clique em um elemento individual (texto ou forma) para editá-lo separadamente.</p>
             </div>
           ) : (
             <div style={{ textAlign: 'center', color: '#222', marginTop: '6rem' }}>
                <MousePointer2 size={64} style={{ marginBottom: '20px', opacity: 0.2 }} />
                <p style={{ fontWeight: 'bold' }}>Nada selecionado</p>
                <p style={{ fontSize: '0.75rem', marginTop: '5px' }}>Clique em qualquer parte do site ao lado para começar a editar os elementos.</p>
             </div>
           )}
        </aside>

      </div>
    </div>
  );
}

const tabStyle = (active: boolean) => ({
  padding: '8px 20px', border: 'none', background: active ? '#222' : 'transparent', color: active ? '#fff' : '#444', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '950', cursor: 'pointer', transition: 'all 0.2s'
});

const iconBtnStyle = (active: boolean) => ({
  width: '36px', height: '36px', border: 'none', background: active ? 'rgba(255,255,255,0.05)' : 'transparent', color: active ? '#fff' : '#333', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
});

const styleLabel = { fontSize: '0.65rem', color: '#444', fontWeight: '900', display: 'block', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '1px' };
const styleInput = { width: '100%', background: '#111', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', outline: 'none' };
