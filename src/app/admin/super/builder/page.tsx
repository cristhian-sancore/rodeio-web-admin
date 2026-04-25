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
  Palette
} from 'lucide-react';
import Link from 'next/link';
import { saveConfig } from '@/app/admin/etapas/actions';

const PAGES = [
  { id: 'HOME', label: 'Página Inicial', icon: <Home size={18} /> },
  { id: 'RANKING', label: 'Rankings Públicos', icon: <Trophy size={18} /> },
  { id: 'COMPETIDORES', label: 'Atletas', icon: <Users size={18} /> },
  { id: 'ANIMAIS', label: 'Boiada', icon: <Cat size={18} /> },
];

const BLOCK_TYPES = [
  { type: 'HERO', label: 'Banner Principal', icon: '🖼️', pages: ['HOME'] },
  { type: 'HIGHLIGHTS', label: 'Destaques', icon: '🎬', pages: ['HOME'] },
  { type: 'RANKINGS', label: 'Ranking', icon: '🏆', pages: ['HOME', 'RANKING'] },
  { type: 'FEATURES', label: 'Cards de Info', icon: '✨', pages: ['HOME'] },
  { type: 'GALLERY', label: 'Galeria de Fotos', icon: '📷', pages: ['HOME', 'COMPETIDORES', 'ANIMAIS'] },
  { type: 'SPONSORS', label: 'Patrocinadores', icon: '🤝', pages: ['HOME'] },
];

export default function SiteBuilderPage() {
  const [activePage, setActivePage] = useState('HOME');
  const [layouts, setLayouts] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');

  // Carregar configurações iniciais
  useEffect(() => {
    async function load() {
      const res = await fetch('/api/public/config');
      const config = await res.json();
      setLayouts(config.siteLayouts || {
        HOME: [
          { id: 'h1', type: 'HERO', title: 'Banner Principal', visible: true },
          { id: 'r1', type: 'RANKINGS', title: 'Ranking Home', visible: true }
        ],
        RANKING: [{ id: 'rr1', type: 'RANKINGS', title: 'Ranking Completo', visible: true }],
        COMPETIDORES: [{ id: 'cc1', type: 'GALLERY', title: 'Grid de Atletas', visible: true }],
        ANIMAIS: [{ id: 'aa1', type: 'GALLERY', title: 'Grid de Animais', visible: true }]
      });
      setLoading(false);
    }
    load();
  }, []);

  const currentLayout = layouts[activePage] || [];

  function updateLayout(newLayout: any[]) {
    setLayouts({ ...layouts, [activePage]: newLayout });
  }

  function move(index: number, direction: 'up' | 'down') {
    const newLayout = [...currentLayout];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newLayout.length) return;
    [newLayout[index], newLayout[target]] = [newLayout[target], newLayout[index]];
    updateLayout(newLayout);
  }

  function addBlock(type: string) {
    const newBlock = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      title: BLOCK_TYPES.find(b => b.type === type)?.label || 'Nova Seção',
      visible: true
    };
    updateLayout([...currentLayout, newBlock]);
  }

  async function handleSave() {
    setSaving(true);
    const formData = new FormData();
    formData.set('siteLayouts', JSON.stringify(layouts));
    // Fallback para homeLayout para manter compatibilidade
    formData.set('homeLayout', JSON.stringify(layouts.HOME || []));
    
    try {
      await saveConfig(formData);
      alert('✅ Site atualizado com sucesso!');
    } catch (err) {
      alert('❌ Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ color: '#fff', padding: '2rem' }}>Carregando Construtor...</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff' }}>
      
      {/* Top Bar */}
      <header style={{ height: '60px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', background: '#0a0a0a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin/super" style={{ color: '#666' }}><ArrowLeft size={20} /></Link>
          <div style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Layout size={20} color="var(--primary)" /> SITE BUILDER <span style={{ color: '#333' }}>|</span> <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>PRO</span>
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
          style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Save size={18} /> {saving ? 'Publicando...' : 'PUBLICAR SITE'}
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Sidebar: Page Selector */}
        <aside style={{ width: '280px', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
          <div style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.7rem', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>Páginas do Site</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {PAGES.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setActivePage(p.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: activePage === p.id ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    color: activePage === p.id ? 'var(--primary)' : '#888',
                    fontWeight: activePage === p.id ? 'bold' : 'normal'
                  }}
                >
                  {p.icon} {p.label}
                  {activePage === p.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.7rem', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>Estrutura da Página</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {currentLayout.map((block: any, idx: number) => (
                 <div key={block.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                       <ChevronUp size={12} onClick={() => move(idx, 'up')} style={{ cursor: 'pointer', opacity: idx === 0 ? 0.2 : 0.6 }} />
                       <ChevronDown size={12} onClick={() => move(idx, 'down')} style={{ cursor: 'pointer', opacity: idx === currentLayout.length-1 ? 0.2 : 0.6 }} />
                    </div>
                    <span style={{ fontSize: '1.2rem' }}>{BLOCK_TYPES.find(b => b.type === block.type)?.icon}</span>
                    <div style={{ flex: 1, fontSize: '0.8rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.title}</div>
                    <button onClick={() => updateLayout(currentLayout.filter((_:any, i:any) => i !== idx))} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                 </div>
               ))}
               <button 
                onClick={() => {}} // Abrir modal de add
                style={{ padding: '10px', border: '1px dashed #333', background: 'transparent', color: '#666', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer' }}
               >
                 + ADICIONAR SEÇÃO
               </button>
            </div>
          </div>
        </aside>

        {/* Center: Live Preview */}
        <main style={{ flex: 1, padding: '2rem', background: '#000', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
           <div style={{ 
             width: previewMode === 'desktop' ? '100%' : '375px', 
             minHeight: '100%', 
             background: '#0a0a0a', 
             borderRadius: '12px', 
             border: '4px solid #1a1a1a',
             boxShadow: '0 0 50px rgba(0,0,0,0.5)',
             transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
             padding: '1rem'
           }}>
              {/* Header Preview */}
              <div style={{ borderBottom: '1px solid #1a1a1a', padding: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ fontWeight: '900', fontSize: '0.8rem' }}>LOGO RODEIO</div>
                 <div style={{ display: 'flex', gap: '15px', fontSize: '0.6rem', color: '#666' }}>
                    <span>HOME</span><span>RANKING</span><span>ATLETAS</span>
                 </div>
              </div>

              {/* Dynamic Content Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                 {currentLayout.map((block: any) => (
                   <div key={block.id} style={{ 
                     background: 'rgba(212, 175, 55, 0.05)', 
                     border: '1px solid rgba(212, 175, 55, 0.1)', 
                     padding: '2rem', 
                     borderRadius: '12px',
                     textAlign: 'center',
                     minHeight: '150px',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center'
                   }}>
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{BLOCK_TYPES.find(b => b.type === block.type)?.icon}</div>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{block.title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '0.5rem' }}>Tipo: {block.type}</div>
                   </div>
                 ))}
              </div>
           </div>
        </main>

        {/* Right Sidebar: Block Library & Settings */}
        <aside style={{ width: '320px', borderLeft: '1px solid #222', padding: '1.5rem', background: '#0a0a0a', overflowY: 'auto' }}>
           <h4 style={{ fontSize: '0.7rem', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Biblioteca de Seções</h4>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {BLOCK_TYPES.filter(bt => bt.pages.includes(activePage)).map(bt => (
                <button 
                  key={bt.type}
                  onClick={() => addBlock(bt.type)}
                  style={{ 
                    background: '#111', border: '1px solid #222', padding: '1rem', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s', color: '#fff'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#222'}
                >
                   <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{bt.icon}</div>
                   <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{bt.label}</div>
                   <div style={{ fontSize: '0.7rem', color: '#666' }}>Seção pronta para {bt.type}</div>
                </button>
              ))}
           </div>

           <div style={{ marginTop: '3rem', borderTop: '1px solid #222', paddingTop: '2rem' }}>
              <h4 style={{ fontSize: '0.7rem', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Design Global</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#111', padding: '1rem', borderRadius: '8px' }}>
                    <Palette size={18} color="var(--primary)" />
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Tema Escuro Premium</div>
                       <div style={{ fontSize: '0.65rem', color: '#666' }}>Gradientes dourados ativos</div>
                    </div>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#111', padding: '1rem', borderRadius: '8px' }}>
                    <ImageIcon size={18} color="var(--primary)" />
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Assets de Mídia</div>
                       <div style={{ fontSize: '0.65rem', color: '#666' }}>8 imagens otimizadas</div>
                    </div>
                 </div>
              </div>
           </div>
        </aside>

      </div>

    </div>
  );
}

const styleModeBtn: React.CSSProperties = {
  border: 'none',
  color: '#fff',
  padding: '6px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
