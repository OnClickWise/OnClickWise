import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    instanceName: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  console.log("[WhatsApp Evolution API Route] === ROTA CHAMADA ===");
  console.log("[WhatsApp Evolution API Route] Path:", request.nextUrl.pathname);
  console.log("[WhatsApp Evolution API Route] URL:", request.url);
  console.log("[WhatsApp Evolution API Route] Params:", params);
  
  try {
    const instanceName = decodeURIComponent(params.instanceName);
    console.log("[WhatsApp Evolution API Route] InstanceName decoded:", instanceName);
    
    const body = await request.json().catch(() => ({}));
    console.log("[WhatsApp Evolution API Route] Body received:", { hasRemoteJid: !!body.remoteJid, remoteJid: body.remoteJid });

    const remoteJid = body.remoteJid;
    if (!remoteJid) {
      return NextResponse.json(
        {
          success: false,
          error: "remoteJid is required",
        },
        { status: 400 }
      );
    }

    const limit = body.limit || 50;
    const beforeTimestamp = body.beforeTimestamp;

    // Buscar mensagens diretamente da Evolution API
    const evolutionBaseUrl = (process.env.EVOLUTION_API_URL || process.env.NEXT_PUBLIC_EVOLUTION_URL || "http://localhost:8080").replace(/\/$/, "");
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || "";

    if (!evolutionApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Evolution API key not configured",
        },
        { status: 500 }
      );
    }

    // A Evolution API espera um POST vazio no body conforme o exemplo do usuário
    // Ela retorna todas as mensagens e nós filtramos por remoteJid depois
    const evolutionEndpoint = `${evolutionBaseUrl}/chat/findMessages/${instanceName}`;

    console.log("[WhatsApp Evolution API] Buscando mensagens:", {
      endpoint: evolutionEndpoint,
      remoteJid,
      limit,
      beforeTimestamp,
      instanceName,
    });

    const response = await fetch(evolutionEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiKey: evolutionApiKey,
      },
      body: JSON.stringify({}), // Body vazio conforme exemplo do usuário
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error("[WhatsApp Evolution API] Erro:", response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Evolution API error: ${response.status} ${errorText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => null);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from Evolution API",
        },
        { status: 500 }
      );
    }

    console.log("[WhatsApp Evolution API] Resposta recebida:", {
      hasMessages: !!data.messages,
      messagesType: typeof data.messages,
      messagesKeys: data.messages && typeof data.messages === "object" ? Object.keys(data.messages) : [],
    });

    // Processar o formato da resposta da Evolution API
    // Formato esperado: { messages: { total, pages, currentPage, records: [...] } }
    let rawMessages: unknown[] = [];

    if (data.messages && typeof data.messages === "object") {
      // Se messages é um objeto com propriedade records
      if (Array.isArray(data.messages.records)) {
        rawMessages = data.messages.records;
      } 
      // Se messages é um array diretamente
      else if (Array.isArray(data.messages)) {
        rawMessages = data.messages;
      }
    } 
    // Fallback: verificar outras estruturas possíveis
    else if (Array.isArray(data.messages)) {
      rawMessages = data.messages;
    } else if (Array.isArray(data.data)) {
      rawMessages = data.data;
    } else if (Array.isArray(data.records)) {
      rawMessages = data.records;
    } else if (Array.isArray(data.value)) {
      rawMessages = data.value;
    }

    console.log("[WhatsApp Evolution API] Mensagens processadas:", {
      count: rawMessages.length,
      firstMessage: rawMessages[0] ? Object.keys(rawMessages[0] as Record<string, unknown>) : [],
    });

    // Função para normalizar JID (similar à função do whatsappStore)
    // Suporta: @s.whatsapp.net, @g.us, @c.us, @lid (listas de discussão)
    const normalizeJid = (value: unknown): string | null => {
      if (!value) return null;
      let jid = String(value).trim();
      if (!jid) return null;
      
      // Se já tem um formato válido de JID, retornar como está (incluindo @lid)
      if (/@(g\.us|s\.whatsapp\.net|c\.us|lid)$/i.test(jid)) {
        // Para grupos, limpar sufixos como ":0@g.us"
        if (/@g\.us$/i.test(jid)) {
          const base = jid.split("@")[0].split(":")[0].replace(/[^\d]/g, "");
          return base ? `${base}@g.us` : jid;
        }
        // Listas de discussão (@lid) - manter como está
        if (/@lid$/i.test(jid)) {
          return jid;
        }
        // Unificar @c.us -> @s.whatsapp.net
        if (/@c\.us$/i.test(jid)) {
          return jid.replace(/@c\.us$/i, "@s.whatsapp.net");
        }
        // @s.whatsapp.net - manter como está
        return jid;
      }
      
      // Se já tem @ mas não é um formato conhecido, retornar como está
      if (jid.includes("@")) return jid;
      
      // Tentar inferir o tipo baseado no número
      const numberOnly = jid.replace(/[^\d]/g, "");
      if (!numberOnly) return jid;
      
      const looksLikeGroup = /^120\d{5,}$/.test(numberOnly);
      return looksLikeGroup ? `${numberOnly}@g.us` : `${numberOnly}@s.whatsapp.net`;
    };

    // Normalizar o remoteJid de entrada
    const normalizedRemoteJid = normalizeJid(remoteJid);
    
    // Filtrar por remoteJid se necessário (a Evolution API pode retornar todas as mensagens)
    let filteredMessages = rawMessages;
    if (normalizedRemoteJid) {
      // Primeiro, tentar filtrar por remoteJid normalizado
      filteredMessages = rawMessages.filter((msg: unknown) => {
        if (!msg || typeof msg !== "object") return false;
        const m = msg as Record<string, unknown>;
        const key = m.key as Record<string, unknown> | undefined;
        if (!key) return false;
        
        // Tentar obter remoteJid de várias formas
        const msgRemoteJidRaw = key.remoteJid || key.remotejid || m.remoteJid;
        if (!msgRemoteJidRaw) return false;
        
        // Normalizar o remoteJid da mensagem
        const msgRemoteJid = normalizeJid(msgRemoteJidRaw);
        if (!msgRemoteJid) return false;
        
        // Comparar JIDs normalizados (case-insensitive para o domínio)
        const normalized1 = normalizedRemoteJid.toLowerCase();
        const normalized2 = msgRemoteJid.toLowerCase();
        
        // Comparação exata ou comparação sem o sufixo do domínio se necessário
        return normalized1 === normalized2 || 
               normalizedRemoteJid === msgRemoteJid ||
               String(remoteJid).toLowerCase() === String(msgRemoteJidRaw).toLowerCase();
      });
      
      console.log("[WhatsApp Evolution API] Filtro por remoteJid:", {
        originalRemoteJid: remoteJid,
        normalizedRemoteJid,
        totalMessages: rawMessages.length,
        filteredMessages: filteredMessages.length,
        sampleMessageJid: rawMessages[0] && typeof rawMessages[0] === "object" 
          ? (rawMessages[0] as Record<string, unknown>).key 
            ? ((rawMessages[0] as Record<string, unknown>).key as Record<string, unknown>).remoteJid
            : null
          : null,
      });
    } else {
      console.warn("[WhatsApp Evolution API] remoteJid não pôde ser normalizado:", remoteJid);
    }

    // Filtrar por beforeTimestamp se fornecido
    if (beforeTimestamp) {
      filteredMessages = filteredMessages.filter((msg: unknown) => {
        if (!msg || typeof msg !== "object") return false;
        const m = msg as Record<string, unknown>;
        const ts = m.messageTimestamp || m.timestamp || 0;
        return Number(ts) < Number(beforeTimestamp);
      });
    }

    // Ordenar por timestamp (mais recentes primeiro para depois inverter)
    filteredMessages.sort((a: unknown, b: unknown) => {
      const aMsg = a as Record<string, unknown>;
      const bMsg = b as Record<string, unknown>;
      const aTs = Number(aMsg.messageTimestamp || aMsg.timestamp || 0);
      const bTs = Number(bMsg.messageTimestamp || bMsg.timestamp || 0);
      return bTs - aTs; // DESC
    });

    // Aplicar limite
    const limitedMessages = filteredMessages.slice(0, limit);

    // Ordenar novamente por timestamp (mais antigas primeiro para exibição)
    limitedMessages.sort((a: unknown, b: unknown) => {
      const aMsg = a as Record<string, unknown>;
      const bMsg = b as Record<string, unknown>;
      const aTs = Number(aMsg.messageTimestamp || aMsg.timestamp || 0);
      const bTs = Number(bMsg.messageTimestamp || bMsg.timestamp || 0);
      return aTs - bTs; // ASC
    });

    console.log("[WhatsApp Evolution API] Mensagens finais:", {
      total: rawMessages.length,
      filtered: filteredMessages.length,
      limited: limitedMessages.length,
    });

    return NextResponse.json({
      success: true,
      instance: instanceName,
      remoteJid,
      messages: limitedMessages,
      total: filteredMessages.length,
    });
  } catch (error) {
    console.error("[WhatsApp Evolution API] Erro fatal:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

