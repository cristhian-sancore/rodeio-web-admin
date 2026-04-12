import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const c = await prisma.configuracao.findFirst()
  if (!c) {
    await prisma.configuracao.create({ 
      data: { 
        id: 1, 
        titulo: 'Circuito Master 2026',
        numJuizes: 2,
        rankingMode: 'OFF'
      } 
    })
    console.log('Config inicial criada com sucesso!')
  } else {
    console.log('Config já existe no banco.')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
