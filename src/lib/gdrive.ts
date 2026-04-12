import { prisma } from "./db";

/**
 * Google Drive Integration para Replays de Montarias.
 * 
 * Requer:
 * 1. Uma pasta pública no Google Drive com os replays.
 * 2. Uma API Key do Google Cloud (Console: console.cloud.google.com > APIs > Drive API v3).
 * 3. O ID da pasta e a API Key configurados no Admin > Configurações.
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
  try {
    const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
    const apiKey = (config as any)?.googleDriveApiKey;
    
    if (!apiKey) {
      console.log('[GDrive] API Key não configurada - vídeos de replay não serão exibidos');
      return {};
    }

    // Buscamos id, name e thumbnailLink.
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,thumbnailLink,mimeType)&pageSize=1000&key=${apiKey}`;
    
    const response = await fetch(url, { 
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GDrive] Erro API (${response.status}):`, errorText);
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

    console.log(`[GDrive] ${Object.keys(map).length} arquivos encontrados na pasta`);
    return map;
  } catch (error) {
    console.error('[GDrive] Erro ao buscar arquivos:', error);
    return {};
  }
}
