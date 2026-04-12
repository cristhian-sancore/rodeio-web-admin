import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } })
  console.log('--- CONFIGURAÇÃO ATUAL ---')
  console.log('Montaria Ativa ID:', config?.montariaAtivaId)
  console.log('Timer Correndo:', config?.timerRunning)
  console.log('Timer Iniciado Em:', config?.timerStartedAt)

  if (config?.montariaAtivaId) {
    const montaria = await prisma.montaria.findUnique({ where: { id: config.montariaAtivaId } })
    console.log('--- MONTARIA ATIVA ---')
    console.log('Competidor ID:', montaria?.competidorId)
    console.log('Tempo Gravado:', montaria?.tempo)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
