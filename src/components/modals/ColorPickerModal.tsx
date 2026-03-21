"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react";

const COLORS: Record<string, { name: string; hex: string; tailwind: string }> = {
  red:    { name: "Vermelho", hex: "#f44336", tailwind: "bg-red-500" },
  orange: { name: "Laranja", hex: "#ff9800", tailwind: "bg-orange-500" },
  yellow: { name: "Amarelo", hex: "#ffca28", tailwind: "bg-yellow-400" },
  lime:   { name: "Lima", hex: "#8bc34a", tailwind: "bg-lime-500" },
  green:  { name: "Verde", hex: "#4caf50", tailwind: "bg-green-600" },
  teal:   { name: "Azul Petróleo", hex: "#009688", tailwind: "bg-teal-600" },
  blue:   { name: "Azul", hex: "#2196f3", tailwind: "bg-blue-500" },
  purple: { name: "Roxo", hex: "#9c27b0", tailwind: "bg-purple-600" },
  pink:   { name: "Rosa", hex: "#e91e63", tailwind: "bg-pink-500" },
};

export function ColorPickerModal({
  isOpen,
  onClose,
  onSelect,
  currentColor,
  title = "Escolha uma cor",
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (colorKey: string) => void;
  currentColor?: string;
  title?: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-96 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-2xl border border-white/20 dark:border-white/10 p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color Grid */}
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(COLORS).map(([key, { name, hex, tailwind }]) => (
            <button
              key={key}
              onClick={() => {
                onSelect(key);
                onClose();
              }}
              className={`group relative p-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 ${
                currentColor === key
                  ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-blue-500"
                  : ""
              }`}
            >
              {/* Color Circle */}
              <div
                className={`w-12 h-12 rounded-full shadow-md transition-transform group-hover:scale-110 ${
                  currentColor === key ? "ring-2 ring-white shadow-lg" : ""
                }`}
                style={{ backgroundColor: hex }}
              />

              {/* Checkmark if selected */}
              {currentColor === key && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Color Name */}
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 text-center">
                {name}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          {currentColor && (
            <button
              onClick={() => {
                onSelect(currentColor);
                onClose();
              }}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              Confirmar
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
