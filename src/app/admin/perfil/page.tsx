'use client';

import { useState } from 'react';
import { User, Lock, Save, ShieldCheck, AlertCircle } from 'lucide-react';
import { updateSelfProfile } from './actions';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!session) return null;
  const user = session.user as any;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateSelfProfile(formData);

    if (res.success) {
      setMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      // Limpar campos de senha
      (e.target as any).currentPassword.value = '';
      (e.target as any).newPassword.value = '';
      (e.target as any).confirmPassword.value = '';
      // Atualizar sessão se o nome mudou
      update({ name: formData.get('username') });
    } else {
      setMsg({ type: 'error', text: res.error || 'Ocorreu um erro.' });
    }
    setLoading(false);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ width: '60px', height: '60px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={32} color="var(--primary)" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Meu Perfil</h1>
          <p style={{ color: '#888', margin: 0 }}>Gerencie suas informações de acesso e segurança.</p>
        </div>
      </div>

      {msg && (
        <div style={{ 
          background: msg.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 68, 68, 0.1)',
          color: msg.type === 'success' ? '#4CAF50' : '#ff4444',
          padding: '1rem',
          borderRadius: '10px',
          border: '1px solid currentColor',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: '600'
        }}>
          {msg.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
          {msg.text}
        </div>
      )}

      <div className="premium-card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>Nível de Acesso</label>
            <div style={{ padding: '0.75rem 1rem', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '1rem' }}>
              {user.role === 'SUPER_ADMIN' ? '🏆 SUPER ADMINISTRADOR (ROOT)' : 
               user.role === 'ADMIN' ? '🛡️ ADMINISTRADOR' : 
               user.role === 'COMENTARISTA' ? '🎤 COMENTARISTA' : '⚖️ JUIZ'}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>Nome de Usuário (Login)</label>
            <input 
              name="username" 
              type="text" 
              defaultValue={user.name} 
              required 
              style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1rem' }} 
            />
          </div>

          <div style={{ height: '1px', background: '#222', margin: '1rem 0' }} />
          
          <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
            <Lock size={18} color="var(--primary)" /> Alterar Senha
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#555' }}>Preencha apenas se desejar trocar sua senha de acesso.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Nova Senha</label>
              <input name="newPassword" type="password" placeholder="Mínimo 4 caracteres" style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Confirmar Nova Senha</label>
              <input name="confirmPassword" type="password" placeholder="Repita a nova senha" style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '12px', border: '1px dashed rgba(212, 175, 55, 0.3)' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>Confirmação de Segurança</label>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: '#666' }}>Para salvar qualquer alteração no seu perfil, você deve confirmar sua senha atual.</p>
            <input 
              name="currentPassword" 
              type="password" 
              required 
              placeholder="Digite sua senha ATUAL aqui..."
              style={{ width: '100%', padding: '1rem', background: '#000', border: '2px solid var(--primary)', borderRadius: '10px', color: '#fff', fontSize: '1rem' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1.1rem' }}
          >
            <Save size={22} /> {loading ? 'Salvando...' : 'ATUALIZAR MEU PERFIL'}
          </button>

        </form>
      </div>
    </div>
  );
}
