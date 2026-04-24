const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const username = "root";
    const password = "master_rodeio_2026";
    
    console.log(`🚀 Criando Usuário SUPER ADMIN (ROOT)...`);
    
    const existing = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existing) {
      console.log(`⚠️ O usuário ${username} já existe. Atualizando cargo para SUPER_ADMIN...`);
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "SUPER_ADMIN", password: hashedPassword }
      });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: "SUPER_ADMIN"
        }
      });
      console.log("✅ Usuário SUPER_ADMIN criado com SUCESSO!");
    }
    
    console.log("\n----------------------------");
    console.log(`LOGIN: ${username}`);
    console.log(`SENHA: ${password}`);
    console.log("----------------------------\n");
    console.log("⚠️ ATENÇÃO: Use este usuário apenas para manutenções críticas e backup.");
    
  } catch (e) {
    console.error("❌ Erro ao criar super admin:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
