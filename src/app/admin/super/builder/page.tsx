'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Layout, Plus, Trash2, Move, Save, Image as ImageIcon, Type, Palette, Layers, 
  Monitor, Smartphone, Eye, Settings, ChevronDown, ChevronUp, Copy, ArrowLeft, 
  Search, X, Square, Circle, Triangle, MousePointer2, Maximize2
} from 'lucide-react';
import Link from 'next/link';
import { saveConfig } from '@/app/admin/etapas/actions';

// --- TIPOS DE ELEMENTOS (CANVA STYLE) ---
const ELEMENT_TYPES = [
  { type: 'TEXT', label: 'Texto', icon: Type, defaultContent: 'Novo Texto' },
  { type: 'SHAPE_RECT', label: 'Retângulo', icon: Square, defaultContent: '' },
  { type: 'SHAPE_CIRCLE', label: 'Círculo', icon: Circle, defaultContent: '' },
  { type: 'IMAGE', label: 'Imagem/Logo', icon: ImageIcon, defaultContent: '/hero-rodeo.png' },
];

const FONTS = ['Inter', 'Outfit', 'Montserrat', 'Bebas Neue', 'Oswald', 'Roboto Condensed', 'Black Ops One'];

export default function CanvaBuilder() {
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
      // Garantir que cada bloco tenha uma array de elements
      setBlocks(initialBlocks.map((b: any) => ({ ...b, elements: b.elements || [] })));
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
      alert('Erro ao publicar.');
      setIsSaving(false);
    }
  };

  // --- LÓGICA DE ELEMENTOS (CANVA) ---
  const addElementToBlock = (blockId: string, type: string) => {
    const typeInfo = ELEMENT_TYPES.find(t => t.type === type);
    const newElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 50,
      y: 50,
      w: type.startsWith('SHAPE') ? 150 : 300,
      h: type.startsWith('SHAPE') ? 100 : 50,
      content: typeInfo?.defaultContent || '',
      zIndex: 1,
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

  const deleteElement = (blockId: string, elementId: string) => {
    setBlocks(blocks.map(b => b.id === blockId ? {
      ...b,
      elements: b.elements.filter((el: any) => el.id !== elementId)
    } : b));
    setSelectedElementId(null);
  };

  const moveLayer = (blockId: string, elementId: string, dir: 'up' | 'down') => {
    setBlocks(blocks.map(b => b.id === blockId ? {
      ...b,
      elements: b.elements.map((el: any) => {
        if (el.id === elementId) {
          const newZ = dir === 'up' ? (el.zIndex || 1) + 1 : Math.max(1, (el.zIndex || 1) - 1);
          return { ...el, zIndex: newZ };
        }
        return el;
      })
    } : b));
  };

  // --- COMPONENTE DE ELEMENTO DRAGGABLE ---
  const DraggableElement = ({ blockId, element }: { blockId: string, element: any }) => {
    const isSelected = selectedElementId === element.id;
    const dragRef = useRef<any>(null);

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
            fontFamily: config?.fontFamily
          }}>{element.content}</div>;
        case 'SHAPE_RECT':
        case 'SHAPE_CIRCLE':
          return <div style={{ 
            width: '100%', height: '100%', 
            background: element.style?.background, 
            borderRadius: element.style?.borderRadius,
            opacity: element.style?.opacity 
          }} />;
        case 'IMAGE':
          return <img src={element.content} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />;
        default: return null;
      }
    };

    return (
      <div 
        ref={dragRef}
        onMouseDown={onMouseDown}
        style={{ 
          position: 'absolute', 
          left: element.x, 
          top: element.y, 
          width: element.type === 'TEXT' ? 'auto' : element.w, 
          height: element.type === 'TEXT' ? 'auto' : element.h,
          zIndex: element.zIndex || 1,
          cursor: isDragging ? 'grabbing' : 'grab',
          border: isSelected ? `2px solid ${config?.primaryColor || '#D4AF37'}` : '1px solid transparent',
          padding: element.type === 'TEXT' ? '5px' : '0'
        }}
      >
        {renderContent()}
        {isSelected && (
          <div style={{ position: 'absolute', top: -30, left: 0, background: '#111', padding: '4px', borderRadius: '4px', display: 'flex', gap: '5px' }}>
             <button onClick={() => deleteElement(blockId, element.id)} style={{ background: 'none', border: 'none', color: '#ff4444' }}><Trash2 size={12}/></button>
             <button onClick={() => moveLayer(blockId, element.id, 'up')} style={{ background: 'none', border: 'none', color: '#fff' }}><Layers size={12}/></button>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div style={{ color: '#fff', padding: '2rem' }}>Carregando Editor Canva-Style...</div>;

  const selectedElement = blocks.flatMap(b => b.elements).find(el => el.id === selectedElementId);
  const selectedBlockForElement = blocks.find(b => b.elements.some((el: any) => el.id === selectedElementId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* BARRA SUPERIOR */}
      <div style={{ padding: '0.75rem 1.5rem', background: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/admin/super" style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontSize: '0.8rem' }}>
             <ArrowLeft size={16} /> PAINEL
          </Link>
          <div style={{ display: 'flex', background: '#111', padding: '4px', borderRadius: '10px' }}>
            <button onClick={() => setActiveTab('HOME')} style={tabStyle(activeTab === 'HOME')}>WEB</button>
            <button onClick={() => setActiveTab('OVERLAYS')} style={tabStyle(activeTab === 'OVERLAYS')}>VMIX</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={saveLayout} disabled={isSaving} style={{ background: config?.primaryColor || '#D4AF37', color: '#000', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' }}>
            {isSaving ? 'SALVANDO...' : 'PUBLICAR DESIGN'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* 📚 BIBLIOTECA (CANVA SIDEBAR) */}
        <aside style={{ width: '280px', background: '#0a0a0a', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #1a1a1a' }}>
             <h3 style={{ fontSize: '0.7rem', color: '#444', fontWeight: '900', letterSpacing: '1px' }}>ELEMENTOS</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
             {ELEMENT_TYPES.map(type => (
               <div 
                key={type.type}
                onClick={() => {
                  if (!selectedBlockId) alert('Selecione uma seção no centro primeiro!');
                  else addElementToBlock(selectedBlockId, type.type);
                }}
                style={{ 
                  background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #222', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' 
                }}
               >
                 <type.icon size={20} color={config?.primaryColor} />
                 <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>{type.label}</span>
               </div>
             ))}
          </div>
          <div style={{ padding: '1rem', borderTop: '1px solid #1a1a1a' }}>
             <h3 style={{ fontSize: '0.7rem', color: '#444', fontWeight: '900', marginBottom: '1rem' }}>ESTILO GLOBAL</h3>
             <select value={config?.fontFamily} onChange={e => setConfig({...config, fontFamily: e.target.value})} style={styleInput}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
             </select>
          </div>
        </aside>

        {/* 🎭 PALCO LIVRE (CENTER) */}
        <main style={{ flex: 1, background: '#000', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
          <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
             {blocks.map((block) => (
               <div 
                key={block.id}
                onClick={() => setSelectedBlockId(block.id)}
                style={{ 
                  height: '500px', background: block.style?.background || '#111', 
                  borderRadius: '20px', position: 'relative', overflow: 'hidden',
                  border: selectedBlockId === block.id ? `2px solid ${config?.primaryColor}` : '2px solid transparent',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
               >
                 <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', fontSize: '0.6rem', color: '#444' }}>
                   BLOCO: {block.type}
                 </div>

                 {/* RENDERIZAR ELEMENTOS LIVRES */}
                 {block.elements.map((el: any) => (
                   <DraggableElement key={el.id} blockId={block.id} element={el} />
                 ))}

                 {block.elements.length === 0 && (
                   <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                      Clique aqui e adicione elementos da barra lateral
                   </div>
                 )}
               </div>
             ))}
          </div>
        </main>

        {/* ⚙️ INSPETOR DE ELEMENTO (RIGHT) */}
        <aside style={{ width: '320px', background: '#0a0a0a', borderLeft: '1px solid #222', padding: '1.5rem', overflowY: 'auto' }}>
           {selectedElement ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: config?.primaryColor }}>EDITAR {selectedElement.type}</h3>
                
                {selectedElement.type === 'TEXT' && (
                  <>
                    <div>
                      <label style={styleLabel}>CONTEÚDO DO TEXTO</label>
                      <textarea 
                        value={selectedElement.content} 
                        onChange={e => updateElement(selectedBlockId!, selectedElement.id, { content: e.target.value })}
                        style={{ ...styleInput, height: '80px' }}
                      />
                    </div>
                    <div>
                      <label style={styleLabel}>TAMANHO DA FONTE</label>
                      <input type="range" min="10" max="200" value={selectedElement.style?.fontSize} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value) } })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={styleLabel}>COR DO TEXTO</label>
                      <input type="color" value={selectedElement.style?.color} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, color: e.target.value } })} style={{ width: '100%', height: '40px', border: 'none', background: 'none' }} />
                    </div>
                  </>
                )}

                {(selectedElement.type === 'SHAPE_RECT' || selectedElement.type === 'SHAPE_CIRCLE') && (
                  <>
                    <div>
                      <label style={styleLabel}>LARGURA</label>
                      <input type="range" min="10" max="1200" value={selectedElement.w} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { w: parseInt(e.target.value) })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={styleLabel}>ALTURA</label>
                      <input type="range" min="10" max="800" value={selectedElement.h} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { h: parseInt(e.target.value) })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={styleLabel}>COR DE PREENCHIMENTO</label>
                      <input type="color" value={selectedElement.style?.background} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, background: e.target.value } })} style={{ width: '100%', height: '40px', border: 'none', background: 'none' }} />
                    </div>
                  </>
                )}

                <div>
                   <label style={styleLabel}>OPACIDADE ({selectedElement.style?.opacity})</label>
                   <input type="range" min="0" max="1" step="0.1" value={selectedElement.style?.opacity} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, opacity: parseFloat(e.target.value) } })} style={{ width: '100%' }} />
                </div>

                <button 
                  onClick={() => deleteElement(selectedBlockId!, selectedElement.id)}
                  style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', marginTop: '2rem', fontWeight: 'bold' }}
                >
                  DELETAR ELEMENTO
                </button>
             </div>
           ) : (
             <div style={{ textAlign: 'center', color: '#444', marginTop: '4rem' }}>
                <MousePointer2 size={48} style={{ marginBottom: '1rem', opacity: 0.1 }} />
                <p>Selecione um elemento no palco para editar suas propriedades.</p>
             </div>
           )}
        </aside>

      </div>
    </div>
  );
}

const tabStyle = (active: boolean) => ({
  padding: '6px 20px', border: 'none', background: active ? '#222' : 'transparent', color: active ? '#fff' : '#444', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer'
});

const styleLabel = { fontSize: '0.6rem', color: '#444', fontWeight: '900', display: 'block', marginBottom: '8px' };
const styleInput = { width: '100%', background: '#111', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', outline: 'none' };
