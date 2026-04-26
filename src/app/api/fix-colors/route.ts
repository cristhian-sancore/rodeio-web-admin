import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const config = await prisma.configuracao.findFirst();
    if (config) {
      await prisma.configuracao.update({
        where: { id: config.id },
        data: {
          primaryColor: '#d4af37',
          secondaryColor: '#111111'
        }
      });
      return NextResponse.json({ message: "Cores resetadas com sucesso para Preto e Dourado na producao!" });
    }
    return NextResponse.json({ message: "Nenhuma configuracao encontrada" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
