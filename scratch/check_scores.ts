import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const montaria = await prisma.montaria.findFirst({
    where: { notaTotal: { gt: 0 } },
    orderBy: { dataHora: 'desc' },
    include: { competidor: true, animal: true }
  })

  if (!montaria) {
    console.log('Nenhuma montaria com nota encontrada.')
    return
  }

  console.log('--- MONTARIA ENCONTRADA ---')
  console.log('Competidor:', montaria.competidor.nome)
  console.log('J1 Peao:', montaria.j1Peao, 'J1 Animal:', montaria.j1Animal)
  console.log('J2 Peao:', montaria.j2Peao, 'J2 Animal:', montaria.j2Animal)
  console.log('Nota Peao (Total DB):', montaria.notaPeao)
  console.log('Nota Animal (Total DB):', montaria.notaAnimal)
  console.log('Nota TOTAL (DB):', montaria.notaTotal)
  
  const calculatedTotal = (montaria.j1Peao + montaria.j1Animal + montaria.j2Peao + montaria.j2Animal + montaria.j3Peao + montaria.j3Animal + montaria.j4Peao + montaria.j4Animal)
  console.log('Calculado Simples Sum (8 colunas):', calculatedTotal)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
