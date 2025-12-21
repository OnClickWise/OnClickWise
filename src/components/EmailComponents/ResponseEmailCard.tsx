"use client";

import { ReactNode, useState } from "react";
import EmailComposerBody from "./EmailComposerBody";
import { AlertDialogDemo } from "../AlertDialogDemo";
import { Forward, Paperclip, Reply } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

interface PropsCurrentEmail {
  htmlContent: string;
  timestamp: string;
  subject: string;
}

export default function ResponseEmailCard({
  htmlContent,
  timestamp,
  subject,
}: PropsCurrentEmail): ReactNode {
  const [replyAction, setReplyAction] = useState<string>("Responder");

  return (
    <div className="mb-14 space-y-6 px-8">
      <h4 className="text-sm font-medium text-gray-900 mb-4">Email Recebido</h4>

      <div className="border-l-4 border-l-gray-800 pl-4 py-3 bg-gray-50 rounded-r-lg">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-semibold text-gray-900">
            {subject || "Sem assunto"}
          </h5>

          <span className="text-xs text-gray-500">{timestamp}</span>
        </div>

        <div
          className="prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{
            __html: htmlContent,
          }}
        />
      </div>

      {/* Componente para responder o e-mail */}
      {replyAction === "Cancelar" ? <EmailComposerBody /> : <span></span>}

      {/* Opções - (Respostas/Encaminhamentos) */}
      <div className="flex items-center space-x-2">
        <AlertDialogDemo
          contentPopup="encaminhar"
          onSend={() => {}}
          title="Encaminhar Email"
          description="Encaminhe este email para outros destinatários"
        >
          <Button variant="outline">
            <Forward className="w-4 h-4 mr-2" />
            Encaminhar
          </Button>
        </AlertDialogDemo>

        <Button
          variant="outline"
          onClick={() =>
            replyAction === "Responder"
              ? setReplyAction("Cancelar")
              : setReplyAction("Responder")
          }
        >
          {replyAction === "Responder" ? (
            <Reply className="w-4 h-4" />
          ) : (
            <span>X</span>
          )}
          {replyAction}
        </Button>
      </div>

      <Separator />
    </div>
  );
}
