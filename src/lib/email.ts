import { UserEmail, RawMessage, NormalizedMessage } from "@/types/email";

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

/*

getMockEmails()
  .then((mockUpdate) => {
    console.log(mockUpdate);
  })
  .catch((e) => e); 

*/

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
