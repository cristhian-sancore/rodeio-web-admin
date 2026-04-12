'use server';

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createAnimal(formData: FormData) {
  const nome = formData.get('nome') as string;
  const companhia = formData.get('companhia') as string;
  const tipo = formData.get('tipo') as string;

  await prisma.animal.create({
    data: { nome, companhia, tipo }
  });

  revalidatePath('/admin/animais');
}

export async function updateAnimal(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const nome = formData.get('nome') as string;
  const companhia = formData.get('companhia') as string;
  const tipo = formData.get('tipo') as string;

  await prisma.animal.update({
    where: { id },
    data: { nome, companhia, tipo }
  });

  revalidatePath('/admin/animais');
  const { redirect } = await import('next/navigation');
  redirect('/admin/animais');
}

export async function deleteAnimal(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  
  // Safe delete validation
  const montariaCount = await prisma.montaria.count({ where: { animalId: id } });
  const reservaCount = await prisma.roundReserva.count({ where: { animalId: id } });
  
  if (montariaCount > 0 || reservaCount > 0) {
    const { redirect } = await import('next/navigation');
    redirect('/admin/animais?error=ANIMAL_HAS_LINKS');
  }

  await prisma.animal.delete({ where: { id } });
  revalidatePath('/admin/animais');
}
