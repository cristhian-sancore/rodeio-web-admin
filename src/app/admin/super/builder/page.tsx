'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Layout, Plus, Trash2, Move, Save, Image as ImageIcon, Type, Palette, Layers, 
  Monitor, Smartphone, Eye, Settings, ChevronDown, ChevronUp, Copy, ArrowLeft, 
  Search, X, Square, Circle, Triangle, MousePointer2, Maximize2, Wand2, Play, Trophy, Zap,
  Undo2, Redo2, AlignCenter, AlignLeft, AlignRight, Sun
} from 'lucide-react';
import Link from 'next/link';
import { saveConfig } from '@/app/admin/etapas/actions';
import { removeBackgroundAction } from './actions';

// --- CONFIGURAÇÕES DE ELITE ---
const ELEMENT_TYPES = [
  { type: 'TEXT', label: 'Texto', icon: Type, defaultContent: 'CLIQUE PARA EDITAR' },
  { type: 'BUTTON', label: 'Botão', icon: MousePointer2, defaultContent: 'SAIBA MAIS' },
  { type: 'VIDEO', label: 'Vídeo / Player', icon: Play, defaultContent: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { type: 'DYNAMIC_CARD', label: 'Destaque (Cárd)', icon: Trophy, defaultContent: 'LIDER_ETAPA' },
  { type: 'SHAPE_RECT', label: 'Retângulo', icon: Square, defaultContent: '' },
  { type: 'SHAPE_CIRCLE', label: 'Círculo', icon: Circle, defaultContent: '' },
  { type: 'IMAGE', label: 'Imagem/Logo', icon: ImageIcon, defaultContent: '/hero-rodeo.png' },
];

const FONTS = ['Inter', 'Outfit', 'Montserrat', 'Bebas Neue', 'Oswald', 'Roboto Condensed', 'Black Ops One'];

export default function EliteVisualBuilder() {
  const [config, setConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'HOME' | 'OVERLAYS'>('HOME');
  const [blocks, setBlocks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [guides, setGuides] = useState<{ x?: number, y?: number } | null>(null);

  // ref para guardar blocos por aba sem re-render
  const tabBlocksRef = useRef<Record<string, any[]>>({});

  // Carregar dados UMA unica vez
  useEffect(() => {
    async function load() {
      const res = await fetch('/api/public/config');
      const data = await res.json();
      setConfig(data);
      const normalize = (arr: any[]) => (arr || []).map((b: any) => ({ ...b, elements: b.elements || [] }));
      tabBlocksRef.current = {
        HOME: normalize(data?.siteLayouts?.HOME),
        OVERLAYS: normalize(data?.siteLayouts?.OVERLAYS),
      };
      const homeBlocks = tabBlocksRef.current['HOME'];
      setBlocks(homeBlocks);
      addToHistory(homeBlocks);
      setLoading(false);
    }
    load();
  }, []); // <-- sem deps: carrega apenas 1 vez

  // Troca de aba SEM perder edicoes nao salvas
  const handleTabChange = (newTab: 'HOME' | 'OVERLAYS') => {
    if (newTab === activeTab) return;
    tabBlocksRef.current[activeTab] = blocks; // salva estado atual
    const nextBlocks = tabBlocksRef.current[newTab] || [];
    setBlocks(nextBlocks);
    setSelectedBlockId(null);
    setSelectedElementId(null);
    setActiveTab(newTab);
  };

  // --- SISTEMA DE HISTÓRICO AUTOMÁTICO ---
  useEffect(() => {
    if (loading) return;
    // Adiciona ao histórico apenas se os blocos realmente mudaram e não for um "undo/redo"
    const timeout = setTimeout(() => {
      const currentBlocksStr = JSON.stringify(blocks);
      const lastHistoryStr = historyIndex >= 0 ? JSON.stringify(history[historyIndex]) : '';
      
      if (currentBlocksStr !== lastHistoryStr) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(currentBlocksStr));
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [blocks]);

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setBlocks(JSON.parse(JSON.stringify(prev)));
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setBlocks(JSON.parse(JSON.stringify(next)));
      setHistoryIndex(historyIndex + 1);
    }
  };

  const saveLayout = async () => {
    setIsSaving(true);
    const formData = new FormData();
    const updatedLayouts = { ...(config?.siteLayouts || {}), [activeTab]: blocks };
    formData.append('siteLayouts', JSON.stringify(updatedLayouts));
    formData.append('primaryColor', config?.primaryColor || '#D4AF37');
    formData.append('secondaryColor', config?.secondaryColor || '#1a1a1a');
    formData.append('fontFamily', config?.fontFamily || 'Inter');
    formData.append('titulo', config?.titulo || 'RODEIO PRO');
    formData.append('removeBgApiKey', config?.removeBgApiKey || '');
    
    try {
      await saveConfig(formData);
      setIsSaving(false);
      alert('Design de Elite publicado com sucesso! 🚀💎');
    } catch (err: any) {
      console.error("ERRO AO PUBLICAR BUILDER:", err);
      alert('Erro ao publicar: ' + (err?.message || 'Falha na requisição. Veja o F12.'));
      setIsSaving(false);
    }
  };

  // --- GESTÃO DE ELEMENTOS (UNIVERSAL) ---
  const addElementToBlock = (blockId: string, type: string) => {
    const typeInfo = ELEMENT_TYPES.find(t => t.type === type);
    const newElement = {
      id: Math.random().toString(36).substr(2, 9),
      type, x: 100, y: 100,
      w: type.startsWith('SHAPE') ? 150 : 300,
      h: type.startsWith('SHAPE') ? 150 : 50,
      content: typeInfo?.defaultContent || '',
      zIndex: 10,
      style: {
        color: '#ffffff',
        background: type === 'SHAPE_RECT' ? config?.primaryColor || '#D4AF37' : 'transparent',
        fontSize: 24, fontWeight: '950',
        borderRadius: type === 'SHAPE_CIRCLE' ? '100%' : '0px',
        opacity: 1, textAlign: 'center', shadowBlur: 0, shadowColor: '#000000', letterSpacing: 0,
      }
    };

    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, elements: [...(b.elements || []), newElement] } : b));
    setSelectedElementId(newElement.id);
    setSelectedBlockId(blockId);
  };

  const updateElement = (blockId: string, elementId: string, updates: any) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? {
      ...b,
      elements: b.elements.map((el: any) => el.id === elementId ? { 
        ...el, 
        ...updates, 
        style: { ...el.style, ...(updates.style || {}) } 
      } : el)
    } : b));
  };

  const deleteElement = (blockId: string, elementId: string) => {
    if (!confirm('Deseja realmente excluir este elemento?')) return;
    setBlocks(prev => prev.map(b => b.id === blockId ? {
      ...b,
      elements: b.elements.filter((el: any) => el.id !== elementId)
    } : b));
    setSelectedElementId(null);
  };

  const duplicateElement = (blockId: string, element: any) => {
    const newEl = { 
      ...JSON.parse(JSON.stringify(element)), 
      id: Math.random().toString(36).substr(2, 9), 
      x: element.x + 20, 
      y: element.y + 20 
    };
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, elements: [...b.elements, newEl] } : b));
    setSelectedElementId(newEl.id);
  };

  // --- GESTÃO DE BLOCOS (SEÇÕES) ---
  const addBlock = () => {
    const newBlock = {
      id: 'block_' + Math.random().toString(36).substr(2, 9),
      type: 'CUSTOM',
      visible: true,
      title: 'NOVA SEÇÃO',
      subtitle: 'Personalize este espaço',
      style: { background: '#0a0a0a', minHeight: 600, padding: 80 },
      elements: []
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const deleteBlock = (id: string) => {
    if (!confirm('Excluir esta seção inteira e todos os seus elementos?')) return;
    setBlocks(prev => prev.filter(b => b.id !== id));
    setSelectedBlockId(null);
    setSelectedElementId(null);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateBlockStyle = (blockId: string, styleUpdates: any) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, style: { ...b.style, ...styleUpdates } } : b));
  };

  // --- RENDERIZADOR ELITE COM GUIAS ---
  const VisualElement = ({ blockId, element }: { blockId: string, element: any }) => {
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
        let newX = moveE.clientX - startX;
        let newY = moveE.clientY - startY;

        // ALINHAMENTO INTELIGENTE (SNAPPING)
        const snapThreshold = 15;
        const blockW = 1200; // Aproximado
        const blockH = 600;
        
        let guideX = undefined;
        let guideY = undefined;

        if (Math.abs(newX + (element.w || 100)/2 - blockW/2) < snapThreshold) {
           newX = blockW/2 - (element.w || 100)/2;
           guideX = blockW/2;
        }
        if (Math.abs(newY + (element.h || 50)/2 - blockH/2) < snapThreshold) {
           newY = blockH/2 - (element.h || 50)/2;
           guideY = blockH/2;
        }

        setGuides({ x: guideX, y: guideY });
        updateElement(blockId, element.id, { x: newX, y: newY }, true);
      };

      const onMouseUp = () => {
        setIsDragging(false);
        setGuides(null);
        addToHistory(blocks);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const elementStyle: React.CSSProperties = {
      position: 'absolute', left: element.x, top: element.y,
      width: element.type === 'TEXT' ? 'auto' : element.w,
      height: element.type === 'TEXT' ? 'auto' : element.h,
      zIndex: element.zIndex || 1,
      cursor: isDragging ? 'grabbing' : 'grab',
      border: isSelected ? `2px solid ${config?.primaryColor || '#D4AF37'}` : '1px solid transparent',
      padding: element.type === 'TEXT' ? '10px' : '0',
      opacity: element.style?.opacity || 1,
      boxShadow: element.type !== 'TEXT' && element.style?.shadowBlur > 0 ? `0 0 ${element.style.shadowBlur}px ${element.style.shadowColor}` : 'none',
      textShadow: element.type === 'TEXT' && element.style?.shadowBlur > 0 ? `0 0 ${element.style.shadowBlur}px ${element.style.shadowColor}` : 'none',
    };

    const renderContent = () => {
      switch (element.type) {
        case 'TEXT':
          return <div style={{ 
            fontSize: `${element.style?.fontSize || 24}px`, fontWeight: element.style?.fontWeight || '950',
            color: element.style?.color, textAlign: element.style?.textAlign as any, fontFamily: config?.fontFamily,
            letterSpacing: `${element.style?.letterSpacing || 0}px`, lineHeight: 1
          }}>{element.content}</div>;
        case 'BUTTON':
          return (
            <button style={{ 
              width: '100%', height: '100%', background: element.style?.background || '#ff4444', 
              color: element.style?.color || '#fff', borderRadius: element.style?.borderRadius || '8px',
              border: 'none', fontWeight: element.style?.fontWeight || 'bold', fontSize: `${element.style?.fontSize || 16}px`,
              cursor: 'pointer'
            }}>
              {element.content}
            </button>
          );
        case 'DYNAMIC_CARD':
          return (
            <div style={{ width: '100%', height: '100%', background: '#111', borderRadius: '15px', border: '1px solid #333', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', color: '#fff' }}>
               <Trophy size={32} color={config?.primaryColor || '#d4af37'} style={{ marginBottom: '10px' }} />
               <div style={{ fontSize: '0.8rem', fontWeight: 900, color: config?.primaryColor || '#d4af37' }}>CARTÃO DINÂMICO</div>
               <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '5px' }}>{element.content}</div>
            </div>
          );
        case 'VIDEO': {
          const isYouTube = element.content?.includes('youtube.com') || element.content?.includes('youtu.be');
          const isDrive = element.content?.includes('drive.google.com');
          const isDirectMp4 = element.content?.endsWith('.mp4');

          let srcUrl = element.content;
          if (isYouTube) {
            const videoId = element.content.includes('v=') ? element.content.split('v=')[1].split('&')[0] : element.content.split('/').pop();
            srcUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
          } else if (isDrive) {
            srcUrl = element.content.replace('/view', '/preview').split('?')[0];
            if (!srcUrl.endsWith('/preview')) srcUrl += '/preview';
          }

          return (
            <div style={{ width: '100%', height: '100%', background: '#111', borderRadius: element.style?.borderRadius, overflow: 'visible', position: 'relative' }}>
              {isDirectMp4 ? (
                <video src={srcUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
              ) : (
                <iframe width="100%" height="100%" src={srcUrl} title="Video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ pointerEvents: 'none' }}></iframe>
              )}
              {/* O overlay transparente evita que cliques no iframe interfiram com o arrastar e soltar do Builder */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}></div>
            </div>
          );
        }
        case 'SHAPE_RECT':
        case 'SHAPE_CIRCLE':
          return <div style={{ width: '100%', height: '100%', background: element.style?.background, borderRadius: element.style?.borderRadius }} />;
        case 'IMAGE':
          return <img src={element.content} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />;
        default: return null;
      }
    };

    return (
      <div onMouseDown={onMouseDown} style={elementStyle}>
        {renderContent()}
        {isSelected && (
          <div style={{ position: 'absolute', top: -42, left: 0, background: '#1a1a1a', padding: '6px 10px', borderRadius: '10px', display: 'flex', gap: '4px', boxShadow: '0 5px 20px rgba(0,0,0,0.7)', zIndex: 9999, border: '1px solid #333', whiteSpace: 'nowrap' }}>
            <button title="Subir camada" onClick={(e) => { e.stopPropagation(); updateElement(blockId, element.id, { zIndex: (element.zIndex || 1) + 1 }); }} style={{ background: 'none', border: 'none', color: config?.primaryColor || '#d4af37', cursor: 'pointer', padding: '4px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '3px' }}>▲ FRENTE</button>
            <button title="Descer camada" onClick={(e) => { e.stopPropagation(); updateElement(blockId, element.id, { zIndex: Math.max(1, (element.zIndex || 1) - 1) }); }} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '4px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '3px' }}>▼ ATRÁS</button>
            <div style={{ width: '1px', background: '#333', margin: '0 4px' }} />
            <button title="Duplicar" onClick={(e) => { e.stopPropagation(); duplicateElement(blockId, element); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}><Copy size={14}/></button>
            <button title="Excluir" onClick={(e) => { e.stopPropagation(); deleteElement(blockId, element.id); }} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={14}/></button>
            <div style={{ fontSize: '0.6rem', color: '#444', padding: '4px', alignSelf: 'center' }}>Z:{element.zIndex || 1}</div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>💎 Carregando Estúdio de Elite...</div>;

  const selectedElement = blocks.flatMap(b => b.elements).find(el => el.id === selectedElementId);
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar { display: none !important; }
        .main-content { margin-left: 0 !important; padding: 0 !important; max-width: 100vw !important; min-height: 100vh !important; }
        header.mobile-header { display: none !important; }
      `}} />
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#050505', color: '#fff', overflow: 'hidden' }}>
      {/* 🚀 BARRA DE ELITE (TOP) */}
      <header style={{ height: '70px', background: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 25px', zIndex: 100 }}>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <Link href="/admin/super" style={{ color: '#444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: '900' }}>
            <ArrowLeft size={16} /> PAINEL
          </Link>
          <div style={{ width: '1px', height: '24px', background: '#222' }} />
          <div style={{ fontSize: '1rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>
            {activeTab === 'HOME' ? 'SITE WEB' : 'OVERLAY'} <span style={{ color: config?.primaryColor || '#d4af37', marginLeft: '5px' }}>{config?.titulo && config.titulo !== 'undefined' ? config.titulo : ''}</span>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#222' }} />
          <div style={{ display: 'flex', background: '#111', padding: '4px', borderRadius: '12px' }}>
             <button onClick={undo} disabled={historyIndex <= 0} style={iconBtnStyle(false)}><Undo2 size={18} /></button>
             <button onClick={redo} disabled={historyIndex >= history.length - 1} style={iconBtnStyle(false)}><Redo2 size={18} /></button>
          </div>
          <div style={{ display: 'flex', background: '#111', padding: '4px', borderRadius: '12px' }}>
            <button onClick={() => handleTabChange('HOME')} style={tabStyle(activeTab === 'HOME')}>SITE WEB</button>
            <button onClick={() => handleTabChange('OVERLAYS')} style={tabStyle(activeTab === 'OVERLAYS')}>vMIX OVERLAY</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
           <button onClick={() => {
             if(!confirm('Migrar apagará o design visual atual e ativará o modo de blocos padrão. Continuar?')) return;
             const standardBlocks = [
               { id: 'hero', type: 'HERO', visible: true, title: config?.homeHeroTitle || 'NOME DO EVENTO', subtitle: config?.homeHeroSubtitle || 'Subtítulo do evento', style: { background: '#0a0a0a', align: 'center' }, elements: [] },
               { id: 'highlights', type: 'HIGHLIGHTS', visible: true, title: 'DESTAQUES DA ETAPA', subtitle: 'Os melhores resultados', style: { background: '#111', align: 'left', borderRadius: 12 }, elements: [] },
               { id: 'rankings', type: 'RANKINGS', visible: true, title: 'RANKING GERAL', subtitle: 'Classificação oficial', style: { background: '#0a0a0a', align: 'left', borderRadius: 60 }, elements: [] }
             ];
             setBlocks(standardBlocks);
             addToHistory(standardBlocks);
           }} style={{
             background: '#111', color: '#fff', border: '1px solid #222', padding: '12px 20px', 
             borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
           }}>
             <Wand2 size={18} /> MIGRAR PADRÃO
           </button>

           <button onClick={saveLayout} disabled={isSaving} style={{ 
             background: 'linear-gradient(135deg, #d4af37 0%, #aa8b2c 100%)', color: '#000', border: 'none', padding: '12px 30px', 
             borderRadius: '12px', fontWeight: '950', cursor: 'pointer', boxShadow: '0 8px 25px rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', gap: '10px'
           }}>
             {isSaving ? 'PUBLICAÇÃO DE ELITE...' : <><Zap size={18} /> PUBLICAR DESIGN</>}
           </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* 📚 BIBLIOTECA (LEFT) */}
        <aside style={{ width: '300px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '25px', overflowY: 'auto' }}>
           <h3 style={{ fontSize: '0.65rem', color: '#444', fontWeight: '900', letterSpacing: '2px', marginBottom: '25px' }}>BIBLIOTECA ELITE</h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {ELEMENT_TYPES.map(type => (
                <div 
                  key={type.type} 
                  onClick={() => selectedBlockId && addElementToBlock(selectedBlockId, type.type)}
                  style={{ 
                    background: '#111', padding: '25px', borderRadius: '20px', border: '1px solid #222', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.3s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = config?.primaryColor; e.currentTarget.style.transform = 'translateY(-5px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <type.icon size={28} color={config?.primaryColor} />
                  <span style={{ fontSize: '0.75rem', fontWeight: '900' }}>{type.label}</span>
                </div>
              ))}
           </div>

           <div style={{ marginTop: '50px', paddingTop: '25px', borderTop: '1px solid #1a1a1a' }}>
              <h3 style={{ fontSize: '0.65rem', color: '#444', fontWeight: '900', marginBottom: '25px' }}>CONFIGURAÇÕES GLOBAIS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div><label style={styleLabel}>FONTE PRINCIPAL</label><select value={config?.fontFamily} onChange={e => setConfig({...config, fontFamily: e.target.value})} style={styleInput}>{FONTS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                 <div><label style={styleLabel}>ESTILO DE TELA</label><div style={{ display: 'flex', gap: '10px' }}><button onClick={() => setPreviewMode('desktop')} style={iconBtnStyle(previewMode === 'desktop')}><Monitor size={18} /></button><button onClick={() => setPreviewMode('mobile')} style={iconBtnStyle(previewMode === 'mobile')}><Smartphone size={18} /></button></div></div>
              </div>
           </div>
        </aside>

        {/* 🎭 PALCO (CENTER) */}
        <main style={{ flex: 1, background: '#000', overflowY: 'auto', padding: '50px', position: 'relative' }}>
           <div style={{ width: previewMode === 'desktop' ? '1200px' : '375px', margin: '0 auto', transition: 'all 0.5s', fontFamily: config?.fontFamily || 'Inter' }}>
              
              {/* Navbar Fake para dar contexto de site */}
              {activeTab === 'HOME' && (
                <div style={{ height: '70px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: '20px', opacity: 0.6 }}>
                   <div style={{ color: config?.primaryColor || '#d4af37', fontWeight: 900, fontSize: '1.2rem' }}>{config?.titulo && config.titulo !== 'undefined' ? config.titulo : 'RODEIO PRO'}</div>
                   <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                      <span>AO VIVO</span><span>RANKINGS</span><span>COMPETIDORES</span>
                   </div>
                </div>
              )}
              {blocks.map((block, bIdx) => (
                <section 
                  key={block.id}
                  onClick={() => { setSelectedBlockId(block.id); setSelectedElementId(null); }}
                  style={{ 
                    position: 'relative', 
                    minHeight: block.style?.minHeight || 650, 
                    background: block.style?.backgroundImage ? `url(${block.style.backgroundImage}) center/cover no-repeat` : block.style?.background || '#050505',
                    border: selectedBlockId === block.id ? `3px solid ${config?.primaryColor}` : '1px solid #111',
                    marginBottom: '30px', borderRadius: '30px', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', opacity: block.visible === false ? 0.3 : 1,
                    overflow: 'visible'
                  }}
                >
                  {/* CONTROLES DA SECAO */}
                  <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 15, right: 15, display: 'flex', gap: '8px', zIndex: 1000 }}>
                    <button onClick={e => { e.stopPropagation(); moveBlock(bIdx, 'up'); }} style={{ background: '#111', border: '1px solid #333', color: '#fff', cursor: 'pointer', borderRadius: '8px', padding: '6px' }}><ArrowUp size={14}/></button>
                    <button onClick={e => { e.stopPropagation(); moveBlock(bIdx, 'down'); }} style={{ background: '#111', border: '1px solid #333', color: '#fff', cursor: 'pointer', borderRadius: '8px', padding: '6px' }}><ArrowDown size={14}/></button>
                    <button onClick={e => { e.stopPropagation(); const nb = blocks.map(b => b.id === block.id ? { ...b, visible: b.visible === false } : b); setBlocks(nb); }} style={{ background: '#111', border: '1px solid #333', color: block.visible === false ? '#555' : '#fff', cursor: 'pointer', borderRadius: '8px', padding: '6px 12px', fontSize: '0.65rem', fontWeight: 900 }}>
                      {block.visible === false ? 'OCULTA' : 'VISÍVEL'}
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteBlock(block.id); }} style={{ background: '#1a0000', border: '1px solid #440000', color: '#ff4444', cursor: 'pointer', borderRadius: '8px', padding: '6px 12px', fontSize: '0.65rem', fontWeight: 900 }}>
                      EXCLUIR
                    </button>
                  </div>

                  {block.elements.map((el: any) => (
                    <VisualElement key={el.id} blockId={block.id} element={el} />
                  ))}

                  {block.elements.length === 0 && <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1, fontSize: '2rem', fontWeight: 900 }}>{block.type} (VAZIO)</div>}
                </section>
              ))}
           </div>
        
           <div onClick={addBlock} style={{ width: previewMode === 'desktop' ? '1200px' : '375px', margin: '0 auto 100px', height: '100px', border: '3px dashed #111', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#222', fontWeight: 900, fontSize: '1rem', letterSpacing: '3px', transition: 'all 0.3s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = config?.primaryColor || '#d4af37'; (e.currentTarget as HTMLElement).style.color = config?.primaryColor || '#d4af37'; (e.currentTarget as HTMLElement).style.background = '#050505'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#111'; (e.currentTarget as HTMLElement).style.color = '#222'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>+ ADICIONAR NOVA SEÇÃO DE ELITE</div>
        </main>

        {/* ⚙️ INSPETOR ELITE (RIGHT) */}
        <aside style={{ width: '350px', background: '#0a0a0a', borderLeft: '1px solid #222', padding: '25px', overflowY: 'auto' }}>
           {selectedElement ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <h3 style={{ fontSize: '0.85rem', fontWeight: '950', color: config?.primaryColor }}>DESIGN DO ELEMENTO</h3>
                   <button onClick={() => setSelectedElementId(null)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><X size={24}/></button>
                </div>

                {selectedElement.type === 'TEXT' && (
                  <>
                    <div><label style={styleLabel}>CONTEÚDO</label><textarea value={selectedElement.content} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { content: e.target.value })} style={{ ...styleInput, height: '100px' }} /></div>
                    <div><label style={styleLabel}>TAMANHO ({selectedElement.style?.fontSize}px)</label><input type="range" min="10" max="400" value={selectedElement.style?.fontSize} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value) } })} style={{ width: '100%' }} /></div>
                    <div><label style={styleLabel}>ESPAÇAMENTO LETRAS ({selectedElement.style?.letterSpacing}px)</label><input type="range" min="-10" max="50" value={selectedElement.style?.letterSpacing} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, letterSpacing: parseInt(e.target.value) } })} style={{ width: '100%' }} /></div>
                  </>
                )}

                {selectedElement.type === 'IMAGE' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <label style={styleLabel}>URL DA IMAGEM</label><input value={selectedElement.content} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { content: e.target.value })} style={styleInput} />
                    <button onClick={async () => {
                       const btn = document.activeElement as HTMLButtonElement; btn.innerText = 'PROCESSANDO...';
                       try { const res = await removeBackgroundAction(selectedElement.content); updateElement(selectedBlockId!, selectedElement.id, { content: res }); } catch (e: any) { alert(e.message); }
                       btn.innerText = 'REMOVER FUNDO (AI)';
                    }} style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)', color: '#fff', border: 'none', padding: '12px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>✨ REMOVER FUNDO (AI)</button>
                  </div>
                )}
                {selectedElement.type === 'VIDEO' && (
                  <div><label style={styleLabel}>URL DO VÍDEO (Drive, MP4 ou YouTube)</label><input value={selectedElement.content} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { content: e.target.value })} style={styleInput} placeholder="https://drive.google.com/..." /></div>
                )}
                {selectedElement.type === 'BUTTON' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div><label style={styleLabel}>TEXTO DO BOTÃO</label><input value={selectedElement.content} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { content: e.target.value })} style={styleInput} /></div>
                    <div><label style={styleLabel}>LINK (URL)</label><input value={selectedElement.style?.link || ''} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, link: e.target.value } })} style={styleInput} placeholder="/ranking" /></div>
                    <div><label style={styleLabel}>TAMANHO DA FONTE ({selectedElement.style?.fontSize || 16}px)</label><input type="range" min="10" max="100" value={selectedElement.style?.fontSize || 16} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value) } })} style={{ width: '100%' }} /></div>
                  </div>
                )}
                {selectedElement.type === 'DYNAMIC_CARD' && (
                  <div>
                    <label style={styleLabel}>DADO DO DESTAQUE</label>
                    <select value={selectedElement.content} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { content: e.target.value })} style={styleInput}>
                      <option value="LIDER_ETAPA">Líder da Etapa (Competidor)</option>
                      <option value="ANIMAL_ETAPA">Melhor Animal (Etapa)</option>
                      <option value="MELHOR_NOITE_COMP">Melhor da Noite (Competidor)</option>
                      <option value="MELHOR_NOITE_ANIMAL">Melhor da Noite (Animal)</option>
                      <option value="CAMPEAO_TEMP">Líder do Campeonato (Competidor)</option>
                      <option value="ANIMAL_TEMP">Líder do Campeonato (Animal)</option>
                    </select>
                  </div>
                )}
                {selectedElement.type !== 'TEXT' && selectedElement.type !== 'DYNAMIC_CARD' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div><label style={styleLabel}>LARGURA ({selectedElement.w}px)</label><input type="range" min="10" max="1200" value={selectedElement.w || 100} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { w: parseInt(e.target.value) })} style={{ width: '100%' }} /></div>
                    <div><label style={styleLabel}>ALTURA ({selectedElement.h}px)</label><input type="range" min="10" max="1200" value={selectedElement.h || 100} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { h: parseInt(e.target.value) })} style={{ width: '100%' }} /></div>
                  </div>
                )}
                {selectedElement.type === 'DYNAMIC_CARD' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div><label style={styleLabel}>LARGURA ({selectedElement.w}px)</label><input type="range" min="150" max="800" value={selectedElement.w || 300} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { w: parseInt(e.target.value) })} style={{ width: '100%' }} /></div>
                    <div><label style={styleLabel}>ALTURA ({selectedElement.h}px)</label><input type="range" min="150" max="800" value={selectedElement.h || 350} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { h: parseInt(e.target.value) })} style={{ width: '100%' }} /></div>
                  </div>
                )}

                {/* 🌈 SOMBRAS (PARA TODOS OS ELEMENTOS) */}
                <div style={{ background: '#111', padding: '20px', borderRadius: '20px', border: '1px solid #222' }}>
                   <label style={{ ...styleLabel, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}><Sun size={14} /> SOMBRA PROJETADA (DROP SHADOW)</label>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                      <div><label style={{ fontSize: '0.6rem', color: '#666' }}>INTENSIDADE (BLUR)</label><input type="range" min="0" max="100" value={selectedElement.style?.shadowBlur} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, shadowBlur: parseInt(e.target.value) } })} style={{ width: '100%' }} /></div>
                      <div><label style={{ fontSize: '0.6rem', color: '#666' }}>COR DA SOMBRA</label><input type="color" value={selectedElement.style?.shadowColor?.startsWith('#') ? selectedElement.style.shadowColor : '#000000'} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, shadowColor: e.target.value } })} style={{ width: '100%', height: '40px', background: 'none', border: 'none', cursor: 'pointer' }} /></div>
                   </div>
                </div>

                <div>
                   <label style={styleLabel}>COR PRINCIPAL</label>
                   <input type="color" value={selectedElement.type === 'TEXT' ? selectedElement.style?.color : selectedElement.style?.background} onChange={e => updateElement(selectedBlockId!, selectedElement.id, { style: { ...selectedElement.style, [selectedElement.type === 'TEXT' ? 'color' : 'background']: e.target.value } })} style={{ width: '100%', height: '50px', background: 'none', border: 'none', cursor: 'pointer' }} />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                   <button onClick={() => deleteElement(selectedBlockId!, selectedElement.id)} style={{ flex: 1, background: '#1a1a1a', color: '#ff4444', border: '1px solid #222', padding: '15px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}>EXCLUIR</button>
                   <button onClick={() => duplicateElement(selectedBlockId!, selectedElement)} style={{ flex: 1, background: '#1a1a1a', color: '#fff', border: '1px solid #222', padding: '15px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}>DUPLICAR</button>
                </div>
             </div>
           ) : selectedBlock ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '950', color: config?.primaryColor }}>CONFIGURAÇÕES DA SEÇÃO</h3>
                <div>
                  <label style={styleLabel}>TÍTULO DA SEÇÃO</label>
                  <input value={selectedBlock.title || ''} onChange={e => { const nb = blocks.map(b=>b.id===selectedBlock.id?{...b,title:e.target.value}:b); setBlocks(nb); addToHistory(nb); }} style={styleInput} placeholder="Ex: NOME DO EVENTO" />
                </div>
                <div>
                  <label style={styleLabel}>SUBTÍTULO</label>
                  <input value={selectedBlock.subtitle || ''} onChange={e => { const nb = blocks.map(b=>b.id===selectedBlock.id?{...b,subtitle:e.target.value}:b); setBlocks(nb); addToHistory(nb); }} style={styleInput} placeholder="Ex: A maior plataforma" />
                </div>
                <div>
                  <label style={styleLabel}>FUNDO DA SEÇÃO</label>
                  <input type="color" value={selectedBlock.style?.background || '#050505'} onChange={e => { const nb = blocks.map(b=>b.id===selectedBlock.id?{...b,style:{...b.style,background:e.target.value}}:b); setBlocks(nb); addToHistory(nb); }} style={{ width: '100%', height: '60px', background: 'none', border: 'none', cursor: 'pointer' }} />
                </div>
                                {(selectedBlock.elements?.length || 0) > 0 && (
                  <div>
                    <label style={styleLabel}>CAMADAS ({selectedBlock.elements.length})</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[...selectedBlock.elements].sort((a: any, b: any) => (b.zIndex || 1) - (a.zIndex || 1)).map((el: any) => (
                        <div key={el.id} onClick={() => { setSelectedElementId(el.id); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: selectedElementId === el.id ? `${config?.primaryColor || '#d4af37'}22` : '#111', border: `1px solid ${selectedElementId === el.id ? (config?.primaryColor || '#d4af37') : '#222'}`, padding: '9px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s' }}>
                          <span style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900, minWidth: '22px' }}>Z{el.zIndex || 1}</span>
                          <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 700, flex: 1, overflow: 'visible', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.type}{el.content ? ` — ${String(el.content).substring(0,16)}` : ''}</span>
                          <button onClick={(e) => { e.stopPropagation(); updateElement(selectedBlock.id, el.id, { zIndex: (el.zIndex || 1) + 1 }); }} style={{ background: 'none', border: 'none', color: config?.primaryColor || '#d4af37', cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem', padding: '2px 5px' }}>&#x25B2;</button>
                          <button onClick={(e) => { e.stopPropagation(); updateElement(selectedBlock.id, el.id, { zIndex: Math.max(1, (el.zIndex || 1) - 1) }); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem', padding: '2px 5px' }}>&#x25BC;</button>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.65rem', color: '#444', marginTop: '8px' }}>Clique para selecionar qualquer elemento, mesmo que esteja atras de outro.</p>
                  </div>
                )}<p style={{ fontSize: '0.7rem', color: '#444' }}>Dica: Se a seção não tiver elementos visuais, este título e subtítulo serão usados no layout padrão responsivo.</p>
             </div>
           ) : (
             <div style={{ textAlign: 'center', color: '#1a1a1a', marginTop: '10rem' }}>
                <MousePointer2 size={80} style={{ marginBottom: '30px', opacity: 0.1 }} />
                <p style={{ fontSize: '0.8rem', fontWeight: '900', color: '#333' }}>ESTÚDIO DE ELITE</p>
                <p style={{ fontSize: '0.7rem' }}>Selecione um elemento para começar.</p>
             </div>
           )}
        </aside>

      </div>
      </div>
    </>
  );
}

const tabStyle = (active: boolean) => ({
  padding: '10px 25px', border: 'none', background: active ? '#222' : 'transparent', color: active ? '#fff' : '#444', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '950', cursor: 'pointer', transition: 'all 0.3s'
});

const iconBtnStyle = (active: boolean) => ({
  width: '40px', height: '40px', border: 'none', background: active ? 'rgba(255,255,255,0.08)' : 'transparent', color: active ? '#fff' : '#444', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
});

const styleLabel = { fontSize: '0.65rem', color: '#444', fontWeight: '950', display: 'block', marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '1.5px' };
const styleInput = { width: '100%', background: '#111', border: '1px solid #222', color: '#fff', padding: '15px', borderRadius: '12px', fontSize: '0.9rem', outline: 'none', transition: 'border 0.2s' };


