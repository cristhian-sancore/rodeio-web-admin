'use server';

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function createUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autorizado");
  
  const creator = session.user as any;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  let role = formData.get('role') as string;
  
  try {
    // 🛡️ PROTEÇÃO CONTRA ESCALADA DE PRIVILÉGIOS (PENTEST)
    if (role === 'SUPER_ADMIN' && creator.role !== 'SUPER_ADMIN') {
      throw new Error("Apenas o Super Admin original pode criar outros usuários Root.");
    }

    // Restrição: Comentarista não pode criar ADMIN nem COMENTARISTA
    if (creator.role === 'COMENTARISTA') {
      if (role === 'ADMIN' || role === 'COMENTARISTA' || role === 'SUPER_ADMIN') {
        role = 'JUIZ'; 
      }
    }

    const juizId = (role === 'JUIZ' && formData.get('juizId')) ? parseInt(formData.get('juizId') as string) : null;
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        juizId
      }
    });

    const { logSystemAction } = await import("@/lib/audit");
    await logSystemAction(creator.name || username, 'USER_CREATE', { role, target: username });

    revalidatePath('/admin/usuarios');
  } catch (err: any) {
    console.error("ERRO AO CRIAR USUÁRIO:", err);
    throw new Error(err.message || "Erro ao criar usuário. Verifique se o login já existe.");
  }
}

export async function updateUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autorizado");

  const creator = session.user as any;
  const id = parseInt(formData.get('id') as string);
  const username = formData.get('username') as string;
  let role = formData.get('role') as string;

  // Carregar usuário alvo para verificar nível atual
  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) throw new Error("Usuário não encontrado");

  // 🛡️ PROTEÇÃO CONTRA ESCALADA DE PRIVILÉGIOS (PENTEST)
  if (targetUser.role === 'SUPER_ADMIN' && creator.role !== 'SUPER_ADMIN') {
    throw new Error("Você não tem permissão para alterar dados de um usuário Root.");
  }
  if (role === 'SUPER_ADMIN' && creator.role !== 'SUPER_ADMIN') {
    throw new Error("Você não pode promover usuários ao nível Root.");
  }

  // Restrição: Comentarista não pode editar ADMINS ou outros COMENTARISTAS
  if (creator.role === 'COMENTARISTA') {
    if (targetUser.role === 'ADMIN' || targetUser.role === 'COMENTARISTA' || targetUser.role === 'SUPER_ADMIN') {
      throw new Error("Você não tem permissão para editar usuários deste nível.");
    }
    // Impedir que promova alguém para ADMIN ou COMENTARISTA
    if (role === 'ADMIN' || role === 'COMENTARISTA' || role === 'SUPER_ADMIN') {
      role = 'JUIZ';
    }
  }

  // Apenas JUIZ pode ter vínculo com juiz oficial
  const juizId = (role === 'JUIZ' && formData.get('juizId')) ? parseInt(formData.get('juizId') as string) : null;

  const data: any = { username, role, juizId };

  // Update password optionally if provided
  const password = formData.get('password') as string;
  if (password && password.trim() !== '') {
    data.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id },
    data
  });

  revalidatePath('/admin/usuarios');
  const { redirect } = await import('next/navigation');
  redirect('/admin/usuarios');
}

export async function deleteUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autorizado");

  const creator = session.user as any;
  const id = parseInt(formData.get('id') as string);

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) return;

  // 🛡️ PROTEÇÃO CONTRA DELEÇÃO DE ROOT (PENTEST)
  if (targetUser.role === 'SUPER_ADMIN' && creator.role !== 'SUPER_ADMIN') {
    throw new Error("Atenção: Usuários Super Admin só podem ser removidos por outro Super Admin.");
  }

  // Restrição: Apenas ADMIN ou SUPER_ADMIN pode deletar ADMINS ou COMENTARISTAS
  if (creator.role !== 'ADMIN' && creator.role !== 'SUPER_ADMIN' && (targetUser.role === 'ADMIN' || targetUser.role === 'COMENTARISTA')) {
    throw new Error("Você não tem permissão para remover este tipo de usuário.");
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/usuarios');
}
