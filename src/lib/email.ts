export interface MessageSendPropsInterface {
  subject: string;
  htmlContent: string;
  timestamp: string;
}
export interface userPropsInterface {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  previewContent: string;
  timestamp: string;
  avatar: string;
  messageSend: MessageSendPropsInterface[];
  messageReceived: never[];
}

// Mock data para emails - Lista de conversas iniciadas
export const usersActivate: userPropsInterface[] = [
  {
    id: "udi2",
    fromEmail: "joao@empresa.com",
    from: "João Silva",
    subject: "",
    previewContent: "",
    timestamp: "10:30",
    avatar: "/avatars/joao.jpg",
    messageSend: [
      {
        subject: "teste",
        htmlContent: "Conteúdo do corpo do e-mail",
        timestamp: "10:30",
      },
    ],
    messageReceived: [],
  },
  {
    id: "udi1",
    from: "Maria Alvez",
    fromEmail: "maria@empresa.com",
    subject: "",
    previewContent: "",
    timestamp: "10:30",
    avatar: "/avatars/joao.jpg",
    messageSend: [
      {
        subject: "Curriculo enviado",
        htmlContent:
          "Aqui segue o meu curriculo Aqui segue o meu curriculo Aqui segue o meu curriculo Aqui segue o meu curriculo Aqui segue o meu curriculo Aqui segue o meu curriculo Aqui segue o meu curriculo",
        timestamp: "10:40",
      },
    ],
    messageReceived: [],
  },
];

export const returnAllUsersActivate = (): Array<userPropsInterface> => {
  const usersContent: Array<userPropsInterface> = usersActivate.map(
    (userContent) => {
      const lastMessage =
        userContent.messageSend[userContent.messageSend.length - 1];
      return {
        ...userContent,
        previewContent: lastMessage ? lastMessage.htmlContent : "",
      };
    }
  );
  return usersContent;
};

export const findRegister = (
  emailType: string
): userPropsInterface | undefined => {
  return returnAllUsersActivate().find((email) => email.id === emailType);
};

export const addNewMessageToUser = (
  bodyMessage: MessageSendPropsInterface,
  userId: string
): userPropsInterface[] => {
  const users = returnAllUsersActivate();

  users.forEach((user) => {
    if (user.id === userId) {
      user.messageSend.push(bodyMessage);
    }
  });

  return returnAllUsersActivate();
};

export const searchEmailActive = (searchTerm: string): userPropsInterface[] => {
  return returnAllUsersActivate().filter(
    (email) =>
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const createNewUser = (
  newSentEmailProp: {
    subject: string;
    htmlContent: string;
  },
  emailType: string
): userPropsInterface[] => {
  const newSentEmail: userPropsInterface = {
    id: window.crypto.randomUUID(),
    from: "Maria Alvez",
    fromEmail: emailType,
    subject: "",
    previewContent: newSentEmailProp.htmlContent,
    timestamp: "10:30",
    avatar: "/avatars/joao.jpg",
    messageSend: [
      {
        subject: newSentEmailProp.subject,
        htmlContent: newSentEmailProp.htmlContent,
        timestamp: "10:40",
      },
    ],
    messageReceived: [],
  };

  usersActivate.push(newSentEmail);

  return returnAllUsersActivate();
};

export async function getMockEmails() {
  let res;

  try {
    console.log("Testando requisição da api:");

    res = await fetch("http://localhost:3002/email/get-mock-emails");
    const data = await res.json();

    return data;
  } catch (e) {
    throw e;
  }
}
