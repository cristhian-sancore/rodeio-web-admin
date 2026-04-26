const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const username = "sancore";
  const password = "123";
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`🛡️ [SUPER-ADMIN] Criando usuário: ${username}...`);

  const user = await prisma.user.upsert({
    where: { username: username },
    update: {
      password: hashedPassword,
      role: "SUPER_ADMIN"
    },
    create: {
      username: username,
      password: hashedPassword,
      role: "SUPER_ADMIN"
    }
  });

  console.log(`✅ [SUCESSO] Usuário ${username} criado/atualizado com sucesso!`);
  console.log(`🔑 Role: ${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
