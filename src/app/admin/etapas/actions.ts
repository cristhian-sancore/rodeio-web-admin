'use server';

import { prisma } from "@/lib/db";
const p = prisma;
import { logSystemAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
import { authOptions } from "@/lib/auth";
import { sendToVMix, triggerVMixOverlay } from "@/lib/vmix";
import { getCompetidorStageRank } from "@/lib/ranking";
import { getSafeConfig } from "@/lib/config-safe";

export async function createRound(etapaId: number, numero: number, juiz1Id?: number, juiz2Id?: number, juiz3Id?: number, juiz4Id?: number, modalidade?: string, dataAgenda?: Date) {
  const cleanId = (id?: any) => {
    const parsed = parseInt(String(id));
    return (parsed && parsed > 0) ? parsed : null;
  };
  
  await p.round.create({
    data: { 
      numero, 
      etapaId, 
      juiz1Id: cleanId(juiz1Id), 
      juiz2Id: cleanId(juiz2Id), 
      juiz3Id: cleanId(juiz3Id), 
      juiz4Id: cleanId(juiz4Id), 
      modalidade: modalidade || "Touro",
      dataAgenda: dataAgenda || new Date()
    }
  });
  revalidatePath(`/admin/etapas/${etapaId}`);
  revalidatePath(`/admin/execucao`);
}

export async function updateMontariaNota(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autorizado");

  const user = session.user as any;
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  const mId = parseInt(formData.get('montariaId') as string);
  const tempo = parseFloat(formData.get('tempo') as string || '0');
  const desclassificado = formData.get('desclassificado') === 'on';
  const motivo = formData.get('motivo') as string;

  const m = await p.montaria.findUnique({ 
    where: { id: mId },
    include: { 
      round: true,
      competidor: true,
      animal: true
    }
  });
  if (!m) throw new Error("Montaria não encontrada");

  const config = await getSafeConfig() || { 
    numJuizes: 2,
    vmixUrl: null,
    vmixInputId: null,
    vmixReplayInputId: null,
    replayExportPath: null,
    vmixOverlayChannel: 1
  };
  const numJuizes = parseInt(String(config.numJuizes)) || 2;

  const round = m.round;

  // Verificar permissões por juiz
  const isJ1 = isAdmin || (user.juizId && round.juiz1Id === user.juizId);
  const isJ2 = (numJuizes >= 2) && (isAdmin || (user.juizId && round.juiz2Id === user.juizId));
  const isJ3 = (numJuizes >= 4) && (isAdmin || (user.juizId && round.juiz3Id === user.juizId));
  const isJ4 = (numJuizes >= 4) && (isAdmin || (user.juizId && round.juiz4Id === user.juizId));

  let j1P = isJ1 ? parseFloat(formData.get('j1Peao') as string || '0') : m.j1Peao;
  let j1A = isJ1 ? parseFloat(formData.get('j1Animal') as string || '0') : m.j1Animal;
  let j2P = isJ2 ? parseFloat(formData.get('j2Peao') as string || '0') : m.j2Peao;
  let j2A = isJ2 ? parseFloat(formData.get('j2Animal') as string || '0') : m.j2Animal;
  let j3P = isJ3 ? parseFloat(formData.get('j3Peao') as string || '0') : m.j3Peao;
  let j3A = isJ3 ? parseFloat(formData.get('j3Animal') as string || '0') : m.j3Animal;
  let j4P = isJ4 ? parseFloat(formData.get('j4Peao') as string || '0') : m.j4Peao;
  let j4A = isJ4 ? parseFloat(formData.get('j4Animal') as string || '0') : m.j4Animal;

  let notaPeao = j1P + j2P + j3P + j4P;
  let notaAnimal = j1A + j2A + j3A + j4A;

  if (desclassificado || (tempo > 0 && tempo < 8)) notaPeao = 0;
  
  let notaTotal = notaPeao + notaAnimal;
  
  // REGRA DE CÁLCULO PARA TETO DE 100 PONTOS (INDEPENDENTE DO NÚMERO DE JUÍZES)
  if (numJuizes === 4) {
    // 4 juízes: Max 200 (25P + 25A) * 4 -> divide por 2
    notaTotal /= 2;
    notaPeao /= 2;
    notaAnimal /= 2;
  } else if (numJuizes === 3) {
    // 3 juízes: Max 150 -> divide por 1.5 (ou multiplica por 2/3)
    notaTotal = (notaTotal / 3) * 2;
    notaPeao = (notaPeao / 3) * 2;
    notaAnimal = (notaAnimal / 3) * 2;
  } else if (numJuizes === 1) {
    // 1 juiz: Max 50 -> multiplica por 2
    notaTotal *= 2;
    notaPeao *= 2;
    notaAnimal *= 2;
  }
  
  // Garantia absoluta para nunca passar de 100 (50 para cada lado) caso os formulários sejam adulterados
  if (notaTotal > 100) notaTotal = 100;
  if (notaPeao > 50) notaPeao = 50;
  if (notaAnimal > 50) notaAnimal = 50;

  const updated = await p.montaria.update({
    where: { id: mId },
    data: { 
      j1Peao: j1P, j1Animal: j1A, 
      j2Peao: j2P, j2Animal: j2A, 
      j3Peao: j3P, j3Animal: j3A, 
      j4Peao: j4P, j4Animal: j4A, 
      notaPeao, notaAnimal, notaTotal, 
      tempo, desclassificado, motivo,
      dataHora: new Date()
    },
    include: {
      competidor: true,
      animal: true,
      etapa: { select: { nome: true } }
    }
  });

  // Integração vMix - Enviando TUDO separado para o usuário poder montar como quiser
  if (config.vmixUrl) {
    try {
      // Calcular a posição do competidor na etapa
      const { getCompetidorStageRank } = await import('@/lib/ranking');
      const stageRank = await getCompetidorStageRank(m.etapaId, m.competidorId);

      const replayFileName = await sendToVMix(config as any, {
        competidor: updated.competidor.nome,
        animal: updated.animal.nome,
        etapaNome: (updated as any).etapa?.nome,
        // Notas de cada juiz (separadas)
        j1p: j1P, j1a: j1A,
        j2p: j2P, j2a: j2A,
        j3p: j3P, j3a: j3A,
        j4p: j4P, j4a: j4A,
        // Notas de cada juiz (soma P+A)
        j1: j1P + j1A,
        j2: j2P + j2A,
        j3: j3P + j3A,
        j4: j4P + j4A,
        // Totais calculados
        notaPeao: notaPeao,
        notaAnimal: notaAnimal,
        total: notaTotal,
        // Colocação na etapa
        etapaRank: stageRank.rank > 0 ? `${stageRank.rank}º` : '---'
      });
      // Salvar o nome do replay no banco
      if (replayFileName) {
        await p.montaria.update({
          where: { id: updated.id },
          data: { replayFileName }
        });
      }
    } catch (vErr) {
      console.error('Erro ao enviar para o vMix:', vErr);
    }
  }

  revalidatePath(`/admin/execucao`);
  revalidatePath(`/juiz/dashboard`);
  revalidatePath('/overlay/nota');
  revalidatePath('/api/overlay/current');
  
  // Important imports for this redirect:
  const { redirect } = await import('next/navigation');
  redirect(`/admin/execucao?roundId=${round.id}`);
}

export async function addMontaria(roundId: number, competidorId: number, animalId: number, etapaId: number) {
  await p.montaria.create({
    data: { roundId, competidorId, animalId, etapaId }
  });
  revalidatePath(`/admin/etapas/${etapaId}/round/${roundId}/montagem`);
}

export async function deleteMontaria(montariaId: number, roundId: number, etapaId: number) {
  const session = await getServerSession(authOptions);
  if (!session || ((session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPER_ADMIN')) {
    throw new Error("Não autorizado");
  }

  await p.montaria.delete({
    where: { id: montariaId }
  });
  revalidatePath(`/admin/etapas/${etapaId}/round/${roundId}/montagem`);
}

export async function addRoundReserva(formData: FormData) {
  const roundId = parseInt(formData.get('roundId') as string);
  const etapaId = parseInt(formData.get('etapaId') as string);
  const animalId = parseInt(formData.get('animalId') as string);
  const ordem = parseInt(formData.get('ordem') as string);

  await p.roundReserva.create({
    data: { roundId, animalId, ordem }
  });
  revalidatePath(`/admin/etapas/${etapaId}/round/${roundId}/montagem`);
}

export async function deleteRoundReserva(reservaId: number, roundId: number, etapaId: number) {
  await p.roundReserva.delete({
    where: { id: reservaId }
  });
  revalidatePath(`/admin/etapas/${etapaId}/round/${roundId}/montagem`);
}

export async function applyRepasse(montariaId: number, roundId: number) {
  // Encontrar a primeira reserva disponível
  const reserva = await p.roundReserva.findFirst({
    where: { roundId, utilizado: false },
    orderBy: { ordem: 'asc' }
  });

  if (!reserva) {
    const { redirect } = await import('next/navigation');
    redirect(`/admin/execucao?roundId=${roundId}&error=SEM_RESERVA`);
    return;
  }

  // Substituir o animal na montaria, zerar as notas
  await p.montaria.update({
    where: { id: montariaId },
    data: { 
      animalId: reserva.animalId,
      j1Peao: 0, j1Animal: 0, 
      j2Peao: 0, j2Animal: 0,
      j3Peao: 0, j3Animal: 0,
      j4Peao: 0, j4Animal: 0,
      notaPeao: 0, notaAnimal: 0, notaTotal: 0,
      tempo: 0, desclassificado: false, motivo: null
    }
  });

  // Queimar a reserva
  await p.roundReserva.update({
    where: { id: reserva.id },
    data: { utilizado: true }
  });

  revalidatePath(`/admin/execucao`);
}

export async function saveConfig(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || ((session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPER_ADMIN')) {
    throw new Error("Não autorizado para alterar configurações globais.");
  }

  const numJuizesStr = formData.get('numJuizes') as string;
  const titulo = formData.get('titulo') as string;
  
  const numJuizes = parseInt(numJuizesStr) || 1;

  console.log('---- SAVING CONFIG ----');
  console.log('RAW numJuizes:', numJuizesStr);
  console.log('PARSED numJuizes:', numJuizes);
  console.log('titulo:', titulo);

  try {
    await prisma.configuracao.upsert({
      where: { id: 1 },
      update: { 
        numJuizes, 
        titulo,
        vmixUrl: formData.get('vmixUrl') as string,
        vmixInputNotaId: formData.get('vmixInputNotaId') as string,
        vmixInputChamadaId: formData.get('vmixInputChamadaId') as string,
        vmixInputRankingId: formData.get('vmixInputRankingId') as string,
        vmixReplayInputId: formData.get('vmixReplayInputId') as string,
        replayExportPath: formData.get('replayExportPath') as string,
        vmixOverlayChannel: parseInt(formData.get('vmixOverlayChannel') as string) || 1,
        googleDriveFolderId: (formData.get('googleDriveFolderId') as string) || null,
        googleDriveApiKey: (formData.get('googleDriveApiKey') as string) || null
      },
      create: { 
        id: 1, 
        numJuizes, 
        titulo,
        vmixUrl: formData.get('vmixUrl') as string,
        vmixInputNotaId: formData.get('vmixInputNotaId') as string,
        vmixInputChamadaId: formData.get('vmixInputChamadaId') as string,
        vmixInputRankingId: formData.get('vmixInputRankingId') as string,
        vmixReplayInputId: formData.get('vmixReplayInputId') as string,
        replayExportPath: formData.get('replayExportPath') as string,
        vmixOverlayChannel: parseInt(formData.get('vmixOverlayChannel') as string) || 1,
        googleDriveFolderId: (formData.get('googleDriveFolderId') as string) || null,
        googleDriveApiKey: (formData.get('googleDriveApiKey') as string) || null
      }
    });

    console.log('✅ CONFIG SAVED TO DB:', {
      url: formData.get('vmixUrl'),
      inputId: formData.get('vmixInputId'),
      replay: formData.get('vmixReplayInputId'),
      path: formData.get('replayExportPath')
    });
  } catch (err) {
    console.error('❌ ERROR SAVING CONFIG:', err);
  }

  revalidatePath('/admin/configuracoes');
  revalidatePath('/admin/execucao');

  const { redirect } = await import('next/navigation');
  redirect('/admin/configuracoes?success=true');
}

export async function executeRawSql(sql: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'SUPER_ADMIN') return { success: false, error: 'Não autorizado' };

  try {
    const isSelect = sql.trim().toLowerCase().startsWith('select');
    let data;

    if (isSelect) {
      data = await prisma.$queryRawUnsafe(sql);
    } else {
      const count = await prisma.$executeRawUnsafe(sql);
      data = { affectedRows: count };
    }

    await logSystemAction((session?.user as any)?.name || 'Root', 'SQL_EXEC', { sql, isSelect });

    return { success: true, data };
  } catch (err: any) {
    console.error('ERRO SQL ROOT:', err);
    // 🛡️ OFUSCAÇÃO DE ERROS (PENTEST MEGA)
    // Não retornar a mensagem original do banco de dados para evitar vazamento de schema.
    return { success: false, error: 'Falha na execução do comando SQL. Verifique a sintaxe ou privilégios.' };
  }
}

export async function checkVMixStatus() {
  try {
    const config = await prisma.configuracao.findFirst();
    if (!config || !config.vmixUrl) return { online: false, error: 'vMix URL não configurada' };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
    
    // Tentativa silenciosa de ping
    const res = await fetch(config.vmixUrl, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);

    return { online: res.status >= 200 && res.status < 500 };
  } catch (err) {
    return { online: false };
  }
}

export async function deactivateVMixOverlay() {
  try {
    const config = await prisma.configuracao.findFirst();
    if (config && config.vmixUrl) {
      const { triggerVMixOverlay } = await import('@/lib/vmix');
      const channel = config.vmixOverlayChannel || 1;
      
      let inputId = config.vmixInputNotaId || config.vmixInputId;
      if (config.overlayMode === 'CHAMADA') inputId = config.vmixInputChamadaId;
      if (config.overlayMode === 'RANKING') inputId = config.vmixInputRankingId;

      await triggerVMixOverlay(config as any, channel, 'Out', inputId as string);
    }
    return { success: true };
  } catch (err) {
    console.error('Erro ao desativar Vmix Overlay:', err);
    return { success: false };
  }
}

export async function exportDatabaseSql() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'SUPER_ADMIN') throw new Error('Não autorizado');

  try {
    const dbUrl = (process.env.DATABASE_URL || '').split('?')[0];
    const { stdout } = await execAsync(`pg_dump "${dbUrl}"`);
    
    await logSystemAction((session?.user as any)?.name || 'Root', 'BACKUP_EXPORT', { size: stdout.length });
    return { success: true, sql: stdout };
  } catch (err: any) {
    console.error('Erro ao exportar banco:', err);
    return { success: false, error: err.message };
  }
}

export async function importDatabaseSql(sql: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'SUPER_ADMIN') throw new Error('Não autorizado');

  try {
    const dbUrl = (process.env.DATABASE_URL || '').split('?')[0];
    const child = exec(`psql "${dbUrl}"`);
    child.stdin?.write(sql);
    child.stdin?.end();

    await logSystemAction((session?.user as any)?.name || 'Root', 'BACKUP_IMPORT', { size: sql.length });
    return { success: true };
  } catch (err: any) {
    console.error('Erro ao importar banco:', err);
    return { success: false, error: err.message };
  }
}

export async function toggleTimer(running: boolean, finalTempo?: number) {
  try {
    const timerStartedAt = running ? new Date() : null;
    
    // Usar transação para garantir sincronia absoluta
    await prisma.$transaction(async (tx) => {
      // 1. Localizar a configuração ativa (evitando assumir ID fixo 1)
      const currentConfig = await tx.configuracao.findFirst();
      if (!currentConfig) throw new Error("Configuração global não encontrada.");

      const config = await tx.configuracao.update({
        where: { id: currentConfig.id },
        data: {
          timerRunning: running,
          timerStartedAt
        }
      });

      // 2. Automação vMix: Se o cronômetro iniciar, chutar o Overlay pra tela
      if (running && currentConfig.vmixUrl) {
        try {
           const { triggerVMixOverlay } = await import('@/lib/vmix');
           const inputId = currentConfig.vmixInputNotaId || currentConfig.vmixInputId;
           await triggerVMixOverlay(currentConfig as any, currentConfig.vmixOverlayChannel || 1, 'In', inputId as string);
        } catch (vErr) {
           console.error("Erro ao ativar Overlay no vMix via Cronômetro", vErr);
        }
      }

      // 2. Se parou e tem tempo final, salvar na montaria ativa imediatamente
      if (!running && finalTempo !== undefined && config.montariaAtivaId) {
        await tx.montaria.update({
          where: { id: config.montariaAtivaId },
          data: { tempo: finalTempo }
        });
      }
    });

    revalidatePath('/admin/execucao');
    revalidatePath('/api/overlay/current');
    
    return { 
      success: true, 
      timerStartedAt, 
      serverTime: Date.now() 
    };
  } catch (err) {
    console.error('❌ ERROR TOGGLING TIMER:', err);
    return { success: false, serverTime: Date.now() };
  }
}

export async function saveTemporada(formData: FormData) {
  const ano = parseInt(formData.get('ano') as string);
  const titulo = formData.get('titulo') as string;
  const bonusMelhorNotaNoite = parseInt(formData.get('bonusMelhorNotaNoite') as string || '0');
  const bonusMelhorNotaEtapa = parseInt(formData.get('bonusMelhorNotaEtapa') as string || '0');
  const premiaAte = parseInt(formData.get('premiaAte') as string || '5');

  const bonusNotasAcima90 = parseFloat(formData.get('bonusNotasAcima90') as string || '0');
  const ptsMelhorNotaCampeonato = parseInt(formData.get('ptsMelhorNotaCampeonato') as string || '0');

  await p.temporada.create({
    data: { 
      ano, 
      titulo, 
      bonusMelhorNotaNoite, 
      bonusMelhorNotaEtapa, 
      bonusNotasAcima90,
      ptsMelhorNotaCampeonato,
      premiaAte,
      ptsRound1: parseInt(formData.get('ptsRound1') as string || '10'),
      ptsRound2: parseInt(formData.get('ptsRound2') as string || '8'),
      ptsRound3: parseInt(formData.get('ptsRound3') as string || '6'),
      ptsRound4: parseInt(formData.get('ptsRound4') as string || '4'),
      ptsRound5: parseInt(formData.get('ptsRound5') as string || '2'),
      ptsEtapa1: parseInt(formData.get('ptsEtapa1') as string || '70'),
      ptsEtapa2: parseInt(formData.get('ptsEtapa2') as string || '60'),
      ptsEtapa3: parseInt(formData.get('ptsEtapa3') as string || '50'),
      ptsEtapa4: parseInt(formData.get('ptsEtapa4') as string || '40'),
      ptsEtapa5: parseInt(formData.get('ptsEtapa5') as string || '30'),
      ptsEtapa6: parseInt(formData.get('ptsEtapa6') as string || '25'),
      ptsEtapa7: parseInt(formData.get('ptsEtapa7') as string || '20'),
      ptsEtapa8: parseInt(formData.get('ptsEtapa8') as string || '15'),
      ptsEtapa9: parseInt(formData.get('ptsEtapa9') as string || '10'),
      ptsEtapa10: parseInt(formData.get('ptsEtapa10') as string || '5'),
      defaultJuiz1Id: formData.get('defaultJuiz1Id') ? parseInt(formData.get('defaultJuiz1Id') as string) : null,
      defaultJuiz2Id: formData.get('defaultJuiz2Id') ? parseInt(formData.get('defaultJuiz2Id') as string) : null,
      ativa: true
    }
  });

  revalidatePath('/admin/configuracoes');
}

export async function deleteTemporada(id: number) {
  const etapasCount = await p.etapa.count({ where: { temporadaId: id } });

  if (etapasCount > 0) {
    const { redirect } = await import('next/navigation');
    redirect('/admin/configuracoes?error=TEMPORADA_HAS_LINKS');
  }

  await p.temporada.delete({ where: { id } });
  revalidatePath('/admin/configuracoes');
}

export async function updateTemporada(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const ano = parseInt(formData.get('ano') as string);
  const titulo = formData.get('titulo') as string;
  const bonusMelhorNotaNoite = parseInt(formData.get('bonusMelhorNotaNoite') as string || '0');
  const bonusMelhorNotaEtapa = parseInt(formData.get('bonusMelhorNotaEtapa') as string || '0');
  const premiaAte = parseInt(formData.get('premiaAte') as string || '5');
  const bonusNotasAcima90 = parseFloat(formData.get('bonusNotasAcima90') as string || '0');
  const ptsMelhorNotaCampeonato = parseInt(formData.get('ptsMelhorNotaCampeonato') as string || '0');
  const ativa = formData.get('ativa') === 'on';

  await p.temporada.update({
    where: { id },
    data: { 
      ano, 
      titulo, 
      bonusMelhorNotaNoite, 
      bonusMelhorNotaEtapa, 
      bonusNotasAcima90,
      ptsMelhorNotaCampeonato,
      premiaAte,
      ptsRound1: parseInt(formData.get('ptsRound1') as string || '10'),
      ptsRound2: parseInt(formData.get('ptsRound2') as string || '8'),
      ptsRound3: parseInt(formData.get('ptsRound3') as string || '6'),
      ptsRound4: parseInt(formData.get('ptsRound4') as string || '4'),
      ptsRound5: parseInt(formData.get('ptsRound5') as string || '2'),
      ptsEtapa1: parseInt(formData.get('ptsEtapa1') as string || '70'),
      ptsEtapa2: parseInt(formData.get('ptsEtapa2') as string || '60'),
      ptsEtapa3: parseInt(formData.get('ptsEtapa3') as string || '50'),
      ptsEtapa4: parseInt(formData.get('ptsEtapa4') as string || '40'),
      ptsEtapa5: parseInt(formData.get('ptsEtapa5') as string || '30'),
      ptsEtapa6: parseInt(formData.get('ptsEtapa6') as string || '25'),
      ptsEtapa7: parseInt(formData.get('ptsEtapa7') as string || '20'),
      ptsEtapa8: parseInt(formData.get('ptsEtapa8') as string || '15'),
      ptsEtapa9: parseInt(formData.get('ptsEtapa9') as string || '10'),
      ptsEtapa10: parseInt(formData.get('ptsEtapa10') as string || '5'),
      defaultJuiz1Id: formData.get('defaultJuiz1Id') ? parseInt(formData.get('defaultJuiz1Id') as string) : null,
      defaultJuiz2Id: formData.get('defaultJuiz2Id') ? parseInt(formData.get('defaultJuiz2Id') as string) : null,
      ativa
    }
  });

  revalidatePath('/admin/configuracoes');
  
  const { redirect } = await import('next/navigation');
  redirect('/admin/configuracoes');
}

export async function deleteEtapa(id: number) {
  const roundCount = await p.round.count({ where: { etapaId: id } });
  const montariaCount = await p.montaria.count({ where: { etapaId: id } });

  if (roundCount > 0 || montariaCount > 0) {
    const { redirect } = await import('next/navigation');
    redirect('/admin/etapas?error=ETAPA_HAS_LINKS');
  }

  await p.etapa.delete({ where: { id } });
  revalidatePath('/admin/etapas');
  revalidatePath('/admin');
}

export async function deleteRound(id: number, etapaId: number) {
  const montarias = await p.montaria.count({ where: { roundId: id } });
  
  if (montarias > 0) {
    const { redirect } = await import('next/navigation');
    // Using redirect to pass URL param without crashing server processing
    redirect(`/admin/etapas/${etapaId}?error=ROUND_HAS_LINKS`);
  }

  await p.round.delete({ where: { id } });
  revalidatePath(`/admin/etapas/${etapaId}`);
}

export async function updateEtapa(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const nome = formData.get('nome') as string;
  const cidade = formData.get('cidade') as string;
  const estado = formData.get('estado') as string;
  const dataInicio = new Date(formData.get('dataInicio') as string);
  const dataFinal = new Date(formData.get('dataFinal') as string);
  const temporadaId = parseInt(formData.get('temporadaId') as string);

  await p.etapa.update({
    where: { id },
    data: {
      nome,
      cidade,
      estado,
      dataInicio,
      dataFinal,
      temporadaId,
      defaultJuiz1Id: formData.get('defaultJuiz1Id') ? parseInt(formData.get('defaultJuiz1Id') as string) : null,
      defaultJuiz2Id: formData.get('defaultJuiz2Id') ? parseInt(formData.get('defaultJuiz2Id') as string) : null,
    }
  });

  revalidatePath('/admin/etapas');
  revalidatePath(`/admin/etapas/${id}`);
  revalidatePath(`/admin/etapas/${id}/editar`);
  
  const { redirect } = await import('next/navigation');
  redirect('/admin/etapas');
}

export async function updateRound(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const etapaId = parseInt(formData.get('etapaId') as string);
  const numero = parseInt(formData.get('numero') as string);
  
  const cleanId = (val: any) => {
    const p = parseInt(String(val));
    return (p && p > 0) ? p : null;
  };

  const juiz1Id = cleanId(formData.get('juiz1'));
  const juiz2Id = cleanId(formData.get('juiz2'));
  const juiz3Id = cleanId(formData.get('juiz3'));
  const juiz4Id = cleanId(formData.get('juiz4'));

  await p.round.update({
    where: { id },
    data: {
      numero,
      juiz1Id,
      juiz2Id,
      juiz3Id,
      juiz4Id
    }
  });

  revalidatePath(`/admin/etapas/${etapaId}`);
  revalidatePath(`/admin/execucao`);
  revalidatePath(`/admin/etapas/${etapaId}/round/${id}/editar`);
  
  const { redirect } = await import('next/navigation');
  redirect(`/admin/etapas/${etapaId}`);
}

export async function updateMontariaAtiva(montariaId: number | null) {
  const currentConfig = await prisma.configuracao.findFirst();
  
  // Se estiver tentando ativar uma NOVA montaria (diferente da atual)
  if (montariaId && currentConfig?.montariaAtivaId && currentConfig.montariaAtivaId !== montariaId) {
    const activeMontaria = await prisma.montaria.findUnique({
      where: { id: currentConfig.montariaAtivaId },
      include: { round: true }
    });

    if (activeMontaria && !activeMontaria.desclassificado) {
      const numJuizes = currentConfig.numJuizes || 2;
      let pendente = false;

      if (numJuizes >= 1 && activeMontaria.j1Animal === 0) pendente = true;
      if (numJuizes >= 2 && activeMontaria.j2Animal === 0) pendente = true;
      if (numJuizes >= 3 && activeMontaria.j3Animal === 0) pendente = true;
      if (numJuizes >= 4 && activeMontaria.j4Animal === 0) pendente = true;

      if (pendente) {
        throw new Error("AGUARDANDO_NOTAS_JUIZES");
      }
    }
  }

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

      if (montaria && config?.vmixUrl) {
        const rankData = await getCompetidorStageRank(montaria.etapaId, montaria.competidorId);
        
        await sendToVMix(config as any, {
          competidor: montaria.competidor.nome,
          animal: montaria.animal.nome,
          etapaNome: (montaria as any).etapa?.nome,
          j1: 0, j2: 0, j3: 0, j4: 0, // Notas iniciais zeradas
          total: 0,
          etapaRank: rankData.rank > 0 ? `${rankData.rank}º` : '---'
        });
      }
    } catch (err) {
      console.error("Erro na automação vMix (Ativação):", err);
    }
  }

  revalidatePath('/admin/execucao');
  revalidatePath('/overlay/nota');
  revalidatePath('/api/overlay/current');
}

export async function updateMontariaSorteio(formData: FormData) {
  const montariaId = parseInt(formData.get('montariaId') as string);
  const roundId = parseInt(formData.get('roundId') as string);
  const etapaId = parseInt(formData.get('etapaId') as string);
  const competidorId = parseInt(formData.get('competidorId') as string);
  const animalId = parseInt(formData.get('animalId') as string);

  await p.montaria.update({
    where: { id: montariaId },
    data: { competidorId, animalId }
  });

  revalidatePath(`/admin/etapas/${etapaId}/round/${roundId}/montagem`);
  
  const { redirect } = await import('next/navigation');
  redirect(`/admin/etapas/${etapaId}/round/${roundId}/montagem`);
}

export async function updateRankingMode(mode: string | null) {
  const m = mode || "OFF";
  
  const currentConfig = await getSafeConfig();
  if (!currentConfig) return;

  // Usamos SQL puro para evitar erros de validação do Prisma Client caso o servidor não tenha reiniciado
  await prisma.$executeRawUnsafe(
    `UPDATE "Configuracao" SET "rankingMode" = $1, "rankingPage" = 0 WHERE "id" = $2`,
    m,
    currentConfig.id
  );

  const config = await prisma.configuracao.findFirst();
  if (!config) return;

  // Automação vMix: Acionar Overlay 4
  if (config.vmixUrl) {
    try {
      if (m !== 'OFF') {
        // Liga o Overlay 4
        await triggerVMixOverlay(config as any, 4, 'In');
      } else {
        // Desliga o Overlay 4
        await triggerVMixOverlay(config as any, 4, 'Out');
      }
    } catch (vErr) {
      console.error('Erro ao acionar Overlay 4 no vMix:', vErr);
    }
  }

  revalidatePath('/admin/execucao');
  revalidatePath('/overlay/nota');
  revalidatePath('/api/overlay/current');
}

export async function updateRankingPage(delta: number) {
  try {
    const config = await getSafeConfig();
    if (!config) return;

    // Garante que rankingPage seja tratado como número para evitar NaN
    const currentPage = typeof config.rankingPage === 'number' ? config.rankingPage : 0;
    let newPage = currentPage + delta;
    if (newPage < 0) newPage = 0;

    // Usamos SQL puro para contornar o cache do Prisma Client no servidor Next.js
    await prisma.$executeRawUnsafe(
      `UPDATE "Configuracao" SET "rankingPage" = $1 WHERE "id" = $2`,
      newPage,
      config.id
    );

    revalidatePath('/admin/execucao');
    revalidatePath('/overlay/nota');
    revalidatePath('/api/overlay/current');
  } catch (err) {
    console.error("Erro ao mudar página do ranking:", err);
  }
}
export async function sendManualToOverlay(montariaId: number) {
  const montaria = await prisma.montaria.findUnique({
    where: { id: montariaId },
    include: { 
      competidor: true, 
      animal: true, 
      etapa: { select: { nome: true } } 
    }
  });

  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });

  if (montaria && config?.vmixUrl) {
    const { getCompetidorStageRank } = await import('@/lib/ranking');
    const stageRank = await getCompetidorStageRank(montaria.etapaId, montaria.competidorId);

    await sendToVMix(config as any, {
      competidor: montaria.competidor.nome,
      animal: montaria.animal.nome,
      etapaNome: (montaria as any).etapa?.nome,
      j1p: montaria.j1Peao, j1a: montaria.j1Animal,
      j2p: montaria.j2Peao, j2a: montaria.j2Animal,
      j3p: montaria.j3Peao, j3a: montaria.j3Animal,
      j4p: montaria.j4Peao, j4a: montaria.j4Animal,
      j1: montaria.j1Peao + montaria.j1Animal,
      j2: montaria.j2Peao + montaria.j2Animal,
      j3: montaria.j3Peao + montaria.j3Animal,
      j4: montaria.j4Peao + montaria.j4Animal,
      notaPeao: montaria.notaPeao,
      notaAnimal: montaria.notaAnimal,
      total: montaria.notaTotal,
      etapaRank: stageRank.rank > 0 ? `${stageRank.rank}º` : '---'
    });
  }
}

export async function updateOverlayMode(mode: string) {
  const currentConfig = await prisma.configuracao.findFirst();
  await prisma.configuracao.upsert({
    where: { id: currentConfig?.id || 1 },
    update: { overlayMode: mode },
    create: { id: 1, overlayMode: mode, numJuizes: 2, titulo: "Rodeio Web" }
  });

  // Automação vMix: Chamar o Input correspondente
  if (currentConfig?.vmixUrl) {
    try {
      const { triggerVMixOverlay } = await import('@/lib/vmix');
      const channel = currentConfig.vmixOverlayChannel || 1;
      
      if (mode === 'OFF') {
          // Desligar o último ativo (usamos o ID de notas como geral se não soubermos)
          const fallbackInput = currentConfig.vmixInputRankingId || currentConfig.vmixInputChamadaId || currentConfig.vmixInputNotaId || currentConfig.vmixInputId;
          await triggerVMixOverlay(currentConfig as any, channel, 'Out', fallbackInput as string);
      } else {
          let targetInput = currentConfig.vmixInputNotaId || currentConfig.vmixInputId;
          if (mode === 'CHAMADA') targetInput = currentConfig.vmixInputChamadaId;
          if (mode === 'RANKING') targetInput = currentConfig.vmixInputRankingId;
          
          await triggerVMixOverlay(currentConfig as any, channel, 'In', targetInput as string);
      }
    } catch (e) {
      console.error("Erro vMix Mode Switch:", e);
    }
  }

  revalidatePath('/admin/execucao');
  revalidatePath('/api/overlay/current');
}

export async function updateRankingCongelado(status: boolean) {
  const currentConfig = await prisma.configuracao.findFirst();
  await prisma.configuracao.upsert({
    where: { id: currentConfig?.id || 1 },
    update: { rankingCongelado: status },
    create: { id: 1, rankingCongelado: status, overlayMode: 'ID', numJuizes: 2, titulo: "Rodeio Web" }
  });
  revalidatePath('/admin/execucao');
  revalidatePath('/api/overlay/current');
  revalidatePath('/overlay/nota');
  revalidatePath('/');
  revalidatePath('/ranking');
}

export async function importRidersFromPreviousRound(etapaId: number, currentRoundId: number) {
  // 1. Descobre qual é o Round Anterior baseado no número do atual
  const currentRound = await p.round.findUnique({ where: { id: currentRoundId } });
  if (!currentRound || currentRound.numero <= 1) return { error: 'Gatilho desativado: Este já é o primeiro round ou formato inválido.' };

  const prevRound = await p.round.findFirst({
    where: { etapaId, numero: currentRound.numero - 1 }
  });

  if (!prevRound) return { error: 'Nenhum round anterior foi localizado nesta etapa para copiar os competidores.' };

  // 2. Coleta os peões do round passado
  const prevMontarias = await p.montaria.findMany({
    where: { roundId: prevRound.id, removida: false },
    select: { competidorId: true }
  });

  if (prevMontarias.length === 0) return { error: 'A súmula do round anterior estava vazia.' };

  // 3. Verifica quem JÁ está escalado no round atual pra não duplicar
  const currentMontarias = await p.montaria.findMany({
    where: { roundId: currentRoundId, removida: false },
    select: { competidorId: true }
  });
  const escaladosSet = new Set(currentMontarias.map(m => m.competidorId));

  const peoesParaImportar = prevMontarias
    .map(m => m.competidorId)
    // Remove duplicados da lista antiga e checa se já tá na atual
    .filter((id, index, self) => self.indexOf(id) === index && !escaladosSet.has(id));

  if (peoesParaImportar.length === 0) return { error: 'Todos os peões do round anterior já foram escalados neste round.' };

  // 4. Garante a existência do Animal Fantasma "A DEFINIR"
  let animalFantasma = await p.animal.findFirst({ where: { nome: 'A DEFINIR' } });
  if (!animalFantasma) {
    animalFantasma = await p.animal.create({
      data: { nome: 'A DEFINIR', companhia: 'ORGANIZACAO', tipo: currentRound.modalidade === 'Touro' ? 'Touro' : 'Cavalo' }
    });
  }

  // 5. Gera as montarias limpas
  const batchData = peoesParaImportar.map(compId => ({
    roundId: currentRoundId,
    competidorId: compId,
    animalId: animalFantasma.id,
    etapaId
  }));

  await p.montaria.createMany({ data: batchData });
  revalidatePath(`/admin/etapas/${etapaId}/round/${currentRoundId}/montagem`);
  return { success: true, importados: peoesParaImportar.length };
}

export async function importTopClassifiedRiders(etapaId: number, currentRoundId: number, limit: number) {
  const { getRanking } = await import('@/lib/ranking');
  const { peoes } = await getRanking({ etapaId });

  const topPeoes = peoes.slice(0, limit);
  if (topPeoes.length === 0) return { error: 'Nenhum competidor classificado encontrado nesta etapa.' };

  // Verifica quem JÁ está escalado
  const currentMontarias = await p.montaria.findMany({
    where: { roundId: currentRoundId, removida: false },
    select: { competidorId: true }
  });
  const escaladosSet = new Set(currentMontarias.map(m => m.competidorId));

  const peoesParaImportar = topPeoes.filter(p => !escaladosSet.has(p.id));
  if (peoesParaImportar.length === 0) return { error: 'Todos os top competidores selecionados já foram escalados.' };

  let animalFantasma = await p.animal.findFirst({ where: { nome: 'A DEFINIR' } });
  if (!animalFantasma) {
    animalFantasma = await p.animal.create({
      data: { nome: 'A DEFINIR', companhia: 'ORGANIZACAO' }
    });
  }

  // IMPORTANTE: Criamos em ordem de ranking (1º, 2º, 3º...)
  // Como o sistema ordena por Data de Criação Decrescente (Latest First), 
  // o Líder (1º) ficará no final da lista e o último classificado ficará no topo (primeiro a montar).
  for (const peao of peoesParaImportar) {
    await p.montaria.create({
      data: {
        roundId: currentRoundId,
        competidorId: peao.id,
        animalId: animalFantasma.id,
        etapaId,
        dataHora: new Date()
      }
    });
    // Pequeno delay para garantir a ordem cronológica no banco
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  revalidatePath(`/admin/etapas/${etapaId}/round/${currentRoundId}/montagem`);
  return { success: true, importados: peoesParaImportar.length };
}

