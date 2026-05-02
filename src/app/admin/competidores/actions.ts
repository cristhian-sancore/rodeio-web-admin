'use server';

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logSystemAction } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

async function saveImage(file: File, prefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Caminho da pasta de uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Garantir que a pasta existe
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

export async function createCompetidor(formData: FormData) {
  const nome = formData.get('nome') as string;
  const cidade = formData.get('cidade') as string;
  const uf = formData.get('uf') as string;
  const file = formData.get('foto') as File;

  const fotoUrl = await saveImage(file, 'rider');

  await prisma.competidor.create({
    data: { 
      nome, 
      cidade, 
      uf,
      fotoUrl: fotoUrl || undefined 
    }
  });

  revalidatePath('/admin/competidores');
}

export async function updateCompetidor(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const nome = formData.get('nome') as string;
  const cidade = formData.get('cidade') as string;
  const uf = formData.get('uf') as string;
  const file = formData.get('foto') as File;

  const newFotoUrl = await saveImage(file, 'rider');

  await prisma.competidor.update({
    where: { id },
    data: { 
      nome, 
      cidade, 
      uf,
      ...(newFotoUrl ? { fotoUrl: newFotoUrl } : {})
    }
  });

  revalidatePath('/admin/competidores');
  const { redirect } = await import('next/navigation');
  redirect('/admin/competidores');
}

export async function deleteCompetidor(arg: FormData | number) {
  const id = typeof arg === 'number' ? arg : parseInt(arg.get('id') as string);
  
  const montariaCount = await prisma.montaria.count({ where: { competidorId: id } });
  
  if (montariaCount > 0) {
    const { redirect } = await import('next/navigation');
    redirect('/admin/competidores?error=COMPETIDOR_HAS_LINKS');
  }

  await prisma.competidor.delete({ where: { id } });
  revalidatePath('/admin/competidores');
}

export async function importCompetidores(data: any[]) {
  const session = await getServerSession(authOptions);
  
  function getVal(row: any, keys: string[]) {
    if (!row) return '';
    const rowKeys = Object.keys(row);
    for (const k of keys) {
      const match = rowKeys.find(rk => rk.trim().toLowerCase() === k.toLowerCase());
      if (match && row[match] !== undefined && row[match] !== null) {
        return String(row[match]).trim();
      }
    }
    return '';
  }

  // Limpar e validar dados
  const toCreate = data.map(row => ({
    nome: getVal(row, ['nome', 'competidor', 'peão', 'atleta', 'rider']),
    cidade: getVal(row, ['cidade', 'municipio', 'município', 'city']),
    uf: getVal(row, ['uf', 'estado', 'state']).toUpperCase().substring(0, 2),
  })).filter(c => c.nome.length > 2);

  if (toCreate.length === 0) return { error: 'Nenhum dado válido encontrado na planilha.' };

  await prisma.competidor.createMany({ data: toCreate });
  
  await logSystemAction(session?.user?.name || 'Sistema', 'IMPORT_EXCEL', { 
    tipo: 'COMPETIDORES', 
    quantidade: toCreate.length 
  });

  revalidatePath('/admin/competidores');
  return { success: true, count: toCreate.length };
}

