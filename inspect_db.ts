import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const temporadas = await prisma.temporada.findMany()
  const competidores = await prisma.competidor.findMany({ take: 5 })
  const animais = await prisma.animal.findMany({ take: 5 })
  const etapas = await prisma.etapa.findMany({ take: 2 })

  console.log(JSON.stringify({
    temporadas: temporadas.map(t => ({ id: t.id, nome: t.titulo })),
    competidores: competidores.map(c => ({ id: c.id, nome: c.nome })),
    animais: animais.map(a => ({ id: a.id, nome: a.nome, tipo: a.tipo })),
    etapas: etapas.map(e => ({ id: e.id, nome: e.nome }))
  }, null, 2))
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
