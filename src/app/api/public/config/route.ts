import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = await prisma.configuracao.findFirst();
    return NextResponse.json(config || {});
  } catch (err) {
    return NextResponse.json({ error: 'Falha ao buscar config' }, { status: 500 });
  }
}
