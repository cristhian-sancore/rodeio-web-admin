const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipe() {
  console.log('Iniciando limpeza total de testes do Banco de Dados...');
  try {
    await prisma.logNota.deleteMany();
    await prisma.montaria.deleteMany();
    await prisma.roundReserva.deleteMany();
    await prisma.round.deleteMany();
    await prisma.etapa.deleteMany();
    await prisma.temporada.deleteMany();
    await prisma.competidor.deleteMany();
    await prisma.animal.deleteMany();
    
    // ATENÇÃO: NÃO deletamos Configuracao, User e Juiz para manter o sistema utilizável.
    
    console.log('⚠️ BANCO DE DADOS LIMPO COM SUCESSO! ⚠️');
    console.log('Todas as montarias de teste, etapas, peões e animais foram apagados.');
  } catch (err) {
    console.error('Erro na limpeza:', err);
  } finally {
    await prisma.$disconnect();
  }
}

wipe();
