import { unstable_noStore } from "next/cache";

export interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe?: boolean;
    id: string;
    [key: string]: unknown;
  };
  messageTimestamp?: number;
  pushName?: string;
  message?: Record<string, unknown>;
  status?: string;
  [key: string]: unknown;
}

export interface WhatsAppChat {
  id: string;
  conversationId?: string;
  remoteJid: string;
  jid?: string;
  name?: string;
  subject?: string;
  displayName?: string;
  pushName?: string;
  unreadCount?: number;
  pin?: number;
  lastMessage?: WhatsAppMessage;
  [key: string]: unknown;
}

export interface WhatsAppInstanceInfo {
  instanceName: string;
  status: string;
  qrcode?: string | null;
  meta?: Record<string, unknown>;
}

export interface BroadcastEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface InternalChat extends WhatsAppChat {
  updatedAt: number;
}

interface InstanceRecord {
  instanceName: string;
  status: string;
  qrcode?: string | null;
  meta?: Record<string, unknown>;
  chats: Map<string, InternalChat>;
  messages: Map<string, WhatsAppMessage[]>;
  createdAt: number;
}

type EventListener = (event: BroadcastEvent) => void;

const DEFAULT_INSTANCE_STATUS = "connecting";

function ensureNumberTimestamp(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : Math.floor(Date.now() / 1000);
  }
  return Math.floor(Date.now() / 1000);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function cloneMessage(message: WhatsAppMessage): WhatsAppMessage {
  return JSON.parse(JSON.stringify(message)) as WhatsAppMessage;
}

function normalizeJid(value: unknown): string | null {
  if (!value) {
    return null;
  }

  let jid = String(value).trim();

  if (!jid) {
    return null;
  }

  // Se já tem um formato válido de JID, processar adequadamente
  // Suporta: @s.whatsapp.net, @g.us, @c.us, @lid (listas de discussão)
  if (/@(g\.us|s\.whatsapp\.net|c\.us|lid)$/i.test(jid)) {
    // Grupos: limpar sufixos como ":0@g.us"
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
      jid = jid.replace(/@c\.us$/i, "@s.whatsapp.net");
      return jid;
    }
    // @s.whatsapp.net - manter como está
    return jid;
  }

  // Se já tem @ mas não é um formato conhecido, retornar como está
  if (jid.includes("@")) {
    return jid;
  }

  // Tentar inferir o tipo baseado no número
  const numberOnly = jid.replace(/[^\d]/g, "");
  if (!numberOnly) {
    return jid;
  }

  const looksLikeGroup = /^120\d{5,}$/.test(numberOnly);
  return looksLikeGroup ? `${numberOnly}@g.us` : `${numberOnly}@s.whatsapp.net`;
}

function normalizeMessage(input: unknown): WhatsAppMessage | null {
  if (!isPlainObject(input)) {
    console.warn("[WhatsAppStore] normalizeMessage: input is not a plain object");
    return null;
  }

  const rawKey = input.key;
  if (!isPlainObject(rawKey)) {
    console.warn("[WhatsAppStore] normalizeMessage: key is missing or not an object", {
      hasKey: !!input.key,
      inputKeys: Object.keys(input),
    });
    return null;
  }

  if (typeof rawKey.id !== "string" && typeof rawKey.id !== "number") {
    console.warn("[WhatsAppStore] normalizeMessage: key.id is missing or invalid", {
      keyId: rawKey.id,
      keyType: typeof rawKey.id,
      keyKeys: Object.keys(rawKey),
    });
    return null;
  }

  const remoteJid = normalizeJid(rawKey.remoteJid ?? rawKey.remotejid ?? rawKey.chatId);
  if (!remoteJid) {
    console.warn("[WhatsAppStore] normalizeMessage: failed to normalize remoteJid", {
      remoteJid: rawKey.remoteJid ?? rawKey.remotejid ?? rawKey.chatId,
      keyKeys: Object.keys(rawKey),
    });
    return null;
  }

  const normalized: WhatsAppMessage = {
    ...input,
    key: {
      ...rawKey,
      remoteJid,
      id: String(rawKey.id),
    },
    messageTimestamp: ensureNumberTimestamp(
      input.messageTimestamp ??
        input.messageTimestampLow ??
        input.messageTimestampHigh ??
        (input as Record<string, unknown>).timestamp
    ),
  };

  return normalized;
}

function coerceToArray<T>(value: unknown, predicate: (item: unknown) => item is T): T[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(predicate);
  }

  if (isPlainObject(value) && Array.isArray(value.messages)) {
    return value.messages.filter(predicate);
  }

  if (isPlainObject(value) && Array.isArray(value.data)) {
    return value.data.filter(predicate);
  }

  if (isPlainObject(value) && Array.isArray(value.value)) {
    return value.value.filter(predicate);
  }

  if (isPlainObject(value) && value.message) {
    const single = predicate(value.message) ? [value.message] : [];
    return single;
  }

  if (predicate(value)) {
    return [value];
  }

  return [];
}

function serializeChat(chat: InternalChat): WhatsAppChat {
  const { updatedAt, ...rest } = chat;
  return {
    ...rest,
    unreadCount: chat.unreadCount ?? 0,
    pin: chat.pin ?? 0,
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __whatsappStore: WhatsAppStore | undefined;
}

class WhatsAppStore {
  private instances: Map<string, InstanceRecord>;
  private defaultInstanceName?: string;
  private listeners: Set<EventListener>;

  constructor() {
    this.instances = new Map<string, InstanceRecord>();
    this.listeners = new Set<EventListener>();

    const initialInstance = process.env.WHATSAPP_INSTANCE_NAME;
    if (initialInstance) {
      this.defaultInstanceName = initialInstance;
      this.getOrCreateInstance(initialInstance);
    }
  }

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private broadcast(type: string, data: Record<string, unknown>): void {
    if (this.listeners.size === 0) {
      return;
    }

    const event: BroadcastEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("WhatsAppStore listener error:", error);
      }
    }
  }

  private getOrCreateInstance(name: string): InstanceRecord {
    const normalized = name || this.defaultInstanceName || "whatsapp-instance";

    if (!this.instances.has(normalized)) {
      this.instances.set(normalized, {
        instanceName: normalized,
        status: DEFAULT_INSTANCE_STATUS,
        chats: new Map(),
        messages: new Map(),
        createdAt: Date.now(),
      });
    }

    if (!this.defaultInstanceName) {
      this.defaultInstanceName = normalized;
    }

    return this.instances.get(normalized)!;
  }

  getDefaultInstance(): WhatsAppInstanceInfo | undefined {
    const name = this.defaultInstanceName ?? this.instances.keys().next().value;
    if (!name) {
      return undefined;
    }

    return this.getInstanceInfo(name);
  }

  getInstanceInfo(instanceName: string): WhatsAppInstanceInfo | undefined {
    const instance = this.instances.get(instanceName);
    if (!instance) {
      return undefined;
    }

    return {
      instanceName: instance.instanceName,
      status: instance.status,
      qrcode: instance.qrcode ?? null,
      meta: instance.meta,
    };
  }

  ensureInstance(instanceName: string, meta?: Record<string, unknown>): WhatsAppInstanceInfo {
    const instance = this.getOrCreateInstance(instanceName);
    if (meta) {
      instance.meta = {
        ...instance.meta,
        ...meta,
      };
    }

    return this.getInstanceInfo(instanceName)!;
  }

  setStatus(instanceName: string, status: string, meta?: Record<string, unknown>): WhatsAppInstanceInfo {
    const instance = this.getOrCreateInstance(instanceName);
    instance.status = status;

    if (meta) {
      instance.meta = {
        ...instance.meta,
        ...meta,
      };
    }

    this.broadcast("whatsapp:instance:status:update", {
      instanceName,
      status,
      meta: instance.meta,
    });

    return this.getInstanceInfo(instanceName)!;
  }

  upsertChats(instanceName: string, payload: unknown): void {
    const instance = this.getOrCreateInstance(instanceName);

    const chats = coerceToArray<WhatsAppChat>(payload, (item): item is WhatsAppChat => {
      if (!isPlainObject(item)) {
        return false;
      }

      const candidate = item as Partial<WhatsAppChat>;
      const remote = candidate.remoteJid ?? candidate.jid ?? candidate.id;
      return typeof remote === "string";
    });

    if (chats.length === 0) {
      return;
    }

    for (const chat of chats) {
      const remoteJid = normalizeJid(chat.remoteJid ?? chat.jid ?? chat.id);
      if (!remoteJid) {
        continue;
      }

      const existing = instance.chats.get(remoteJid);
      const candidate: InternalChat = {
        id: chat.id ?? remoteJid,
        conversationId: chat.conversationId ?? existing?.conversationId,
        remoteJid,
        jid: chat.jid ?? existing?.jid ?? remoteJid,
        name: chat.name ?? existing?.name,
        subject: chat.subject ?? existing?.subject,
        displayName: chat.displayName ?? existing?.displayName,
        pushName: chat.pushName ?? existing?.pushName ?? chat.lastMessage?.pushName,
        unreadCount: chat.unreadCount ?? existing?.unreadCount ?? 0,
        pin: chat.pin ?? existing?.pin ?? 0,
        lastMessage: chat.lastMessage ? normalizeMessage(chat.lastMessage) ?? existing?.lastMessage : existing?.lastMessage,
        updatedAt: Date.now(),
      };

      instance.chats.set(remoteJid, candidate);

      this.broadcast("whatsapp:chat:update", {
        instanceName,
        chat: serializeChat(candidate),
      });
    }
  }

  upsertMessages(instanceName: string, payload: unknown): void {
    const instance = this.getOrCreateInstance(instanceName);

    console.log("[WhatsAppStore] upsertMessages called:", {
      instanceName,
      payloadType: Array.isArray(payload) ? "array" : typeof payload,
      payloadKeys: isPlainObject(payload) ? Object.keys(payload) : [],
    });

    const normalizedMessages = coerceToArray<WhatsAppMessage>(payload, (item): item is WhatsAppMessage => {
      const normalized = normalizeMessage(item);
      if (!normalized) {
        console.warn("[WhatsAppStore] Failed to normalize message:", {
          itemKeys: isPlainObject(item) ? Object.keys(item) : [],
          hasKey: isPlainObject(item) && !!item.key,
        });
        return false;
      }
      Object.assign(item as Record<string, unknown>, normalized);
      return true;
    }).map((message) => normalizeMessage(message)).filter((msg): msg is WhatsAppMessage => msg !== null);

    console.log("[WhatsAppStore] Normalized messages:", {
      count: normalizedMessages.length,
      messages: normalizedMessages.map((m) => ({
        id: m.key?.id,
        remoteJid: m.key?.remoteJid,
        fromMe: m.key?.fromMe,
        timestamp: m.messageTimestamp,
      })),
    });

    if (normalizedMessages.length === 0) {
      console.warn("[WhatsAppStore] No valid messages to upsert");
      return;
    }

    const newMessages: Array<{ remoteJid: string; message: WhatsAppMessage }> = [];

    for (const message of normalizedMessages) {
      if (!message?.key?.remoteJid) {
        continue;
      }

      const remoteJid = message.key.remoteJid;
      const storedMessages = instance.messages.get(remoteJid) ?? [];
      const existingIndex = storedMessages.findIndex((item) => item.key.id === message.key.id);

      const normalized = cloneMessage(message);
      normalized.messageTimestamp = ensureNumberTimestamp(normalized.messageTimestamp);

      if (existingIndex >= 0) {
        storedMessages[existingIndex] = {
          ...storedMessages[existingIndex],
          ...normalized,
          key: {
            ...storedMessages[existingIndex].key,
            ...normalized.key,
          },
        };
      } else {
        storedMessages.push(normalized);
        newMessages.push({ remoteJid, message: normalized });
      }

      storedMessages.sort((a, b) => {
        const aTs = ensureNumberTimestamp(a.messageTimestamp);
        const bTs = ensureNumberTimestamp(b.messageTimestamp);
        return aTs - bTs;
      });

      instance.messages.set(remoteJid, storedMessages);

      const existingChat = instance.chats.get(remoteJid);
      const chat: InternalChat = {
        id: existingChat?.id ?? remoteJid,
        conversationId: existingChat?.conversationId,
        remoteJid,
        jid: existingChat?.jid ?? remoteJid,
        name: existingChat?.name,
        subject: existingChat?.subject,
        displayName: existingChat?.displayName,
        pushName: normalized.pushName ?? existingChat?.pushName ?? normalized.message?.pushName as string | undefined,
        unreadCount: existingChat?.unreadCount ?? 0,
        lastMessage: cloneMessage(storedMessages[storedMessages.length - 1]),
        updatedAt: Date.now(),
        pin: existingChat?.pin ?? 0,
      };

      instance.chats.set(remoteJid, chat);
    }

    for (const entry of newMessages) {
      console.log("[WhatsAppStore] Broadcasting new message:", {
        instanceName,
        remoteJid: entry.remoteJid,
        messageId: entry.message.key?.id,
        listeners: this.listeners.size,
      });
      this.broadcast("whatsapp:message:new", {
        instanceName,
        remoteJid: entry.remoteJid,
        message: entry.message,
      });
    }

    if (newMessages.length > 0) {
      const affected = new Set(newMessages.map((item) => item.remoteJid));
      for (const remoteJid of affected) {
        const chat = instance.chats.get(remoteJid);
        if (chat) {
          this.broadcast("whatsapp:chat:update", {
            instanceName,
            chat: serializeChat(chat),
          });
        }
      }
    }
  }

  deleteMessages(instanceName: string, payload: unknown): void {
    const instance = this.instances.get(instanceName);
    if (!instance) {
      return;
    }

    const normalizedKeys = coerceToArray<Record<string, unknown>>(
      payload,
      (item): item is Record<string, unknown> => {
        return isPlainObject(item);
      }
    ).map((item): { remoteJid: string; id: string } | null => {
      if (item.key && isPlainObject(item.key)) {
        const key = item.key as Record<string, unknown>;
        const remote = normalizeJid(key.remoteJid ?? key.remotejid);
        const id = key.id;
        if (remote && id) {
          return {
            remoteJid: remote,
            id: String(id),
          };
        }
      }

      if (typeof item.remoteJid === "string" && item.id) {
        const remote = normalizeJid(item.remoteJid);
        if (remote) {
          return {
            remoteJid: remote,
            id: String(item.id),
          };
        }
      }

      return null;
    }).filter((item): item is { remoteJid: string; id: string } => item !== null);

    for (const { remoteJid, id } of normalizedKeys) {
      if (!remoteJid || !id) {
        continue;
      }

      const storedMessages = instance.messages.get(remoteJid);
      if (!storedMessages) {
        continue;
      }

      const nextMessages = storedMessages.filter((message) => message.key.id !== id);
      instance.messages.set(remoteJid, nextMessages);

      const chat = instance.chats.get(remoteJid);
      if (chat) {
        chat.lastMessage = nextMessages.length > 0 ? cloneMessage(nextMessages[nextMessages.length - 1]) : undefined;
        chat.updatedAt = Date.now();
        instance.chats.set(remoteJid, chat);

        this.broadcast("whatsapp:chat:update", {
          instanceName,
          chat: serializeChat(chat),
        });
      }

      this.broadcast("whatsapp:message:delete", {
        instanceName,
        remoteJid,
        messageId: id,
      });
    }
  }

  getChats(instanceName: string): WhatsAppChat[] {
    const instance = this.instances.get(instanceName);
    if (!instance) {
      return [];
    }

    const chats = Array.from(instance.chats.values()).sort((a, b) => {
      const aTime = ensureNumberTimestamp(a.lastMessage?.messageTimestamp ?? 0);
      const bTime = ensureNumberTimestamp(b.lastMessage?.messageTimestamp ?? 0);
      return bTime - aTime;
    });

    return chats.map(serializeChat);
  }

  getMessages(
    instanceName: string,
    remoteJid: string,
    options: {
      order?: "ASC" | "DESC";
      limit?: number;
      beforeTimestamp?: number;
    } = {}
  ): WhatsAppMessage[] {
    const instance = this.instances.get(instanceName);
    if (!instance) {
      return [];
    }

    const normalizedRemoteJid = normalizeJid(remoteJid);
    if (!normalizedRemoteJid) {
      return [];
    }

    const allMessages = instance.messages.get(normalizedRemoteJid) ?? [];
    let selected = allMessages.slice();

    if (options.beforeTimestamp) {
      selected = selected.filter(
        (message) => ensureNumberTimestamp(message.messageTimestamp) < options.beforeTimestamp!
      );
    }

    const order = options.order ?? "DESC";
    selected.sort((a, b) => {
      const aTs = ensureNumberTimestamp(a.messageTimestamp);
      const bTs = ensureNumberTimestamp(b.messageTimestamp);
      return order === "ASC" ? aTs - bTs : bTs - aTs;
    });

    if (options.limit && options.limit > 0) {
      selected = selected.slice(0, options.limit);
    }

    return selected.map(cloneMessage);
  }
}

const store = globalThis.__whatsappStore ?? new WhatsAppStore();

if (process.env.NODE_ENV !== "production") {
  globalThis.__whatsappStore = store;
}

export function touchStore(): void {
  unstable_noStore();
}

export default store;

