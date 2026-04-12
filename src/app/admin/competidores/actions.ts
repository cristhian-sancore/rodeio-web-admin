'use server';

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCompetidor(formData: FormData) {
  const nome = formData.get('nome') as string;
  const cidade = formData.get('cidade') as string;
  const uf = formData.get('uf') as string;

  await prisma.competidor.create({
    data: { nome, cidade, uf }
  });

  revalidatePath('/admin/competidores');
}

export async function updateCompetidor(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const nome = formData.get('nome') as string;
  const cidade = formData.get('cidade') as string;
  const uf = formData.get('uf') as string;

  await prisma.competidor.update({
    where: { id },
    data: { nome, cidade, uf }
  });

  revalidatePath('/admin/competidores');
  const { redirect } = await import('next/navigation');
  redirect('/admin/competidores');
}

export async function deleteCompetidor(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  
  // Safe delete validation
  const montariaCount = await prisma.montaria.count({ where: { competidorId: id } });
  
  if (montariaCount > 0) {
    const { redirect } = await import('next/navigation');
    redirect('/admin/competidores?error=COMPETIDOR_HAS_LINKS');
  }

  await prisma.competidor.delete({ where: { id } });
  revalidatePath('/admin/competidores');
}
