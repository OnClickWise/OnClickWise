"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AuthGuard from '@/components/AuthGuard';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Bell,
  BellOff,
  Volume2,
  Search,
  Settings,
  Phone,
  MoreVertical,
  UserPlus,
  Folder,
  Archive,
  User,
  LogOut,
  Compass,
  Plus,
  Send,
  Paperclip,
  Smile,
  Mic,
  Video,
  BarChart3,
  CheckCircle2,
  Palette,
  X,
  Loader2,
} from 'lucide-react';
import { getCurrentUser } from '@/services/authService';
import { AudioPlayerCustom } from './AudioPlayerCustom';
import {
  addInternalChatChannelMember,
  createInternalChatChannel,
  createInternalChatPoll,
  deleteInternalChatChannel,
  deleteInternalChatMessage,
  InternalChatAttachment,
  InternalChatChannel,
  InternalChatMember,
  InternalChatMessage,
  InternalChatPoll,
  InternalChatUser,
  listInternalChatAttachments,
  listInternalChatChannels,
  listInternalChatMembers,
  listInternalChatMessages,
  listInternalChatOrganizationUsers,
  listInternalChatPolls,
  reactInternalChatMessage,
  sendInternalChatAudio,
  sendInternalChatMessage,
  startInternalChatVideoCall,
  updateInternalChatMessage,
  uploadInternalChatAttachment,
  voteInternalChatPoll,
} from '@/services/internalChatService';
import {
  disconnectInternalChatSocket,
  getInternalChatSocket,
  isInternalChatSocketConnected,
} from '@/services/internalChatSocket';
import { getApiOrigin } from '@/lib/api-url';

const EMOJIS = ['😀', '😂', '🔥', '❤️', '👍', '👏', '🎉', '🤝'];
const ACCENT_COLORS = ['#facc15', '#3b82f6', '#000000', '#ffffff'];
const WALLPAPERS = ['plain', 'dots', 'waves'] as const;
const CHAT_SOUND_PRESETS = ['classic', 'soft', 'double', 'digital'] as const;
const MAX_CHAT_FILE_SIZE = 20 * 1024 * 1024;

type WallpaperKind = (typeof WALLPAPERS)[number];
type ChatTab = 'general' | 'direct' | 'group';
type ChatSoundPreset = (typeof CHAT_SOUND_PRESETS)[number];
type NotificationMode = 'off' | 'closed' | 'always';

type InternalChatWidgetProps = {
  mode?: 'floating' | 'page';
  initialOpen?: boolean;
};

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

function wallpaperStyle(kind: WallpaperKind, accentColor: string, isDark: boolean): React.CSSProperties {
  const base = isDark ? '#0a0a0a' : '#f8fafc';

  if (kind === 'dots') {
    return {
      backgroundColor: base,
      backgroundImage: `radial-gradient(${accentColor}${isDark ? '33' : '22'} 1px, transparent 1px)`,
      backgroundSize: '14px 14px',
    };
  }

  if (kind === 'waves') {
    return {
      backgroundColor: base,
      backgroundImage: `repeating-linear-gradient(45deg, ${accentColor}${isDark ? '24' : '14'}, ${accentColor}${isDark ? '24' : '14'} 10px, transparent 10px, transparent 20px)`,
    };
  }

  return {
    background: isDark
      ? 'linear-gradient(180deg, #050505 0%, #111111 100%)'
      : 'linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)',
  };
}

export function InternalChatWidget({ mode = 'floating', initialOpen = false }: InternalChatWidgetProps) {
  const isPageMode = mode === 'page';
  const router = useRouter();
  const params = useParams();
  const org = typeof params?.org === 'string' ? params.org : '';
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [channels, setChannels] = React.useState<InternalChatChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<InternalChatMember[]>([]);
  const [membersByChannel, setMembersByChannel] = React.useState<Record<string, InternalChatMember[]>>({});
  const [messages, setMessages] = React.useState<InternalChatMessage[]>([]);
  const [polls, setPolls] = React.useState<InternalChatPoll[]>([]);
  const [organizationUsers, setOrganizationUsers] = React.useState<InternalChatUser[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  const [userSearch, setUserSearch] = React.useState('');
  const [creatingDirectChat, setCreatingDirectChat] = React.useState(false);
  const [showGroupComposer, setShowGroupComposer] = React.useState(false);
  const [groupName, setGroupName] = React.useState('');
  const [groupUserIds, setGroupUserIds] = React.useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = React.useState(false);

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
  const [socketStatus, setSocketStatus] = React.useState<'connecting' | 'connected' | 'reconnecting' | 'disconnected'>('connecting');

  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const [editingMessageBody, setEditingMessageBody] = React.useState('');
  const [renderingForDelete, setRenderingForDelete] = React.useState<string | null>(null);
  const [showChannelMenu, setShowChannelMenu] = React.useState(false);

  const [attachments, setAttachments] = React.useState<InternalChatAttachment[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = React.useState(false);
  const [selectedNewMemberId, setSelectedNewMemberId] = React.useState<string | null>(null);
  const [addingMember, setAddingMember] = React.useState(false);

  const [showAppearanceSettings, setShowAppearanceSettings] = React.useState(false);
  const [accentColor, setAccentColor] = React.useState('#facc15');
  const [wallpaper, setWallpaper] = React.useState<WallpaperKind>('dots');
  const [activeTab, setActiveTab] = React.useState<ChatTab>('direct');
  const [showRightPanelFilesTab, setShowRightPanelFilesTab] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(isPageMode || initialOpen);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [showNotificationSettings, setShowNotificationSettings] = React.useState(false);
  const [notificationMode, setNotificationMode] = React.useState<NotificationMode>('closed');
  const [soundPreset, setSoundPreset] = React.useState<ChatSoundPreset>('classic');

  const ui = React.useMemo(
    () => ({
      brandYellow: '#facc15',
      brandBlue: '#3b82f6',
      brandBlack: '#000000',
      brandWhite: '#ffffff',
      shellBg: isDark ? '#000000' : '#ffffff',
      sectionBg: isDark ? '#0b0b0b' : '#ffffff',
      sectionSoft: isDark ? '#111111' : '#f9fafb',
      border: isDark ? '#27272a' : '#e5e7eb',
      text: isDark ? '#ffffff' : '#000000',
      muted: isDark ? '#a1a1aa' : '#6b7280',
      bubbleMeBg: isDark ? '#3b82f622' : '#3b82f6',
      bubbleMeBorder: '#3b82f6',
      bubbleOtherBg: isDark ? '#0f0f10' : '#f3f4f6',
      bubbleOtherBorder: isDark ? '#26272b' : '#e5e7eb',
    }),
    [isDark],
  );

  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const newChannelInputRef = React.useRef<HTMLInputElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const selectedChannel = React.useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) || null,
    [channels, selectedChannelId],
  );

  const filteredUsers = React.useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    return organizationUsers
      .filter((user) => user.id !== currentUserId)
      .filter((user) => {
        if (!search) return true;
        return user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
      })
      .slice(0, 30);
  }, [organizationUsers, currentUserId, userSearch]);

  const selectedChannelLabel = React.useMemo(() => {
    if (!selectedChannel) return null;
    return selectedChannel.name || (selectedChannel.slug === 'geral' ? 'Geral' : selectedChannel.slug);
  }, [selectedChannel]);

  const channelBuckets = React.useMemo(() => {
    const isGeneral = (channel: InternalChatChannel) => channel.slug === 'geral';
    const isDirect = (channel: InternalChatChannel) => {
      if (!channel.is_private) return false;
      if (channel.members_count <= 2) return true;
      const name = (channel.name || '').toLowerCase();
      return name.includes('conversa com');
    };

    return {
      general: channels.filter((channel) => isGeneral(channel)),
      direct: channels.filter((channel) => !isGeneral(channel) && isDirect(channel)),
      group: channels.filter((channel) => !isGeneral(channel) && !isDirect(channel)),
    };
  }, [channels]);

  const visibleChannels = React.useMemo(() => {
    if (activeTab === 'general') return channelBuckets.general;
    if (activeTab === 'group') return channelBuckets.group;
    return channelBuckets.direct;
  }, [activeTab, channelBuckets]);

  const pollMap = React.useMemo(() => {
    const map: Record<string, InternalChatPoll> = {};
    for (const poll of polls) {
      map[poll.id] = poll;
    }
    return map;
  }, [polls]);

  const visibleMessages = React.useMemo(() => {
    const seen = new Set<string>();
    const deduped: InternalChatMessage[] = [];

    for (const message of messages) {
      if (!message?.id || seen.has(message.id)) continue;
      seen.add(message.id);
      deduped.push(message);
    }

    return deduped;
  }, [messages]);

  const getUserScopedKey = React.useCallback(
    (name: 'open' | 'unread' | 'sound' | 'notifyMode' | 'soundPreset') => `internal-chat:${name}:${currentUserId || 'anonymous'}`,
    [currentUserId],
  );

  const playNotificationSound = React.useCallback((preset: ChatSoundPreset) => {
    if (typeof window === 'undefined') return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const beep = (frequency: number, start: number, duration: number, gain: number, type: OscillatorType) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.0001;

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.exponentialRampToValueAtTime(gain, start + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        oscillator.start(start);
        oscillator.stop(start + duration + 0.01);
      };

      const now = audioContext.currentTime;
      if (preset === 'soft') {
        beep(640, now, 0.18, 0.02, 'sine');
      } else if (preset === 'double') {
        beep(700, now, 0.12, 0.03, 'triangle');
        beep(930, now + 0.14, 0.14, 0.035, 'triangle');
      } else if (preset === 'digital') {
        beep(880, now, 0.08, 0.035, 'square');
        beep(1120, now + 0.09, 0.08, 0.03, 'square');
      } else {
        beep(920, now, 0.2, 0.04, 'sine');
      }

      setTimeout(() => {
        void audioContext.close();
      }, 500);
    } catch {
      // Em alguns navegadores, o som pode depender de gesto prévio do usuário.
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('internal-chat-appearance');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { accentColor?: string; wallpaper?: WallpaperKind };
      if (parsed.accentColor) setAccentColor(parsed.accentColor);
      if (parsed.wallpaper && WALLPAPERS.includes(parsed.wallpaper)) setWallpaper(parsed.wallpaper);
    } catch {
      // noop
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('internal-chat-appearance', JSON.stringify({ accentColor, wallpaper }));
  }, [accentColor, wallpaper]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || isPageMode || !currentUserId) return;

    const savedOpen = localStorage.getItem(getUserScopedKey('open'));
    const savedUnread = localStorage.getItem(getUserScopedKey('unread'));
    const savedSound = localStorage.getItem(getUserScopedKey('sound'));
    const savedNotifyMode = localStorage.getItem(getUserScopedKey('notifyMode'));
    const savedSoundPreset = localStorage.getItem(getUserScopedKey('soundPreset'));

    if (savedOpen !== null) {
      setIsOpen(savedOpen === '1');
    }

    if (savedUnread !== null) {
      const parsed = Number(savedUnread);
      if (Number.isFinite(parsed) && parsed >= 0) {
        setUnreadCount(parsed);
      }
    }

    if (savedNotifyMode === 'off' || savedNotifyMode === 'closed' || savedNotifyMode === 'always') {
      setNotificationMode(savedNotifyMode);
    } else if (savedSound !== null) {
      // Compatibilidade com versão anterior que só tinha ligado/desligado.
      setNotificationMode(savedSound === '1' ? 'closed' : 'off');
    }

    if (
      savedSoundPreset === 'classic' ||
      savedSoundPreset === 'soft' ||
      savedSoundPreset === 'double' ||
      savedSoundPreset === 'digital'
    ) {
      setSoundPreset(savedSoundPreset);
    }
  }, [isPageMode, currentUserId, getUserScopedKey]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || isPageMode || !currentUserId) return;
    localStorage.setItem(getUserScopedKey('open'), isOpen ? '1' : '0');
  }, [isOpen, isPageMode, currentUserId, getUserScopedKey]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || isPageMode || !currentUserId) return;
    localStorage.setItem(getUserScopedKey('unread'), String(unreadCount));
  }, [unreadCount, isPageMode, currentUserId, getUserScopedKey]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || isPageMode || !currentUserId) return;
    localStorage.setItem(getUserScopedKey('notifyMode'), notificationMode);
    localStorage.setItem(getUserScopedKey('sound'), notificationMode === 'off' ? '0' : '1');
  }, [notificationMode, isPageMode, currentUserId, getUserScopedKey]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || isPageMode || !currentUserId) return;
    localStorage.setItem(getUserScopedKey('soundPreset'), soundPreset);
  }, [soundPreset, isPageMode, currentUserId, getUserScopedKey]);

  const loadChannels = React.useCallback(async () => {
    const data = await listInternalChatChannels();
    setChannels(data);

    if (data.length > 0) {
      setSelectedChannelId((current) => current || data[0].id);
    } else {
      setSelectedChannelId(null);
    }

    return data;
  }, []);

  const loadChannelData = React.useCallback(async (channelId: string) => {
    const [messageData, membersData, pollsData, attachmentsData] = await Promise.all([
      listInternalChatMessages(channelId, 80),
      listInternalChatMembers(channelId),
      listInternalChatPolls(channelId).catch(() => []),
      listInternalChatAttachments(channelId).catch(() => []),
    ]);

    setMessages(messageData);
    setMembers(membersData);
    setMembersByChannel((current) => ({ ...current, [channelId]: membersData }));
    setPolls(pollsData);
    setAttachments(attachmentsData);
  }, []);

  const ensureGeneralChannel = React.useCallback(async (users: InternalChatUser[]) => {
    let data = await loadChannels();
    let general = data.find((channel) => channel.slug === 'geral');

    if (!general) {
      try {
        general = await createInternalChatChannel({
          name: 'Geral',
          description: 'Canal geral da organização',
          isPrivate: false,
        });
        data = await loadChannels();
      } catch {
        data = await loadChannels();
        general = data.find((channel) => channel.slug === 'geral');
      }
    }

    if (!general) return;

    setSelectedChannelId((current) => current || general.id);

    try {
      const membersData = await listInternalChatMembers(general.id);
      const memberIds = new Set(membersData.map((item) => item.user_id));
      const missingUsers = users.filter((user) => !memberIds.has(user.id));

      missingUsers.forEach((user) => {
        void addInternalChatChannelMember(general.id, { userId: user.id, role: 'member' }).catch(() => {});
      });
    } catch {
      // Se o usuário não puder gerenciar membros, o chat ainda funciona para ele.
    }
  }, [loadChannels]);

  async function handleOpenDirectChat(targetUser: InternalChatUser) {
    if (!currentUserId || creatingDirectChat) return;

    setCreatingDirectChat(true);
    setError(null);

    try {
      for (const channel of channels) {
        if (!channel.is_private || channel.members_count !== 2) continue;

        let memberList = membersByChannel[channel.id];
        if (!memberList) {
          memberList = await listInternalChatMembers(channel.id);
          setMembersByChannel((current) => ({ ...current, [channel.id]: memberList || [] }));
        }

        const ids = new Set((memberList || []).map((member) => member.user_id));
        if (ids.has(currentUserId) && ids.has(targetUser.id) && ids.size === 2) {
          setSelectedChannelId(channel.id);
          return;
        }
      }

      const created = await createInternalChatChannel({
        name: `Conversa com ${targetUser.name}`,
        description: 'Conversa individual',
        isPrivate: true,
      });

      await addInternalChatChannelMember(created.id, { userId: targetUser.id, role: 'member' });
      await loadChannels();
      setSelectedChannelId(created.id);
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel abrir conversa individual.');
    } finally {
      setCreatingDirectChat(false);
    }
  }

  async function handleCreateGroupChannel() {
    const name = groupName.trim();
    if (!name || groupUserIds.length === 0 || creatingGroup) {
      setError('Informe o nome do grupo e selecione pelo menos 1 membro.');
      return;
    }

    setCreatingGroup(true);
    setError(null);

    try {
      const created = await createInternalChatChannel({
        name,
        description: 'Grupo interno',
        isPrivate: true,
      });

      await Promise.all(
        groupUserIds.map((userId) => addInternalChatChannelMember(created.id, { userId, role: 'member' }).catch(() => null)),
      );

      setGroupName('');
      setGroupUserIds([]);
      setShowGroupComposer(false);
      await loadChannels();
      setSelectedChannelId(created.id);
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel criar o grupo.');
    } finally {
      setCreatingGroup(false);
    }
  }

  React.useEffect(() => {
    const boot = async () => {
      setLoading(true);
      setError(null);

      try {
        const [currentUser, users] = await Promise.all([
          getCurrentUser().catch(() => null),
          listInternalChatOrganizationUsers(true).catch(() => []),
        ]);

        if (currentUser?.id) {
          setCurrentUserId(currentUser.id);
        }

        setOrganizationUsers(users);
        await ensureGeneralChannel(users);
      } catch (err: any) {
        setError(err?.message || 'Nao foi possivel carregar os canais internos.');
      } finally {
        setLoading(false);
      }
    };

    void boot();
  }, [ensureGeneralChannel]);

  React.useEffect(() => {
    if (!selectedChannelId) {
      setMessages([]);
      setMembers([]);
      setPolls([]);
      return;
    }

    void loadChannelData(selectedChannelId).catch((err: any) => {
      setError(err?.message || 'Erro ao carregar dados do canal.');
    });
  }, [selectedChannelId, loadChannelData]);

  React.useEffect(() => {
    const socket = getInternalChatSocket();

    const onMessage = (message: InternalChatMessage) => {
      const incomingFromAnotherUser = message.sender_user_id !== currentUserId;
      const shouldCountUnread = !isPageMode && incomingFromAnotherUser && (!isOpen || message.channel_id !== selectedChannelId);
      const shouldNotifySound =
        incomingFromAnotherUser &&
        (notificationMode === 'always' ||
          (notificationMode === 'closed' && !isPageMode && (!isOpen || message.channel_id !== selectedChannelId)));

      if (shouldCountUnread) {
        setUnreadCount((current) => current + 1);
      }

      if (shouldNotifySound) {
        playNotificationSound(soundPreset);
      }

      if (!selectedChannelId || message.channel_id !== selectedChannelId) return;
      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) return current;
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

    const onChannelsUpdated = async (payload: { channelId?: string | null }) => {
      await loadChannels();
      const affectedChannelId = payload?.channelId || selectedChannelId;
      if (affectedChannelId) {
        await loadChannelData(affectedChannelId);
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
  }, [selectedChannelId, loadChannels, loadChannelData, isOpen, isPageMode, currentUserId, notificationMode, soundPreset, playNotificationSound]);

  React.useEffect(() => {
    if (isPageMode) return;
    if (isOpen && unreadCount > 0) {
      setUnreadCount(0);
    }
  }, [isOpen, unreadCount, isPageMode]);

  React.useEffect(() => {
    const socket = getInternalChatSocket();

    const onConnect = () => setSocketStatus('connected');
    const onDisconnect = () => setSocketStatus('disconnected');
    const onReconnectAttempt = () => setSocketStatus('reconnecting');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);

    if (socket.connected) {
      setSocketStatus('connected');
    } else {
      setSocketStatus('connecting');
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
    };
  }, []);

  React.useEffect(() => {
    if (!selectedChannelId) return;

    const socket = getInternalChatSocket();

    const joinChannel = () => {
      socket.emit('channel:join', { channelId: selectedChannelId });
    };

    if (isInternalChatSocketConnected()) {
      joinChannel();
    } else {
      socket.connect();
    }

    const onConnect = () => joinChannel();

    socket.on('connect', onConnect);
    socket.on('reconnect', onConnect);

    return () => {
      socket.emit('channel:leave', { channelId: selectedChannelId });
      socket.off('connect', onConnect);
      socket.off('reconnect', onConnect);
    };
  }, [selectedChannelId]);

  React.useEffect(() => {
    return () => {
      disconnectInternalChatSocket();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChannelId, scrollToBottom]);

  async function handleCreateChannel() {
    const name = newChannelName.trim();
    if (creatingChannel) return;

    if (!name || name.length < 2) {
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
      if (!socket.connected) {
        socket.connect();
      }

      const ack = await socket
        .timeout(7000)
        .emitWithAck('message:send', {
          channelId: selectedChannelId,
          text: body,
        })
        .catch(() => null);

      if (ack?.message) {
        setMessages((current) => {
          if (current.some((item) => item.id === ack.message.id)) return current;
          return [...current, ack.message];
        });
      } else {
        const sent = await sendInternalChatMessage(selectedChannelId, body);
        setMessages((current) => {
          if (current.some((item) => item.id === sent.id)) return current;
          return [...current, sent];
        });
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

    if (file.size > MAX_CHAT_FILE_SIZE) {
      setError('Arquivo acima do limite de 20MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError(null);
    try {
      const sent = await uploadInternalChatAttachment(selectedChannelId, file);
      setMessages((current) => [...current, sent]);
      await loadChannels();
      await loadChannelData(selectedChannelId);
    } catch (err: any) {
      setError(err?.message || 'Falha ao anexar arquivo.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  async function handleDeleteMessage(messageId: string) {
    if (!selectedChannelId) return;

    try {
      await deleteInternalChatMessage(selectedChannelId, messageId);
      await loadChannelData(selectedChannelId);
      await loadChannels();
    } catch (err: any) {
      setError(err?.message || 'Falha ao deletar mensagem.');
    }
  }

  async function handleUpdateMessage(messageId: string, newBody: string) {
    if (!selectedChannelId) return;

    try {
      const updated = await updateInternalChatMessage(selectedChannelId, messageId, { body: newBody });
      setMessages((current) =>
        current.map((msg) => (msg.id === messageId ? updated : msg))
      );
      setEditingMessageId(null);
      setEditingMessageBody('');
    } catch (err: any) {
      setError(err?.message || 'Falha ao editar mensagem.');
    }
  }

  async function handleDeleteChannel(channelId: string) {
    try {
      await deleteInternalChatChannel(channelId);
      setSelectedChannelId(null);
      await loadChannels();
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Falha ao deletar canal.');
    }
  }

  async function handleAddMember() {
    if (!selectedChannelId || !selectedNewMemberId) return;

    setAddingMember(true);
    setError(null);

    try {
      await addInternalChatChannelMember(selectedChannelId, {
        userId: selectedNewMemberId,
        role: 'member',
      });
      await loadChannelData(selectedChannelId);
      setShowAddMemberModal(false);
      setSelectedNewMemberId(null);
    } catch (err: any) {
      setError(err?.message || 'Falha ao adicionar membro.');
    } finally {
      setAddingMember(false);
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
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Browser não suporta gravação de áudio.');
      return;
    }

    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      
      const audioChunks: BlobPart[] = [];
      let chunkCount = 0;

      mediaRecorder.ondataavailable = (event) => {
        chunkCount++;
        audioChunks.push(event.data);
      };

      mediaRecorder.onerror = (event) => {
        console.error('🎙️ ❌ MediaRecorder Error:', event.error);
        setError(`Erro no gravador: ${event.error}`);
      };

      mediaRecorder.onstop = async () => {
        
        try {
          if (!selectedChannelId) {
            console.error('🎙️ ❌ selectedChannelId não disponível');
            setError('Nenhum canal selecionado');
            return;
          }

          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          
          if (audioBlob.size === 0) {
            console.error('🎙️ ❌ Blob está vazio!');
            setError('Nenhum áudio foi gravado');
            return;
          }

          const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
          const message = await sendInternalChatAudio(selectedChannelId, audioFile);
          
          setMessages((prev) => [...prev, message]);
          await loadChannels();
        } catch (err: any) {
          console.error('🎙️ ❌ Erro no onstop:', err);
          setError(err?.message || 'Erro ao enviar áudio');
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      recorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setRecording(true);
    } catch (error: any) {
      console.error('🎙️ ❌ Erro ao iniciar gravação:', error);
      const errorName = error?.name || '';
      if (errorName.includes('NotAllowed')) {
        setError(
          'Microfone bloqueado. Vá em:\n' +
          '1. Chrome → Configurações\n' +
          '2. Privacidade → Permissões\n' +
          '3. Microfone → Remova localhost:3001 da lista de bloqueados\n' +
          '4. Recarregue a página (Ctrl+Shift+R)'
        );
      } else if (errorName.includes('NotFound')) {
        setError('Nenhum microfone encontrado. Conecte um microfone.');
      } else {
        setError(`Erro: ${error?.message || 'Desconhecido'}`);
      }
    }
  }

  function handleStopAudioRecord() {
    if (!recorderRef.current) return;
    recorderRef.current.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  const handleAudioToggle = () => {
    if (recording) {
      handleStopAudioRecord();
    } else {
      handleStartAudioRecord().catch((err) => {
        console.error('❌ Erro ao iniciar gravação:', err);
      });
    }
  }

  const recentFiles = React.useMemo(() => {
    const attachments = visibleMessages
      .filter((msg) => msg?.metadata?.kind === 'attachment' || msg?.metadata?.kind === 'audio')
      .filter((msg) => msg?.metadata?.fileUrl)
      .slice(-6)
      .reverse();
    return attachments;
  }, [visibleMessages]);



  if (isPageMode) {
    return (
      <AuthGuard orgSlug={org}>
        <SidebarProvider>
          <AppSidebar org={org} />
          <SidebarInset>
            {/* Header Superior Padrão (Breadcrumb) */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Mensagens</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>

            {/* CONTAINER PRINCIPAL DO CHAT */}
            <div
              className="flex h-[calc(100vh-4rem)] w-full overflow-hidden"
              style={{
                backgroundColor: ui.sectionBg,
              }}
            >
              
              {/* COLUNA 1: ESQUERDA (Lista de Canais) */}
              <aside
                className="flex h-full w-[320px] shrink-0 flex-col border-r border-border"
                style={{
                  backgroundColor: ui.sectionSoft,
                  borderColor: ui.border,
                }}
              >
                {/* Header / Busca Fixos */}
                <div
                  className="shrink-0 space-y-3 p-4"
                  style={{
                    borderBottom: `1px solid ${ui.border}`,
                    backgroundColor: ui.sectionSoft,
                  }}
                >
                  <h1 className="text-xl font-bold" style={{ color: ui.text }}>Mensagens</h1>
                  <Input
                    placeholder="Buscar contatos..."
                    value={userSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserSearch(e.target.value)}
                    style={{ borderColor: ui.border, backgroundColor: ui.sectionBg, color: ui.text }}
                    className="h-10 rounded-xl border text-sm"
                  />
                </div>
                
                {/* Lista com Scroll Independente */}
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
                  {/* Tabs */}
                  <div className="flex gap-2">
                    {(['general', 'direct', 'group'] as ChatTab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                          backgroundColor: activeTab === tab ? ui.brandYellow : ui.sectionBg,
                          color: activeTab === tab ? ui.brandBlack : ui.muted,
                        }}
                        className="rounded-full px-3 py-1 text-xs font-medium transition border"
                      >
                        {tab === 'general' ? 'Geral' : tab === 'direct' ? 'Diretas' : 'Grupos'}
                      </button>
                    ))}
                  </div>

                  {/* Usuários / Canais */}
                  {activeTab === 'direct' ? (
                    <div className="space-y-2">
                      <p className="text-xs px-2" style={{ color: ui.muted }}>Contatos</p>
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            const directChannel = channels.find(
                              (ch) => ch.is_private && ch.members_count <= 2
                            );
                            if (directChannel) {
                              setSelectedChannelId(directChannel.id);
                            } else {
                              void handleOpenDirectChat(user);
                            }
                          }}
                          className="w-full rounded-2xl border p-3 text-left text-sm transition hover:opacity-80"
                          style={{
                            borderColor: ui.border,
                            backgroundColor: ui.sectionBg,
                            color: ui.text,
                          }}
                        >
                          <p className="truncate font-medium">{user.name}</p>
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-xs text-center py-4" style={{ color: ui.muted }}>Nenhum contato encontrado</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {visibleChannels.map((channel) => {
                        const active = channel.id === selectedChannelId;
                        return (
                          <button
                            key={channel.id}
                            type="button"
                            onClick={() => setSelectedChannelId(channel.id)}
                            className="w-full rounded-2xl border p-3 text-left text-sm transition"
                            style={{
                              borderColor: active ? ui.muted : ui.border,
                              backgroundColor: active ? ui.sectionBg : ui.sectionSoft,
                              color: ui.text,
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate font-semibold">{channel.name || channel.slug}</p>
                              <span className="shrink-0" style={{ color: ui.muted }}>{channel.members_count || 0}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Rodapé (Criar novo canal) Fixo */}
                <div
                  className="shrink-0 p-4"
                  style={{
                    borderTop: `1px solid ${ui.border}`,
                    backgroundColor: ui.sectionSoft,
                  }}
                >
                  <div className="flex gap-2">
                    <Input
                      ref={newChannelInputRef}
                      placeholder="Novo canal"
                      value={newChannelName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewChannelName(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') void handleCreateChannel();
                      }}
                      className="text-sm"
                    />
                    <Button type="button" onClick={() => void handleCreateChannel()} disabled={creatingChannel || newChannelName.trim().length < 2} size="icon" className="h-10 w-10">
                      {creatingChannel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </aside>

              {/* COLUNA 2: CENTRO (Mensagens) */}
              <main
                className="relative flex h-full min-w-0 flex-1 flex-col"
                style={{ backgroundColor: ui.sectionBg, color: ui.text }}
              >
                {selectedChannel ? (
                  <>
                    {/* Header do Canal Fixo */}
                    <div
                      className="shrink-0 border-b p-4"
                      style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft }}
                    >
                      <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold" style={{ color: ui.text }}>{selectedChannelLabel}</h2>
                        <p className="text-sm" style={{ color: ui.muted }}>{members.length || 0} membros, {onlineCount || 0} online</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" onClick={() => void handleStartVideoCall()} style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft, color: ui.text }}>
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => setShowAppearanceSettings((v) => !v)} style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft, color: ui.text }}>
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                      </div>
                    </div>
                    
                    {/* Área de Mensagens com Scroll Independente */}
                    <div
                      className="flex-1 overflow-y-auto py-3"
                      style={{
                        backgroundColor: ui.sectionBg,
                      }}
                    >
                      <div className="max-w-4xl mx-auto w-full flex flex-col space-y-4 px-4">
                        {loading && <p className="text-sm text-center" style={{ color: ui.muted }}>Carregando mensagens...</p>}
                        {!loading && visibleMessages.length === 0 && <p className="text-sm text-center mt-4" style={{ color: ui.muted }}>Sem mensagens ainda. Envie a primeira mensagem.</p>}

                        {visibleMessages.map((message) => {
                          const kind = message.metadata?.kind;
                          const poll = kind === 'poll' ? pollMap[message.metadata?.pollId] : null;
                          const reactions = message.metadata?.reactions || {};
                          const isMine = message.sender_user_id === currentUserId;

                          return (
                            <div
                              key={message.id}
                              className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`flex flex-col group relative max-w-[85%] md:max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                                
                                {/* Header da Mensagem (Nome e Hora) */}
                                <div className={`flex items-center gap-2 mb-1 px-1 text-[11px] ${isMine ? 'flex-row-reverse' : ''}`}>
                                  <span className="font-semibold" style={{ color: ui.text }}>{message.sender_name || 'Usuário'}</span>
                                  <span style={{ color: ui.muted }}>
                                    {new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                {/* Balão de Mensagem */}
                                <div
                                  className={`px-4 py-2.5 shadow-sm relative text-sm leading-relaxed rounded-2xl ${
                                    isMine
                                      ? 'rounded-tr-sm'
                                      : 'rounded-tl-sm border'
                                  }`}
                                  style={{
                                    backgroundColor: isMine ? ui.bubbleMeBg : ui.bubbleOtherBg,
                                    borderColor: isMine ? ui.bubbleMeBorder : ui.bubbleOtherBorder,
                                    color: ui.text,
                                  }}
                                >
                                  {editingMessageId === message.id ? (
                                    <div className="flex gap-2 w-full">
                                      <input
                                        type="text"
                                        value={editingMessageBody}
                                        onChange={(e) => setEditingMessageBody(e.target.value)}
                                        className="flex-1 rounded border px-2 py-1 text-sm"
                                        style={{ borderColor: ui.border, backgroundColor: isDark ? ui.sectionBg : ui.brandWhite, color: ui.text }}
                                        placeholder="Editar mensagem..."
                                      />
                                      <button
                                        type="button"
                                        onClick={() => void handleUpdateMessage(message.id, editingMessageBody)}
                                        className="rounded px-2 py-1 text-xs font-medium"
                                        style={{ backgroundColor: ui.brandBlue, color: ui.brandWhite }}
                                      >
                                        OK
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMessageId(null);
                                          setEditingMessageBody('');
                                        }}
                                        className="rounded px-2 py-1 text-xs font-medium border"
                                        style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft, color: ui.text }}
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="whitespace-pre-wrap text-left" style={{ color: ui.text }}>{message.body}</p>
                                  )}

                                  {kind === 'attachment' && message.metadata?.fileUrl && (() => {
                                    const fileUrl = resolveUploadUrl(message.metadata.fileUrl);
                                    const filename = message.metadata.filename || 'anexo';
                                    const ext = filename.split('.').pop()?.toLowerCase() || '';
                                    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                                    const pdfExts = ['pdf'];
                                    
                                    if (imageExts.includes(ext)) {
                                      return (
                                        <img 
                                          src={fileUrl} 
                                          alt={filename}
                                          className="mt-2 max-w-sm rounded-xl cursor-pointer hover:opacity-90 transition"
                                          onClick={() => window.open(fileUrl, '_blank')}
                                        />
                                      );
                                    }
                                    
                                    if (pdfExts.includes(ext)) {
                                      return (
                                        <div className="mt-2 rounded-xl overflow-hidden border" style={{ borderColor: ui.border }}>
                                          <iframe 
                                            src={`${fileUrl}#toolbar=0`}
                                            className="w-full rounded-xl"
                                            style={{ height: '400px' }}
                                          />
                                        </div>
                                      );
                                    }
                                    
                                    return (
                                      <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80" style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft, color: ui.text }}>
                                        <span>📎</span>
                                        <span className="truncate">{filename}</span>
                                      </a>
                                    );
                                  })()}

                                  {kind === 'audio' && (() => {
                                    const audioUrl = message.metadata?.fileUrl || message.metadata?.audioUrl || message.metadata?.url;
                                    
                                    if (!audioUrl) {
                                      return (
                                        <div className="mt-2 p-2 rounded-xl border text-xs" style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft, color: ui.text }}>
                                          <div>🎙️ Mensagem de voz</div>
                                          <div style={{ color: ui.muted, fontSize: '10px', marginTop: '4px' }}>⚠️ URL não encontrada</div>
                                        </div>
                                      );
                                    }

                                    const resolvedUrl = resolveUploadUrl(audioUrl);
                                    
                                    return (
                                      <AudioPlayerCustom
                                        src={resolvedUrl}
                                        primaryColor={ui.brandBlue}
                                        backgroundColor={ui.sectionSoft}
                                      />
                                    );
                                  })()}

                                  {kind === 'video_call' && message.metadata?.meetingUrl && (
                                    <a href={message.metadata.meetingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:underline">
                                      <Video className="h-4 w-4" /> Entrar na chamada
                                    </a>
                                  )}

                                  {poll && (
                                    <div className="mt-2 rounded-md border p-3" style={{ backgroundColor: ui.sectionSoft }}>
                                      <div className="mb-2 flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" />
                                        <p className="text-sm font-semibold">{poll.question}</p>
                                      </div>
                                      <div className="space-y-2">
                                        {poll.options.map((option) => (
                                          <button key={option.id} type="button" onClick={() => void handleVotePoll(poll.id, option.id)} className="flex w-full items-center justify-between rounded border px-3 py-2 text-sm transition hover:opacity-80" style={{ borderColor: option.votedByMe ? ui.brandBlue : ui.border, backgroundColor: option.votedByMe ? 'rgba(59, 130, 246, 0.13)' : ui.sectionBg, color: ui.text }}>
                                            <span className="flex items-center gap-2">{option.votedByMe && <CheckCircle2 className="h-4 w-4 text-green-600" />}{option.label}</span>
                                            <span className="text-xs" style={{ color: ui.muted }}>{option.votes} votos</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {Object.keys(reactions).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {Object.entries(reactions).map(([emoji, users]) => (
                                        <button key={`reaction-${message.id}-${emoji}`} type="button" onClick={() => void handleReact(message.id, emoji)} className="rounded-full border px-2 py-0.5 text-xs transition hover:opacity-80" style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft, color: ui.text }}>
                                          {emoji} {Array.isArray(users) ? users.length : 0}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Botões Hover (Editar/Excluir) */}
                                  {isMine && editingMessageId !== message.id && (
                                    <div className={`flex items-center gap-1 absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? '-left-16' : '-right-16'}`}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMessageId(message.id);
                                          setEditingMessageBody(message.body);
                                        }}
                                        className="text-xs p-1 hover:opacity-70 transition"
                                        style={{ color: ui.brandBlue }}
                                        title="Editar mensagem"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleDeleteMessage(message.id)}
                                        className="text-xs p-1 hover:opacity-70 transition"
                                        style={{ color: '#ef4444' }}
                                        title="Deletar mensagem"
                                      >
                                        ❌
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Footer: Toolbar + Input */}
                    <div className="shrink-0 border-t bg-background p-4" style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft }}>
                      {/* Botões de ferramentas */}
                      <div className="mb-2 flex flex-wrap gap-2">
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
                        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-1 px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:py-2 sm:text-sm" style={{ borderColor: ui.border, backgroundColor: ui.sectionBg, color: ui.text }}>
                          <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" /> Arquivo
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowEmojiPicker((v) => !v)} className="gap-1 px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:py-2 sm:text-sm" style={{ borderColor: ui.border, backgroundColor: ui.sectionBg, color: ui.text }}>
                          <Smile className="h-3 w-3 sm:h-4 sm:w-4" /> Emoji
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowPollComposer((v) => !v)} className="gap-1 px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:py-2 sm:text-sm" style={{ borderColor: ui.border, backgroundColor: ui.sectionBg, color: ui.text }}>
                          <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" /> Enquete
                        </Button>
                      </div>

                      {/* Emoji Picker */}
                      {showEmojiPicker && (
                        <div className="mb-2 flex flex-wrap gap-1 rounded-xl border p-2" style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft }}>
                          {EMOJIS.map((emoji) => (
                            <button key={emoji} type="button" onClick={() => setNewMessage((current) => `${current}${emoji}`)} className="rounded border px-2 py-1 text-sm" style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft, color: ui.text }}>
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Poll Composer */}
                      {showPollComposer && (
                        <div className="mb-2 rounded-xl border p-3" style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft }}>
                          <p className="mb-2 text-sm font-medium" style={{ color: ui.text }}>Nova enquete</p>
                          <Input value={pollQuestion} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPollQuestion(e.target.value)} placeholder="Pergunta da enquete" style={{ borderColor: ui.border, backgroundColor: ui.sectionBg, color: ui.text }} className="mb-2" />
                          <textarea value={pollOptionsRaw} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPollOptionsRaw(e.target.value)} placeholder={'Uma opcao por linha\nExemplo:\nSim\nNao'} style={{ borderColor: ui.border, backgroundColor: ui.sectionBg, color: ui.text }} className="mb-2 min-h-[90px] w-full rounded border px-3 py-2 text-sm" />
                          <Button size="sm" onClick={() => void handleCreatePoll()} style={{ backgroundColor: ui.brandYellow, color: ui.brandBlack }}>Criar enquete</Button>
                        </div>
                      )}

                      {/* Settings */}
                      {showAppearanceSettings && (
                        <div className="mb-2 rounded-xl border p-3" style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft }}>
                          <p className="mb-3 text-sm font-medium" style={{ color: ui.text }}>Aparência</p>
                          
                          <div className="space-y-3">
                            {/* Cor de destaque */}
                            <div>
                              <label className="text-xs font-medium" style={{ color: ui.text }}>Cor de destaque</label>
                              <div className="mt-1 flex gap-2 flex-wrap">
                                {ACCENT_COLORS.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => setAccentColor(color)}
                                    className="h-8 w-8 rounded-full border-2 transition"
                                    style={{
                                      backgroundColor: color,
                                      borderColor: accentColor === color ? ui.text : ui.border,
                                      boxShadow: accentColor === color ? `0 0 8px ${color}` : 'none',
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Papel de parede */}
                            <div>
                              <label className="text-xs font-medium" style={{ color: ui.text }}>Papel de parede</label>
                              <div className="mt-1 grid grid-cols-3 gap-2">
                                {WALLPAPERS.map((wp) => (
                                  <button
                                    key={wp}
                                    type="button"
                                    onClick={() => setWallpaper(wp)}
                                    className="rounded border-2 p-2 text-xs font-medium transition"
                                    style={{
                                      backgroundColor: wallpaper === wp ? ui.sectionBg : ui.sectionBg,
                                      borderColor: wallpaper === wp ? ui.brandYellow : ui.border,
                                      color: ui.text,
                                    }}
                                  >
                                    {wp === 'plain' ? '⬜' : wp === 'dots' ? '🔵' : '〰️'} {wp}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Notificações */}
                            <div>
                              <label className="text-xs font-medium" style={{ color: ui.text }}>Notificações</label>
                              <div className="mt-1 grid grid-cols-3 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setNotificationMode('off')}
                                  className="rounded border-2 p-2 text-xs font-medium transition"
                                  style={{
                                    backgroundColor: notificationMode === 'off' ? ui.sectionBg : ui.sectionBg,
                                    borderColor: notificationMode === 'off' ? ui.brandYellow : ui.border,
                                    color: ui.text,
                                  }}
                                >
                                  🔇 Off
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNotificationMode('closed')}
                                  className="rounded border-2 p-2 text-xs font-medium transition"
                                  style={{
                                    backgroundColor: notificationMode === 'closed' ? ui.sectionBg : ui.sectionBg,
                                    borderColor: notificationMode === 'closed' ? ui.brandYellow : ui.border,
                                    color: ui.text,
                                  }}
                                >
                                  📳 Fechado
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNotificationMode('always')}
                                  className="rounded border-2 p-2 text-xs font-medium transition"
                                  style={{
                                    backgroundColor: notificationMode === 'always' ? ui.sectionBg : ui.sectionBg,
                                    borderColor: notificationMode === 'always' ? ui.brandYellow : ui.border,
                                    color: ui.text,
                                  }}
                                >
                                  🔔 Sempre
                                </button>
                              </div>
                            </div>

                            {/* Som de notificação */}
                            <div>
                              <label className="text-xs font-medium" style={{ color: ui.text }}>Som de notificação</label>
                              <div className="mt-1 grid grid-cols-2 gap-2">
                                {CHAT_SOUND_PRESETS.map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => { setSoundPreset(preset); playNotificationSound(preset); }}
                                    className="rounded border-2 p-2 text-xs font-medium transition capitalize"
                                    style={{
                                      backgroundColor: soundPreset === preset ? ui.sectionBg : ui.sectionBg,
                                      borderColor: soundPreset === preset ? ui.brandYellow : ui.border,
                                      color: ui.text,
                                    }}
                                  >
                                    🔊 {preset}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Input Area */}
                      <div className="flex gap-2 rounded-2xl border p-2" style={{ borderColor: ui.border, backgroundColor: ui.sectionBg }}>
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
                              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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
                          className="text-sm border-0"
                          style={{ backgroundColor: ui.sectionBg, color: ui.text }}
                        />
                        <Button size="sm" variant={recording ? 'destructive' : 'outline'} onClick={handleAudioToggle} className="gap-1 px-2 py-1" style={recording ? undefined : { borderColor: ui.border, backgroundColor: ui.sectionSoft, color: ui.text }}>
                          {recording ? <Mic className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" onClick={() => void handleSendMessage()} disabled={sendingMessage || !newMessage.trim()} style={{ backgroundColor: ui.brandYellow, color: ui.brandBlack }}>
                          {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-muted-foreground">Selecione um canal</div>
                )}
              </main>

              {/* COLUNA 3: DIREITA (Info do Grupo/Membros) */}
              <aside
                className="flex h-full w-[280px] shrink-0 flex-col border-l border-border"
                style={{ backgroundColor: ui.sectionSoft, borderColor: ui.border }}
              >
                {/* Tabs: Members / Files */}
                <div className="shrink-0 border-b p-4" style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft }}>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRightPanelFilesTab(false)}
                      className="text-sm font-medium pb-2 px-1"
                      style={{
                        color: !showRightPanelFilesTab ? ui.text : ui.muted,
                        borderBottom: !showRightPanelFilesTab ? `2px solid ${ui.brandYellow}` : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Members
                    </button>
                    <button
                      onClick={() => setShowRightPanelFilesTab(true)}
                      className="text-sm font-medium pb-2 px-1"
                      style={{
                        color: showRightPanelFilesTab ? ui.text : ui.muted,
                        borderBottom: showRightPanelFilesTab ? `2px solid ${ui.brandYellow}` : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Files
                    </button>
                  </div>
                </div>

                {/* Conteúdo: Members ou Files */}
                {!showRightPanelFilesTab ? (
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-2 rounded-xl border p-2" style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft }}>
                        <Avatar className="h-8 w-8"><AvatarFallback>{initials(member.name)}</AvatarFallback></Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium" style={{ color: ui.text }}>{member.name}</p>
                          <p className="truncate text-xs" style={{ color: ui.muted }}>{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                    {visibleMessages.some(m => m?.metadata?.kind === 'attachment' || m?.metadata?.kind === 'audio') ? (
                      <>
                        {visibleMessages
                          .filter(m => m?.metadata?.kind === 'attachment' || m?.metadata?.kind === 'audio')
                          .map((message) => (
                            <a
                              key={message.id}
                              href={resolveUploadUrl(message.metadata?.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl border p-3 text-sm transition hover:opacity-80"
                              style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft, color: ui.text }}
                            >
                              <div style={{ color: '#d4a644' }}>📎</div>
                              <span className="truncate text-xs">{message.metadata?.filename || 'arquivo'}</span>
                            </a>
                          ))}
                      </>
                    ) : (
                      <p className="text-xs text-center" style={{ color: '#9a9aaa' }}>Nenhum arquivo compartilhado</p>
                    )}
                  </div>
                )}
              </aside>

            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    );
  }

  return (
    <div suppressHydrationWarning>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl"
          style={{ backgroundColor: ui.brandYellow, color: ui.brandBlack }}
          aria-label="Abrir chat interno"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[22px] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {isOpen && mounted && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" suppressHydrationWarning>
          <div className="absolute bottom-6 right-6 h-[78vh] w-[95vw] max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-row" style={{ backgroundColor: isDark ? '#000000' : '#ffffff', borderColor: ui.border }}>
            
            {/* COLUNA 1: SIDEBAR */}
            <aside className="flex flex-col flex-shrink-0 border-r overflow-hidden w-52" style={{ borderColor: '#e0e0ff', backgroundColor: '#ffffff' }}>
              {/* HEADER */}
              <div className="flex-shrink-0 border-b px-4 py-4 space-y-3" style={{ borderColor: '#e0e0ff', backgroundColor: '#ffffff' }}>
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>Mensagens</h1>
                  <button onClick={() => setIsOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-blue-100" style={{ color: '#000000' }} title="Fechar">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <Input
                  placeholder="Buscar contatos..."
                  value={userSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserSearch(e.target.value)}
                  className="rounded-full bg-blue-50 border-blue-200 text-sm placeholder:text-blue-400"
                  style={{ backgroundColor: '#eff6ff', borderColor: '#3b82f6', color: '#000000' }}
                />
              </div>
              
              {/* MIDDLE: Scrollable content */}
              <div className="flex-1 overflow-y-auto space-y-3 px-3 py-3 min-h-0">
                <div className="flex gap-2">
                  {(['general', 'direct', 'group'] as ChatTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        activeTab === tab ? 'bg-yellow-400 text-black' : 'bg-blue-100 text-blue-700'
                      }`}
                      style={
                        activeTab === tab
                          ? { backgroundColor: '#facc15', color: '#000000' }
                          : { backgroundColor: '#dbeafe', color: '#1e40af' }
                      }
                    >
                      {tab === 'general' ? 'Geral' : tab === 'direct' ? 'Diretas' : 'Grupos'}
                    </button>
                  ))}
                </div>

                {/* Mostrar Contatos se aba "Diretas" está selecionada */}
                {activeTab === 'direct' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-blue-600 px-2" style={{ color: '#3b82f6' }}>Contatos</p>
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          const directChannel = channels.find(
                            (ch) => ch.is_private && ch.members_count <= 2
                          );
                          if (directChannel) {
                            setSelectedChannelId(directChannel.id);
                          } else {
                            void handleOpenDirectChat(user);
                          }
                        }}
                        className="w-full rounded-2xl border p-3 text-left text-sm transition hover:bg-blue-50"
                        style={{
                          borderColor: '#e0e0ff',
                          backgroundColor: '#ffffff',
                          color: '#000000',
                        }}
                      >
                        <p className="truncate font-medium">{user.name}</p>
                      </button>
                    ))}
                    {filteredUsers.length === 0 && (
                      <p className="text-xs text-center text-blue-400 py-4">Nenhum contato encontrado</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 sm:space-y-2">
                    {visibleChannels.map((channel) => {
                      const active = channel.id === selectedChannelId;
                      return (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => setSelectedChannelId(channel.id)}
                          className="w-full rounded-2xl border p-2 text-left text-xs transition sm:p-3 sm:text-sm"
                          style={{
                            borderColor: active ? '#facc15' : '#e0e0ff',
                            backgroundColor: active ? '#fffaeb' : '#ffffff',
                            color: '#000000',
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-semibold">{channel.name || channel.slug}</p>
                            <span className="shrink-0" style={{ color: '#3b82f6' }}>{channel.members_count || 0}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex-shrink-0 border-t px-3 py-2 sm:px-4 sm:py-3" style={{ borderColor: '#e0e0ff', backgroundColor: '#ffffff' }}>
                <div className="flex gap-1 sm:gap-2">
                  <Input
                    ref={newChannelInputRef}
                    placeholder="Novo canal"
                    value={newChannelName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewChannelName(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') void handleCreateChannel();
                    }}
                    className="text-xs sm:text-sm"
                    style={{ backgroundColor: '#f0f9ff', borderColor: '#3b82f6', color: '#000000' }}
                  />
                  <Button type="button" onClick={() => void handleCreateChannel()} disabled={creatingChannel || newChannelName.trim().length < 2} size="icon" className="h-8 w-8 sm:h-10 sm:w-10" style={{ backgroundColor: '#3b82f6' }}>
                    {creatingChannel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </aside>

            {/* COLUNA 2: MAIN CHAT */}
            <main className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
              {selectedChannel ? (
                <>
                  {/* HEADER */}
                  <div className="flex-shrink-0 border-b px-3 py-3 sm:px-4 sm:py-4" style={{ borderColor: '#e0e0ff', backgroundColor: '#ffffff' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold sm:text-lg" style={{ color: '#000000' }}>{selectedChannelLabel}</h2>
                        <p className="text-xs sm:text-sm" style={{ color: '#9090a0' }}>{members.length || 0} membros, {onlineCount || 0} online</p>
                      </div>
                      <Button size="icon" variant="outline" onClick={() => void handleStartVideoCall()} style={{ borderColor: '#e0e0ff', color: '#3b82f6' }}>
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* MIDDLE: Messages */}
                  <div className="flex-1 overflow-y-scroll overflow-x-hidden p-2 sm:p-4 min-h-0" style={wallpaperStyle(wallpaper, accentColor, isDark)}>
                    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-2 sm:space-y-3">
                      {loading && <p className="text-sm" style={{ color: ui.muted }}>Carregando mensagens...</p>}
                      {!loading && visibleMessages.length === 0 && <p className="text-sm" style={{ color: ui.muted }}>Sem mensagens ainda.</p>}
                      {visibleMessages.map((message) => {
                        const isMine = message.sender_user_id === currentUserId;

                        return (
                          <div 
                            key={message.id} 
                            className={`flex flex-col w-fit max-w-[85%] sm:max-w-[70%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}
                          >
                            {/* Cabeçalho (Nome e Hora) */}
                            <div className={`flex items-center gap-2 mb-1 text-[10px] ${isMine ? 'flex-row-reverse' : ''}`}>
                              <span className="font-medium" style={{ color: ui.text }}>{message.sender_name || 'Usuário'}</span>
                              <span style={{ color: ui.muted }}>{new Date(message.created_at).toLocaleString('pt-BR')}</span>
                            </div>
                            
                            {/* Balão */}
                            <div
                              className={`px-3 py-2 shadow-sm rounded-2xl ${isMine ? 'rounded-tr-sm' : 'rounded-tl-sm border'}`}
                              style={{
                                backgroundColor: isMine ? ui.bubbleMeBg : ui.bubbleOtherBg,
                                borderColor: isMine ? 'transparent' : ui.border,
                              }}
                            >
                              <p className="whitespace-pre-wrap text-sm" style={{ color: ui.text }}>{message.body}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* FOOTER: Input area */}
                  <div className="flex-shrink-0 border-t p-2 sm:p-3" style={{ borderColor: ui.border, backgroundColor: isDark ? '#0d0d0d' : '#ffffff' }}>
                    <div className="flex gap-1 rounded-2xl border p-1 sm:gap-2 sm:p-2" style={{ borderColor: ui.border, backgroundColor: ui.sectionSoft }}>
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
                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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
                        className="text-xs sm:text-sm"
                      />
                      <Button size="sm" variant={recording ? 'destructive' : 'outline'} onClick={handleAudioToggle} className="h-8 w-8 shrink-0 p-0" style={recording ? undefined : { borderColor: ui.border, backgroundColor: ui.sectionBg, color: ui.text }}>
                        {recording ? <Mic className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button onClick={() => void handleSendMessage()} disabled={sendingMessage} size="icon" className="h-8 w-8 shrink-0 sm:h-10 sm:w-10" style={{ backgroundColor: ui.brandYellow, color: ui.brandBlack }}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-6 text-center" style={{ color: ui.muted }}>Selecione um canal</div>
              )}
            </main>

            {/* COLUNA 3: MEMBERS (Hidden on mobile) */}
            <div className="hidden lg:flex flex-col flex-shrink-0 border-l overflow-hidden w-56" style={{ borderColor: ui.border, backgroundColor: isDark ? '#090909' : '#f0f2ff' }}>
              {/* HEADER */}
              <div className="flex-shrink-0 border-b px-3 py-3" style={{ borderColor: ui.border, backgroundColor: isDark ? '#111111' : '#ffffff' }}>
                <h3 className="text-sm font-semibold" style={{ color: ui.text }}>Membros</h3>
              </div>

              {/* MIDDLE: Members */}
              <div className="flex-1 overflow-y-auto space-y-2 p-2 min-h-0">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 rounded-xl border p-2" style={{ borderColor: ui.border, backgroundColor: isDark ? '#0b0b0b' : '#f8fafc' }}>
                    <Avatar className="h-8 w-8"><AvatarFallback>{initials(member.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" style={{ color: ui.text }}>{member.name}</p>
                      <p className="truncate text-xs" style={{ color: ui.muted }}>{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-24 z-50 max-w-md rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}


