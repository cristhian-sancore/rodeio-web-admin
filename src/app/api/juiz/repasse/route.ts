import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applyRepasse } from "@/app/admin/etapas/actions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });

    const user = session.user as any;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const isJuiz = !!user.juizId;

    if (!isAdmin && !isJuiz) {
       return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    const { montariaId } = await req.json();
    if (!montariaId) return NextResponse.json({ success: false, error: 'ID da montaria ausente' });

    const montaria = await prisma.montaria.findUnique({
      where: { id: montariaId },
      include: { round: true }
    });

    if (!montaria) return NextResponse.json({ success: false, error: 'Montaria não encontrada' });

    // Executar a ação de repasse (reutilizando a lógica do admin)
    await applyRepasse(montariaId, montaria.roundId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro no repasse do juiz:", err);
    return NextResponse.json({ success: false, error: err.message || 'Erro interno' }, { status: 500 });
  }
}
