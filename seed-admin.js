const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const username = "admin";
    const password = "admin123";
    
    console.log(`Verificando se o usuário ${username} já existe...`);
    
    const existing = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existing) {
      console.log("Usuário admin já existe.");
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "ADMIN"
      }
    });
    
    console.log("Usuário ADMIN criado com SUCESSO!");
    console.log(`Login: ${username}`);
    console.log(`Senha: ${password}`);
  } catch (e) {
    console.error("Erro ao criar admin:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
