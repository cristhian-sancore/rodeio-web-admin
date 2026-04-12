import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const absoluteDbPath = 'C:/coisas/RODEIO/rodeio-web/prisma/dev.db'
const dbUrl = `file:${absoluteDbPath}`
const adapter = new PrismaLibSql({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 Iniciando geração de massa de dados de teste...')

  // 1. Garantir uma Temporada
  let temporada = await prisma.temporada.findFirst()
  if (!temporada) {
    temporada = await prisma.temporada.create({
      data: {
        ano: 2026,
        titulo: 'Circuito Teste Liga 2026',
        ativa: true,
        bonusMelhorNotaNoite: 10,
        bonusMelhorNotaEtapa: 50,
        bonusNotasAcima90: 20,
        ptsRound1: 20, ptsRound2: 15, ptsRound3: 10, ptsRound4: 5, ptsRound5: 2,
        ptsEtapa1: 100, ptsEtapa2: 80, ptsEtapa3: 60, ptsEtapa4: 50, ptsEtapa5: 40,
        ptsEtapa6: 30, ptsEtapa7: 20, ptsEtapa8: 15, ptsEtapa9: 10, ptsEtapa10: 5
      }
    })
    console.log('✅ Temporada criada.')
  }

  // 2. Criar Competidores (5 Touro, 5 Cavalo)
  const peoesTouro = []
  const peoesCavalo = []
  
  for (let i = 1; i <= 5; i++) {
    const p = await prisma.competidor.create({
      data: { nome: `Peão Touro ${i}`, cidade: 'Barretos', uf: 'SP' }
    })
    peoesTouro.push(p)
  }
  for (let i = 1; i <= 5; i++) {
    const p = await prisma.competidor.create({
      data: { nome: `Peão Cavalo ${i}`, cidade: 'Colorado', uf: 'PR' }
    })
    peoesCavalo.push(p)
  }
  console.log('✅ 10 Competidores criados.')

  // 3. Criar Animais (5 Touros, 5 Cavalos)
  const touros = []
  const cavalos = []
  for (let i = 1; i <= 5; i++) {
    const a = await prisma.animal.create({
      data: { nome: `Touro Brutal ${i}`, companhia: `Cia Touros ${i}`, tipo: 'Touro' }
    })
    touros.push(a)
  }
  for (let i = 1; i <= 5; i++) {
    const a = await prisma.animal.create({
      data: { nome: `Cavalo Vendaval ${i}`, companhia: `Tropa Cavalos ${i}`, tipo: 'Cavalo' }
    })
    cavalos.push(a)
  }
  console.log('✅ 10 Animais criados.')

  // 4. Criar 2 Etapas
  const nomesEtapas = ['Etapa de Barretos (TESTE)', 'Etapa de Jaguariúna (TESTE)']
  for (const nomeEtapa of nomesEtapas) {
    const etapa = await prisma.etapa.create({
      data: {
        nome: nomeEtapa,
        cidade: nomeEtapa.split(' ')[2],
        estado: 'SP',
        dataInicio: new Date(),
        dataFinal: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        temporadaId: temporada.id
      }
    })

    // ROUND 1: Touros
    const roundTouro = await prisma.round.create({
      data: { numero: 1, etapaId: etapa.id, modalidade: 'Touro' }
    })
    
    // ROUND 2: Cavalos
    const roundCavalo = await prisma.round.create({
      data: { numero: 2, etapaId: etapa.id, modalidade: 'Cavalo' }
    })

    // Gerar Montarias para Touros
    for (let i = 0; i < peoesTouro.length; i++) {
      const notaA = 42 + Math.random() * 5
      const notaP = 42 + Math.random() * 5
      await prisma.montaria.create({
        data: {
          competidorId: peoesTouro[i].id,
          animalId: touros[i].id,
          roundId: roundTouro.id,
          etapaId: etapa.id,
          j1Peao: notaP, j1Animal: notaA,
          j2Peao: notaP, j2Animal: notaA,
          notaPeao: notaP * 2,
          notaAnimal: notaA * 2,
          notaTotal: (notaP + notaA) * 2,
          tempo: 8.0
        }
      })
    }

    // Gerar Montarias para Cavalos
    for (let i = 0; i < peoesCavalo.length; i++) {
      const notaA = 40 + Math.random() * 5
      const notaP = 40 + Math.random() * 5
      await prisma.montaria.create({
        data: {
          competidorId: peoesCavalo[i].id,
          animalId: cavalos[i].id,
          roundId: roundCavalo.id,
          etapaId: etapa.id,
          j1Peao: notaP, j1Animal: notaA,
          j2Peao: notaP, j2Animal: notaA,
          notaPeao: notaP * 2,
          notaAnimal: notaA * 2,
          notaTotal: (notaP + notaA) * 2,
          tempo: 8.0
        }
      })
    }
    console.log(`✅ Massa de dados para ${nomeEtapa} gerada.`)
  }

  console.log('✨ Geração concluída com sucesso!')
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
