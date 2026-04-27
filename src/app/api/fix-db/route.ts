import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🚀 Iniciando correção de schema manual...");

    // Adicionando colunas que faltam na tabela Round
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Round" ADD COLUMN IF NOT EXISTS "eFinal" BOOLEAN DEFAULT false;
    `);
    console.log("✅ Coluna eFinal adicionada/verificada.");

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Round" ADD COLUMN IF NOT EXISTS "juiz3Id" INTEGER;
    `);
    console.log("✅ Coluna juiz3Id adicionada/verificada.");

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Round" ADD COLUMN IF NOT EXISTS "juiz4Id" INTEGER;
    `);
    console.log("✅ Coluna juiz4Id adicionada/verificada.");

    return NextResponse.json({ 
      success: true, 
      message: "Schema atualizado com sucesso! Colunas eFinal, juiz3Id e juiz4Id foram adicionadas." 
    });
  } catch (error: any) {
    console.error("❌ Erro na correção de schema:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
