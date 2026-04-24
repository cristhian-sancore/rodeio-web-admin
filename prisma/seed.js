const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando semeadura de dados fictícios...');

  // 1. Limpeza opcional (CUIDADO: descomente se quiser limpar antes de inserir)
  /*
  await prisma.logNota.deleteMany();
  await prisma.montaria.deleteMany();
  await prisma.roundReserva.deleteMany();
  await prisma.round.deleteMany();
  await prisma.etapa.deleteMany();
  await prisma.temporada.deleteMany();
  await prisma.competidor.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.juiz.deleteMany();
  await prisma.user.deleteMany();
  */

  // 2. Criar Usuário Admin Default
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });
  console.log('✅ Usuário Admin criado (admin / admin123)');

  // 3. Criar Juízes
  const juiz1 = await prisma.juiz.create({ data: { nome: 'Tião Processo', cidade: 'Barretos', uf: 'SP' } });
  const juiz2 = await prisma.juiz.create({ data: { nome: 'Neto Oger', cidade: 'São José do Rio Preto', uf: 'SP' } });
  
  // Criar usuários para os juízes
  await prisma.user.create({
    data: { username: 'juiz1', password: hashedPassword, role: 'JUIZ', juizId: juiz1.id }
  });
  await prisma.user.create({
    data: { username: 'juiz2', password: hashedPassword, role: 'JUIZ', juizId: juiz2.id }
  });
  console.log('✅ Juízes e usuários de juízes criados (juiz1, juiz2 / admin123)');

  // 4. Criar Competidores
  const competidoresData = [
    { nome: 'Adriano Moraes', cidade: 'Quintana', uf: 'SP' },
    { nome: 'Silvano Alves', cidade: 'Pilar do Sul', uf: 'SP' },
    { nome: 'Guilherme Marchi', cidade: 'Itupeva', uf: 'SP' },
    { nome: 'Kaique Pacheco', cidade: 'Itatiba', uf: 'SP' },
    { nome: 'José Vitor Leme', cidade: 'Ribas do Rio Pardo', uf: 'MS' },
    { nome: 'Cássio Dias Barbosa', cidade: 'São Francisco de Sales', uf: 'MG' },
    { nome: 'Dener Barbosa', cidade: 'Paulo de Faria', uf: 'SP' },
    { nome: 'Luciano de Castro', cidade: 'Guzolândia', uf: 'SP' },
    { nome: 'Rafael dos Santos', cidade: 'São José do Rio Pardo', uf: 'SP' },
    { nome: 'Maurício Moreira', cidade: 'Gaviao Peixoto', uf: 'SP' },
  ];

  const competidores = [];
  for (const c of competidoresData) {
    const comp = await prisma.competidor.create({ data: c });
    competidores.push(comp);
  }
  console.log('✅ 10 Competidores lendários criados.');

  // 5. Criar Animais
  const animaisData = [
    { nome: 'Bipolar', companhia: 'Cia Paulo Emílio', tipo: 'Touro' },
    { nome: 'Agressivo', companhia: 'Cia Paulo Emílio', tipo: 'Touro' },
    { nome: 'Rei da Safra', companhia: 'Cia Tercio Miranda', tipo: 'Touro' },
    { nome: 'Vingador', companhia: 'Cia Marcondes Maia', tipo: 'Touro' },
    { nome: 'Fabuloso', companhia: 'Cia Califórnia', tipo: 'Touro' },
    { nome: 'Mexerica', companhia: 'Cia 2M', tipo: 'Touro' },
    { nome: 'Nortão', companhia: 'Cia Toca do Touro', tipo: 'Touro' },
    { nome: 'Impressionante', companhia: 'Cia Fortaleza', tipo: 'Touro' },
    { nome: 'Cadeado', companhia: 'Cia Guto Paglione', tipo: 'Touro' },
    { nome: 'Aniquilador', companhia: 'Cia F Bull', tipo: 'Touro' },
  ];

  const animais = [];
  for (const a of animaisData) {
    const ani = await prisma.animal.create({ data: a });
    animais.push(ani);
  }
  console.log('✅ 10 Touros de elite criados.');

  // 6. Criar Temporada e Etapa
  const temporada = await prisma.temporada.create({
    data: {
      ano: 2026,
      titulo: 'Circuito Master Rodeio 2026',
      ativa: true,
      bonusMelhorNotaNoite: 50,
      bonusMelhorNotaEtapa: 100
    }
  });

  const etapa = await prisma.etapa.create({
    data: {
      nome: 'Rodeio de Barretos 2026',
      cidade: 'Barretos',
      estado: 'SP',
      dataInicio: new Date(),
      dataFinal: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      temporadaId: temporada.id,
      defaultJuiz1Id: juiz1.id,
      defaultJuiz2Id: juiz2.id
    }
  });
  console.log('✅ Temporada 2026 e Etapa Barretos criadas.');

  // 7. Criar Round 1
  const round = await prisma.round.create({
    data: {
      numero: 1,
      etapaId: etapa.id,
      juiz1Id: juiz1.id,
      juiz2Id: juiz2.id,
      modalidade: 'Touro'
    }
  });
  console.log('✅ Round 1 configurado.');

  // 8. Criar Montarias (Súmula do Round 1)
  for (let i = 0; i < 5; i++) {
    await prisma.montaria.create({
      data: {
        competidorId: competidores[i].id,
        animalId: animais[i].id,
        roundId: round.id,
        etapaId: etapa.id
      }
    });
  }
  console.log('✅ Súmula do Round 1 com 5 montarias iniciais pronta.');

  // 9. Configuração Global
  await prisma.configuracao.upsert({
    where: { id: 1 },
    update: {
       numJuizes: 2,
       titulo: "RODEIO WEB V2",
       overlayMode: 'ID'
    },
    create: {
      id: 1,
      numJuizes: 2,
      titulo: "RODEIO WEB V2",
      overlayMode: 'ID'
    }
  });

  console.log('✨ Base de dados populada com sucesso! Use "admin" / "admin123" para logar.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
