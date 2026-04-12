import { prisma } from "./src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Limpiando banco de dados...");
  
  // Excluir em ordem reversa de dependências
  await prisma.montaria.deleteMany({});
  await prisma.round.deleteMany({});
  await prisma.etapa.deleteMany({});
  await prisma.temporada.deleteMany({});
  await prisma.competidor.deleteMany({});
  await prisma.animal.deleteMany({});
  await prisma.juiz.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Criando usuário admin...");
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await (prisma as any).user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log("Banco de dados resetado com sucesso! Apenas o usuário 'admin' / 'admin123' existe agora.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
