import { UserEmail } from "@/types/email";

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
