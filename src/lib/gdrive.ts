import { getSafeConfig } from "./config-safe";

/**
 * Google Drive Integration para Replays de Montarias.
 */

/**
 * Gera a URL de embed (preview) do Google Drive.
 */
export function getDriveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Busca todos os arquivos da pasta do Google Drive usando a API Key.
 * Retorna um mapa de fileName -> fileId.
 */
export async function getReplayFileMap(folderId: string): Promise<Record<string, { id: string, thumb: string | null }>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos de limite

  try {
    const config = await getSafeConfig();
    const apiKey = config?.googleDriveApiKey;
    
    if (!apiKey) {
      return {};
    }

    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,thumbnailLink,mimeType)&pageSize=1000&key=${apiKey}`;
    
    const response = await fetch(url, { 
      signal: controller.signal,
      cache: 'no-store' // Forçamos não cachear na rede se a página já for dinâmica
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    const map: Record<string, { id: string, thumb: string | null }> = {};
    
    data.files?.forEach((f: any) => {
      if (f.mimeType !== 'application/vnd.google-apps.folder') {
        map[f.name] = {
          id: f.id,
          thumb: f.thumbnailLink || null
        };
      }
    });

    return map;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[GDrive] Erro ao buscar arquivos (timeout ou rede):', error);
    return {};
  }
}
