import { NextRequest } from "next/server";
import { getOverlayDataPayload } from "../current/route";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Configurando a resposta como stream de eventos (Server-Sent Events)
  const stream = new ReadableStream({
    async start(controller) {
      let lastDataStr = "";
      
      controller.enqueue(
        new TextEncoder().encode(`retry: 1000\n\n`) // Instrução de reconexão
      );

      // Função de Loop Interno
      const interval = setInterval(async () => {
        try {
          const data = await getOverlayDataPayload();
          const dataStr = JSON.stringify(data);
          
          // Somente envia se o payload for diferente do último enviado (Zero Latency otimizada)
          if (dataStr !== lastDataStr) {
             const message = `data: ${dataStr}\n\n`;
             controller.enqueue(new TextEncoder().encode(message));
             lastDataStr = dataStr;
          }
        } catch (error) {
          console.error("SSE Polling Error", error);
        }
      }, 500); // Pool de 500ms puramente no DB sem pesar headers do servidor web.

      // Se a conexão for abortada pelo cliente, limpamos o interval
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
