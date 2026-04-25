import { useState, useActionState } from 'react';
import { Save, Shield, AlertCircle } from "lucide-react";
import { updateUser } from './actions';

export default function UserEditForm({ usuario, juizes, currentUserRole }: { usuario: any, juizes: any[], currentUserRole: string }) {
  const [role, setRole] = useState(usuario.role || 'JUIZ');
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
      const res = await updateUser(formData);
      if (res.success) {
          window.location.href = '/admin/usuarios'; 
      }
      return res;
  }, { success: false, error: null });

  const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';

  return (
    <div className="premium-card" style={{ maxWidth: '600px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
        <Shield size={20} color="var(--primary)" /> Credenciais do Sistema
      </h3>

      {state?.error && (
        <div style={{ padding: '0.75rem', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', borderRadius: '8px', color: '#ff4444', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <AlertCircle size={16} />
          {state.error}
        </div>
      )}
      
      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', opacity: isPending ? 0.6 : 1 }}>
        <input type="hidden" name="id" value={usuario.id} />

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nome de Usuário (Login)</label>
          <input name="username" type="text" required defaultValue={usuario.username} style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nova Senha (deixe em branco para não alterar)</label>
          <input name="password" type="password" style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem' }} placeholder="••••••••" />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nível de Acesso</label>
          <select 
            name="role" 
            required 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={!isAdmin && (usuario.role === 'ADMIN' || usuario.role === 'COMENTARISTA')}
            style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem', opacity: (!isAdmin && (usuario.role === 'ADMIN' || usuario.role === 'COMENTARISTA')) ? 0.5 : 1 }}
          >
            <option value="JUIZ">Juiz (Acesso ao Lançamento)</option>
            {isAdmin && <option value="COMENTARISTA">Comentarista (Gestão de Evento)</option>}
            {isAdmin && <option value="ADMIN">Administrador (Acesso Total)</option>}
            {!isAdmin && (usuario.role === 'ADMIN' || usuario.role === 'COMENTARISTA') && <option value={usuario.role}>{usuario.role}</option>}
            {!isAdmin && <option value="USER">Usuário Comum</option>}
          </select>
        </div>
        
        {role === 'JUIZ' && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Vincular a Juiz Oficial</label>
            <select name="juizId" defaultValue={usuario.juizId || ""} style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem' }}>
              <option value="">Selecione um Juiz...</option>
              {juizes.map((j: any) => (
                <option key={j.id} value={j.id}>{j.nome}</option>
              ))}
            </select>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>
              Importante: Como Juiz, ele precisará estar vinculado a um Juiz Oficial para poder lançar notas na súmula.
            </p>
          </div>
        )}

        {role === 'COMENTARISTA' && (
          <div style={{ padding: '0.75rem', background: 'rgba(33, 150, 243, 0.08)', border: '1px solid rgba(33, 150, 243, 0.2)', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#2196F3' }}>
              📋 O Comentarista possui acesso para cadastrar dados do evento, mas não interfere nas notas ou configurações globais.
            </p>
          </div>
        )}

        <button type="submit" disabled={isPending} className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <Save size={20} /> {isPending ? 'PROCESSANDO...' : 'SALVAR ALTERAÇÕES'}
        </button>
      </form>
    </div>
  );
}
