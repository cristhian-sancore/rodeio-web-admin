import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const absoluteDbPath = 'C:/coisas/RODEIO/rodeio-web/prisma/dev.db'
const dbUrl = `file:${absoluteDbPath}`
const adapter = new PrismaLibSql({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('--- DB CONNECTING TO:', dbUrl)
  console.log('🚀 Iniciando geração de 30 montarias de teste...')

  // Limpar etapas de teste anteriores para não poluir
  // await prisma.montaria.deleteMany({ where: { etapa: { nome: 'Rodeio Show - 30 Montarias' } } })

  // 1. Garantir Temporada
  let temporada = await prisma.temporada.findFirst()
  if (!temporada) {
    temporada = await prisma.temporada.create({
      data: {
        ano: 2026,
        titulo: 'Circuito Profissional 2026',
        ativa: true,
        bonusNotasAcima90: 20,
        bonusMelhorNotaNoite: 15,
        ptsEtapa1: 100, ptsEtapa2: 80, ptsEtapa3: 60
      }
    })
  }

  // 2. Criar Etapa
  const etapa = await prisma.etapa.create({
    data: {
      nome: 'Rodeio Show - 30 Montarias',
      cidade: 'São José do Rio Preto',
      estado: 'SP',
      dataInicio: new Date(),
      dataFinal: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      temporadaId: temporada.id
    }
  })

  // 3. Rounds
  const roundTouro = await prisma.round.create({
    data: { numero: 1, etapaId: etapa.id, modalidade: 'Touro' }
  })
  const roundCavalo = await prisma.round.create({
    data: { numero: 1, etapaId: etapa.id, modalidade: 'Cavalo' }
  })

  const companhias = ['Cia 2M', 'Cia Paulo Emílio', 'Tropa WR', 'Cia Califórnia', 'Tropa SBC']

  // 4. Gerar 15 Montarias de Touro
  console.log('🐂 Gerando 15 montarias de touro...')
  for (let i = 1; i <= 15; i++) {
    const comp = await prisma.competidor.create({
      data: { nome: `Atleta Touro ${i}`, cidade: 'Sertãozinho', uf: 'SP' }
    })
    const anim = await prisma.animal.create({
      data: { nome: `Touro Fera ${i}`, companhia: companhias[i % 5], tipo: 'Touro' }
    })

    const caiu = i % 4 === 0
    const notaP = caiu ? 0 : (20 + Math.random() * 5)
    const notaA = 21 + Math.random() * 4
    
    const totalP = (notaP * 2)
    const totalA = (notaA * 2)
    const total = totalP + totalA

    await prisma.montaria.create({
      data: {
        competidorId: comp.id,
        animalId: anim.id,
        roundId: roundTouro.id,
        etapaId: etapa.id,
        j1Peao: notaP, j1Animal: notaA,
        j2Peao: notaP, j2Animal: notaA,
        notaPeao: totalP,
        notaAnimal: totalA,
        notaTotal: total,
        tempo: caiu ? (2 + Math.random() * 4) : 8.0
      }
    })
  }

  // 5. Gerar 15 Montarias de Cavalo
  console.log('🐎 Gerando 15 montarias de cavalo...')
  for (let i = 1; i <= 15; i++) {
    const comp = await prisma.competidor.create({
      data: { nome: `Atleta Cavalo ${i}`, cidade: 'Olimpia', uf: 'SP' }
    })
    const anim = await prisma.animal.create({
      data: { nome: `Cavalo Trovão ${i}`, companhia: companhias[i % 5], tipo: 'Cavalo' }
    })

    const caiu = i % 5 === 0
    const notaP = caiu ? 0 : (21 + Math.random() * 4)
    const notaA = 21 + Math.random() * 4
    
    const totalP = (notaP * 2)
    const totalA = (notaA * 2)
    const total = totalP + totalA

    await prisma.montaria.create({
      data: {
        competidorId: comp.id,
        animalId: anim.id,
        roundId: roundCavalo.id,
        etapaId: etapa.id,
        j1Peao: notaP, j1Animal: notaA,
        j2Peao: notaP, j2Animal: notaA,
        notaPeao: totalP,
        notaAnimal: totalA,
        notaTotal: total,
        tempo: caiu ? (3 + Math.random() * 3) : 8.0
      }
    })
  }

  console.log('✨ 30 montarias registradas com sucesso na Etapa ID: ' + etapa.id)
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
