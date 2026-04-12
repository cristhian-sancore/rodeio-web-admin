import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Save, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import UserEditForm from "../../UserEditForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const currentUserRole = user?.role || 'USER';

  const { id } = await params;
  const uId = parseInt(id);

  const [usuario, juizes] = await Promise.all([
    prisma.user.findUnique({ where: { id: uId } }),
    prisma.juiz.findMany({ orderBy: { nome: 'asc' } })
  ]);
  
  if (!usuario) redirect('/admin/usuarios');

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/usuarios" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', textDecoration: 'none' }}>
          <ArrowLeft size={20} /> Voltar para Acessos
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Editar Conta: <span style={{ color: 'var(--primary)' }}>{usuario.username}</span></h1>
      </div>

      <UserEditForm usuario={usuario} juizes={juizes} currentUserRole={currentUserRole} />
    </div>
  );
}
