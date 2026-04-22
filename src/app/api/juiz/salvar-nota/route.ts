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

    // Validar notas (0-25)
    const peao = Math.max(0, Math.min(25, parseFloat(notaPeao) || 0));
    const animal = Math.max(0, Math.min(25, parseFloat(notaAnimal) || 0));

    // Verificar montaria existe e juiz está vinculado
    const montaria = await prisma.montaria.findUnique({
      where: { id: montariaId },
      include: { round: true }
    });

    if (!montaria) {
      return NextResponse.json({ success: false, error: 'Montaria não encontrada' });
    }

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
        return NextResponse.json({ success: false, error: 'Você não é o juiz designado' });
      }
    }

    // Preparar os campos para atualizar
    const updateData: any = {};
    updateData[`j${juizNumero}Peao`] = peao;
    updateData[`j${juizNumero}Animal`] = animal;

    // Atualizar apenas as notas deste juiz
    await prisma.montaria.update({
      where: { id: montariaId },
      data: updateData,
    });

    // Recalcular totais
    const updated = await prisma.montaria.findUnique({ where: { id: montariaId } });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Erro ao recalcular' });
    }

    const config = await getSafeConfig();
    const numJuizes = config?.numJuizes || 2;

    let totalPeao = updated.j1Peao + updated.j2Peao + updated.j3Peao + updated.j4Peao;
    let totalAnimal = updated.j1Animal + updated.j2Animal + updated.j3Animal + updated.j4Animal;

    if (updated.desclassificado || (updated.tempo > 0 && updated.tempo < 8)) totalPeao = 0;

    let notaTotal = totalPeao + totalAnimal;

    // Normalização pelo número de juízes (teto de 100)
    if (numJuizes === 4) {
      notaTotal /= 2;
      totalPeao /= 2;
      totalAnimal /= 2;
    } else if (numJuizes === 3) {
      notaTotal = (notaTotal / 3) * 2;
      totalPeao = (totalPeao / 3) * 2;
      totalAnimal = (totalAnimal / 3) * 2;
    } else if (numJuizes === 1) {
      notaTotal *= 2;
      totalPeao *= 2;
      totalAnimal *= 2;
    }

    if (notaTotal > 100) notaTotal = 100;
    if (totalPeao > 50) totalPeao = 50;
    if (totalAnimal > 50) totalAnimal = 50;

    await prisma.montaria.update({
      where: { id: montariaId },
      data: {
        notaPeao: totalPeao,
        notaAnimal: totalAnimal,
        notaTotal: notaTotal,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar nota do juiz:", error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
