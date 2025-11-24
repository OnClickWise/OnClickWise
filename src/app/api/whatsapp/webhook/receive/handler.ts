import { NextRequest, NextResponse } from "next/server";
import store, { touchStore } from "@/server/whatsappStore";

export const runtime = "nodejs";

function normalizeEventName(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value
    .trim()
    .replace(/[\s.-]+/g, "_")
    .replace(/__+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .toUpperCase();
}

function extractEventName(slugSegments: string[], body: Record<string, unknown>): string | null {
  const slugEvent = slugSegments.length > 0 ? slugSegments[slugSegments.length - 1] : null;
  const bodyEvent =
    typeof body.event === "string"
      ? body.event
      : typeof body.type === "string"
      ? body.type
      : typeof body.eventName === "string"
      ? body.eventName
      : null;

  return normalizeEventName(bodyEvent ?? slugEvent);
}

function extractInstanceName(body: Record<string, unknown>): string {
  const instanceCandidate =
    body.instance ??
    body.instanceName ??
    (body.instanceData && typeof body.instanceData === "object"
      ? (body.instanceData as Record<string, unknown>).name
      : undefined) ??
    (body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>).instanceName
      : undefined) ??
    process.env.WHATSAPP_INSTANCE_NAME ??
    "whatsapp-instance";

  return String(instanceCandidate);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function handleWebhook(request: NextRequest, slugSegments: string[]): Promise<NextResponse> {
  touchStore();

  const expectedKey = process.env.WHATSAPP_WEBHOOK_KEY;
  const providedKey =
    request.headers.get("apikey") ??
    request.headers.get("x-api-key") ??
    request.headers.get("authorization");

  if (expectedKey && expectedKey !== providedKey) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch (error) {
    console.error("Invalid webhook payload:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON payload",
      },
      { status: 400 }
    );
  }

  const event = extractEventName(slugSegments, payload);

  if (!event) {
    return NextResponse.json(
      {
        success: false,
        error: "Event name not provided",
      },
      { status: 400 }
    );
  }

  const instanceName = extractInstanceName(payload);

  const meta =
    (payload.meta as Record<string, unknown> | undefined) ??
    ((payload.data as Record<string, unknown> | undefined)?.meta as Record<string, unknown> | undefined);

  const instanceInfo = store.ensureInstance(instanceName, meta);

  console.log("[WhatsApp Webhook] Event received:", {
    event,
    instanceName,
    hasData: payload.data !== undefined,
  });

  const data = payload.data ?? payload;

  console.log("[WhatsApp Webhook] Processing event:", {
    event,
    instanceName,
    hasData: data !== undefined,
    dataType: Array.isArray(data) ? "array" : typeof data,
    dataKeys: isRecord(data) ? Object.keys(data) : [],
  });

  switch (event) {
    case "MESSAGES_UPSERT":
    case "MESSAGES_UPDATE":
    case "MESSAGES_SET":
      {
        // O Evolution API envia mensagens como objeto único ou array
        // O formato pode ser:
        // 1. { data: { key: {...}, message: {...}, ... } } - mensagem única
        // 2. { data: [{ key: {...}, message: {...}, ... }] } - array de mensagens
        // 3. { data: { messages: [...] } } - mensagens dentro de um objeto
        
        let messagesToProcess: unknown[] = [];
        
        if (Array.isArray(data)) {
          // Caso 2: data é um array
          messagesToProcess = data;
        } else if (isRecord(data)) {
          // Verificar se há um campo 'messages' dentro de data
          if (Array.isArray(data.messages)) {
            messagesToProcess = data.messages;
          } else if (data.key && isRecord(data.key)) {
            // Caso 1: data é uma mensagem única com key
            messagesToProcess = [data];
          } else {
            // Tentar processar data como mensagem única
            messagesToProcess = [data];
          }
        } else {
          // Fallback: tratar como mensagem única
          messagesToProcess = [data];
        }
        
        console.log("[WhatsApp Webhook] Processing messages:", {
          event,
          instanceName,
          count: messagesToProcess.length,
          firstMessageKeys: messagesToProcess[0] && isRecord(messagesToProcess[0]) 
            ? Object.keys(messagesToProcess[0]) 
            : [],
          firstMessageHasKey: messagesToProcess[0] && isRecord(messagesToProcess[0]) 
            ? !!messagesToProcess[0].key 
            : false,
        });
        
        if (messagesToProcess.length > 0) {
          store.upsertMessages(instanceName, messagesToProcess);
        } else {
          console.warn("[WhatsApp Webhook] No messages to process after normalization");
        }
      }
      break;
    case "MESSAGES_DELETE":
      store.deleteMessages(instanceName, data);
      break;
    case "CHATS_SET":
    case "CHATS_UPSERT":
    case "CHATS_UPDATE":
    case "CHATS_DELETE":
      store.upsertChats(instanceName, data);
      break;
    case "CONNECTION_UPDATE":
    case "INSTANCE_UPDATE":
    case "APPLICATION_STARTUP":
      {
        const status =
          (isRecord(data) && typeof data.state === "string" && data.state) ||
          (isRecord(data) && typeof data.status === "string" && data.status) ||
          (typeof payload.status === "string" && payload.status) ||
          (typeof payload.state === "string" && payload.state) ||
          instanceInfo.status;

        store.setStatus(instanceName, status, meta);
      }
      break;
    default:
      console.log("[WhatsApp Webhook] Event ignored:", event);
  }

  return NextResponse.json({
    success: true,
    event,
    instance: instanceInfo,
  });
}

