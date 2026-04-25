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
  Type
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
  // Site
  { type: 'HERO', label: 'Banner Principal', icon: '🖼️', pages: ['HOME'] },
  { type: 'HIGHLIGHTS', label: 'Destaques', icon: '🎬', pages: ['HOME'] },
  { type: 'RANKINGS', label: 'Ranking', icon: '🏆', pages: ['HOME', 'RANKING'] },
  { type: 'GALLERY', label: 'Galeria de Fotos', icon: '📷', pages: ['HOME', 'COMPETIDORES', 'ANIMAIS'] },
  { type: 'SPONSORS', label: 'Patrocinadores', icon: '🤝', pages: ['HOME'] },
  // Overlays
  { type: 'LOWER_THIRD', label: 'Tarja de Atleta', icon: '🏷️', pages: ['OVERLAYS'] },
  { type: 'SCORE_BOARD', label: 'Placar de Notas', icon: '🔢', pages: ['OVERLAYS'] },
  { type: 'FULL_RANKING', label: 'Ranking Tela Cheia', icon: '📺', pages: ['OVERLAYS'] },
  // Paineis
  { type: 'JUDGE_VOTE', label: 'Teclado de Notas', icon: '⌨️', pages: ['PAINEIS'] },
  { type: 'COMMENTATOR_FEED', label: 'Feed do Comentarista', icon: '🎙️', pages: ['PAINEIS'] },
  { type: 'STATS_CARD', label: 'Card de Estatísticas', icon: '📊', pages: ['PAINEIS', 'ADMIN'] },
];

export default function SiteBuilderPage() {
  const [activePage, setActivePage] = useState('HOME');
  const [layouts, setLayouts] = useState<any>({});
  const [brand, setBrand] = useState({
    primaryColor: '#d4af37',
    secondaryColor: '#111111',
    logoUrl: '',
    siteName: 'RODEIO PRO'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/public/config');
      const config = await res.json();
      setLayouts(config.siteLayouts || {
        HOME: [{ id: 'h1', type: 'HERO', title: 'Banner Principal', visible: true }],
        RANKING: [{ id: 'rr1', type: 'RANKINGS', title: 'Ranking Completo', visible: true }],
        COMPETIDORES: [{ id: 'cc1', type: 'GALLERY', title: 'Grid de Atletas', visible: true }],
        OVERLAYS: [{ id: 'lt1', type: 'LOWER_THIRD', title: 'GC de Atleta', visible: true }],
        PAINEIS: [{ id: 'jv1', type: 'JUDGE_VOTE', title: 'Interface de Votação', visible: true }],
        ADMIN: [{ id: 'st1', type: 'STATS_CARD', title: 'Resumo da Arena', visible: true }]
      });
      setBrand({
        primaryColor: config.primaryColor || '#d4af37',
        secondaryColor: config.secondaryColor || '#111111',
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

  async function handleSave() {
    setSaving(true);
    const formData = new FormData();
    formData.set('siteLayouts', JSON.stringify(layouts));
    formData.set('homeLayout', JSON.stringify(layouts.HOME || []));
    
    // Configurações Globais
    formData.set('titulo', brand.siteName);
    formData.set('primaryColor', brand.primaryColor);
    
    try {
      await saveConfig(formData);
      alert('✅ Configurações Globais e Layouts salvos com sucesso!');
    } catch (err) {
      alert('❌ Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ color: '#fff', padding: '2rem' }}>Carregando Construtor Full...</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Bar */}
      <header style={{ height: '60px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', background: '#0a0a0a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin/super" style={{ color: '#666' }}><ArrowLeft size={20} /></Link>
          <div style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Layout size={20} color={brand.primaryColor} /> CONSTRUTOR TOTAL <span style={{ color: '#333' }}>|</span> <span style={{ color: brand.primaryColor, fontSize: '0.8rem' }}>MASTER CONTROL</span>
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
          style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: brand.primaryColor, color: '#000' }}
        >
          <Save size={18} /> {saving ? 'Salvando Tudo...' : 'PUBLICAR SISTEMA'}
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Sidebar: Navigation */}
        <aside style={{ width: '300px', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
          
          {/* Identidade Visual Section */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #1a1a1a' }}>
             <h4 style={{ fontSize: '0.7rem', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>Identidade Visual</h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                   <label style={{ fontSize: '0.7rem', color: '#666', display: 'block', marginBottom: '4px' }}>NOME DO SISTEMA</label>
                   <input 
                    value={brand.siteName} 
                    onChange={e => setBrand({...brand, siteName: e.target.value})}
                    style={styleInput} 
                   />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                   <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: '#666', display: 'block', marginBottom: '4px' }}>COR PRIMÁRIA</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                         <input type="color" value={brand.primaryColor} onChange={e => setBrand({...brand, primaryColor: e.target.value})} style={{ padding: 0, width: '30px', height: '30px', border: 'none', background: 'none' }} />
                         <input value={brand.primaryColor} onChange={e => setBrand({...brand, primaryColor: e.target.value})} style={{ ...styleInput, fontSize: '0.7rem' }} />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
            <h4 style={{ fontSize: '0.7rem', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>Páginas & Painéis</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {PAGES.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setActivePage(p.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: activePage === p.id ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    color: activePage === p.id ? brand.primaryColor : '#888',
                    fontWeight: activePage === p.id ? 'bold' : 'normal'
                  }}
                >
                  {p.icon} {p.label}
                  {activePage === p.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>

            <div style={{ marginTop: '2rem' }}>
               <h4 style={{ fontSize: '0.7rem', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>Estrutura de {activePage}</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentLayout.map((block: any, idx: number) => (
                    <div key={block.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <ChevronUp size={12} onClick={() => {}} style={{ cursor: 'pointer', opacity: 0.6 }} />
                          <ChevronDown size={12} onClick={() => {}} style={{ cursor: 'pointer', opacity: 0.6 }} />
                        </div>
                        <div style={{ flex: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>{block.title}</div>
                        <button style={{ background: 'none', border: 'none', color: '#444' }}><Trash2 size={12} /></button>
                    </div>
                  ))}
               </div>
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
             display: 'flex',
             flexDirection: 'column'
           }}>
              {/* Preview Header */}
              <div style={{ borderBottom: '1px solid #1a1a1a', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d0d0d' }}>
                 <div style={{ fontWeight: '900', fontSize: '0.9rem', color: brand.primaryColor }}>{brand.siteName}</div>
                 <div style={{ display: 'flex', gap: '15px', fontSize: '0.65rem', color: '#666', fontWeight: 'bold' }}>
                    <span>HOME</span><span>RANKING</span><span>ARENA</span>
                 </div>
              </div>

              {/* Preview Content */}
              <div style={{ padding: '2rem', flex: 1 }}>
                 <div style={{ color: '#444', fontSize: '0.7rem', marginBottom: '1.5rem', textAlign: 'center' }}>MODO PREVIEW: {activePage}</div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {currentLayout.map((block: any) => (
                      <div key={block.id} style={{ 
                        background: '#111', 
                        border: `1px solid ${brand.primaryColor}22`, 
                        padding: '2.5rem 1rem', 
                        borderRadius: '12px',
                        textAlign: 'center'
                      }}>
                         <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{BLOCK_TYPES.find(b => b.type === block.type)?.icon}</div>
                         <div style={{ fontWeight: 'bold', color: brand.primaryColor }}>{block.title}</div>
                         <div style={{ fontSize: '0.6rem', color: '#444', marginTop: '0.5rem' }}>CONFIGURAÇÃO ATIVA</div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </main>

        {/* Right Sidebar: Block Library */}
        <aside style={{ width: '320px', borderLeft: '1px solid #222', padding: '1.5rem', background: '#0a0a0a', overflowY: 'auto' }}>
           <h4 style={{ fontSize: '0.7rem', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Componentes Disponíveis</h4>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {BLOCK_TYPES.filter(bt => bt.pages.includes(activePage)).map(bt => (
                <button 
                  key={bt.type}
                  onClick={() => {}}
                  style={{ 
                    background: '#111', border: '1px solid #222', padding: '1rem', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s', color: '#fff'
                  }}
                >
                   <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{bt.icon}</div>
                   <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{bt.label}</div>
                   <div style={{ fontSize: '0.65rem', color: '#555' }}>Adicionar à {activePage}</div>
                </button>
              ))}
           </div>

           <div style={{ marginTop: '3rem', background: 'rgba(212, 175, 55, 0.05)', padding: '1.5rem', borderRadius: '15px', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: brand.primaryColor, marginBottom: '0.5rem' }}>
                 <Palette size={16} />
                 <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>DESIGN DO SISTEMA</span>
              </div>
              <p style={{ fontSize: '0.65rem', color: '#666', lineHeight: '1.4' }}>
                As cores e logos definidas aqui serão aplicadas automaticamente em todos os painéis dos juízes, comentaristas e telas de overlay.
              </p>
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

const styleInput: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem',
  background: '#111',
  border: '1px solid #333',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '0.85rem'
};
