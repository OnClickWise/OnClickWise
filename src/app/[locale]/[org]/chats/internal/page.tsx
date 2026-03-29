"use client";

import * as React from 'react';
import AuthGuard from '@/components/AuthGuard';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getApiOrigin } from '@/lib/api-url';
import { MessageSquare, Plus, Send, Paperclip, Smile, Mic, Video, CheckCircle2, BarChart3, Loader2 } from 'lucide-react';
import {
  createInternalChatChannel,
  createInternalChatPoll,
  InternalChatChannel,
  InternalChatMember,
  InternalChatMessage,
  InternalChatPoll,
  listInternalChatChannels,
  listInternalChatMembers,
  listInternalChatMessages,
  listInternalChatPolls,
  reactInternalChatMessage,
  sendInternalChatMessage,
  startInternalChatVideoCall,
  uploadInternalChatAttachment,
  voteInternalChatPoll,
} from '@/services/internalChatService';
import { disconnectInternalChatSocket, getInternalChatSocket } from '@/services/internalChatSocket';

const EMOJIS = ['😀', '😂', '🔥', '❤️', '👍', '👏', '🎉', '🤝'];

function initials(name?: string | null) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function resolveUploadUrl(path?: string) {
  if (!path) return '#';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${getApiOrigin()}${path}`;
}

export default function InternalChatPage({
  params,
}: {
  params: Promise<{ locale: string; org: string }>;
}) {
  const { locale, org } = React.use(params);

  const [channels, setChannels] = React.useState<InternalChatChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<InternalChatMember[]>([]);
  const [messages, setMessages] = React.useState<InternalChatMessage[]>([]);
  const [polls, setPolls] = React.useState<InternalChatPoll[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [newChannelName, setNewChannelName] = React.useState('');
  const [newMessage, setNewMessage] = React.useState('');
  const [creatingChannel, setCreatingChannel] = React.useState(false);
  const [sendingMessage, setSendingMessage] = React.useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showPollComposer, setShowPollComposer] = React.useState(false);
  const [pollQuestion, setPollQuestion] = React.useState('');
  const [pollOptionsRaw, setPollOptionsRaw] = React.useState('');
  const [recording, setRecording] = React.useState(false);
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);
  const [onlineCount, setOnlineCount] = React.useState(0);

  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const newChannelInputRef = React.useRef<HTMLInputElement | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);

  const selectedChannel = React.useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) || null,
    [channels, selectedChannelId],
  );

  const pollMap = React.useMemo(() => {
    const map: Record<string, InternalChatPoll> = {};
    for (const poll of polls) {
      map[poll.id] = poll;
    }
    return map;
  }, [polls]);

  const loadChannels = React.useCallback(async () => {
    const data = await listInternalChatChannels();
    setChannels(data);

    if (data.length > 0) {
      setSelectedChannelId((current) => current || data[0].id);
    } else {
      setSelectedChannelId(null);
    }
  }, []);

  const loadChannelData = React.useCallback(async (channelId: string) => {
    const [messageData, membersData, pollsData] = await Promise.all([
      listInternalChatMessages(channelId, 80),
      listInternalChatMembers(channelId),
      listInternalChatPolls(channelId),
    ]);

    setMessages(messageData);
    setMembers(membersData);
    setPolls(pollsData);
  }, []);

  React.useEffect(() => {
    const boot = async () => {
      setLoading(true);
      setError(null);

      try {
        await loadChannels();
      } catch (err: any) {
        setError(err?.message || 'Nao foi possivel carregar os canais internos.');
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, [loadChannels]);

  React.useEffect(() => {
    if (!selectedChannelId) {
      setMessages([]);
      setMembers([]);
      setPolls([]);
      return;
    }

    const load = async () => {
      try {
        await loadChannelData(selectedChannelId);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar dados do canal.');
      }
    };

    load();
  }, [selectedChannelId, loadChannelData]);

  React.useEffect(() => {
    const socket = getInternalChatSocket();

    const onMessage = (message: InternalChatMessage) => {
      if (!selectedChannelId || message.channel_id !== selectedChannelId) return;
      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) {
          return current;
        }
        return [...current, message];
      });
    };

    const onTyping = (payload: { channelId: string; userIds: string[] }) => {
      if (!selectedChannelId || payload.channelId !== selectedChannelId) return;
      setTypingUsers(payload.userIds || []);
    };

    const onPresence = (payload: { channelId: string; onlineCount: number }) => {
      if (!selectedChannelId || payload.channelId !== selectedChannelId) return;
      setOnlineCount(payload.onlineCount || 0);
    };

    const onChannelsUpdated = async (payload: { channelId?: string | null; reason?: string }) => {
      try {
        await loadChannels();

        const affectedChannelId = payload?.channelId || selectedChannelId;
        if (affectedChannelId && (affectedChannelId === selectedChannelId || !selectedChannelId)) {
          await loadChannelData(affectedChannelId);
        }
      } catch {
        // noop
      }
    };

    socket.on('message:new', onMessage);
    socket.on('typing:update', onTyping);
    socket.on('presence:update', onPresence);
    socket.on('channels:updated', onChannelsUpdated);

    return () => {
      socket.off('message:new', onMessage);
      socket.off('typing:update', onTyping);
      socket.off('presence:update', onPresence);
      socket.off('channels:updated', onChannelsUpdated);
    };
  }, [selectedChannelId, loadChannels, loadChannelData]);

  React.useEffect(() => {
    if (!selectedChannelId) return;

    const socket = getInternalChatSocket();
    socket.emit('channel:join', { channelId: selectedChannelId });

    return () => {
      socket.emit('channel:leave', { channelId: selectedChannelId });
    };
  }, [selectedChannelId]);

  React.useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        await loadChannels();
      } catch {
        // noop
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadChannels]);

  React.useEffect(() => {
    return () => {
      disconnectInternalChatSocket();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  async function handleCreateChannel() {
    const name = newChannelName.trim();
    if (creatingChannel) return;

    if (!name) {
      setError('Digite o nome do canal para criar.');
      newChannelInputRef.current?.focus();
      return;
    }

    if (name.length < 2) {
      setError('O nome do canal precisa ter pelo menos 2 caracteres.');
      newChannelInputRef.current?.focus();
      return;
    }

    setCreatingChannel(true);
    setError(null);

    try {
      const created = await createInternalChatChannel({ name });
      setNewChannelName('');
      await loadChannels();
      setSelectedChannelId(created.id);
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel criar o canal.');
    } finally {
      setCreatingChannel(false);
    }
  }

  async function handleSendMessage() {
    const body = newMessage.trim();
    if (!body || !selectedChannelId || sendingMessage) return;

    setSendingMessage(true);
    setError(null);

    try {
      const socket = getInternalChatSocket();
      const ack = await socket.emitWithAck('message:send', {
        channelId: selectedChannelId,
        text: body,
      });

      if (ack?.message) {
        setMessages((current) => {
          if (current.some((item) => item.id === ack.message.id)) {
            return current;
          }
          return [...current, ack.message];
        });
      } else {
        const sent = await sendInternalChatMessage(selectedChannelId, body);
        setMessages((current) => [...current, sent]);
      }

      setNewMessage('');
      socket.emit('typing:stop', { channelId: selectedChannelId });
      await loadChannels();
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel enviar a mensagem.');
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedChannelId) return;

    setError(null);
    try {
      const sent = await uploadInternalChatAttachment(selectedChannelId, file);
      setMessages((current) => [...current, sent]);
      await loadChannels();
      await loadChannelData(selectedChannelId);
    } catch (err: any) {
      setError(err?.message || 'Falha ao anexar arquivo.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleStartVideoCall() {
    if (!selectedChannelId) return;

    try {
      const result = await startInternalChatVideoCall(selectedChannelId);
      window.open(result.meetingUrl, '_blank', 'noopener,noreferrer');
      await loadChannelData(selectedChannelId);
      await loadChannels();
    } catch (err: any) {
      setError(err?.message || 'Falha ao iniciar chamada de video.');
    }
  }

  async function handleReact(messageId: string, emoji: string) {
    if (!selectedChannelId) return;

    try {
      await reactInternalChatMessage(selectedChannelId, messageId, emoji);
      await loadChannelData(selectedChannelId);
    } catch (err: any) {
      setError(err?.message || 'Falha ao aplicar reacao.');
    }
  }

  async function handleCreatePoll() {
    if (!selectedChannelId) return;

    const question = pollQuestion.trim();
    const options = pollOptionsRaw
      .split('\n')
      .map((option) => option.trim())
      .filter(Boolean);

    if (!question || options.length < 2) {
      setError('Preencha a pergunta e pelo menos 2 opcoes de enquete.');
      return;
    }

    try {
      await createInternalChatPoll(selectedChannelId, { question, options });
      setPollQuestion('');
      setPollOptionsRaw('');
      setShowPollComposer(false);
      await loadChannelData(selectedChannelId);
      await loadChannels();
    } catch (err: any) {
      setError(err?.message || 'Falha ao criar enquete.');
    }
  }

  async function handleVotePoll(pollId: string, optionId: string) {
    if (!selectedChannelId) return;

    try {
      const poll = await voteInternalChatPoll(selectedChannelId, pollId, optionId);
      setPolls((current) => current.map((item) => (item.id === poll.id ? poll : item)));
    } catch (err: any) {
      setError(err?.message || 'Falha ao votar na enquete.');
    }
  }

  async function handleStartAudioRecord() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          if (!selectedChannelId || recordedChunksRef.current.length === 0) return;

          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
          const sent = await uploadInternalChatAttachment(selectedChannelId, audioFile);
          setMessages((current) => [...current, sent]);
          await loadChannels();
        } catch (err: any) {
          setError(err?.message || 'Falha ao enviar audio.');
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError('Nao foi possivel acessar o microfone.');
    }
  }

  function handleStopAudioRecord() {
    if (!recorderRef.current) return;
    recorderRef.current.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${locale}/${org}/dashboard`}>Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${locale}/${org}/chats/whatsapp`}>Chats</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Interno
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex h-[calc(100vh-4rem)] bg-muted/20">
            <aside className="w-[320px] border-r bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h1 className="text-base font-semibold">Canais internos</h1>
              </div>

              <div className="mb-4 flex gap-2">
                <Input
                  ref={newChannelInputRef}
                  placeholder="Novo canal"
                  value={newChannelName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewChannelName(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      void handleCreateChannel();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => void handleCreateChannel()}
                  disabled={creatingChannel || newChannelName.trim().length < 2}
                  size="icon"
                  title="Criar canal"
                >
                  {creatingChannel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>

              <div className="space-y-2 overflow-y-auto">
                {loading && <p className="text-sm text-muted-foreground">Carregando canais...</p>}

                {!loading && channels.length === 0 && (
                  <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    Nenhum canal criado ainda. Crie o primeiro canal para iniciar o bate-papo interno.
                  </p>
                )}

                {channels.map((channel) => {
                  const active = channel.id === selectedChannelId;

                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => setSelectedChannelId(channel.id)}
                      className={`w-full rounded-md border p-3 text-left transition ${
                        active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">#{channel.slug}</p>
                        <span className="text-xs text-muted-foreground">{channel.members_count || 0} membros</span>
                      </div>
                      {channel.last_message_preview && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">{channel.last_message_preview}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col bg-white">
              {selectedChannel ? (
                <>
                  <div className="flex items-start justify-between border-b px-5 py-3">
                    <div>
                      <h2 className="text-lg font-semibold">#{selectedChannel.slug}</h2>
                      <p className="text-sm text-muted-foreground">{selectedChannel.description || 'Canal interno da organizacao.'}</p>
                      <p className="text-xs text-muted-foreground">{onlineCount} online agora</p>
                    </div>
                    <Button onClick={() => void handleStartVideoCall()} size="sm" className="gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </Button>
                  </div>

                  <div className="flex min-h-0 flex-1">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex-1 space-y-3 overflow-y-auto p-4">
                        {messages.length === 0 && (
                          <p className="text-sm text-muted-foreground">Sem mensagens ainda. Envie a primeira mensagem.</p>
                        )}

                        {typingUsers.length > 0 && (
                          <p className="text-xs text-muted-foreground">Alguem esta digitando...</p>
                        )}

                        {messages.map((message) => {
                          const kind = message.metadata?.kind;
                          const poll = kind === 'poll' ? pollMap[message.metadata?.pollId] : null;
                          const reactions = message.metadata?.reactions || {};

                          return (
                            <div key={message.id} className="rounded-md border border-border/80 p-3">
                              <div className="mb-1 flex items-center justify-between gap-3">
                                <p className="text-sm font-medium">{message.sender_name || 'Usuario'}</p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.created_at).toLocaleString('pt-BR')}
                                </span>
                              </div>

                              <p className="whitespace-pre-wrap text-sm">{message.body}</p>

                              {kind === 'attachment' && message.metadata?.fileUrl && (
                                <a
                                  href={resolveUploadUrl(message.metadata.fileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
                                >
                                  Abrir arquivo: {message.metadata.filename || 'anexo'}
                                </a>
                              )}

                              {kind === 'audio' && message.metadata?.fileUrl && (
                                <audio className="mt-2 w-full" controls src={resolveUploadUrl(message.metadata.fileUrl)} />
                              )}

                              {kind === 'video_call' && message.metadata?.meetingUrl && (
                                <a
                                  href={message.metadata.meetingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                                >
                                  <Video className="h-4 w-4" /> Entrar na chamada
                                </a>
                              )}

                              {poll && (
                                <div className="mt-2 rounded-md border bg-muted/30 p-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    <p className="text-sm font-semibold">{poll.question}</p>
                                  </div>
                                  <div className="space-y-2">
                                    {poll.options.map((option: any) => (
                                      <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => void handleVotePoll(poll.id, option.id)}
                                        className={`flex w-full items-center justify-between rounded border px-3 py-2 text-sm ${
                                          option.votedByMe ? 'border-green-500 bg-green-50' : 'border-border bg-white'
                                        }`}
                                      >
                                        <span className="flex items-center gap-2">
                                          {option.votedByMe && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                          {option.label}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{option.votes} votos</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="mt-2 flex flex-wrap gap-1">
                                {Object.entries(reactions).map(([emoji, users]) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => void handleReact(message.id, emoji)}
                                    className="rounded-full border px-2 py-0.5 text-xs"
                                  >
                                    {emoji} {Array.isArray(users) ? users.length : 0}
                                  </button>
                                ))}
                                {EMOJIS.slice(0, 4).map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => void handleReact(message.id, emoji)}
                                    className="rounded-full border px-2 py-0.5 text-xs"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t p-3">
                        <div className="mb-2 flex flex-wrap gap-2">
                          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />

                          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                            <Paperclip className="h-4 w-4" /> Arquivo
                          </Button>

                          <Button
                            size="sm"
                            variant={recording ? 'destructive' : 'outline'}
                            onClick={() => (recording ? handleStopAudioRecord() : void handleStartAudioRecord())}
                            className="gap-2"
                          >
                            <Mic className="h-4 w-4" /> {recording ? 'Parar gravacao' : 'Gravar audio'}
                          </Button>

                          <Button size="sm" variant="outline" onClick={() => setShowEmojiPicker((v) => !v)} className="gap-2">
                            <Smile className="h-4 w-4" /> Emoji
                          </Button>

                          <Button size="sm" variant="outline" onClick={() => setShowPollComposer((v) => !v)} className="gap-2">
                            <BarChart3 className="h-4 w-4" /> Enquete
                          </Button>
                        </div>

                        {showEmojiPicker && (
                          <div className="mb-2 flex flex-wrap gap-1 rounded border p-2">
                            {EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => setNewMessage((current) => `${current}${emoji}`)}
                                className="rounded border px-2 py-1 text-sm"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {showPollComposer && (
                          <div className="mb-2 rounded border p-3">
                            <p className="mb-2 text-sm font-medium">Nova enquete</p>
                            <Input
                              value={pollQuestion}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPollQuestion(e.target.value)}
                              placeholder="Pergunta da enquete"
                              className="mb-2"
                            />
                            <textarea
                              value={pollOptionsRaw}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPollOptionsRaw(e.target.value)}
                              placeholder={'Uma opcao por linha\nExemplo:\nSim\nNao'}
                              className="mb-2 min-h-[90px] w-full rounded border px-3 py-2 text-sm"
                            />
                            <Button size="sm" onClick={() => void handleCreatePoll()}>
                              Criar enquete
                            </Button>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input
                            placeholder="Digite uma mensagem"
                            value={newMessage}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const value = e.target.value;
                              setNewMessage(value);

                              if (!selectedChannelId) return;
                              const socket = getInternalChatSocket();

                              if (value.trim().length > 0) {
                                socket.emit('typing:start', { channelId: selectedChannelId });

                                if (typingTimeoutRef.current) {
                                  clearTimeout(typingTimeoutRef.current);
                                }

                                typingTimeoutRef.current = setTimeout(() => {
                                  socket.emit('typing:stop', { channelId: selectedChannelId });
                                }, 1200);
                              } else {
                                socket.emit('typing:stop', { channelId: selectedChannelId });
                              }
                            }}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                void handleSendMessage();
                              }
                            }}
                          />
                          <Button onClick={() => void handleSendMessage()} disabled={sendingMessage} size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <aside className="w-[260px] border-l bg-muted/10 p-4">
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Membros</h3>
                      <div className="space-y-2">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center gap-2 rounded-md border bg-white p-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{initials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{member.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                        ))}

                        {members.length === 0 && (
                          <p className="text-sm text-muted-foreground">Sem membros visiveis.</p>
                        )}
                      </div>
                    </aside>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-6 text-center text-muted-foreground">
                  Selecione um canal para ver as mensagens.
                </div>
              )}
            </main>
          </div>

          {error && (
            <div className="fixed bottom-4 right-4 max-w-md rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
