'use client';

import { useState } from 'react';
import { Layout, Eye, EyeOff, ChevronUp, ChevronDown, Save, Plus, Trash2, Settings } from 'lucide-react';
import { saveConfig } from '@/app/admin/etapas/actions';

interface Block {
  id: string;
  type: 'HERO' | 'HIGHLIGHTS' | 'RANKINGS' | 'FEATURES' | 'INFO' | 'SPONSORS';
  title: string;
  visible: boolean;
}

const BLOCK_TYPES = [
  { type: 'HERO', label: 'Banner Principal (Hero)', icon: '🖼️' },
  { type: 'HIGHLIGHTS', label: 'Destaques da Arena', icon: '🎬' },
  { type: 'RANKINGS', label: 'Ranking Oficial', icon: '🏆' },
  { type: 'FEATURES', label: 'Diferenciais (Cards)', icon: '✨' },
  { type: 'INFO', label: 'Informações do Evento', icon: 'ℹ️' },
  { type: 'SPONSORS', label: 'Patrocinadores', icon: '🤝' },
];

export default function PageBuilder({ config }: { config: any }) {
  const initialLayout: Block[] = (config?.homeLayout as Block[]) || [
    { id: 'hero-1', type: 'HERO', title: 'Banner Principal', visible: true },
    { id: 'high-1', type: 'HIGHLIGHTS', title: 'Destaques', visible: true },
    { id: 'rank-1', type: 'RANKINGS', title: 'Ranking', visible: true },
    { id: 'feat-1', type: 'FEATURES', title: 'Características', visible: true },
  ];

  const [layout, setLayout] = useState<Block[]>(initialLayout);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function move(index: number, direction: 'up' | 'down') {
    const newLayout = [...layout];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLayout.length) return;

    const temp = newLayout[index];
    newLayout[index] = newLayout[targetIndex];
    newLayout[targetIndex] = temp;
    setLayout(newLayout);
  }

  function toggleVisibility(index: number) {
    const newLayout = [...layout];
    newLayout[index].visible = !newLayout[index].visible;
    setLayout(newLayout);
  }

  function removeBlock(index: number) {
    if (!confirm('Excluir este bloco?')) return;
    setLayout(layout.filter((_, i) => i !== index));
  }

  function addBlock(type: any) {
    const newBlock: Block = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      title: BLOCK_TYPES.find(b => b.type === type)?.label || 'Novo Bloco',
      visible: true
    };
    setLayout([...layout, newBlock]);
  }

  async function handleSave() {
    setLoading(true);
    setMessage('');

    const formData = new FormData();
    // Adicionar campos obrigatórios para saveConfig não dar erro (buscando da config atual)
    if (config) {
        Object.keys(config).forEach(key => {
            if (key !== 'homeLayout') formData.append(key, String(config[key]));
        });
    }
    
    formData.set('homeLayout', JSON.stringify(layout));

    try {
      await saveConfig(formData);
      setMessage('✅ Layout do site atualizado com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Erro ao salvar layout.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="premium-card" style={{ background: 'rgba(212, 175, 55, 0.02)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Layout size={24} color="var(--primary)" /> Construtor de Site (Page Builder)
          </h3>
          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.4rem' }}>Arraste e organize os blocos da sua página inicial.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {message && <span style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{message}</span>}
            <button 
                onClick={handleSave}
                disabled={loading}
                className="btn-primary" 
                style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <Save size={18} /> {loading ? 'Salvando...' : 'Publicar Alterações'}
            </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        
        {/* Lista de Blocos Ativos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {layout.map((block, index) => (
            <div 
              key={block.id} 
              style={{ 
                background: '#111', 
                border: '1px solid #333', 
                borderRadius: '12px', 
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: block.visible ? 1 : 0.5,
                transition: 'all 0.3s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button onClick={() => move(index, 'up')} disabled={index === 0} style={styleBtn}><ChevronUp size={16} /></button>
                  <button onClick={() => move(index, 'down')} disabled={index === layout.length - 1} style={styleBtn}><ChevronDown size={16} /></button>
                </div>
                <div style={{ fontSize: '1.5rem' }}>{BLOCK_TYPES.find(b => b.type === block.type)?.icon}</div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>{block.type}</div>
                  <div style={{ fontWeight: 'bold' }}>{block.title}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => toggleVisibility(index)} style={{ ...styleBtn, color: block.visible ? '#4CAF50' : '#666' }}>
                  {block.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button style={styleBtn} title="Configurações do Bloco"><Settings size={18} /></button>
                <button onClick={() => removeBlock(index)} style={{ ...styleBtn, color: '#ff4444' }}><Trash2 size={18} /></button>
              </div>
            </div>
          ))}

          {layout.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed #333', borderRadius: '15px', color: '#666' }}>
              Nenhum bloco adicionado. Comece adicionando um ao lado.
            </div>
          )}
        </div>

        {/* Adicionar Novos Blocos */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '15px', border: '1px solid #222' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#888' }}>ADICIONAR SEÇÃO</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {BLOCK_TYPES.map(bt => (
              <button 
                key={bt.type} 
                onClick={() => addBlock(bt.type)}
                className="premium-card" 
                style={{ 
                  textAlign: 'left', 
                  padding: '0.75rem 1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  cursor: 'pointer',
                  border: '1px solid #333'
                }}
              >
                <span>{bt.icon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{bt.label}</span>
                <Plus size={14} style={{ marginLeft: 'auto', color: '#666' }} />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const styleBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  color: '#fff',
  padding: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
};
