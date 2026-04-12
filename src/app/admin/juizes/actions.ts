'use server';

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createJuiz(formData: FormData) {
  const nome = formData.get('nome') as string;
  const cidade = formData.get('cidade') as string;
  const uf = formData.get('uf') as string;

  await prisma.juiz.create({
    data: { nome, cidade, uf }
  });

  revalidatePath('/admin/juizes');
}

export async function updateJuiz(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const nome = formData.get('nome') as string;
  const cidade = formData.get('cidade') as string;
  const uf = formData.get('uf') as string;

  await prisma.juiz.update({
    where: { id },
    data: { nome, cidade, uf }
  });

  revalidatePath('/admin/juizes');
  const { redirect } = await import('next/navigation');
  redirect('/admin/juizes');
}

export async function deleteJuiz(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  
  // Safe delete validation: Checar se o juiz está trabalhando em algum round
  const userLinks = await prisma.user.count({ where: { juizId: id } });
  
  const roundsLink = await prisma.round.count({
    where: {
      OR: [
        { juiz1Id: id },
        { juiz2Id: id },
        { juiz3Id: id },
        { juiz4Id: id }
      ]
    }
  });
  
  if (userLinks > 0 || roundsLink > 0) {
    const { redirect } = await import('next/navigation');
    redirect('/admin/juizes?error=JUIZ_HAS_LINKS');
  }

  await prisma.juiz.delete({ where: { id } });
  revalidatePath('/admin/juizes');
}
