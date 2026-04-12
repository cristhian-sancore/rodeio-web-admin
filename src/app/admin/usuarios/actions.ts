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
  
  // Restrição: Juiz nunca cria usuários
  if (creator.role === 'JUIZ') throw new Error("Juízes não podem criar usuários");

  // Restrição: Comentarista não pode criar ADMIN nem COMENTARISTA
  if (creator.role === 'COMENTARISTA') {
    if (role === 'ADMIN' || role === 'COMENTARISTA') {
      role = 'JUIZ'; // Forçar JUIZ se tentar burlar via FORM
    }
  }

  // Apenas JUIZ ou quem cria um JUIZ pode ter vínculo com juiz oficial
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

  revalidatePath('/admin/usuarios');
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

  // Restrição: Comentarista não pode editar ADMINS ou outros COMENTARISTAS
  if (creator.role === 'COMENTARISTA') {
    if (targetUser.role === 'ADMIN' || targetUser.role === 'COMENTARISTA') {
      throw new Error("Você não tem permissão para editar usuários deste nível.");
    }
    // Impedir que promova alguém para ADMIN ou COMENTARISTA
    if (role === 'ADMIN' || role === 'COMENTARISTA') {
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

  // Restrição: Apenas ADMIN pode deletar ADMINS ou COMENTARISTAS
  if (creator.role !== 'ADMIN' && (targetUser.role === 'ADMIN' || targetUser.role === 'COMENTARISTA')) {
    throw new Error("Você não tem permissão para remover este tipo de usuário.");
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/usuarios');
}
