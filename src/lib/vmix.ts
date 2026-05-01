/**
 * Utilitário para integração HTTP com API do vMix
 */
import fs from 'node:fs';
import path from 'node:path';

export interface VMixConfig {
  vmixUrl: string | null;
  vmixInputId?: string | null;
  vmixInputNotaId?: string | null;
  vmixInputChamadaId?: string | null;
  vmixInputRankingId?: string | null;
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
  roundNome?: string;
}

/**
 * Envia comando genérico para a API do vMix
 */
export async function callVMix(baseUrl: string, functionName: string, params: Record<string, string>) {
  const query = new URLSearchParams({ Function: functionName, ...params }).toString();
  const url = `${baseUrl}/?${query}`;
  
  try {
    const controller = new AbortController();
    const timeoutMs = functionName.includes('Export') ? 8000 : 3000; // Export precisa mais tempo
    const id = setTimeout(() => controller.abort(), timeoutMs);
    
    console.log(`[vMix] >> ${functionName} -> ${url.substring(0, 120)}...`);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    
    if (!response.ok) {
      console.error(`[vMix] !! ${functionName} retornou ${response.status}`);
    }
    return response.ok;
  } catch (err: any) {
    console.error(`[vMix] ❌ Falha ${functionName}:`, err?.message || err);
    return false;
  }
}

/**
 * Aciona um overlay específico no vMix
 */
export async function triggerVMixOverlay(config: VMixConfig, channel: number, action: 'In' | 'Out' | 'Off', customInputId?: string) {
  const inputId = customInputId || config.vmixInputId;
  if (!config.vmixUrl || !inputId) return;

  const baseUrl = config.vmixUrl.endsWith('/api') 
    ? config.vmixUrl 
    : `${config.vmixUrl.replace(/\/$/, '')}/api`;

  const functionName = action === 'Off' ? `OverlayInput${channel}Off` : `OverlayInput${channel}${action}`;
  
  return await callVMix(baseUrl, functionName, { Input: inputId });
}

export async function sendToVMix(config: VMixConfig, data: VMixData): Promise<string | null> {
  if (!config.vmixUrl) return null;

  const baseUrl = config.vmixUrl.endsWith('/api') 
    ? config.vmixUrl 
    : `${config.vmixUrl.replace(/\/$/, '')}/api`;

  let replayFileName: string | null = null;

  // 1. Atualizar Textos no Overlay (GT Title)
  const inputId = config.vmixInputNotaId || config.vmixInputId;

  if (inputId) {
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
      'EtapaRank': data.etapaRank || '---',
      'Round': data.roundNome || ''
    };

    const promises = Object.entries(fields).map(([fieldName, value]) => {
      if (value === undefined || value === null) return Promise.resolve(true);
      return callVMix(baseUrl, 'SetText', {
        Input: inputId,
        SelectedName: fieldName,
        Value: value.toString()
      });
    });

    await Promise.all(promises);

    // 2. Acionar Overlay (Entrada automática)
    const channel = config.vmixOverlayChannel || 1;
    await callVMix(baseUrl, `OverlayInput${channel}In`, { Input: inputId });
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
      // O vMix usará o 'Description' tagueado acima como nome do arquivo.
      replayFileName = `${description}.mp4`;

      const vmixSafePath = config.replayExportPath.replace(/\//g, '\\');

      await callVMix(baseUrl, 'ReplayExportLastEvent', { 
         Input: config.vmixReplayInputId,
         Value: vmixSafePath
      });
      console.log(`[vMix] Comando de exportação enviado: ${replayFileName}`);
    }
  }

  return replayFileName;
}
