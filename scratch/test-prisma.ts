
import { prisma } from '../src/lib/db';

async function test() {
  try {
    const round = await (prisma as any).round.findFirst({
      include: {
        etapa: true,
        juiz1: true,
        juiz2: true,
      }
    });
    console.log('SUCCESS:', round ? 'Round found' : 'No round found');
    if (round) {
        console.log('Etapa:', round.etapa?.nome);
        console.log('Juiz 1:', round.juiz1?.nome);
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

test();
