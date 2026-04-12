import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { User as UserIcon, UserPlus, Trash2, Key, Shield, Gavel, Edit, Search, Mic } from "lucide-react";
import Link from "next/link";
import { createUser, deleteUser } from "./actions";
import UserForm from "./UserForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const currentUserRole = user?.role || 'USER';

  const { q } = await searchParams;
  const [usuarios, juizes] = await Promise.all([
    prisma.user.findMany({
      where: q ? {
        username: { contains: q }
      } : undefined,
      include: { juiz: true },
      orderBy: { username: 'asc' }
    }),
    prisma.juiz.findMany({
      where: { user: null }, // Só juízes que ainda não tem conta
      orderBy: { nome: 'asc' }
    })
  ]);

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '2rem' }}>Controle de Acesso</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
        {/* Formulario Client-Side */}
        <UserForm juizes={juizes} currentUserRole={currentUserRole} />

        {/* Lista de Usuarios */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Usuários Ativos ({usuarios.length})</h2>
            
            <form method="GET" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#666" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input name="q" type="text" defaultValue={q || ''} placeholder="Pesquisar..." style={{ padding: '0.5rem 0.5rem 0.5rem 2.2rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', width: '200px' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.9rem' }}>Filtrar</button>
              {q && <Link href="/admin/usuarios" style={{ color: '#ff4444', textDecoration: 'none', fontSize: '0.8rem', marginLeft: '0.5rem' }}>Limpar</Link>}
            </form>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {usuarios.map((u: any) => (
              <div key={u.id} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', background: u.role === 'ADMIN' ? 'rgba(212, 175, 55, 0.1)' : u.role === 'COMENTARISTA' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(76, 175, 80, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: u.role === 'ADMIN' ? '#d4af37' : u.role === 'COMENTARISTA' ? '#2196F3' : '#4CAF50' }}>
                    {u.role === 'ADMIN' ? <Shield size={20} /> : u.role === 'COMENTARISTA' ? <Mic size={20} /> : <Gavel size={20} />}
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>{u.username}</h4>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>
                      {u.role} {u.juiz ? `• Vinculado a: ${u.juiz.nome}` : ''}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {(user.role === 'ADMIN' || (user.role === 'COMENTARISTA' && u.role !== 'ADMIN' && u.role !== 'COMENTARISTA')) && (
                    <Link href={`/admin/usuarios/${u.id}/editar`} style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: '#fff', cursor: 'pointer', border: '1px solid #333' }}>
                      <Edit size={16} />
                    </Link>
                  )}
                  {(user.role === 'ADMIN' || (user.role === 'COMENTARISTA' && u.role !== 'ADMIN' && u.role !== 'COMENTARISTA')) && (
                    <form action={deleteUser}>
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" style={{ padding: '6px', background: 'rgba(255,68,68,0.1)', borderRadius: '4px', color: '#ff4444', cursor: 'pointer', border: '1px solid currentColor' }}>
                        <Trash2 size={16} />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
