export interface fileAttachmentsProps {
  name: string;
  size: string;
}

export interface dataMessageProps {
  subject: string;
  timestamp: string;
  attachments: fileAttachmentsProps[];
}

export interface messageHistoryProps {
  sendMessage: dataMessageProps[];
  receiveMessage: dataMessageProps[];
}

export interface mockEmailsProp {
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
  messagesHistory: messageHistoryProps[];
}
