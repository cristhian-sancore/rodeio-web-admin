import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const absoluteDbPath = 'C:/coisas/RODEIO/rodeio-web/prisma/dev.db'
const dbUrl = `file:${absoluteDbPath}`
const adapter = new PrismaLibSql({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 Iniciando geração de Rodeio com Eliminação Avançada...')

  // 1. Garantir Temporada
  let temporada = await prisma.temporada.findFirst()
  if (!temporada) {
    temporada = await prisma.temporada.create({
      data: { ano: 2026, titulo: 'Circuito Profissional 2026', ativa: true }
    })
  }

  // 2. Criar Etapa (3 Dias de Calendário)
  const etapa = await prisma.etapa.create({
    data: {
      nome: 'Desafio Extreme - 3 Dias / Corte de 5 em 5',
      cidade: 'Fernandópolis',
      estado: 'SP',
      dataInicio: new Date(),
      dataFinal: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      temporadaId: temporada.id
    }
  })

  // 3. Criar 30 Competidores e Animais
  const peoes = []
  for (let i = 1; i <= 30; i++) {
    const p = await prisma.competidor.create({
      data: { nome: `Aspirante ${i}`, cidade: 'Indaiatuba', uf: 'SP' }
    })
    peoes.push(p)
  }

  const touros = []
  for (let i = 1; i <= 80; i++) {
    const a = await prisma.animal.create({
      data: { nome: `Touro Brutal ${i}`, companhia: 'Cia Radical', tipo: 'Touro' }
    })
    touros.push(a)
  }

  // Lógica de Ranking para os Cortes
  let rankingAcumulado: Record<number, { id: number, pontos: number, tempo: number }> = {}
  peoes.forEach(p => { rankingAcumulado[p.id] = { id: p.id, pontos: 0, tempo: 0 } })

  const getTop = (count: number) => {
    return Object.values(rankingAcumulado)
      .sort((a,b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        return b.tempo - a.tempo;
      })
      .slice(0, count)
      .map(r => peoes.find(p => p.id === r.id)!)
  }

  // ROUNDS
  const configRounds = [
    { num: 1, label: 'Noite 1', corte: 30 },
    { num: 2, label: 'Noite 2', corte: 25 }, // Elimina 5
    { num: 3, label: 'Semi-Final', corte: 15 }, // Vai afunilando
    { num: 4, label: 'GRANDE FINAL', corte: 5 }  // Sobram os 5 melhores
  ]

  for (const config of configRounds) {
    const round = await prisma.round.create({
      data: { 
        numero: config.num, 
        etapaId: etapa.id, 
        modalidade: 'Touro'
      }
    })

    const competidoresParaEsteRound = getTop(config.corte)
    console.log(`🐂 ${config.label}: ${competidoresParaEsteRound.length} competidores na disputa...`)

    for (let i = 0; i < competidoresParaEsteRound.length; i++) {
      const p = competidoresParaEsteRound[i]
      const t = touros[(config.num * 20 + i) % touros.length]

      // Notas realistas (75-92)
      const caiu = Math.random() < 0.2 // 20% de chance de queda
      const notaP = caiu ? 0 : (21 + Math.random() * 4)
      const notaA = caiu ? (19 + Math.random() * 3) : (21 + Math.random() * 4)
      
      const tp = notaP * 2
      const ta = notaA * 2
      const total = tp + ta
      const tempo = caiu ? (3 + Math.random() * 4) : 8.0

      await prisma.montaria.create({
        data: {
          competidorId: p.id, animalId: t.id, roundId: round.id, etapaId: etapa.id,
          j1Peao: notaP, j1Animal: notaA, j2Peao: notaP, j2Animal: notaA,
          notaPeao: tp, notaAnimal: ta, notaTotal: total, tempo: tempo
        }
      })

      // Atualiza ranking para o próximo corte
      rankingAcumulado[p.id].pontos += total
      rankingAcumulado[p.id].tempo += tempo
    }
  }

  console.log('✨ Rodeio de 3 dias com sistema de eliminatórias concluído! Etapa ID: ' + etapa.id)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
