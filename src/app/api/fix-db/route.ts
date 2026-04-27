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

    // Criar usuário sancore se não existir
    const bcrypt = require('bcryptjs');
    const sancore = await prisma.user.findUnique({ where: { username: 'sancore' } });
    if (!sancore) {
      const hashedPassword = await bcrypt.hash('123', 10);
      await prisma.user.create({
        data: {
          username: 'sancore',
          password: hashedPassword,
          role: 'SUPER_ADMIN'
        }
      });
      console.log("✅ Usuário sancore criado como SUPER_ADMIN.");
    }

    return NextResponse.json({ 
      success: true, 
      message: "Schema atualizado e usuário sancore verificado/criado como SUPER_ADMIN com sucesso!" 
    });
  } catch (error: any) {
    console.error("❌ Erro na correção de schema:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
