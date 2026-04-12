import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('--- REPARANDO BANCO ---')
  
  // 1. Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword, role: 'ADMIN' },
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })
  console.log('✅ Usuário admin garantido.')

  // 2. Garantir Configuracao ID 1
  await prisma.configuracao.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      titulo: 'Circuito Master Professional',
      numJuizes: 2
    }
  })
  console.log('✅ Configuração ID 1 garantida.')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
