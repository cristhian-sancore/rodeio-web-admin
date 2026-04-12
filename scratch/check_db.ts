import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const animais = await prisma.animal.count()
  const competidores = await prisma.competidor.count()
  const etapas = await prisma.etapa.count()
  const montarias = await prisma.montaria.count()

  console.log('--- CONTAGEM SQLITE ---')
  console.log(`ANIMAIS: ${animais}`)
  console.log(`COMPETIDORES: ${competidores}`)
  console.log(`ETAPAS: ${etapas}`)
  console.log(`MONTARIAS: ${montarias}`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
