'use client';

import { useState } from 'react';
import { Layout, Image as ImageIcon, Type, Save } from 'lucide-react';
import { saveConfig } from '@/app/admin/etapas/actions';

interface CmsManagerProps {
  config: any;
}

export default function CmsManager({ config }: CmsManagerProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData(e.currentTarget);
    
    // Manter as outras configs enviando campos ocultos se necessário, 
    // ou apenas garantir que saveConfig trate o que vier.
    // Como saveConfig usa formData.get(), se o campo não existir, ele virá nulo.
    // Para não perder as outras configs, vamos anexá-las se possível.
    
    // Adicionar campos existentes da config que não estão no form
    Object.keys(config).forEach(key => {
      if (!formData.has(key)) {
        formData.append(key, String(config[key]));
      }
    });

    try {
      await saveConfig(formData);
      setMessage('✅ Configurações da página inicial salvas!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="premium-card">
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Layout size={20} color="var(--primary)" /> Personalização da Página Inicial (Landing Page)
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>TÍTULO PRINCIPAL (HERO)</label>
          <div style={{ position: 'relative' }}>
            <Type size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
            <input 
              name="homeHeroTitle"
              defaultValue={config?.homeHeroTitle || ''}
              className="premium-input"
              placeholder="Ex: RODEIO PRO"
              style={{ paddingLeft: '3rem', width: '100%' }}
            />
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>SUBTÍTULO / DESCRIÇÃO</label>
          <textarea 
            name="homeHeroSubtitle"
            defaultValue={config?.homeHeroSubtitle || ''}
            className="premium-input"
            rows={3}
            placeholder="Descreva o seu evento ou plataforma..."
            style={{ width: '100%', resize: 'none' }}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>URL DA IMAGEM DE FUNDO (BACKGROUND)</label>
          <div style={{ position: 'relative' }}>
            <ImageIcon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
            <input 
              name="homeHeroImage"
              defaultValue={config?.homeHeroImage || ''}
              className="premium-input"
              placeholder="https://exemplo.com/imagem.jpg"
              style={{ paddingLeft: '3rem', width: '100%' }}
            />
          </div>
          <p style={{ fontSize: '0.7rem', color: '#555', marginTop: '0.5rem' }}>Dica: Use imagens de alta resolução (Full HD) para melhor visual.</p>
        </div>

        {config?.homeHeroImage && (
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>PRÉ-VISUALIZAÇÃO</label>
                <div style={{ 
                    height: '150px', 
                    borderRadius: '10px', 
                    backgroundImage: `url(${config.homeHeroImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid #333'
                }} />
            </div>
        )}

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          {message && <span style={{ marginRight: '1rem', alignSelf: 'center', fontSize: '0.9rem' }}>{message}</span>}
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
          </button>
        </div>
      </form>
    </div>
  );
}
