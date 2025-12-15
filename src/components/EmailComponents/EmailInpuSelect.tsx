"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

type Props = {
  value?: string[];
  onChange?: (emails: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  id?: string;
};

export default function EmailInputSelect({
  value = [],
  onChange,
  placeholder = "To: exemplo@email.com",
  maxItems = 50,
  id,
}: Props) {
  const [emails, setEmails] = useState<string[]>(value);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setEmails(value);
  }, [value]);

  useEffect(() => onChange?.(emails), [emails, onChange]);

  function isValidEmail(email: string) {
    // simples validação RFC-lite
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }

  function normalizeAndSplit(raw: string) {
    // aceita vírgula, ponto-e-vírgula, espaço ou quebra de linha
    return raw
      .split(/[,;\n\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);
  }

  function addEmailsFromString(raw: string) {
    const parts = normalizeAndSplit(raw);
    if (!parts.length) return;
    const newOnes = parts.filter(
      (p) => p && emails.indexOf(p) === -1 && emails.length + 1 <= maxItems
    );
    if (newOnes.length) setEmails((prev) => [...prev, ...newOnes]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      addEmailsFromString(input);
      setInput("");
    } else if (e.key === "Backspace" && input === "" && emails.length) {
      // remove a última ao apertar backspace com input vazio
      setEmails((prev) => prev.slice(0, -1));
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (text.includes(",") || text.includes("@") || text.includes(";")) {
      e.preventDefault();
      addEmailsFromString(text);
      setInput("");
    }
  }

  function removeEmail(i: number) {
    setEmails((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onBlur() {
    if (input.trim()) {
      addEmailsFromString(input);
      setInput("");
    }
  }

  return (
    <div className="w-full">
      <label htmlFor={id} className="sr-only">
        To
      </label>

      <div
        className={`min-h-12 flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900`}
      >
        {/* chips area */}
        <div className="max-h-[160px] px-4 py-2 overflow-y-auto flex flex-wrap gap-4 items-center flex-1">
          {emails.map((e, i) => (
            <span
              key={e + i}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800`}
              title={e}
            >
              <span className="truncate max-w-[18rem]">{e}</span>
              <button
                type="button"
                aria-label={`Remover ${e}`}
                onClick={() => removeEmail(i)}
                className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {/* input */}
          <div className="flex-1 min-w-[120px]">
            <Input
              id={id}
              ref={inputRef}
              value={input}
              onChange={(ev) => setInput(ev.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={onBlur}
              placeholder={emails.length ? "" : placeholder}
              className="bg-transparent border-0 shadow-none p-0 ring-0"
            />
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Pressione Enter, vírgula, ponto-e-vírgula ou cole uma lista para
        adicionar.
      </p>
    </div>
  );
}
