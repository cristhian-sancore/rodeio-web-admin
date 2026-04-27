const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const username = "sancore";
    const password = "123";
    
    console.log(`Verificando se o usuário ${username} já existe...`);
    
    const existing = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!existing) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: "ADMIN"
        }
      });
      console.log("Usuário sancore criado com SUCESSO!");
    } else {
      console.log("Usuário sancore já existe.");
    }

    // Garantir configuração básica
    const configCount = await prisma.configuracao.count();
    if (configCount === 0) {
      await prisma.configuracao.create({
        data: {
          titulo: "Rodeio Master Brasil",
          primaryColor: "#d4af37",
          secondaryColor: "#111111"
        }
      });
      console.log("Configuração padrão criada!");
    }
  } catch (e) {
    console.error("Erro ao criar admin:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
