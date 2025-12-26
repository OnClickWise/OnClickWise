type MessageType = "send" | "response";

interface Attachment {
  name: string;
  size: string;
}

export interface NormalizedMessage {
  typeMessage: MessageType;
  htmlContent: string;
  subject: string;
  timestamp: string;
}

export interface RawMessage {
  subject: string;
  timestamp: string;
  htmlContent: string;
  attachments?: Attachment[];
}

export interface MessagesHistory {
  sendMessage: RawMessage[];
  receiveMessage: RawMessage[];
  roadMap?: NormalizedMessage[];
}

export interface UserEmail {
  id: number;
  fromName: string;
  fromEmail: string;
  subject: string;
  preview: string;
  timestampLatest: string;
  avatar: string;
  isRead: boolean;

  /* Infos */
  infos: object;

  /* Messages */
  messagesHistory: MessagesHistory;
}

export interface individualMessageSend {
  from: string;
  to: string[];
  subject: string;
  html: string;
}
