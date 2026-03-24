"use client";

import React, { createContext, useState, useCallback, useRef } from "react";

export type ModalType = "confirm" | "alert" | "form" | "custom";

export interface ModalConfig {
  id?: string;
  type: ModalType;
  title?: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export interface ModalsContextType {
  openConfirm: (config: Omit<ModalConfig, "type">) => Promise<boolean>;
  openAlert: (config: Omit<ModalConfig, "type">) => Promise<void>;
  closeModal: (id?: string) => void;
  modals: ModalConfig[];
}

export const ModalsContext = createContext<ModalsContextType | undefined>(undefined);

export function ModalsProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<ModalConfig[]>([]);
  const confirmPromisesRef = useRef<{ [key: string]: (value: boolean) => void }>({});

  const generateId = () => `modal-${Date.now()}-${Math.random()}`;

  const openConfirm = useCallback(
    (config: Omit<ModalConfig, "type">): Promise<boolean> => {
      return new Promise((resolve) => {
        const id = config.id || generateId();
        
        const wrappedOnConfirm = async () => {
          if (config.onConfirm) {
            try {
              await config.onConfirm();
            } catch (error) {
              console.error("Error in onConfirm:", error);
            }
          }
          setModals((prev) => prev.filter((m) => m.id !== id));
          confirmPromisesRef.current[id]?.(true);
          delete confirmPromisesRef.current[id];
        };

        const wrappedOnCancel = () => {
          if (config.onCancel) {
            config.onCancel();
          }
          setModals((prev) => prev.filter((m) => m.id !== id));
          confirmPromisesRef.current[id]?.(false);
          delete confirmPromisesRef.current[id];
        };

        const modalConfig: ModalConfig = {
          ...config,
          type: "confirm",
          id,
          onConfirm: wrappedOnConfirm,
          onCancel: wrappedOnCancel,
        };

        setModals((prev) => [...prev, modalConfig]);
        confirmPromisesRef.current[id] = resolve;
      });
    },
    [],
  );

  const openAlert = useCallback(
    (config: Omit<ModalConfig, "type">): Promise<void> => {
      return new Promise((resolve) => {
        const id = config.id || generateId();

        const wrappedOnConfirm = async () => {
          if (config.onConfirm) {
            try {
              await config.onConfirm();
            } catch (error) {
              console.error("Error in onConfirm:", error);
            }
          }
          setModals((prev) => prev.filter((m) => m.id !== id));
          resolve();
        };

        const modalConfig: ModalConfig = {
          ...config,
          type: "alert",
          id,
          confirmText: config.confirmText || "OK",
          onConfirm: wrappedOnConfirm,
        };

        setModals((prev) => [...prev, modalConfig]);
      });
    },
    [],
  );

  const closeModal = useCallback((id?: string) => {
    setModals((prev) => (id ? prev.filter((m) => m.id !== id) : []));
  }, []);

  return (
    <ModalsContext.Provider
      value={{
        openConfirm,
        openAlert,
        closeModal,
        modals,
      }}
    >
      {children}
    </ModalsContext.Provider>
  );
}
