"use client";

import React, { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import EmailComposer from "./EmailComponents/EmailComposer";
import UserAvatarListRedirect from "./EmailComponents/UserAvatarListRedirect";

interface AlertDialogDemoProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  contentPopup?: string;
  subjectSend?: string;
  htmlContentSend?: string;
}

export function AlertDialogDemo({
  children,
  title,
  description,
  contentPopup,
  subjectSend,
  htmlContentSend,
}: AlertDialogDemoProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>

      <AlertDialogContent
        className={contentPopup == "novo-email" ? "sm:max-w-2xl" : ""}
      >
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
            <EmailComposer />
          ) : (
            <UserAvatarListRedirect
              subject={subjectSend}
              htmlContent={htmlContentSend}
            />
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
