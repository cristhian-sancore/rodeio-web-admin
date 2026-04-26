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
import pdf from "pdf-parse";
import { Buffer } from "buffer";

export async function importPdfAction(formData: FormData) {
  const file = formData.get('file') as File;
  const roundId = parseInt(formData.get('roundId') as string);
  const etapaId = parseInt(formData.get('etapaId') as string);

  if (!file || !roundId || !etapaId) return { success: false, error: 'Dados incompletos' };

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // --- MOTOR DE EXTRAÇÃO SMART PIPE (SENSÍVEL) ---
    const data = await pdf(buffer, {
      pagerender: (pageData: any) => {
        return pageData.getTextContent().then((textContent: any) => {
          let lastY: number | undefined;
          let lastX: number | undefined;
          let text = '';
          for (let item of textContent.items) {
            const x = item.transform[4];
            const y = item.transform[5];
            
            if (lastY !== undefined && Math.abs(lastY - y) > 5) {
              text += '\n';
            } else if (lastX !== undefined && (x - lastX) > 12) { // 12 unidades de gap (mais sensível)
              text += ' | '; 
            } else if (lastX !== undefined && (x - lastX) > 1) {
              text += ' ';
            }
            
            text += item.str;
            lastY = y;
            lastX = x + (item.width || (item.str.length * 4)); 
          }
          return text;
        });
      }
    });

    const rawText = data.text;
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 5); // Ignora linhas muito curtas
    let importedCount = 0;

    console.log(`--- DEBUG PDF RAW (PRIMEIRAS 5 LINHAS) ---`);
    lines.slice(0, 10).forEach(l => console.log(`[RAW]: ${l}`));

    for (const line of lines) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length === 0) continue;

      let num = "";
      let nomeCompetidor = "";
      let nomeAnimal = "";
      let ciaDetectada = "NÃO INFORMADA";

      // Tentar extrair número da primeira parte (pode estar colado: "1 CARLOS")
      const firstPart = parts[0];
      const matchNum = firstPart.match(/^(\d+)\s*(.*)$/);
      
      if (matchNum) {
         num = matchNum[1];
         const remainder = matchNum[2].trim();
         
         if (remainder.length > 0) {
            // Caso: "1 CARLOS RAFAEL LANA | TOURO | CIA"
            nomeCompetidor = remainder;
            nomeAnimal = parts[1] || "A DEFINIR";
            ciaDetectada = parts[2] || "NÃO INFORMADA";
         } else if (parts.length >= 3) {
            // Caso: "1 | CARLOS RAFAEL LANA | TOURO | CIA"
            nomeCompetidor = parts[1];
            nomeAnimal = parts[2];
            ciaDetectada = parts[3] || "NÃO INFORMADA";
         }

         // Validar se não é cabeçalho
         if (nomeCompetidor.toUpperCase().includes("NOME") || nomeAnimal.toUpperCase().includes("TOURO")) continue;
         if (nomeCompetidor.length < 3) continue;

         console.log(`[IMPORT] -> Atleta: ${nomeCompetidor} | Touro: ${nomeAnimal} | Cia: ${ciaDetectada}`);

         // Gravar no Banco
         let competidor = await p.competidor.findFirst({ where: { nome: { equals: nomeCompetidor, mode: 'insensitive' } } });
         if (!competidor) competidor = await p.competidor.create({ data: { nome: nomeCompetidor, ranking: 0 } });

         let animal = await p.animal.findFirst({ where: { nome: { equals: nomeAnimal, mode: 'insensitive' } } });
         if (!animal) animal = await p.animal.create({ data: { nome: nomeAnimal, companhia: ciaDetectada } });

         const existing = await p.montaria.findFirst({ where: { competidorId: competidor.id, roundId, removida: false } });
         if (!existing) {
           await p.montaria.create({ data: { competidorId: competidor.id, animalId: animal.id, roundId, etapaId } });
           importedCount++;
         }
      }

      // Caso 2: Reservas (R1 | NOME | CIA)
      if (firstPart.toUpperCase().startsWith('R')) {
         const matchR = firstPart.match(/R(\d+)\s*(.*)/i);
         if (matchR) {
            const ordem = parseInt(matchR[1]);
            const remainder = matchR[2].trim();
            let content = remainder || parts[1] || "RESERVA";
            let ciaRes = remainder ? (parts[1] || "RESERVA") : (parts[2] || "RESERVA");

            if (content.toUpperCase().includes("RESERVA")) continue;

            console.log(`[IMPORT-RES] -> Touro: ${content} | Cia: ${ciaRes}`);

            let animal = await p.animal.findFirst({ where: { nome: { equals: content, mode: 'insensitive' } } });
            if (!animal) animal = await p.animal.create({ data: { nome: content, companhia: ciaRes } });

            const existingRes = await p.roundReserva.findFirst({ where: { roundId, animalId: animal.id } });
            if (!existingRes) {
              await p.roundReserva.create({ data: { roundId, animalId: animal.id, ordem } });
            }
         }
      }
    }

    revalidatePath(`/admin/etapas/${etapaId}/round/${roundId}/montagem`);
    return { success: true, count: importedCount };
  } catch (err: any) {
    console.error('Erro no processamento do PDF:', err);
    return { success: false, error: err.message };
  }
}

export async function createRound(etapaId: number, numero: number, juiz1Id?: number, juiz2Id?: number, juiz3Id?: number, juiz4Id?: number, modalidade?: string, dataAgenda?: Date) {
  const cleanId = (id?: any) => {
    const parsed = parseInt(String(id));
    return (parsed && parsed > 0) ? parsed : null;
  };

  // Validação de data robusta
  let finalDate = new Date();
  if (dataAgenda && !isNaN(dataAgenda.getTime())) {
    finalDate = dataAgenda;
  }
  
  await p.round.create({
    data: { 
      numero, 
      etapaId, 
      juiz1Id: cleanId(juiz1Id), 
      juiz2Id: cleanId(juiz2Id), 
      juiz3Id: cleanId(juiz3Id), 
      juiz4Id: cleanId(juiz4Id), 
      modalidade: modalidade || "Touro",
      dataAgenda: finalDate
    }
  });
  revalidatePath(`/admin/etapas/${etapaId}`);
  revalidatePath(`/admin/execucao`);
}

export async function createRoundAction(formData: FormData) {
  const etapaId = parseInt(formData.get('etapaId') as string);
  const modalidade = formData.get('modalidade') as string || 'Touro';
  const numeroRaw = formData.get('numero') as string;
  
  let numero = parseInt(numeroRaw);
  
  if (isNaN(numero)) {
    const rounds = await p.round.findMany({
      where: { etapaId, modalidade }
    });
    numero = rounds.length + 1;
  }

  const cleanId = (val: any) => {
    const p = parseInt(String(val));
    return (p && p > 0) ? p : null;
  };

  const juiz1Id = cleanId(formData.get('juiz1'));
  const juiz2Id = cleanId(formData.get('juiz2'));
  const juiz3Id = cleanId(formData.get('juiz3'));
  const juiz4Id = cleanId(formData.get('juiz4'));
  
  const dataAgendaRaw = formData.get('dataAgenda') as string;
  let dataAgenda = new Date();
  if (dataAgendaRaw) {
    const parsed = new Date(dataAgendaRaw);
    if (!isNaN(parsed.getTime())) {
      dataAgenda = parsed;
    }
  }

  await createRound(etapaId, numero, juiz1Id, juiz2Id, juiz3Id, juiz4Id, modalidade, dataAgenda);
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
      // Acionar o Overlay no vMix (Colocar no ar)
      const inputId = config.vmixInputNotaId || config.vmixInputId;
      await triggerVMixOverlay(config as any, config.vmixOverlayChannel || 1, 'In', inputId as string);

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

export async function addMontariaAction(formData: FormData) {
  const roundId = parseInt(formData.get('roundId') as string);
  const etapaId = parseInt(formData.get('etapaId') as string);
  const competidorId = parseInt(formData.get('competidorId') as string);
  const animalId = parseInt(formData.get('animalId') as string);

  if (isNaN(competidorId) || isNaN(animalId)) return;

  const existing = await p.montaria.findFirst({
    where: { competidorId, roundId, removida: false }
  });

  if (!existing) {
    await p.montaria.create({
      data: { competidorId, animalId, roundId, etapaId }
    });
  }
  revalidatePath(`/admin/etapas/${etapaId}/round/${roundId}/montagem`);
}

export async function removeMontariaSorteio(montariaId: number, roundId: number, etapaId: number) {
  const session = await getServerSession(authOptions);
  await p.montaria.update({ 
    where: { id: montariaId },
    data: { removida: true, removidaPor: session?.user?.name || 'Desconhecido', removidaEm: new Date() }
  });
  revalidatePath(`/admin/etapas/${etapaId}/round/${roundId}/montagem`);
}

export async function updateMontariaAnimalAction(formData: FormData) {
  const montariaId = parseInt(formData.get('montariaId') as string);
  const animalId = parseInt(formData.get('animalId') as string);
  const roundId = parseInt(formData.get('roundId') as string);
  const etapaId = parseInt(formData.get('etapaId') as string);

  if (animalId) {
    await p.montaria.update({ where: { id: montariaId }, data: { animalId } });
    revalidatePath(`/admin/etapas/${etapaId}/round/${roundId}/montagem`);
  }
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
        googleDriveApiKey: (formData.get('googleDriveApiKey') as string) || null,
        homeHeroTitle: formData.get('homeHeroTitle') as string,
        homeHeroSubtitle: formData.get('homeHeroSubtitle') as string,
        homeHeroImage: formData.get('homeHeroImage') as string,
        homeLayout: formData.get('homeLayout') ? JSON.parse(formData.get('homeLayout') as string) : undefined,
        siteLayouts: formData.get('siteLayouts') ? JSON.parse(formData.get('siteLayouts') as string) : undefined,
        primaryColor: formData.get('primaryColor') as string,
        secondaryColor: formData.get('secondaryColor') as string,
        fontFamily: formData.get('fontFamily') as string,
        logoUrl: formData.get('logoUrl') as string
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
        googleDriveApiKey: (formData.get('googleDriveApiKey') as string) || null,
        homeHeroTitle: formData.get('homeHeroTitle') as string,
        homeHeroSubtitle: formData.get('homeHeroSubtitle') as string,
        homeHeroImage: formData.get('homeHeroImage') as string,
        homeLayout: formData.get('homeLayout') ? JSON.parse(formData.get('homeLayout') as string) : [],
        siteLayouts: formData.get('siteLayouts') ? JSON.parse(formData.get('siteLayouts') as string) : {},
        primaryColor: formData.get('primaryColor') as string,
        secondaryColor: formData.get('secondaryColor') as string,
        fontFamily: formData.get('fontFamily') as string,
        logoUrl: formData.get('logoUrl') as string
      }
    });

    console.log('✅ FULL CONFIG SAVED');
  } catch (err) {
    console.error('❌ ERROR SAVING CONFIG:', err);
  }

  revalidatePath('/admin/configuracoes');
  revalidatePath('/admin/execucao');
  revalidatePath('/admin/super/builder');
  revalidatePath('/');
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

      if (montaria && config?.vmixUrl) {
        const { getCompetidorStageRank } = await import('@/lib/ranking');
        const rankData = await getCompetidorStageRank(montaria.etapaId, montaria.competidorId);
        
        await sendToVMix(config as any, {
          competidor: montaria.competidor.nome,
          animal: montaria.animal.nome,
          etapaNome: (montaria as any).etapa?.nome,
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
      const inputId = config.vmixInputRankingId;
      if (m !== 'OFF') {
        // Liga o Overlay 4 com o input correto
        await triggerVMixOverlay(config as any, 4, 'In', inputId as string);
      } else {
        // Desliga o Overlay 4
        await triggerVMixOverlay(config as any, 4, 'Out', inputId as string);
      }
    } catch (vErr) {
      console.error('Erro ao acionar Overlay 4 no vMix:', vErr);
    }
  }

  revalidatePath('/admin/execucao');
  revalidatePath('/overlay/nota');
  revalidatePath('/api/overlay/current');
}

export async function updateRankingPage(delta: number, totalItems: number = 1000) {
  try {
    const config = await getSafeConfig();
    if (!config) return;

    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Garante que rankingPage seja tratado como número para evitar NaN
    const currentPage = typeof config.rankingPage === 'number' ? config.rankingPage : 0;
    let newPage = currentPage + delta;
    
    if (newPage < 0) newPage = 0;
    if (totalPages > 0 && newPage >= totalPages) newPage = totalPages - 1;

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
  try {
    const montaria = await prisma.montaria.findUnique({
      where: { id: montariaId },
      include: { 
        competidor: true, 
        animal: true, 
        etapa: { select: { nome: true } } 
      }
    });

    const config = await prisma.configuracao.findFirst();

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
  } catch (err) {
    console.error("ERRO CRÍTICO SEND_MANUAL_OVERLAY:", err);
    throw new Error("Falha ao enviar para o vMix. Verifique a conexão e configuração do IP.");
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


export async function createEtapaAction(formData: FormData) {
  const nome = formData.get('nome') as string;
  const cidade = formData.get('cidade') as string;
  const estado = formData.get('estado') as string;
  const dataInicio = new Date(formData.get('dataInicio') as string);
  const dataFinal = new Date(formData.get('dataFinal') as string);
  const temporadaId = parseInt(formData.get('temporadaId') as string);

  await prisma.etapa.create({
    data: { 
      nome, 
      cidade, 
      estado, 
      dataInicio, 
      dataFinal,
      temporadaId
    }
  });

  revalidatePath('/admin/etapas');
  revalidatePath('/admin');
}

export async function importRoundMontariasAction(roundId: number, etapaId: number, data: any[]) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autorizado");

  console.log('📦 IMPORTANDO MONTAGEM ROUND:', roundId, 'ETAPA:', etapaId);

  let successCount = 0;
  let errors: string[] = [];

  for (const row of data) {
    try {
      const nomeCompetidor = String(row.Competidor || row.competidor || '').trim();
      const nomeAnimal = String(row.Animal || row.animal || '').trim();

      if (!nomeCompetidor) continue;

      // Buscar competidor
      const competidor = await p.competidor.findFirst({
        where: { nome: { equals: nomeCompetidor, mode: 'insensitive' } }
      });

      if (!competidor) {
        errors.push(`Atleta não encontrado: ${nomeCompetidor}`);
        continue;
      }

      let animalId = null;
      if (nomeAnimal && nomeAnimal.toUpperCase() !== 'A DEFINIR') {
        const animal = await p.animal.findFirst({
          where: { nome: { equals: nomeAnimal, mode: 'insensitive' } }
        });
        if (animal) {
          animalId = animal.id;
        } else {
           errors.push(`Animal não encontrado: ${nomeAnimal} (Atleta ${nomeCompetidor} importado sem animal)`);
        }
      }

      if (!animalId) {
        const aDefinir = await p.animal.findFirst({ where: { nome: 'A DEFINIR' } });
        animalId = aDefinir?.id || 1;
      }

      const exists = await p.montaria.findFirst({
        where: { roundId, competidorId: competidor.id, removida: false }
      });

      if (exists) continue;

      await p.montaria.create({
        data: {
          roundId,
          competidorId: competidor.id,
          animalId: animalId,
          notaJ1A: 0, notaJ1P: 0, notaJ2A: 0, notaJ2P: 0,
          notaJ3A: 0, notaJ3P: 0, notaJ4A: 0, notaJ4P: 0,
          notaTotal: 0, tempo: 0
        }
      });

      successCount++;
    } catch (err) {
      console.error('Erro na linha de importação:', err);
    }
  }

  await logSystemAction(session?.user?.name || 'Sistema', 'IMPORT_ROUND_EXCEL', {
    roundId,
    etapaId,
    count: successCount
  });

  revalidatePath(`/admin/etapas/${etapaId}/round/${roundId}/montagem`);
  
  return { 
    success: true, 
    count: successCount, 
    errors: errors.length > 0 ? errors.slice(0, 5) : null,
    totalErrors: errors.length
  };
}

export async function importRoundPdfAction(roundId: number, etapaId: number, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autorizado");

  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'Nenhum arquivo enviado.' };

  try {
    const bytes = await file.arrayBuffer();
    const data = await pdf(Buffer.from(bytes));
    const text = data.text;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);

    console.log('📄 PDF EXTRAÍDO:', text.length, 'caracteres,', lines.length, 'linhas');

    const [allCompetidores, allAnimais] = await Promise.all([
      p.competidor.findMany({ select: { id: true, nome: true } }),
      p.animal.findMany({ select: { id: true, nome: true } })
    ]);

    const aDefinir = await p.animal.findFirst({ where: { nome: 'A DEFINIR' } });

    let successCount = 0;
    let errors: string[] = [];

    // Normalização para busca
    const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    
    const compsMap = allCompetidores.map(c => ({ id: c.id, nome: normalize(c.nome) }));
    const animalsMap = allAnimais.map(a => ({ id: a.id, nome: normalize(a.nome) }));

    for (const line of lines) {
      const normLine = normalize(line);
      
      // Tentar encontrar um competidor na linha
      const foundComp = compsMap.find(c => normLine.includes(c.nome));
      if (!foundComp) continue;

      // Tentar encontrar um animal na linha (excluindo o nome do competidor da busca)
      const lineWithoutComp = normLine.replace(foundComp.nome, '');
      const foundAnimal = animalsMap.find(a => lineWithoutComp.includes(a.nome));

      const finalAnimalId = foundAnimal ? foundAnimal.id : (aDefinir?.id || 1);

      // Verificar duplicados
      const exists = await p.montaria.findFirst({
        where: { roundId, competidorId: foundComp.id, removida: false }
      });

      if (exists) continue;

      await p.montaria.create({
        data: {
          roundId,
          competidorId: foundComp.id,
          animalId: finalAnimalId,
          notaJ1A: 0, notaJ1P: 0, notaJ2A: 0, notaJ2P: 0,
          notaJ3A: 0, notaJ3P: 0, notaJ4A: 0, notaJ4P: 0,
          notaTotal: 0, tempo: 0
        }
      });

      successCount++;
    }

    await logSystemAction(session?.user?.name || 'Sistema', 'IMPORT_ROUND_PDF', {
      roundId,
      etapaId,
      count: successCount
    });

    revalidatePath(`/admin/etapas/${etapaId}/round/${roundId}/montagem`);

    return { 
      success: true, 
      count: successCount,
      textPreview: text.substring(0, 100) + '...'
    };

  } catch (err) {
    console.error('❌ ERRO AO PROCESSAR PDF:', err);
    return { success: false, error: 'Falha ao ler o PDF. O arquivo pode estar protegido ou ser uma imagem.' };
  }
}


