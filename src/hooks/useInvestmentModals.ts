"use client";

import { useCallback } from "react";
import { useModals } from "@/hooks/useModals";

export function useInvestmentModals() {
  const { openConfirm, openAlert } = useModals();

  const confirmDeletePortfolio = useCallback(
    async (portfolioName: string, assetCount: number, onConfirm?: () => Promise<void>) => {
      const confirmed = await openConfirm({
        title: "Excluir Carteira",
        message: onConfirm
          ? `Tem certeza que deseja excluir a carteira "${portfolioName}"? Todos os ${assetCount} ativo(s) vinculado(s) também serão removidos.`
          : `Carteira "${portfolioName}"`,
        confirmText: "Sim, excluir",
        cancelText: "Cancelar",
        isDangerous: true,
        onConfirm,
      });
      return confirmed;
    },
    [openConfirm],
  );

  const confirmDeleteAsset = useCallback(
    async (
      assetName: string,
      quantity: number,
      currentValue: number,
      onConfirm?: () => Promise<void>,
    ) => {
      const confirmed = await openConfirm({
        title: "Remover Ativo",
        message: `Deseja remover "${assetName}"?\n\nQuantidade: ${quantity} unidades\nValor Atual: R$ ${currentValue.toFixed(2)}`,
        confirmText: "Sim, remover",
        cancelText: "Cancelar",
        isDangerous: true,
        onConfirm,
      });
      return confirmed;
    },
    [openConfirm],
  );

  const confirmDeleteContribution = useCallback(
    async (
      type: string,
      value: number,
      date: string,
      onConfirm?: () => Promise<void>,
    ) => {
      const confirmed = await openConfirm({
        title: "Excluir Aporte",
        message: `Tem certeza que deseja excluir este aporte?\n\nTipo: ${type}\nValor: R$ ${value.toFixed(2)}\nData: ${new Intl.DateTimeFormat('pt-BR').format(new Date(date))}`,
        confirmText: "Sim, excluir",
        cancelText: "Cancelar",
        isDangerous: true,
        onConfirm,
      });
      return confirmed;
    },
    [openConfirm],
  );

  const confirmDeleteFinancialFlow = useCallback(
    async (
      category: string,
      value: number,
      type: string,
      onConfirm?: () => Promise<void>,
    ) => {
      const confirmed = await openConfirm({
        title: "Excluir Lançamento",
        message: `Tem certeza que deseja excluir este lançamento?\n\nCategoria: ${category}\nValor: R$ ${value.toFixed(2)}\nTipo: ${type === 'income' ? 'Receita' : 'Despesa'}`,
        confirmText: "Sim, excluir",
        cancelText: "Cancelar",
        isDangerous: true,
        onConfirm,
      });
      return confirmed;
    },
    [openConfirm],
  );

  const confirmDeleteDividend = useCallback(
    async (
      assetName: string,
      value: number,
      date: string,
      onConfirm?: () => Promise<void>,
    ) => {
      const confirmed = await openConfirm({
        title: "Excluir Dividendo",
        message: `Tem certeza que deseja excluir este dividendo?\n\nAtivo: ${assetName}\nValor: R$ ${value.toFixed(2)}\nData: ${new Intl.DateTimeFormat('pt-BR').format(new Date(date))}`,
        confirmText: "Sim, excluir",
        cancelText: "Cancelar",
        isDangerous: true,
        onConfirm,
      });
      return confirmed;
    },
    [openConfirm],
  );

  const confirmDeleteFinancialGoal = useCallback(
    async (
      goalName: string,
      targetAmount: number,
      onConfirm?: () => Promise<void>,
    ) => {
      const confirmed = await openConfirm({
        title: "Excluir Meta",
        message: `Tem certeza que deseja excluir a meta "${goalName}"?\n\nValor da Meta: R$ ${targetAmount.toFixed(2)}`,
        confirmText: "Sim, excluir",
        cancelText: "Cancelar",
        isDangerous: true,
        onConfirm,
      });
      return confirmed;
    },
    [openConfirm],
  );

  const showSuccessAlert = useCallback(
    async (title: string, message: string) => {
      return openAlert({
        title,
        message,
        confirmText: "OK",
      });
    },
    [openAlert],
  );

  const showErrorAlert = useCallback(
    async (title: string = "Erro", message: string) => {
      return openAlert({
        title,
        message,
        confirmText: "OK",
      });
    },
    [openAlert],
  );

  return {
    confirmDeletePortfolio,
    confirmDeleteAsset,
    confirmDeleteContribution,
    confirmDeleteFinancialFlow,
    confirmDeleteDividend,
    confirmDeleteFinancialGoal,
    showSuccessAlert,
    showErrorAlert,
  };
}
