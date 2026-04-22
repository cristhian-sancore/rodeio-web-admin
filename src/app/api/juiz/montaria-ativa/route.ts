import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSafeConfig } from "@/lib/config-safe";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ active: false, message: 'Não autenticado' }, { status: 401 });
    }

    const user = session.user as any;
    const juizId = user.juizId;

    if (!juizId) {
      return NextResponse.json({ active: false, message: 'Usuário não é juiz' });
    }

    const config = await getSafeConfig();
    if (!config || !config.montariaAtivaId) {
      return NextResponse.json({ active: false, message: 'Nenhuma montaria ativa no momento' });
    }

    const montaria = await prisma.montaria.findUnique({
      where: { id: config.montariaAtivaId },
      include: {
        competidor: true,
        animal: true,
        round: {
          include: {
            juiz1: true,
            juiz2: true,
            juiz3: true,
            juiz4: true,
          }
        }
      }
    });

    if (!montaria) {
      return NextResponse.json({ active: false, message: 'Montaria não encontrada' });
    }

    // Determinar o número do juiz (1-4) baseado no juizId
    let juizNumero = 0;
    let juizNome = '';
    const round = montaria.round;

    if (round.juiz1Id === juizId) {
      juizNumero = 1;
      juizNome = round.juiz1?.nome || 'Juiz 1';
    } else if (round.juiz2Id === juizId) {
      juizNumero = 2;
      juizNome = round.juiz2?.nome || 'Juiz 2';
    } else if (round.juiz3Id === juizId) {
      juizNumero = 3;
      juizNome = round.juiz3?.nome || 'Juiz 3';
    } else if (round.juiz4Id === juizId) {
      juizNumero = 4;
      juizNome = round.juiz4?.nome || 'Juiz 4';
    } else {
      return NextResponse.json({ 
        active: false, 
        message: 'Você não está vinculado a este round' 
      });
    }

    // Pegar as notas já existentes deste juiz
    const notasPeaoKey = `j${juizNumero}Peao` as keyof typeof montaria;
    const notasAnimalKey = `j${juizNumero}Animal` as keyof typeof montaria;

    return NextResponse.json({
      active: true,
      data: {
        id: montaria.id,
        competidor: montaria.competidor.nome,
        animal: montaria.animal.nome,
        companhia: montaria.animal.companhia,
        juizNumero,
        juizNome,
        notaPeao: montaria[notasPeaoKey] as number,
        notaAnimal: montaria[notasAnimalKey] as number,
        tempo: montaria.tempo,
        desclassificado: montaria.desclassificado,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    console.error("Erro API juiz montaria-ativa:", error);
    return NextResponse.json({ active: false, message: 'Erro interno' }, { status: 500 });
  }
}
