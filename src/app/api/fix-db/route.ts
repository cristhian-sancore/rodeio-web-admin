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

    // Criar/Atualizar usuários críticos
    const bcrypt = require('bcryptjs');
    
    // 1. Usuário Sancore
    const sancore = await prisma.user.findUnique({ where: { username: 'sancore' } });
    const passSancore = await bcrypt.hash('123', 10);
    if (!sancore) {
      await prisma.user.create({
        data: { username: 'sancore', password: passSancore, role: 'SUPER_ADMIN' }
      });
      console.log("✅ Usuário sancore criado.");
    } else {
      await prisma.user.update({
        where: { id: sancore.id },
        data: { role: 'SUPER_ADMIN' }
      });
    }

    // 2. Usuário Root (Master)
    const root = await prisma.user.findUnique({ where: { username: 'root' } });
    const passRoot = await bcrypt.hash('master_rodeio_2026', 10);
    if (!root) {
      await prisma.user.create({
        data: { username: 'root', password: passRoot, role: 'SUPER_ADMIN' }
      });
      console.log("✅ Usuário root criado.");
    } else {
      await prisma.user.update({
        where: { id: root.id },
        data: { role: 'SUPER_ADMIN', password: passRoot }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Schema corrigido e SuperAdmins (root e sancore) restaurados com sucesso!" 
    });
  } catch (error: any) {
    console.error("❌ Erro na correção de schema:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
