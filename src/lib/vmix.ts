/**
 * Utilitário para integração HTTP com API do vMix
 */
import fs from 'node:fs';
import path from 'node:path';

export interface VMixConfig {
  vmixUrl: string | null;
  vmixInputId: string | null;
  vmixReplayInputId?: string | null;
  replayExportPath?: string | null;
  vmixOverlayChannel?: number;
}

export interface VMixData {
  competidor: string;
  animal: string;
  j1: string | number;
  j2: string | number;
  j3?: string | number;
  j4?: string | number;
  j1p?: string | number;
  j1a?: string | number;
  j2p?: string | number;
  j2a?: string | number;
  j3p?: string | number;
  j3a?: string | number;
  j4p?: string | number;
  j4a?: string | number;
  notaPeao?: string | number;
  notaAnimal?: string | number;
  total: string | number;
  etapaRank?: string;
  etapaNome?: string;
}

/**
 * Envia comando genérico para a API do vMix
 */
export async function callVMix(baseUrl: string, functionName: string, params: Record<string, string>) {
  const query = new URLSearchParams({ Function: functionName, ...params }).toString();
  const url = `${baseUrl}/?${query}`;
  
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response.ok;
  } catch (err) {
    console.error(`Falha ao chamar função ${functionName} no vMix:`, err);
    return false;
  }
}

/**
 * Aciona um overlay específico no vMix
 */
export async function triggerVMixOverlay(config: VMixConfig, channel: number, action: 'In' | 'Out' | 'Off') {
  if (!config.vmixUrl || !config.vmixInputId) return;

  const baseUrl = config.vmixUrl.endsWith('/api') 
    ? config.vmixUrl 
    : `${config.vmixUrl.replace(/\/$/, '')}/api`;

  const functionName = action === 'Off' ? `OverlayInput${channel}Off` : `OverlayInput${channel}${action}`;
  
  return await callVMix(baseUrl, functionName, { Input: config.vmixInputId });
}

export async function sendToVMix(config: VMixConfig, data: VMixData): Promise<string | null> {
  if (!config.vmixUrl) return null;

  const baseUrl = config.vmixUrl.endsWith('/api') 
    ? config.vmixUrl 
    : `${config.vmixUrl.replace(/\/$/, '')}/api`;

  let replayFileName: string | null = null;

  // 1. Atualizar Textos no Overlay (GT Title)
  if (config.vmixInputId) {
    const fields: Record<string, string | number | undefined> = {
      'Competidor': data.competidor,
      'Animal': data.animal,
      // Notas individuais de cada juiz (soma peão+animal)
      'J1': data.j1,
      'J2': data.j2,
      'J3': data.j3 || '',
      'J4': data.j4 || '',
      // Notas separadas por juiz (Peão e Animal)
      'J1P': data.j1p ?? '',
      'J1A': data.j1a ?? '',
      'J2P': data.j2p ?? '',
      'J2A': data.j2a ?? '',
      'J3P': data.j3p ?? '',
      'J3A': data.j3a ?? '',
      'J4P': data.j4p ?? '',
      'J4A': data.j4a ?? '',
      // Totais
      'NotaPeao': data.notaPeao ?? '',
      'NotaAnimal': data.notaAnimal ?? '',
      'Total': data.total,
      'EtapaRank': data.etapaRank || '---'
    };

    for (const [fieldName, value] of Object.entries(fields)) {
      if (value === undefined || value === null) continue;
      await callVMix(baseUrl, 'SetText', {
        Input: config.vmixInputId,
        SelectedName: fieldName,
        Value: value.toString()
      });
    }

    // 2. Acionar Overlay (Entrada automática)
    const channel = config.vmixOverlayChannel || 1;
    await callVMix(baseUrl, `OverlayInput${channel}In`, { Input: config.vmixInputId });
  }

  // 3. Taguear Replay (Instant Replay)
  if (config.vmixReplayInputId) {
    const description = `${data.competidor} - ${data.animal} (NOTA: ${data.total}) (RANK: ${data.etapaRank || '---'})`.toUpperCase();
    
    // ReplaySetLastEventText é a função correta para taguear o último clipe criado
    await callVMix(baseUrl, 'ReplaySetLastEventText', { 
      Input: config.vmixReplayInputId, 
      Value: description 
    });

    // 4. Exportar Replay (Se configurado)
    if (config.replayExportPath) {
      // IMPORTANTE: No vMix, o Value do ReplayExportLastEvent é a PASTA de destino.
      // Se enviarmos um caminho com nome de arquivo, ele cria uma pasta com esse nome.
      // Portanto, enviamos apenas o diretório base. O vMix usará o 'Description' tagueado acima como nome do arquivo.
      const vmixSafePath = config.replayExportPath.replace(/\//g, '\\');

      await callVMix(baseUrl, 'ReplayExportLastEvent', { 
         Input: config.vmixReplayInputId,
         Value: vmixSafePath
      });
      console.log(`[vMix] Comando de exportação enviado para a pasta: ${vmixSafePath}`);
    }
  }

  return replayFileName;
}
