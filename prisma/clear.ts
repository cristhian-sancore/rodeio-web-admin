import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const absoluteDbPath = 'C:/coisas/RODEIO/rodeio-web/prisma/dev.db'
const dbUrl = `file:${absoluteDbPath}`
const adapter = new PrismaLibSql({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 Limpando banco de dados...')

  try {
    // Ordem inversa das dependências
    await prisma.montaria.deleteMany()
    console.log('  - Montarias removidas')
    
    await prisma.roundReserva.deleteMany()
    console.log('  - Reservas de Round removidas')
    
    await prisma.round.deleteMany()
    console.log('  - Rounds removidos')
    
    await prisma.etapa.deleteMany()
    console.log('  - Etapas removidas')
    
    await prisma.animal.deleteMany()
    console.log('  - Animais removidos')
    
    await prisma.competidor.deleteMany()
    console.log('  - Competidores removidos')
    
    await prisma.temporada.deleteMany()
    console.log('  - Temporadas removidas')

    // Opcional: Limpar juízes e usuários (exceto o admin principal se quiser)
    // Se o usuário quer "limpar os dados", geralmente quer tudo limpo.
    // Mas vamos manter os usuários para não perder o login de teste 'melo' e 'admin'.
    
    console.log('✅ Banco de dados limpo com sucesso! (Usuários preservados)')
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
