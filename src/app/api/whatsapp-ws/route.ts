import store from "@/server/whatsappStore";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  console.log("[WhatsApp SSE] === ROTA CHAMADA ===");
  console.log("[WhatsApp SSE] Path:", request.nextUrl.pathname);
  console.log("[WhatsApp SSE] URL:", request.url);
  
  try {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let isClosed = false;

        const sendEvent = (event: { type: string; data: Record<string, unknown>; timestamp: string }) => {
          if (isClosed) return;
          try {
            const data = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch (error) {
            console.error("[WhatsApp SSE] Erro ao enviar evento:", error);
            if (!isClosed) {
              isClosed = true;
              try {
                controller.close();
              } catch {
                // Ignorar
              }
            }
          }
        };

        // Enviar mensagem de conexão inicial imediatamente
        sendEvent({
          type: "connected",
          data: { message: "Connected to WhatsApp realtime bridge" },
          timestamp: new Date().toISOString(),
        });

        // Inscrever-se nos eventos do store
        const unsubscribe = store.subscribe((event) => {
          if (!isClosed) {
            sendEvent(event);
          }
        });

        // Heartbeat a cada 30 segundos
        const heartbeatInterval = setInterval(() => {
          if (isClosed) {
            clearInterval(heartbeatInterval);
            return;
          }
          try {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          } catch {
            isClosed = true;
            clearInterval(heartbeatInterval);
            unsubscribe();
            try {
              controller.close();
            } catch {
              // Ignorar
            }
          }
        }, 30000);

        // Cleanup
        const cleanup = () => {
          if (isClosed) return;
          isClosed = true;
          clearInterval(heartbeatInterval);
          unsubscribe();
          try {
            controller.close();
          } catch (error) {
            console.error("[WhatsApp SSE] Erro no cleanup:", error);
          }
        };

        request.signal.addEventListener("abort", cleanup);
      },
      cancel() {
        console.log("[WhatsApp SSE] Stream cancelado");
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("[WhatsApp SSE] ERRO FATAL:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create SSE stream",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
