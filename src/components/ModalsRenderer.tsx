"use client";

import React from "react";
import { useModals } from "@/hooks/useModals";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function ModalsRenderer() {
  const { modals, closeModal } = useModals();

  return (
    <>
      {modals.map((modal) => {
        const isOpen = !!modal;
        const size = modal.size || "md";

        if (modal.type === "confirm") {
          return (
            <Dialog key={modal.id} open={isOpen} onOpenChange={() => closeModal(modal.id)}>
              <DialogContent className={sizeClasses[size]}>
                <DialogHeader>
                  <div className="flex items-start gap-3">
                    {modal.isDangerous && <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />}
                    {!modal.isDangerous && <Info className="h-5 w-5 text-primary flex-shrink-0 mt-1" />}
                    <div>
                      <DialogTitle>{modal.title || "Confirmar"}</DialogTitle>
                      {modal.description && <DialogDescription>{modal.description}</DialogDescription>}
                    </div>
                  </div>
                </DialogHeader>
                {modal.message && <p className="text-sm text-muted-foreground px-6 py-2">{modal.message}</p>}
                {modal.children && <div className="px-6 py-2">{modal.children}</div>}
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => modal.onCancel?.()}>
                    {modal.cancelText || "Cancelar"}
                  </Button>
                  <Button
                    variant={modal.isDangerous ? "destructive" : "default"}
                    onClick={() => modal.onConfirm?.()}
                  >
                    {modal.confirmText || "Confirmar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        }

        if (modal.type === "alert") {
          return (
            <Dialog key={modal.id} open={isOpen} onOpenChange={() => closeModal(modal.id)}>
              <DialogContent className={sizeClasses[size]}>
                <DialogHeader>
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <DialogTitle>{modal.title || "Aviso"}</DialogTitle>
                      {modal.description && <DialogDescription>{modal.description}</DialogDescription>}
                    </div>
                  </div>
                </DialogHeader>
                {modal.message && <p className="text-sm text-muted-foreground px-6 py-2">{modal.message}</p>}
                {modal.children && <div className="px-6 py-2">{modal.children}</div>}
                <DialogFooter>
                  <Button onClick={() => modal.onConfirm?.()}>
                    {modal.confirmText || "OK"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        }

        return null;
      })}
    </>
  );
}
