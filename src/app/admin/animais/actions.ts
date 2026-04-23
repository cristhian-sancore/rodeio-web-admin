'use server';

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

async function saveImage(file: File, prefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileName = `${prefix}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error("Erro ao salvar imagem:", error);
    return null;
  }
}

export async function createAnimal(formData: FormData) {
  const nome = formData.get('nome') as string;
  const companhia = formData.get('companhia') as string;
  const tipo = formData.get('tipo') as string;
  const file = formData.get('foto') as File;

  const fotoUrl = await saveImage(file, 'bull');

  await prisma.animal.create({
    data: { 
      nome, 
      companhia, 
      tipo,
      fotoUrl: fotoUrl || undefined
    }
  });

  revalidatePath('/admin/animais');
}

export async function updateAnimal(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const nome = formData.get('nome') as string;
  const companhia = formData.get('companhia') as string;
  const tipo = formData.get('tipo') as string;
  const file = formData.get('foto') as File;

  const newFotoUrl = await saveImage(file, 'bull');

  await prisma.animal.update({
    where: { id },
    data: { 
      nome, 
      companhia, 
      tipo,
      ...(newFotoUrl ? { fotoUrl: newFotoUrl } : {})
    }
  });

  revalidatePath('/admin/animais');
  const { redirect } = await import('next/navigation');
  redirect('/admin/animais');
}

export async function deleteAnimal(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  
  const montariaCount = await prisma.montaria.count({ where: { animalId: id } });
  const reservaCount = await prisma.roundReserva.count({ where: { animalId: id } });
  
  if (montariaCount > 0 || reservaCount > 0) {
    const { redirect } = await import('next/navigation');
    redirect('/admin/animais?error=ANIMAL_HAS_LINKS');
  }

  await prisma.animal.delete({ where: { id } });
  revalidatePath('/admin/animais');
}
