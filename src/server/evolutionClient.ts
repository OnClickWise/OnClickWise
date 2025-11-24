const BASE_URL = process.env.EVOLUTION_API_URL?.replace(/\/$/, "") ?? "";
const API_KEY =
  process.env.EVOLUTION_API_KEY ??
  process.env.NEXT_PUBLIC_EVOLUTION_API_KEY ??
  "";

export interface EvolutionRequestOptions extends RequestInit {
  parseJson?: boolean;
}

export async function evolutionRequest<T = unknown>(
  path: string,
  { parseJson = true, headers, ...init }: EvolutionRequestOptions = {}
): Promise<T> {
  if (!BASE_URL) {
    throw new Error("EVOLUTION_API_URL não configurada");
  }
  if (!API_KEY) {
    throw new Error("EVOLUTION_API_KEY não configurada");
  }

  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: API_KEY,
      ...headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Evolution API ${response.status} ${response.statusText}: ${text}`
    );
  }

  if (!parseJson) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

export async function fetchEvolutionChats(instanceName: string) {
  return evolutionRequest(`/chat/findChats/${encodeURIComponent(instanceName)}`, {
    method: "POST",
  });
}

export interface EvolutionMessagesParams {
  instanceName: string;
  remoteJid: string;
  limit?: number;
  cursor?: string | number;
  direction?: "ASC" | "DESC";
}

export async function fetchEvolutionMessages({
  instanceName,
  remoteJid,
  limit,
  cursor,
  direction,
}: EvolutionMessagesParams) {
  const payload: Record<string, unknown> = {
    remoteJid,
  };

  if (limit && Number.isFinite(limit)) {
    payload.limit = limit;
  }

  if (cursor !== undefined) {
    payload.cursor = cursor;
    payload.before = cursor;
  }

  if (direction) {
    payload.direction = direction;
    payload.order = direction;
  }

  return evolutionRequest(
    `/chat/findMessages/${encodeURIComponent(instanceName)}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

