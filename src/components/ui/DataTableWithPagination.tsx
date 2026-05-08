'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableWithPaginationProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  totalPages?: number;
  currentPage?: number;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onSortChange?: (column: string, order: 'asc' | 'desc') => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  exportable?: boolean;
  onExport?: (format: string) => void;
}

export default function DataTableWithPagination<
  T extends { id: string }
>({
  columns,
  data,
  pageSize = 25,
  totalPages = 1,
  currentPage = 1,
  loading = false,
  onPageChange,
  onSortChange,
  onSelectionChange,
  exportable = false,
  onExport,
}: DataTableWithPaginationProps<T>) {
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleSort = (column: string) => {
    if (!column) return;

    let newOrder: 'asc' | 'desc' = 'asc';
    if (sortColumn === column && sortOrder === 'asc') {
      newOrder = 'desc';
    }

    setSortColumn(column);
    setSortOrder(newOrder);
    onSortChange?.(column, newOrder);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(data.map((item) => item.id));
      setSelectedItems(allIds);
      onSelectionChange?.(Array.from(allIds));
    } else {
      setSelectedItems(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando dados...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-8 flex flex-col items-center justify-center">
          <AlertCircle className="text-gray-400" size={32} />
          <p className="mt-3 text-gray-600">Nenhum registro encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabela */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  checked={selectedItems.size === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-sm font-semibold text-gray-700 ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <>
                        {sortOrder === 'asc' ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="w-12 p-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="rounded"
                  />
                </td>
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 text-sm">
                    {column.render ? column.render(item) : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = currentPage - 2 + i;
              if (pageNum < 1 || pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={`px-3 py-2 rounded ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
