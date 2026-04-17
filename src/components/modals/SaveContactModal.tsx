import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SaveContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>; // Promise porque vamos lidar com API
  currentName?: string | null;
  phoneNumber: string;
}

export function SaveContactModal({
  isOpen,
  onClose,
  onSave,
  currentName,
  phoneNumber,
}: SaveContactModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Sincroniza o estado interno quando o modal abre ou o contato muda
  useEffect(() => {
    if (isOpen) {
      setName(currentName || "");
    }
  }, [isOpen, currentName]);

  const handleConfirm = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      await onSave(name);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>
            {currentName ? "Editar Contato" : "Salvar Contato"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label className="text-gray-500">Número</Label>
            <div className="text-sm font-medium p-2 bg-gray-50 rounded border border-gray-100">
              {phoneNumber}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-name">Nome</Label>
            <Input
              id="contact-name"
              placeholder="Digite o nome do contato..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={loading || !name.trim()}
            className="bg-[#00a884] hover:bg-[#008f72] text-white"
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}