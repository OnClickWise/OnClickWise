'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import PermissionGate from '@/components/PermissionGate';

/**
 * DoubleEntryForm - Formulário para lançamentos contábeis duplos
 * 
 * Princípio Fundamental da Contabilidade:
 * Para cada lançamento, Débitos = Créditos
 * 
 * Características:
 * - Validação automática de saldo
 * - Adição/remoção dinâmica de linhas
 * - Autocomplete de contas
 * - Cálculo em tempo real
 * - Histórico de rascunhos
 */

export interface DoubleEntryLine {
  id: string; // UUID
  accountId: string;
  accountCode?: string;
  accountName?: string;
  description: string;
  debit?: number; // Débito
  credit?: number; // Crédito
  documentRef?: string; // NF, Boleto, etc.
}

export interface DoubleEntryFormProps {
  title: string;
  entries: DoubleEntryLine[];
  onEntriesChange: (entries: DoubleEntryLine[]) => void;
  onValidation?: (isValid: boolean, message?: string) => void;
  accounts: { id: string; code: string; name: string; type: string }[];
  onSubmit?: (entries: DoubleEntryLine[]) => Promise<void>;
  readOnly?: boolean;
}

interface ValidationMessage {
  type: 'error' | 'warning' | 'success';
  message: string;
}

export default function DoubleEntryForm({
  title,
  entries,
  onEntriesChange,
  onValidation,
  accounts,
  onSubmit,
  readOnly = false,
}: DoubleEntryFormProps) {
  const [validationMsg, setValidationMsg] = useState<ValidationMessage | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  // =========================================================================
  // CÁLCULOS
  // =========================================================================

  const totalDebits = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
  const totalCredits = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
  const difference = totalDebits - totalCredits;
  const isBalanced = Math.abs(difference) < 0.01; // Tolerância para arredondamento

  // =========================================================================
  // VALIDAÇÃO
  // =========================================================================

  useEffect(() => {
    let message = '';
    let type: 'error' | 'warning' | 'success' = 'error';

    if (entries.length === 0) {
      message = 'Adicione pelo menos um débito e um crédito';
      type = 'error';
    } else if (entries.some((e) => !e.accountId)) {
      message = 'Preencha todas as contas';
      type = 'error';
    } else if (entries.some((e) => !e.description)) {
      message = 'Preencha todas as descrições';
      type = 'error';
    } else if (totalDebits === 0 || totalCredits === 0) {
      message = 'Deve haver pelo menos um débito e um crédito';
      type = 'error';
    } else if (!isBalanced) {
      message = `Desbalanceado: Débito R$ ${totalDebits.toFixed(
        2
      )} ≠ Crédito R$ ${totalCredits.toFixed(2)} (diferença: R$ ${Math.abs(
        difference
      ).toFixed(2)})`;
      type = 'error';
    } else {
      message = '✅ Lançamento balanceado e pronto para envio';
      type = 'success';
    }

    setValidationMsg({ type, message });
    onValidation?.(isBalanced && entries.length > 0, message);
  }, [entries, isBalanced, totalDebits, totalCredits, difference, onValidation]);

  // =========================================================================
  // OPERAÇÕES
  // =========================================================================

  const addLine = () => {
    const newLine: DoubleEntryLine = {
      id: Math.random().toString(36).substr(2, 9),
      accountId: '',
      description: '',
      debit: undefined,
      credit: undefined,
    };
    onEntriesChange([...entries, newLine]);
  };

  const removeLine = (id: string) => {
    if (entries.length <= 2) {
      setValidationMsg({
        type: 'error',
        message: 'Mínimo 2 linhas (1 débito + 1 crédito)',
      });
      return;
    }
    onEntriesChange(entries.filter((entry) => entry.id !== id));
  };

  const updateLine = (
    id: string,
    updates: Partial<DoubleEntryLine>
  ) => {
    onEntriesChange(
      entries.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      )
    );
  };

  const handleAccountChange = (id: string, accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    updateLine(id, {
      accountId,
      accountCode: account?.code,
      accountName: account?.name,
    });
  };

  const handleDebitChange = (id: string, value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    updateLine(id, {
      debit: numValue,
      credit: undefined, // Garantir que não há tanto débito quanto crédito
    });
  };

  const handleCreditChange = (id: string, value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    updateLine(id, {
      credit: numValue,
      debit: undefined, // Garantir que não há tanto débito quanto crédito
    });
  };

  const handleSubmit = async () => {
    if (!isBalanced) {
      setValidationMsg({
        type: 'error',
        message: 'Lançamento não está balanceado',
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.(entries);
      setValidationMsg({
        type: 'success',
        message: 'Lançamento criado com sucesso!',
      });
    } catch (error) {
      setValidationMsg({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao criar lançamento',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600 text-sm mt-1">
          Débito (D) = Crédito (C) - Regra fundamental da contabilidade
        </p>
      </div>

      {/* Validation Message */}
      {validationMsg && (
        <div
          className={`flex gap-3 p-4 rounded ${
            validationMsg.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : validationMsg.type === 'warning'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-green-50 border border-green-200'
          }`}
        >
          <AlertCircle
            className={
              validationMsg.type === 'error'
                ? 'text-red-600'
                : validationMsg.type === 'warning'
                ? 'text-yellow-600'
                : 'text-green-600'
            }
            size={20}
          />
          <p
            className={
              validationMsg.type === 'error'
                ? 'text-red-700'
                : validationMsg.type === 'warning'
                ? 'text-yellow-700'
                : 'text-green-700'
            }
          >
            {validationMsg.message}
          </p>
        </div>
      )}

      {/* Tabela de lançamentos */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Conta
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Descrição
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Débito (D)
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Crédito (C)
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                {/* Conta */}
                <td className="px-4 py-3">
                  <Select
                    value={entry.accountId}
                    onValueChange={(value) =>
                      handleAccountChange(entry.id, value)
                    }
                    disabled={readOnly}
                  >
                    <option value="">Selecione uma conta</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </Select>
                </td>

                {/* Descrição */}
                <td className="px-4 py-3">
                  <Input
                    value={entry.description}
                    onChange={(e) =>
                      updateLine(entry.id, { description: e.target.value })
                    }
                    placeholder="Ex: Venda de produtos"
                    disabled={readOnly}
                  />
                </td>

                {/* Débito */}
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    step="0.01"
                    value={entry.debit || ''}
                    onChange={(e) => handleDebitChange(entry.id, e.target.value)}
                    placeholder="0,00"
                    disabled={readOnly}
                    className="text-right"
                  />
                </td>

                {/* Crédito */}
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    step="0.01"
                    value={entry.credit || ''}
                    onChange={(e) => handleCreditChange(entry.id, e.target.value)}
                    placeholder="0,00"
                    disabled={readOnly}
                    className="text-right"
                  />
                </td>

                {/* Ações */}
                <td className="px-4 py-3 text-center">
                  {!readOnly && (
                    <PermissionGate
                      requiredPermission="delete"
                      module="contabilidade"
                      action="disable"
                    >
                      <button
                        onClick={() => removeLine(entry.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </PermissionGate>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr className="font-semibold">
              <td colSpan={2} className="px-4 py-3 text-right">
                TOTAIS:
              </td>
              <td className="px-4 py-3 text-right text-lg text-blue-600">
                R$ {totalDebits.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right text-lg text-blue-600">
                R$ {totalCredits.toFixed(2)}
              </td>
              <td></td>
            </tr>
            {!isBalanced && (
              <tr className="text-red-600 font-semibold">
                <td colSpan={2} className="px-4 py-3 text-right">
                  DIFERENÇA:
                </td>
                <td colSpan={3} className="px-4 py-3 text-right text-lg">
                  R$ {Math.abs(difference).toFixed(2)}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* Ações */}
      <div className="flex gap-2 justify-between">
        {!readOnly && (
          <PermissionGate
            requiredPermission="create"
            module="contabilidade"
            action="disable"
          >
            <button
              onClick={addLine}
              className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
            >
              <Plus size={18} />
              Adicionar Linha
            </button>
          </PermissionGate>
        )}

        <div className="flex gap-2 ml-auto">
          {!readOnly && (
            <PermissionGate
              requiredPermission="create"
              module="contabilidade"
              action="disable"
            >
              <button
                onClick={handleSubmit}
                disabled={!isBalanced || submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : 'Salvar Lançamento'}
              </button>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* Dicas */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-700">
        <p className="font-semibold mb-2">💡 Dica: Regras de Lançamento</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Débito aumenta Ativo e Despesa; reduz Passivo, PL e Receita</li>
          <li>Crédito reduz Ativo e Despesa; aumenta Passivo, PL e Receita</li>
          <li>Sempre registre em pares (uma conta em D, outra em C)</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * EXEMPLO DE USO:
 * 
 * const [entries, setEntries] = useState<DoubleEntryLine[]>([]);
 * const [canSubmit, setCanSubmit] = useState(false);
 * 
 * <DoubleEntryForm
 *   title="Novo Lançamento Contábil"
 *   entries={entries}
 *   onEntriesChange={setEntries}
 *   onValidation={(valid) => setCanSubmit(valid)}
 *   accounts={chartOfAccounts}
 *   onSubmit={async (entries) => {
 *     const response = await fetchData('/api/accounting/entries', {
 *       method: 'POST',
 *       body: JSON.stringify({ entries }),
 *     });
 *     if (!response.success) throw new Error(response.error);
 *   }}
 * />
 */
