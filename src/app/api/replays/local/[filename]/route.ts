import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const decodedName = decodeURIComponent(filename);

    const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
    const basePath = config?.replayExportPath;

    if (!basePath) {
      return new NextResponse('Caminho de exportação não configurado', { status: 404 });
    }

    // Tentar localizar o arquivo no disco local (G:\...)
    const fullPath = path.join(basePath, decodedName);

    if (!fs.existsSync(fullPath)) {
      console.log(`[LocalReplay] Arquivo não encontrado no disco: ${fullPath}`);
      return new NextResponse('Arquivo não encontrado no disco local', { status: 404 });
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    // Suporte a Streaming (Range Requests) para o player de vídeo funcionar corretamente
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(fullPath, { start, end });
      
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };

      return new NextResponse(file as any, {
        status: 206,
        headers: head
      });
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      const file = fs.createReadStream(fullPath);
      return new NextResponse(file as any, {
        status: 200,
        headers: head
      });
    }
  } catch (error) {
    console.error('[LocalReplay] Erro ao servir vídeo:', error);
    return new NextResponse('Erro interno ao servir vídeo', { status: 500 });
  }
}
