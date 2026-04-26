import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSafeConfig } from "@/lib/config-safe";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'SUPER')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const montariaId = searchParams.get('montariaId');

    if (!montariaId) {
      return NextResponse.json({ error: 'ID da montaria não fornecido' }, { status: 400 });
    }

    const montaria = await prisma.montaria.findUnique({
      where: { id: parseInt(montariaId) },
      include: {
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
      return NextResponse.json({ error: 'Montaria não encontrada' }, { status: 404 });
    }

    const config = await getSafeConfig();
    const numJuizes = config?.numJuizes || 2;
    const round = montaria.round;

    const juizes = [];
    
    // Juiz 1
    juizes.push({
      numero: 1,
      nome: round.juiz1?.nome || 'Juiz 1',
      notaPeao: montaria.j1Peao,
      notaAnimal: montaria.j1Animal,
      enviou: montaria.j1Peao > 0 || montaria.j1Animal > 0
    });

    // Juiz 2
    if (numJuizes >= 2) {
      juizes.push({
        numero: 2,
        nome: round.juiz2?.nome || 'Juiz 2',
        notaPeao: montaria.j2Peao,
        notaAnimal: montaria.j2Animal,
        enviou: montaria.j2Peao > 0 || montaria.j2Animal > 0
      });
    }

    // Juiz 3
    if (numJuizes >= 3) {
      juizes.push({
        numero: 3,
        nome: round.juiz3?.nome || 'Juiz 3',
        notaPeao: montaria.j3Peao,
        notaAnimal: montaria.j3Animal,
        enviou: montaria.j3Peao > 0 || montaria.j3Animal > 0
      });
    }

    // Juiz 4
    if (numJuizes >= 4) {
      juizes.push({
        numero: 4,
        nome: round.juiz4?.nome || 'Juiz 4',
        notaPeao: montaria.j4Peao,
        notaAnimal: montaria.j4Animal,
        enviou: montaria.j4Peao > 0 || montaria.j4Animal > 0
      });
    }

    const todosEnviaram = juizes.every(j => j.enviou);

    return NextResponse.json({
      juizes,
      todosEnviaram
    });
  } catch (error) {
    console.error("Erro API admin juiz-status:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
