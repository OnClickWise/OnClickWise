"use client";
import React, { useState, useEffect } from "react";
import { 
  Bot, Save, Eye, EyeOff, CheckCircle, AlertCircle, 
  Settings, User, Smartphone, MessageSquare, Link as LinkIcon,
  Loader2, RefreshCcw, Trash2
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApi } from "@/hooks/useApi";
import { useParams } from "next/navigation";

export default function WhatsappSettingsPage() {
  const params = useParams();
  const org = typeof params?.org === 'string' ? params.org : '';
  const { apiCall } = useApi();
  
  // Estados de Controle
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Mock da Conta Ativa (Espelhando o Backend)
  const [whatsappAccount, setWhatsappAccount] = useState<any | null>(null);

  // Estados do Formulário
  const [formData, setFormData] = useState({
    friendlyName: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (!org) return;
    const fetchAccount = async () => {
      setLoading(true);
      try {
        const res = await apiCall(`/whatsapp/accounts?orgSlug=${org}`);
        if (res && res.data) {
          setWhatsappAccount(res.data);
        } else {
          setWhatsappAccount(null);
        }
      } catch {
        setWhatsappAccount(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [org, apiCall]);

  const handleLinkAccount = async () => {
    setSaving(true);
    try {
      const method = whatsappAccount ? 'PUT' : 'POST';
      const endpoint = whatsappAccount
        ? `/whatsapp/accounts/${whatsappAccount.id}`
        : '/whatsapp/accounts';
      const res = await apiCall(endpoint, {
        method,
        body: JSON.stringify({ ...formData, orgSlug: org }),
      });
      if (res && res.data) {
        setWhatsappAccount(res.data);
      }
    } catch (err) {
      console.error('Erro ao provisionar conta WhatsApp:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!whatsappAccount?.id) return;
    try {
      await apiCall(`/whatsapp/accounts/${whatsappAccount.id}`, { method: 'DELETE' });
      setWhatsappAccount(null);
      setShowConfirmDelete(false);
    } catch (err) {
      console.error('Erro ao desconectar conta WhatsApp:', err);
    }
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
      <SidebarInset>
        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Configurações</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-bold">WhatsApp Business</span>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-green-600" />
              WhatsApp Business API
            </h2>
            <p className="text-muted-foreground">
              Conecte sua conta oficial via Twilio para automação e atendimento.
            </p>
          </div>

          {/* 1. STATUS DA CONTA ATIVA */}
          {whatsappAccount && (
            <Card className="border-green-200 bg-green-50/20">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    Conectado com Sucesso
                  </CardTitle>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setShowConfirmDelete(true)}
                    className="h-8 gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Desconectar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase text-muted-foreground">Nome Identificador</Label>
                    <p className="font-semibold">{whatsappAccount.twilio_account_name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs uppercase text-muted-foreground">Número de Telefone</Label>
                    <p className="font-semibold">{whatsappAccount.phone_number}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs uppercase text-muted-foreground">Data de Ativação</Label>
                    <p className="font-semibold text-sm">
                      {new Date(whatsappAccount.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            {/* 2. FORMULÁRIO DE CONFIGURAÇÃO */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {whatsappAccount ? "Atualizar Configurações" : "Provisionar Nova Conta"}
                </CardTitle>
                <CardDescription>
                  Ao salvar, nosso sistema criará automaticamente uma Subconta na Twilio dedicada a esta organização.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="friendlyName">Nome da Conta (Interno)</Label>
                    <Input 
                      id="friendlyName" 
                      placeholder="Ex: Suporte Vendas" 
                      value={formData.friendlyName}
                      onChange={(e) => setFormData({...formData, friendlyName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número WhatsApp (E.164)</Label>
                    <Input 
                      id="phone" 
                      placeholder="+5511998887766" 
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="text-xs text-amber-800 space-y-1">
                    <p className="font-bold uppercase tracking-tight">Atenção Requerida:</p>
                    <p>
                      Certifique-se de que o número informado **já possui uma conta ativa no WhatsApp**. 
                      A Twilio enviará um desafio de posse (SMS ou Voz) para validar este número após o provisionamento.
                    </p>
                    <p className="italic underline">
                      O processo de verificação de marca e 2FA é gerenciado pelo Facebook Business Manager.
                    </p>
                  </div>
                </div>

                <Separator />
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setFormData({friendlyName: "", phoneNumber: ""})}>
                    Limpar
                  </Button>
                  <Button 
                    className="gap-2 min-w-[140px]" 
                    disabled={saving || !formData.phoneNumber}
                    onClick={handleLinkAccount}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {whatsappAccount ? "Salvar Alterações" : "Ativar Integração"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 3. INFO SIDEBAR */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> Requisitos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <div className="text-xs space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <p>Conta Twilio Master Ativa</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <p>Créditos disponíveis para provisionamento</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <p>Facebook Business Manager ID</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold mb-2 flex items-center gap-1">
                  <RefreshCcw className="w-3 h-3" /> Sync Status
                </h4>
                <p className="text-[10px] text-slate-500">
                  As subcontas são sincronizadas em tempo real. Webhooks de status serão configurados automaticamente após o link.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
        <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Desconectar WhatsApp?</DialogTitle>
              <DialogDescription>
                Esta ação irá suspender as rotas de mensagem no backend e desativar a subconta Twilio para esta organização. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>Confirmar Desconexão</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}