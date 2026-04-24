'use server';

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateSelfProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Não autorizado" };

  const user = session.user as any;
  const username = formData.get('username') as string;
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: "Usuário não encontrado" };

  // Validar senha atual
  const isCorrect = await bcrypt.compare(currentPassword, dbUser.password);
  if (!isCorrect) return { error: "Senha atual incorreta" };

  const data: any = { username };
  
  if (newPassword && newPassword.trim().length >= 4) {
    data.password = await bcrypt.hash(newPassword, 10);
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data
  });

  revalidatePath('/admin/perfil');
  return { success: true };
}
