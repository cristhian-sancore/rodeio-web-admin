import { prisma } from "./db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🏁 INICIANDO SEED LUXURY...")

  // 1. Limpar Banco
  try {
    await (prisma as any).montaria.deleteMany();
    await (prisma as any).round.deleteMany();
    await (prisma as any).etapa.deleteMany();
    await (prisma as any).competidor.deleteMany();
    await (prisma as any).animal.deleteMany();
    await (prisma as any).user.deleteMany();
    await (prisma as any).temporada.deleteMany();
    await (prisma as any).configuracao.deleteMany();
  } catch (e) {
    console.log("Tabelas limpas ou não existentes.");
  }

  // 2. Criar Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await (prisma as any).user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  // 3. Criar Temporada
  const temporada = await (prisma as any).temporada.create({
    data: {
      ano: 2026,
      titulo: 'Temporada de Ouro 2026',
      ativa: true
    }
  });

  // 4. Criar Etapa
  const etapa = await (prisma as any).etapa.create({
    data: {
      nome: 'Grande Rodeio de Colorado',
      cidade: 'Colorado',
      estado: 'PR',
      dataInicio: new Date('2026-03-20'),
      dataFinal: new Date('2026-03-24'),
      temporadaId: temporada.id
    }
  });

  // 5. Configuração Inicial
  await (prisma as any).configuracao.create({
    data: { id: 1, numJuizes: 2, titulo: 'Circuito Rodeio Pro 2026' }
  });

  // 6. Criar Competidores
  await (prisma as any).competidor.create({
    data: { nome: 'Adriano Moraes', ranking: 0 }
  });
  await (prisma as any).competidor.create({
    data: { nome: 'Guilherme Marchi', ranking: 0 }
  });

  // 7. Criar Touros
  await (prisma as any).animal.create({
    data: { nome: 'Bipolar', companhia: 'Cia Paulo Emílio', tipo: 'Touro' }
  });
  await (prisma as any).animal.create({
    data: { nome: 'Acesso Negado', companhia: 'Cia Tércio Miranda', tipo: 'Touro' }
  });

  console.log("✔ Seed concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
