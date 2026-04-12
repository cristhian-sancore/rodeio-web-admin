import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const absoluteDbPath = 'C:/coisas/RODEIO/rodeio-web/prisma/dev.db'
const dbUrl = `file:${absoluteDbPath}`
const adapter = new PrismaLibSql({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 Iniciando geração de 5 Rounds de Touros (30 Competidores)...')

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
      nome: 'Copa dos Campeões - 5 Rounds / Final',
      cidade: 'Colorado',
      estado: 'PR',
      dataInicio: new Date(),
      dataFinal: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      temporadaId: temporada.id
    }
  })

  // 3. Criar 30 Competidores e 50 Touros (para variar)
  const peoes = []
  for (let i = 1; i <= 30; i++) {
    const p = await prisma.competidor.create({
      data: { nome: `Peão Elite ${i}`, cidade: 'Barretos', uf: 'SP' }
    })
    peoes.push(p)
  }

  const touros = []
  for (let i = 1; i <= 60; i++) {
    const a = await prisma.animal.create({
      data: { nome: `Touro Sagrado ${i}`, companhia: `Cia Central ${i % 5}`, tipo: 'Touro' }
    })
    touros.push(a)
  }

  // 4. Criar 5 Rounds
  const rounds = []
  for (let r = 1; r <= 5; r++) {
    const isFinal = r === 5
    const round = await prisma.round.create({
      data: { 
        numero: r, 
        etapaId: etapa.id, 
        modalidade: 'Touro'
      }
    })
    rounds.push(round)

    console.log(`🐂 Lançando montarias para o Round ${r}${isFinal ? ' (FINAL)' : ''}...`)
    
    // Simulação: Nos Rounds 1-4 todos montam. Na Final (R5), apenas os 10 melhores (simulado aqui pelos 10 primeiros IDs)
    const competidoresNesteRound = isFinal ? peoes.slice(0, 10) : peoes;

    for (let i = 0; i < competidoresNesteRound.length; i++) {
      const p = competidoresNesteRound[i]
      const t = touros[(r * 10 + i) % touros.length]

      // Lógica de nota:
      // - No Round 1 e 2, notas altas (80-92)
      // - No Round 3 e 4, o bicho pega (mais quedas)
      // - Na Final, só notas de peso
      let caiu = false
      if (r === 3 && i % 3 === 0) caiu = true
      if (r === 4 && i % 2 === 0) caiu = true
      if (isFinal && i % 5 === 0) caiu = true

      const notaP = caiu ? 0 : (21 + Math.random() * 4)
      const notaA = caiu ? (18 + Math.random() * 3) : (21 + Math.random() * 4)
      
      const totalP = (notaP * 2)
      const totalA = (notaA * 2)
      const total = totalP + totalA

      await prisma.montaria.create({
        data: {
          competidorId: p.id,
          animalId: t.id,
          roundId: round.id,
          etapaId: etapa.id,
          j1Peao: notaP, j1Animal: notaA,
          j2Peao: notaP, j2Animal: notaA,
          notaPeao: totalP,
          notaAnimal: totalA,
          notaTotal: total,
          tempo: caiu ? (2 + Math.random() * 5.5) : 8.0
        }
      })
    }
  }

  console.log('✨ Campeonato de 5 Rounds finalizado com sucesso! Etapa ID: ' + etapa.id)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
