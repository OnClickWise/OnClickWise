import {
  UserEmail,
  RawMessage,
  NormalizedMessage,
  individualMessageSend,
} from "@/types/email";

export async function getMockEmails() {
  let res;

  try {
    res = await fetch("http://localhost:3002/email/get-mock-emails");
    const data = await res.json();

    return data;
  } catch (e) {
    throw e;
  }
}

export const getDateFormated = (): string => {
  const now = new Date();

  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  const formattedTime = `${hours}:${minutes}`;
  return formattedTime;
};

export const filterSearchEmail = (
  mockEmails: UserEmail[],
  searchTerm: string
): UserEmail[] => {
  return mockEmails.filter(
    (email) =>
      email.fromName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const findUserById = (
  mockEmails: UserEmail[],
  selectedEmail: number
): UserEmail | undefined => {
  const currentEmail = mockEmails.find((email) => email.id === selectedEmail);
  return currentEmail;
};

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  const dd = String(date.getDate()).padStart(2, "0");
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);

  return `${hh}:${mm} - ${dd}/${MM}/${yy}`;
}

export function mergeAndFormatMessages(
  received: RawMessage[],
  sent: RawMessage[]
): NormalizedMessage[] {
  const allMessages: NormalizedMessage[] = [
    ...received.map<NormalizedMessage>((msg) => ({
      typeMessage: "response",
      subject: msg.subject,
      htmlContent: msg.htmlContent,
      timestamp: String(formatDate(msg.timestamp)),
    })),
    ...sent.map<NormalizedMessage>((msg) => ({
      typeMessage: "send",
      subject: msg.subject,
      htmlContent: msg.htmlContent,
      timestamp: String(formatDate(msg.timestamp)),
    })),
  ];

  return allMessages.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export async function sendNewEmail(newEmail: individualMessageSend) {
  const emailRoot = "nicolasnkprogramador@gmail.com";

  // URL do endpoint para onde a requisição será enviada
  const urlDoEndpoint = "http://localhost:3002/email/send-new-email";

  // Opções da requisição fetch
  const opcoesDaRequisicao = {
    method: "POST", // Método HTTP
    headers: {
      // Informa ao servidor que estamos enviando dados JSON
      "Content-Type": "application/json",
    },
    // Converte o objeto JavaScript em uma string JSON
    body: JSON.stringify(newEmail),
  };

  // Fazendo a requisição
  fetch(urlDoEndpoint, opcoesDaRequisicao)
    .then((response) => {
      // Verifica se a resposta foi bem-sucedida (status 200-299)
      if (!response.ok) {
        // Se não, lança um erro para ser capturado pelo .catch()
        throw new Error("Erro na requisição: " + response.statusText);
      }
      // Analisa a resposta como JSON e retorna uma nova Promise
      return response.json();
    })
    .then((data) => {
      // Aqui você recebe os dados processados (data)
      console.log("Sucesso:", data);
      // Você pode manipular o DOM ou fazer outras ações aqui
    })
    .catch((error) => {
      // Captura erros de rede ou erros lançados no primeiro .then()
      console.error("Houve um problema com a operação fetch:", error);
    });
}
