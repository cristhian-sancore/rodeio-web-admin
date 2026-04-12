import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const config = await prisma.configuracao.findFirst()
  console.log('--- DB DIAGNOSIS ---')
  console.log('Configuracao:', config)
  
  const roundCount = await prisma.round.count()
  console.log('Rounds:', roundCount)
  
  const montariaCount = await prisma.montaria.count()
  console.log('Montarias:', montariaCount)
  
  const etapaCount = await prisma.etapa.count()
  console.log('Etapas:', etapaCount)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
