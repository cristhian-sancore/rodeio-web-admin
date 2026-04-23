import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSafeConfig } from "@/lib/config-safe";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const user = session.user as any;
    const juizId = user.juizId;
    const isAdmin = user.role === 'ADMIN';

    if (!juizId && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Sem permissão' });
    }

    const body = await req.json();
    const { montariaId, juizNumero, notaPeao, notaAnimal } = body;

    if (!montariaId || !juizNumero) {
      return NextResponse.json({ success: false, error: 'Dados incompletos' });
    }

    // 1. OTIMIZAÇÃO: Buscar dados atuais e validar em um único passo
    const [montaria, config] = await Promise.all([
      prisma.montaria.findUnique({
        where: { id: montariaId },
        include: { round: true }
      }),
      getSafeConfig()
    ]);

    if (!montaria) {
      return NextResponse.json({ success: false, error: 'Montaria não encontrada' });
    }

    // Validar notas (0-25)
    let peao = Math.max(0, Math.min(25, parseFloat(notaPeao) || 0));
    let animal = Math.max(0, Math.min(25, parseFloat(notaAnimal) || 0));

    // Verificar permissão do juiz
    const round = montaria.round;
    if (!isAdmin) {
      const juizMap: Record<number, number | null> = {
        1: round.juiz1Id,
        2: round.juiz2Id,
        3: round.juiz3Id,
        4: round.juiz4Id,
      };
      if (juizMap[juizNumero] !== juizId) {
        return NextResponse.json({ success: false, error: 'Você não é o juiz designado para esta cadeira' });
      }
    }

    // 2. CÁLCULO EM MEMÓRIA (MAIS RÁPIDO): Evita múltiplos updates no banco
    const tempNotas = {
      j1p: montaria.j1Peao, j1a: montaria.j1Animal,
      j2p: montaria.j2Peao, j2a: montaria.j2Animal,
      j3p: montaria.j3Peao, j3a: montaria.j3Animal,
      j4p: montaria.j4Peao, j4a: montaria.j4Animal,
    };

    // Atualiza a nota que acabou de chegar no objeto temporário
    const prefix = `j${juizNumero}`;
    (tempNotas as any)[`${prefix}p`] = peao;
    (tempNotas as any)[`${prefix}a`] = animal;

    let totalPeao = tempNotas.j1p + tempNotas.j2p + tempNotas.j3p + tempNotas.j4p;
    let totalAnimal = tempNotas.j1a + tempNotas.j2a + tempNotas.j3a + tempNotas.j4a;

    // Regras de desclassificação ou tempo menor que 8s (nota do peão é zero)
    if (montaria.desclassificado || (montaria.tempo > 0 && montaria.tempo < 8)) {
      totalPeao = 0;
      peao = 0; // Se desclassificado, a nota individual também vira 0 para o log
    }

    let notaTotal = totalPeao + totalAnimal;
    const numJuizes = config?.numJuizes || 2;

    // Normalização (Ex: 4 juízes = divide por 2 para teto 100)
    if (numJuizes === 4) {
      notaTotal /= 2; totalPeao /= 2; totalAnimal /= 2;
    } else if (numJuizes === 3) {
      notaTotal = (notaTotal / 3) * 2; totalPeao = (totalPeao / 3) * 2; totalAnimal = (totalAnimal / 3) * 2;
    } else if (numJuizes === 1) {
      notaTotal *= 2; totalPeao *= 2; totalAnimal *= 2;
    }

    if (notaTotal > 100) notaTotal = 100;

    // 3. PRIORIDADE 1 & 3: SALVAR TUDO E REGISTRAR LOG EM UMA ÚNICA TRANSAÇÃO
    await prisma.$transaction([
      // Atualiza a montaria com as novas notas e os totais calculados
      prisma.montaria.update({
        where: { id: montariaId },
        data: {
          [`j${juizNumero}Peao`]: peao,
          [`j${juizNumero}Animal`]: animal,
          notaPeao: totalPeao,
          notaAnimal: totalAnimal,
          notaTotal: notaTotal,
        },
      }),
      // Cria o registro de log para auditoria futura
      prisma.logNota.create({
        data: {
          montariaId: montariaId,
          usuarioNome: user.name || user.username || "Juiz Desconhecido",
          juizNumero: parseInt(juizNumero),
          notaPeao: peao,
          notaAnimal: animal,
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro crítico ao salvar nota:", error);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor' }, { status: 500 });
  }
}
