'use client';
import { useState, useActionState } from 'react';
import { UserPlus, AlertCircle } from 'lucide-react';
import { createUser } from './actions';

export default function UserForm({ juizes, currentUserRole }: { juizes: any[], currentUserRole: string }) {
  const [role, setRole] = useState('JUIZ');
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
      const res = await createUser(formData);
      if (res.success) {
          // Limpa o formulário via reload ou reset (revalidatePath já foi chamado no server)
          window.location.reload(); 
      }
      return res;
  }, { success: false, error: null });

  const isAdminOrSuper = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'SUPER';

  return (
    <div className="premium-card">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <UserPlus size={20} /> Novo Operador
      </h2>

      {state?.error && (
        <div style={{ padding: '0.75rem', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', borderRadius: '8px', color: '#ff4444', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <AlertCircle size={16} />
          {state.error}
        </div>
      )}

      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: isPending ? 0.6 : 1 }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nome de Usuário (Login)</label>
          <input name="username" type="text" required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} placeholder="Ex: juiz.tiago" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Senha Inicial</label>
          <input name="password" type="password" required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} placeholder="••••••••" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nível de Acesso</label>
          <select 
            name="role" 
            required 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
          >
            <option value="JUIZ">Juiz (Acesso ao Lançamento)</option>
            {isAdminOrSuper && <option value="COMENTARISTA">Comentarista (Gestão de Evento)</option>}
            {isAdminOrSuper && <option value="ADMIN">Administrador (Acesso Total)</option>}
            {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'SUPER') && <option value="SUPER_ADMIN">Super Admin (Root)</option>}
            {!isAdminOrSuper && <option value="USER">Usuário Comum</option>}
          </select>
        </div>

        {role === 'JUIZ' && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Vincular a Juiz Oficial</label>
            <select name="juizId" style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
              <option value="">Selecione um Juiz...</option>
              {juizes.map((j: any) => (
                <option key={j.id} value={j.id}>{j.nome}</option>
              ))}
            </select>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>
              O juiz precisa estar vinculado para lançar notas na súmula.
            </p>
          </div>
        )}

        {role === 'COMENTARISTA' && (
          <div style={{ padding: '0.75rem', background: 'rgba(33, 150, 243, 0.08)', border: '1px solid rgba(33, 150, 243, 0.2)', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#2196F3' }}>
              📋 O Comentarista pode cadastrar etapas, competidores, animais, juízes e montar o sorteio. Não tem acesso às configurações nem ao lançamento de notas.
            </p>
          </div>
        )}

        <button type="submit" disabled={isPending} className="btn-primary" style={{ marginTop: '0.5rem' }}>
          {isPending ? 'PROCESSANDO...' : 'Criar Conta de Acesso'}
        </button>
      </form>
    </div>
  );
}
