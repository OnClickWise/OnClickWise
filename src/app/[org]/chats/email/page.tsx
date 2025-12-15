"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SiGmail } from "react-icons/si";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Search, Mail } from "lucide-react";
import { getMockEmails } from "@/lib/email";
import SentEmailCard from "@/components/EmailComponents/SentEmailCard";
import { AlertDialogDemo } from "@/components/AlertDialogDemo";

interface mockEmailsProp {
  id: number;
  fromName: string;
  fromEmail: string;
  subject: string;
  preview: string;
  timestampLatest: string;
  avatar: string;
  isRead: boolean;
}

export default function EmailPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = React.use(params);
  const [selectedEmail, setSelectedEmail] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [mockEmails, setMockEmails] = React.useState<mockEmailsProp[]>([]);

  React.useEffect(() => {
    getMockEmails()
      .then((mockUpdate) => {
        setMockEmails(mockUpdate.body.message);
      })
      .catch((e) => e);
  }, []);

  const filteredEmails = mockEmails.filter(
    (email) =>
      email.fromName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentEmail = mockEmails.find((email) => email.id === selectedEmail);

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          {/* HEADER */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${org}/dashboard`}>
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/${org}/chats`}>Chats</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2">
                    <SiGmail className="w-4 h-4" />
                    Email
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* MAIN CONTENT */}
          <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
            {/* Lista de Emails */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
              {/* Header da Lista */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SiGmail className="w-5 h-5 text-gray-800" />

                    <h1 className="text-xl font-semibold text-gray-800">
                      Email
                    </h1>
                  </div>

                  <AlertDialogDemo
                    contentPopup="novo-email"
                    onSend={() => {}}
                    title="Encaminhar Email"
                    description="Encaminhe este email para outros destinatários"
                  >
                    <Button
                      onClick={() => setComposeOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Escrever
                    </Button>
                  </AlertDialogDemo>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Pesquisar emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Lista de Emails */}
              <div className="flex-1 overflow-y-auto">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email.id)}
                    className={`flex items-center gap-4 p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedEmail === email.id
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={email.avatar} alt={email.fromName} />

                        <AvatarFallback>
                          {email.fromName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`text-md truncate ${
                            !email.isRead ? "font-bold" : "font-thin"
                          }`}
                        >
                          {email.fromName}
                        </h3>

                        <span className="text-xs text-gray-500">
                          {email.timestampLatest}
                        </span>
                      </div>

                      <p
                        className={`text-sm font-medium text-gray-900 truncate mb-1 ${
                          !email.isRead ? "font-bold" : "font-thin text-xs"
                        }`}
                      >
                        {email.subject}
                      </p>

                      <p className="text-xs text-gray-600 truncate">
                        {email.preview}
                      </p>

                      {!email.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Área de Visualização do Email */}
            <div className="flex-1 flex flex-col">
              {currentEmail ? (
                <>
                  {/* Header do Email */}
                  <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {currentEmail.subject}
                      </h2>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={currentEmail.avatar}
                          alt={currentEmail.fromName}
                        />
                        <AvatarFallback>
                          {currentEmail.fromName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {currentEmail.fromName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {currentEmail.fromEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo do Email */}
                  <div className="flex flex-col overflow-y-auto">
                    <SentEmailCard
                      htmlContent="teste"
                      timestamp="10:30"
                      subject="teste"
                      onSendHandle={() => {}}
                    />

                    <SentEmailCard
                      htmlContent="teste"
                      timestamp="10:30"
                      subject="teste"
                      onSendHandle={() => {}}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Selecione um email
                    </h3>
                    <p className="text-gray-500">
                      Escolha um email da lista para visualizar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
