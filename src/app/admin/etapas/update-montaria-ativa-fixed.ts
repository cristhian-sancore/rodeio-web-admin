export async function updateMontariaAtiva(montariaId: number | null) {
  const currentConfig = await prisma.configuracao.findFirst();
  
  // Lógica de ativação simplificada (Permitir troca livre para o Admin)
  await prisma.configuracao.upsert({
    where: { id: currentConfig?.id || 1 },
    update: { montariaAtivaId: montariaId },
    create: { id: 1, montariaAtivaId: montariaId, numJuizes: 2, titulo: "Rodeio Web" }
  });

  if (montariaId) {
    try {
      const montaria = await prisma.montaria.findUnique({
        where: { id: montariaId },
        include: { competidor: true, animal: true, etapa: { select: { nome: true } } }
      });
      const config = await prisma.configuracao.findFirst();

      if (montaria && config && config.vmixUrl) {
         const { sendToVMix } = await import('@/lib/vmix');
         const { getCompetidorStageRank } = await import('@/lib/ranking');
         const stageRank = await getCompetidorStageRank(montaria.etapaId, montaria.competidorId);

         await sendToVMix(config as any, {
            competidor: montaria.competidor.nome,
            animal: montaria.animal.nome,
            etapaNome: (montaria as any).etapa?.nome,
            total: 0,
            etapaRank: stageRank.rank > 0 ? `${stageRank.rank}º` : '---'
         });
      }
    } catch (vErr) {
       console.error("Erro vMix ao trocar montaria:", vErr);
    }
  }

  revalidatePath('/admin/execucao');
  revalidatePath('/api/overlay/current');
  return { success: true };
}
