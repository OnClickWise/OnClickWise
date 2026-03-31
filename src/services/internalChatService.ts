import { authenticatedFetch } from '@/services/authService';
import { getApiBaseUrl } from '@/lib/api-url';
import { getAuthToken } from '@/lib/cookies';

const API_BASE_URL = getApiBaseUrl();

export interface InternalChatChannel {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_private: boolean;
  members_count: number;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalChatMember {
  id: string;
  user_id: string;
  role: 'owner' | 'moderator' | 'member';
  joined_at: string;
  name: string;
  email: string;
}

export interface InternalChatUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface InternalChatMessage {
  id: string;
  organization_id: string;
  channel_id: string;
  sender_user_id: string;
  sender_name?: string | null;
  sender_email?: string | null;
  body: string;
  message_type: 'text' | 'system';
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface InternalChatPollOption {
  id: string;
  label: string;
  position: number;
  votes: number;
  votedByMe: boolean;
}

export interface InternalChatPoll {
  id: string;
  organization_id: string;
  channel_id: string;
  question: string;
  allow_multiple: boolean;
  is_closed: boolean;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
  total_votes: number;
  options: InternalChatPollOption[];
}

export interface InternalChatAttachment {
  id: string;
  messageId: string;
  type: 'attachment' | 'video' | 'audio';
  filename: string;
  fileUrl: string;
  senderName: string;
  senderEmail: string;
  createdAt: string;
  metadata?: any;
}

async function parseResponse<T>(res: Response, errorMessage: string): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${errorMessage} (${res.status}: ${body || res.statusText})`);
  }

  return res.json();
}

export async function listInternalChatChannels(): Promise<InternalChatChannel[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels`);
  return parseResponse<InternalChatChannel[]>(res, 'Erro ao listar canais internos');
}

export async function createInternalChatChannel(data: {
  name: string;
  description?: string;
  isPrivate?: boolean;
}): Promise<InternalChatChannel> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return parseResponse<InternalChatChannel>(res, 'Erro ao criar canal interno');
}

export async function addInternalChatChannelMember(
  channelId: string,
  data: { userId: string; role?: 'member' | 'moderator' },
): Promise<InternalChatMember[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return parseResponse<InternalChatMember[]>(res, 'Erro ao adicionar membro ao canal');
}

export async function listInternalChatOrganizationUsers(includeMaster = true): Promise<InternalChatUser[]> {
  const suffix = includeMaster ? '?include_master=true' : '';
  const res = await authenticatedFetch(`${API_BASE_URL}/api/auth/employees${suffix}`, {
    method: 'GET',
  });

  const payload = await parseResponse<any>(res, 'Erro ao listar usuários da organização');

  if (Array.isArray(payload?.employees)) {
    return payload.employees;
  }

  if (Array.isArray(payload?.users)) {
    return payload.users;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

export async function listInternalChatMembers(channelId: string): Promise<InternalChatMember[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}/members`);
  return parseResponse<InternalChatMember[]>(res, 'Erro ao listar membros do canal');
}

export async function listInternalChatMessages(channelId: string, limit = 50): Promise<InternalChatMessage[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}/messages?limit=${limit}`);
  return parseResponse<InternalChatMessage[]>(res, 'Erro ao listar mensagens do canal');
}

export async function sendInternalChatMessage(channelId: string, body: string): Promise<InternalChatMessage> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

  return parseResponse<InternalChatMessage>(res, 'Erro ao enviar mensagem');
}

export async function uploadInternalChatAttachment(channelId: string, file: File): Promise<InternalChatMessage> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/chat/channels/${channelId}/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  return parseResponse<InternalChatMessage>(res, 'Erro ao enviar anexo');
}

export async function createInternalChatPoll(
  channelId: string,
  data: { question: string; options: string[]; allowMultiple?: boolean; endsAt?: string },
): Promise<InternalChatPoll> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}/polls`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return parseResponse<InternalChatPoll>(res, 'Erro ao criar enquete');
}

export async function listInternalChatPolls(channelId: string): Promise<InternalChatPoll[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}/polls`);
  return parseResponse<InternalChatPoll[]>(res, 'Erro ao listar enquetes');
}

export async function voteInternalChatPoll(channelId: string, pollId: string, optionId: string): Promise<InternalChatPoll> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}/polls/${pollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionId }),
  });

  return parseResponse<InternalChatPoll>(res, 'Erro ao votar na enquete');
}

export async function reactInternalChatMessage(channelId: string, messageId: string, emoji: string) {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}/messages/${messageId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });

  return parseResponse<{ success: boolean; messageId: string; reactions: Array<{ emoji: string; count: number; reactedByMe: boolean }> }>(
    res,
    'Erro ao reagir à mensagem',
  );
}

export async function startInternalChatVideoCall(channelId: string) {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}/video-call`, {
    method: 'POST',
  });

  return parseResponse<{ success: boolean; callSessionId: string; provider: string; meetingUrl: string }>(
    res,
    'Erro ao iniciar chamada de video',
  );
}

export async function deleteInternalChatMessage(channelId: string, messageId: string): Promise<{ success: boolean }> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}/messages/${messageId}`, {
    method: 'DELETE',
  });

  return parseResponse<{ success: boolean }>(res, 'Erro ao deletar mensagem');
}

export async function updateInternalChatMessage(
  channelId: string,
  messageId: string,
  data: { body: string; metadata?: any },
): Promise<InternalChatMessage> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}/messages/${messageId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return parseResponse<InternalChatMessage>(res, 'Erro ao editar mensagem');
}

export async function deleteInternalChatChannel(channelId: string): Promise<{ success: boolean; channelId: string }> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}`, {
    method: 'DELETE',
  });

  return parseResponse<{ success: boolean; channelId: string }>(res, 'Erro ao deletar canal');
}

export async function listInternalChatAttachments(
  channelId: string,
  type?: 'attachment' | 'video' | 'audio',
): Promise<InternalChatAttachment[]> {
  const suffix = type ? `?type=${type}` : '';
  const res = await authenticatedFetch(`${API_BASE_URL}/chat/channels/${channelId}/attachments${suffix}`);
  return parseResponse<InternalChatAttachment[]>(res, 'Erro ao listar anexos');
}

export async function sendInternalChatAudio(channelId: string, audioFile: File): Promise<InternalChatMessage> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', audioFile);

  const res = await fetch(`${API_BASE_URL}/chat/channels/${channelId}/messages/audio`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const responseText = await res.text();

  if (!res.ok) {
    throw new Error(`Erro ${res.status}: ${responseText}`);
  }

  try {
    const message = JSON.parse(responseText) as InternalChatMessage;
    return message;
  } catch (e) {
    throw new Error('Resposta inválida do servidor');
  }
}
