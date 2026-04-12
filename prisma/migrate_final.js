const { PrismaClient } = require('c:/coisas/RODEIO/rodeio-web/node_modules/@prisma/client');
const { createClient } = require('c:/coisas/RODEIO/rodeio-web/node_modules/@libsql/client/lib-cjs/node.js');

async function migrate() {
  const sqlite = createClient({
    url: 'file:c:/coisas/RODEIO/rodeio-web/prisma/dev.db',
  });

  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  });

  try {
    console.log("--- INICIANDO MIGRAÇÃO ---");

    // Helper para ler do SQLite
    const queryOld = async (table) => {
      const rs = await sqlite.execute(`SELECT * FROM ${table}`);
      return rs.rows;
    };

    // 1. User
    console.log("Migrando Users...");
    const users = await queryOld('User');
    for (const u of users) {
      await prisma.user.create({ data: { ...u, id: Number(u.id) } });
    }

    // 2. Temporada
    console.log("Migrando Temporadas...");
    const temporadas = await queryOld('Temporada');
    for (const t of temporadas) {
      await prisma.temporada.create({ data: { ...t, id: Number(t.id) } });
    }

    // 3. Etapa
    console.log("Migrando Etapas...");
    const etapas = await queryOld('Etapa');
    for (const e of etapas) {
      await prisma.etapa.create({ data: { ...e, id: Number(e.id) } });
    }

    // 4. Competidor
    console.log("Migrando Competidores...");
    const competidores = await queryOld('Competidor');
    for (const c of competidores) {
      await prisma.competidor.create({ data: { ...c, id: Number(c.id) } });
    }

    // 5. Animal
    console.log("Migrando Animais...");
    const animais = await queryOld('Animal');
    for (const a of animais) {
      await prisma.animal.create({ data: { ...a, id: Number(a.id) } });
    }

    // 6. Juiz
    console.log("Migrando Juízes...");
    const juizes = await queryOld('Juiz');
    for (const j of juizes) {
      await prisma.juiz.create({ data: { ...j, id: Number(j.id) } });
    }

    // 7. Round
    console.log("Migrando Rounds...");
    const rounds = await queryOld('Round');
    for (const r of rounds) {
      await prisma.round.create({ data: { ...r, id: Number(r.id) } });
    }

    // 8. Montaria
    console.log("Migrando Montarias...");
    const montarias = await queryOld('Montaria');
    for (const m of montarias) {
      await prisma.montaria.create({ data: { ...m, id: Number(m.id) } });
    }

    // 9. Configuracao
    console.log("Migrando Configurações...");
    const configs = await queryOld('Configuracao');
    for (const c of configs) {
      await prisma.configuracao.create({ data: { ...c, id: Number(c.id) } });
    }

    // 10. RoundReserva
    console.log("Migrando Reservas...");
    const reservas = await queryOld('RoundReserva');
    for (const r of reservas) {
      await prisma.roundReserva.create({ data: { ...r, id: Number(r.id) } });
    }

    console.log("--- MIGRAÇÃO CONCLUÍDA COM SUCESSO ---");
  } catch (error) {
    console.error("ERRO NA MIGRAÇÃO:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
