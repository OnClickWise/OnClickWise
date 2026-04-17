"use client";
import React, { useState, useEffect } from "react";
import { 
  Bot, CheckCircle, AlertCircle, Settings, Smartphone, 
  MessageSquare, Loader2, RefreshCcw, Trash2, QrCode
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppSidebar } from "@/components/app-sidebar";
import { useApi } from "@/hooks/useApi";
import { useParams } from "next/navigation";
import { getInternalChatSocket } from "@/services/internalChatSocket";
import { useMemo } from "react";

export default function WhatsappSettingsPage() {
  const params = useParams();
  const org = typeof params?.org === 'string' ? params.org : '';
  const { apiCall } = useApi();
  
  // Estados de Controle
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Conta e QR Code
  const [whatsappAccount, setWhatsappAccount] = useState<any | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  // Estados do Formulário
  const [instanceName, setInstanceName] = useState("");

  useEffect(() => {
    if (!org) return;

    const fetchAccount = async () => {
      setLoading(true);
      try {
        const res = await apiCall(`/whatsapp/accounts?orgSlug=${org}`);
        if (res && res.data) {
          setWhatsappAccount(res.data);
        }
      } catch (error) {
        console.error("Erro ao buscar conta:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [org]);

  // FUNÇÃO PARA GERAR A CONEXÃO (EVOLUTION API)
  const handleConnect = async () => {
    if (!instanceName) return alert("Dê um nome para sua conexão");
    
    setConnecting(true);
    setQrCodeData(null);

    try {
      const res = await apiCall('/whatsapp/evolution/connect', {
        method: 'POST',
        body: JSON.stringify({ 
          instanceName: instanceName,
          integration: "WHATSAPP-BAILEYS"
        })
      });
      
      if (res?.qrcode?.base64) {
        setQrCodeData(res.qrcode.base64);
      }
      
      // Se já retornar a instância, atualizamos o estado local
      if (res?.instance) {
        setWhatsappAccount(res.instance);
      }

    } catch (err) {
      console.error(err);
      alert("Erro ao gerar QR Code. Tente novamente.");
    } finally {
      setConnecting(false);
    }
  };

  const socket = useMemo(() => {
  const instance = getInternalChatSocket();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (instance) {
    instance.auth = { token: token };
    console.log("🔌 Tentando conectar ao Socket nas Configurações..."); // Adicione este
    if (!instance.connected) {
      instance.connect();
    }
  }
  return instance;
}, []);
// 2. Escuta os eventos e gerencia as Salas
useEffect(() => {
  if (!socket || !org) return;

  const handleStatusUpdate = (updatedAccount: any) => {
    console.log("✅ Recebido via Socket:", updatedAccount);
    setWhatsappAccount(updatedAccount);
    
    if (updatedAccount.status === 'open') {
      setQrCodeData(null);
    }
  };

  socket.on('whatsapp_status_updated', handleStatusUpdate);

  return () => {
    socket.off('whatsapp_status_updated', handleStatusUpdate);
  };
}, [socket, org]);

  const handleDeleteAccount = async () => {
    // Lógica para deletar a instância na Evolution e no seu banco
    setShowConfirmDelete(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar org={org} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Configurações</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-bold">WhatsApp Evolution</span>
          </div>
        </header>

        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-green-600" />
              WhatsApp Connection
            </h2>
            <p className="text-muted-foreground">
              Conecte seu WhatsApp via Evolution API para gerenciar atendimentos e automações.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* COLUNA DA ESQUERDA: FORMULÁRIO OU QR CODE */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  {whatsappAccount?.status === 'open' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Conexão Ativa
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5 text-primary" />
                      {qrCodeData ? "Escaneie o QR Code" : "Configurar Nova Conexão"}
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {whatsappAccount?.status === 'open'
                    ? "Sua instância está conectada e pronta para o envio de mensagens."
                    : qrCodeData
                      ? "Abra o WhatsApp no seu celular > Aparelhos Conectados > Conectar um aparelho."
                      : "Escolha um nome para identificar este número no sistema."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-6 min-h-[250px]">
                
                {/* NOVA CONDICIONAL: SE ESTIVER CONECTADO */}
                {whatsappAccount?.status === 'open' ? (
                  <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="bg-green-50 p-6 rounded-full">
                      <Smartphone className="w-12 h-12 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">WhatsApp Conectado!</h3>
                      <p className="text-sm text-muted-foreground">
                        A instância <strong>{whatsappAccount.instanceName}</strong> está operacional.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* SEU CÓDIGO ORIGINAL MANTIDO INTEGRALMENTE ABAIXO */
                  <>
                    {!qrCodeData ? (
                      <div className="w-full space-y-4">
                        <div className="space-y-2">
                          <Label>Nome da Instância (ex: Comercial, Suporte)</Label>
                          <Input
                            placeholder="Ex: WhatsApp Filial Norte"
                            value={instanceName}
                            onChange={(e) => setInstanceName(e.target.value)}
                            disabled={connecting}
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleConnect}
                          disabled={connecting || !instanceName}
                        >
                          {connecting ? <Loader2 className="animate-spin mr-2" /> : null}
                          Gerar QR Code de Conexão
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg border shadow-sm">
                        <img src={qrCodeData} alt="WhatsApp QR Code" className="w-64 h-64" />
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-sm font-medium text-orange-600 animate-pulse">
                            Aguardando leitura do QR Code...
                          </p>
                          <Button variant="outline" size="sm" onClick={() => setQrCodeData(null)}>
                            Cancelar e Voltar
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* COLUNA DA DIREITA: STATUS E INFO */}
            <div className="space-y-6">
              <Card>
                <div className="pt-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">ID da Instância</p>
                  <p className="text-[10px] font-mono truncate">
                    {whatsappAccount?.instanceId || whatsappAccount?.instance_id || 'Nenhum ID encontrado'}
                  </p>
                </div>
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Status da Conexão
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status:</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${whatsappAccount?.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {whatsappAccount?.status === 'open' ? 'CONECTADO' : 'DESCONECTADO'}
                    </span>
                  </div>
                  {whatsappAccount && (
                    <div className="pt-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Instância Ativa</p>
                      <p className="text-sm font-mono">{whatsappAccount.instanceName}</p>
                    </div>
                  )}
                  {whatsappAccount && (
                    <Button 
                      variant="destructive" 
                      className="w-full h-8 text-xs" 
                      onClick={() => setShowConfirmDelete(true)}
                    >
                      <Trash2 className="w-3 h-3 mr-2" /> Desconectar Conta
                    </Button>
                  )}
                </CardContent>
              </Card>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-xs font-bold mb-2 flex items-center gap-1 text-blue-800">
                  <Bot className="w-3 h-3" /> Dica de Conexão
                </h4>
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  Para uma melhor estabilidade, certifique-se de que o seu celular está com uma conexão de internet estável e a bateria carregada.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DIALOG DE EXCLUSÃO */}
        <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Desconectar WhatsApp?</DialogTitle>
              <DialogDescription>
                Esta ação interromperá todas as automações e envios de mensagens para esta instância.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </SidebarInset>
    </SidebarProvider>
  );
}