"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React, { useState } from "react";
import EmailComposer from "./EmailComponents/EmailComposer";
import UserAvatarList from "./EmailComponents/UserAvatarList";
import UserAvatarListRedirect from "./EmailComponents/UserAvatarListRedirect";

interface AlertDialogDemoProps {
  children: React.ReactNode;
  onSend?: (data: {
    subject: string;
    htmlContent: string;
    emails: string[];
  }) => void;
  title?: string;
  description?: string;
  contentPopup?: string;
}

const usersSend = [
  {
    id: "1",
    fromName: "Nicolas",
    fromEmail: "nicolas@email.com",
    avatarUrl: "",
  },
  { id: "2", fromName: "Maria", fromEmail: "maria@email.com", avatarUrl: "" },
];

export function AlertDialogDemo({
  children,
  onSend,
  title = "Compor Email",
  description = "Escreva seu email abaixo",
  contentPopup = "novo-email",
}: AlertDialogDemoProps) {
  const [open, setOpen] = useState(false);

  const handleSend = (data: {
    subject: string;
    htmlContent: string;
    emails: string[];
  }) => {
    // Chama o callback se fornecido
    if (onSend) {
      onSend(data);
    }
    // Fecha o dialog após enviar
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-between">
            <div>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </div>

            <AlertDialogCancel className="border-none text-center bg-transparent text-black text-lg font-normal cursor-pointer rounded-full w-14 h-14 hover:bg-gray-300">
              X
            </AlertDialogCancel>
          </div>
        </AlertDialogHeader>

        <div>
          {contentPopup === "novo-email" ? (
            <EmailComposer onSend={handleSend} />
          ) : (
            <UserAvatarListRedirect
              users={usersSend}
              onSelect={(u) => console.log("Selecionado:", u)}
            />
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
