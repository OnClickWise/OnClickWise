"use client";
import React, { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { individualMessageSend, UserEmail } from "@/types/email";
import { getMockEmails, sendNewEmail } from "@/lib/email";

export default function UserAvatarListRedirect({
  htmlContent,
  subject,
}: {
  htmlContent?: string;
  subject?: string;
}) {
  const [users, setUsers] = useState<UserEmail[]>([]);

  /* async function encaminharEmail() {
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
  } */

  useEffect(() => {
    getMockEmails().then((response) => {
      setUsers(response.body.message);
    });
  }, []);

  return (
    <div className="flex flex-col w-full bg-white rounded-md overflow-hidden">
      {users.map((user) => (
        <button
          onClick={(e) => {
            e.preventDefault();
            const emailRoot = "nicolasnkprogramador@gmail.com";

            // enviar email aqui
            const newEmail: individualMessageSend = {
              from: emailRoot,
              to: [user.fromEmail],
              subject: subject as string,
              html: htmlContent as string,
            };

            sendNewEmail(newEmail);
          }}
          key={user.id}
          className="flex items-center w-full flex-wrap text-left p-3 gap-3 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Avatar className="h-10 w-10 rounded-full shrink-0">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.fromName} />
            ) : null}

            <AvatarFallback className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white text-sm font-medium">
              {user.fromName?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 w-full min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={"text-sm font-medium truncate"}>
                {user.fromName}
              </h3>

              <span className="text-xs text-gray-500">{user.fromEmail}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
