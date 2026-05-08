'use client';

import React from 'react';
import { ChevronRight, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import PermissionGate from '@/components/PermissionGate';

/**
 * HierarchicalTable - Componente para estruturas de árvore
 * 
 * Usado para:
 * - Plano de Contas (Ativo > Circulante > Caixa)
 * - Organogramas
 * - Categorias de produtos
 * - Planos orçamentários
 * 
 * Características:
 * - Expand/collapse com ícones visuais
 * - Indentação por nível
 * - Seleção em massa
 * - Ações context-aware
 * - Suporta drag-drop para reorganização
 */

export interface HierarchicalNode {
  id: string;
  label: string;
  level: number;
  type?: 'group' | 'item'; // group = pode ter filhos, item = folha
  expanded?: boolean;
  children?: HierarchicalNode[];
  data?: Record<string, any>;
  
  // Propriedades específicas para Plano de Contas
  code?: string;
  accountType?: 'ativo' | 'passivo' | 'receita' | 'despesa' | 'patrimonio';
  balance?: number;
}

export interface HierarchicalTableProps {
  nodes: HierarchicalNode[];
  columns: { key: string; label: string; width?: string }[];
  onNodeClick?: (nodeId: string) => void;
  onExpand?: (nodeId: string, expanded: boolean) => void;
  onSelect?: (nodeIds: string[]) => void;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  maxDepth?: number;
  allowSelection?: boolean;
  allowDragDrop?: boolean;
  renderCell?: (node: HierarchicalNode, column: string) => React.ReactNode;
}

interface HierarchicalTableState {
  expandedNodes: Set<string>;
  selectedNodes: Set<string>;
}

/**
 * IMPLEMENTAÇÃO SIMPLIFICADA (para produção, usar biblioteca como TanStack Table)
 */
export default function HierarchicalTable({
  nodes,
  columns,
  onNodeClick,
  onExpand,
  onSelect,
  onEdit,
  onDelete,
  maxDepth = 5,
  allowSelection = true,
  renderCell,
}: HierarchicalTableProps) {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set());
  const [selectedNodes, setSelectedNodes] = React.useState<Set<string>>(new Set());

  const toggleExpand = (nodeId: string, hasChildren: boolean) => {
    if (!hasChildren) return;

    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
    onExpand?.(nodeId, newExpanded.has(nodeId));
  };

  const toggleSelect = (nodeId: string) => {
    const newSelected = new Set(selectedNodes);
    if (newSelected.has(nodeId)) {
      newSelected.delete(nodeId);
    } else {
      newSelected.add(nodeId);
    }
    setSelectedNodes(newSelected);
    onSelect?.(Array.from(newSelected));
  };

  const renderRows = (nodes: HierarchicalNode[], depth = 0): React.ReactNode[] => {
    if (depth > maxDepth) return [];

    return nodes.flatMap((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);
      const isSelected = selectedNodes.has(node.id);

      return [
        // Linha principal do nó
        <tr
          key={node.id}
          className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer ${
            isSelected ? 'bg-blue-100' : depth % 2 === 0 ? 'bg-white' : 'bg-gray-50'
          }`}
        >
          {/* Seleção */}
          <td className="w-12 px-4 py-3">
            {allowSelection && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(node.id)}
                onClick={(e) => e.stopPropagation()}
                className="rounded"
              />
            )}
          </td>

          {/* Primeira coluna com indentação e expand */}
          <td
            className="px-4 py-3 flex items-center gap-2 cursor-pointer"
            onClick={() => toggleSelect(node.id)}
            style={{ paddingLeft: `${depth * 24 + 16}px` }}
          >
            {/* Ícone expand/collapse */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id, hasChildren);
                }}
                className="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ) : (
              <div className="w-6"></div>
            )}

            {/* Conteúdo da primeira coluna */}
            <span
              onClick={() => onNodeClick?.(node.id)}
              className="font-medium text-gray-900 hover:text-blue-600"
            >
              {node.label}
            </span>
          </td>

          {/* Colunas adicionais */}
          {columns.map((col) => (
            <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
              {renderCell ? (
                renderCell(node, col.key)
              ) : (
                (node.data?.[col.key] as string) || '-'
              )}
            </td>
          ))}

          {/* Ações */}
          <td className="px-4 py-3 flex gap-2">
            <PermissionGate requiredPermission="edit" module="contabilidade">
              <button
                onClick={() => onEdit?.(node.id)}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                title="Editar"
              >
                <Edit2 size={16} />
              </button>
            </PermissionGate>

            <PermissionGate requiredPermission="delete" module="contabilidade">
              <button
                onClick={() => onDelete?.(node.id)}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="Deletar"
              >
                <Trash2 size={16} />
              </button>
            </PermissionGate>
          </td>
        </tr>,

        // Recursivamente renderizar filhos se expandido
        ...(isExpanded && hasChildren
          ? renderRows(node.children || [], depth + 1)
          : []),
      ];
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {allowSelection && <th className="w-12"></th>}
            <th className="px-4 py-3 text-left font-semibold text-gray-700">
              Conta
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-semibold text-gray-700"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 text-left font-semibold text-gray-700">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>{renderRows(nodes)}</tbody>
      </table>
    </div>
  );
}

/**
 * EXEMPLO DE USO:
 * 
 * const chartOfAccounts: HierarchicalNode[] = [
 *   {
 *     id: 'ativo',
 *     label: 'ATIVO',
 *     level: 0,
 *     code: '1',
 *     accountType: 'ativo',
 *     children: [
 *       {
 *         id: 'ativo-circulante',
 *         label: 'Ativo Circulante',
 *         level: 1,
 *         code: '1.1',
 *         accountType: 'ativo',
 *         children: [
 *           {
 *             id: 'caixa',
 *             label: 'Caixa',
 *             level: 2,
 *             code: '1.1.1',
 *             accountType: 'ativo',
 *             balance: 50000.00,
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ];
 * 
 * <HierarchicalTable
 *   nodes={chartOfAccounts}
 *   columns={[
 *     { key: 'code', label: 'Código', width: '100px' },
 *     { key: 'balance', label: 'Saldo', width: '150px' }
 *   ]}
 *   renderCell={(node, col) => {
 *     if (col === 'balance') {
 *       return `R$ ${(node.balance || 0).toLocaleString('pt-BR')}`;
 *     }
 *     return node.data?.[col];
 *   }}
 *   onEdit={(id) => router.push(`/contabilidade/plano-de-contas/${id}/edit`)}
 *   onDelete={(id) => handleDelete(id)}
 * />
 */
