"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
} from "lucide-react";
import { AlertDialogCancel } from "@radix-ui/react-alert-dialog";
import EmailInputSelect from "./EmailInpuSelect";

/**
 * Componente de composição de email com editor rich text
 *
 * Funcionalidades:
 * - Editor de texto formatado (negrito, itálico, alinhamento)
 * - Seleção de cor e tamanho da fonte
 * - Inserção de imagens
 * - Gera HTML formatado para envio via API
 *
 * @param onSend - Callback chamado quando o email é enviado, recebe { subject, htmlContent }
 */
interface EmailComposerProps {
  onSend?: (data: {
    subject: string;
    htmlContent: string;
    emails: string[];
  }) => void;
}

export default function EmailComposer({ onSend }: EmailComposerProps = {}) {
  // Estados do formulário
  const [fromEmail, setFromEmail] = useState(""); // Assunto do email
  const [htmlContent, setHtmlContent] = useState(""); // HTML formatado do corpo do email

  // Estados de formatação (para controle visual dos botões)
  const [fontSize, setFontSize] = useState("14px");
  const [fontColor, setFontColor] = useState("#000000");
  const [textAlign, setTextAlign] = useState<
    "left" | "center" | "right" | "justify"
  >("left");

  // Estados dos botões de formatação (para indicar se estão ativos)
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [alignActive, setAlignActive] = useState<
    "left" | "center" | "right" | "justify" | null
  >(null);

  // Refs para elementos do DOM
  const editorRef = useRef<HTMLDivElement | null>(null); // Referência do editor contentEditable
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Referência do input de arquivo (imagens)

  /* Lista de e-mails adicionados */
  const [emails, setEmails] = useState<string[]>([]);

  /**
   * Foca o editor de texto
   */
  function focusEditor() {
    editorRef.current?.focus();
  }

  /**
   * Limpa e formata o HTML do editor antes de salvar
   * Remove elementos desnecessários e garante formatação consistente
   */
  function cleanHTML(html: string): string {
    // Remove zero-width spaces (usados para manter spans ativos)
    let cleaned = html.replace(/\u200B/g, "");

    // Remove spans vazios que não têm conteúdo útil
    cleaned = cleaned.replace(/<span[^>]*>\s*<\/span>/gi, "");

    // Remove atributos de estilo inline vazios
    cleaned = cleaned.replace(/style=""/g, "");

    // Remove elementos font vazios (legado do execCommand)
    cleaned = cleaned.replace(/<font[^>]*>\s*<\/font>/gi, "");

    // Limpa espaços em branco excessivos, mas preserva quebras de linha
    cleaned = cleaned.replace(/\s+/g, " ").replace(/>\s+</g, "><");

    // Se o conteúdo estiver vazio, retorna string vazia
    if (
      !cleaned.trim() ||
      cleaned.trim() === "<br>" ||
      cleaned.trim() === "<br/>"
    ) {
      return "";
    }

    return cleaned.trim();
  }

  /**
   * Salva o conteúdo HTML formatado do editor no estado htmlContent
   * Esta função é chamada sempre que o conteúdo do editor muda
   */
  function saveHTML() {
    const editor = editorRef.current;
    if (!editor) return;

    // Obtém o HTML bruto do editor
    const rawHTML = editor.innerHTML;

    // Limpa e formata o HTML antes de salvar
    const cleanedHTML = cleanHTML(rawHTML);

    // Atualiza o estado com o HTML formatado
    setHtmlContent(cleanedHTML);
  }

  /**
   * Atualiza os estados visuais dos botões de formatação
   * Verifica qual formatação está ativa na posição atual do cursor/seleção
   */
  function updateButtonStates() {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Verifica se negrito está ativo na posição do cursor
    setIsBoldActive(document.queryCommandState("bold"));

    // Verifica se itálico está ativo na posição do cursor
    setIsItalicActive(document.queryCommandState("italic"));

    // Verifica o alinhamento do elemento onde está o cursor
    const range = selection.getRangeAt(0);
    const parent =
      range.commonAncestorContainer.parentElement ||
      (range.commonAncestorContainer as Element);

    const computedStyle = window.getComputedStyle(parent);
    const textAlign = computedStyle.textAlign;

    // Atualiza o estado do botão de alinhamento ativo
    if (textAlign === "left" || textAlign === "start") {
      setAlignActive("left");
    } else if (textAlign === "center") {
      setAlignActive("center");
    } else if (textAlign === "right" || textAlign === "end") {
      setAlignActive("right");
    } else if (textAlign === "justify") {
      setAlignActive("justify");
    } else {
      setAlignActive(null);
    }
  }

  /**
   * Alterna negrito no texto selecionado ou ativa para próximo texto digitado
   */
  function toggleBold() {
    focusEditor();

    // Aplica ou remove negrito usando o comando nativo do browser
    document.execCommand("bold", false, undefined);

    // Atualiza o estado visual do botão
    const isActive = document.queryCommandState("bold");
    setIsBoldActive(isActive);

    // Salva o HTML atualizado
    saveHTML();
  }

  /**
   * Alterna itálico no texto selecionado ou ativa para próximo texto digitado
   */
  function toggleItalic() {
    focusEditor();

    // Aplica ou remove itálico usando o comando nativo do browser
    document.execCommand("italic", false, undefined);

    // Atualiza o estado visual do botão
    const isActive = document.queryCommandState("italic");
    setIsItalicActive(isActive);

    // Salva o HTML atualizado
    saveHTML();
  }

  /**
   * Altera o alinhamento do texto (esquerda, centro, direita, justificado)
   */
  function changeAlign(align: "left" | "center" | "right" | "justify") {
    focusEditor();

    // Mapeia o alinhamento para o comando execCommand correspondente
    const command = {
      left: "justifyLeft",
      center: "justifyCenter",
      right: "justifyRight",
      justify: "justifyFull",
    }[align];

    // Aplica o alinhamento
    document.execCommand(command, false, undefined);

    // Atualiza os estados
    setTextAlign(align);
    setAlignActive(align);

    // Salva o HTML atualizado
    saveHTML();
  }

  /**
   * Abre o seletor de arquivo para inserir imagem
   */
  function insertLocalImage() {
    fileInputRef.current?.click();
  }

  /**
   * Processa a imagem selecionada e insere no editor como base64
   */
  function handleLocalImageChange() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;

      // Cria o HTML da imagem com estilos inline para compatibilidade com emails
      const html = `<img src="${base64}" style="max-width:100%;height:auto;display:block;margin:12px auto;border-radius:8px;" />`;

      focusEditor();
      document.execCommand("insertHTML", false, html);
      saveHTML();
    };
    reader.readAsDataURL(file);
  }

  /**
   * Aplica cor ou tamanho da fonte no texto selecionado ou no próximo texto digitado
   *
   * @param property - Tipo de propriedade: "foreColor" (cor) ou "fontSize" (tamanho)
   * @param value - Valor da propriedade (hex para cor, px para tamanho)
   */
  function applyTextStyle(property: "foreColor" | "fontSize", value: string) {
    focusEditor();

    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const hasSelection = !selection.isCollapsed;

    if (property === "foreColor") {
      // Aplica cor usando comando nativo (funciona para seleção e próximo texto)
      document.execCommand("foreColor", false, value);
    } else if (property === "fontSize") {
      if (hasSelection) {
        // Para texto selecionado: envolve em um span com o tamanho específico
        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.style.fontSize = value;

        try {
          // Extrai o conteúdo selecionado e envolve no span
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);

          // Restaura a seleção dentro do span
          selection.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          newRange.collapse(false); // Coloca o cursor no final do span
          selection.addRange(newRange);
        } catch (e) {
          // Fallback: se não conseguir envolver, insere HTML diretamente
          const html = `<span style="font-size: ${value}">${range.toString()}</span>`;
          document.execCommand("insertHTML", false, html);
        }
      } else {
        // Para próximo texto: insere um span vazio que será preenchido ao digitar
        const span = document.createElement("span");
        span.style.fontSize = value;
        span.innerHTML = "\u200B"; // Zero-width space para manter o span ativo
        const html = span.outerHTML;
        document.execCommand("insertHTML", false, html);

        // Move o cursor para dentro do span (será limpo na função cleanHTML)
        setTimeout(() => {
          const newSelection = document.getSelection();
          if (newSelection && newSelection.rangeCount > 0) {
            const newRange = newSelection.getRangeAt(0);
            const spanElement = editorRef.current?.querySelector(
              'span[style*="font-size"]'
            );
            if (spanElement) {
              newRange.setStart(spanElement, 1);
              newRange.collapse(true);
              newSelection.removeAllRanges();
              newSelection.addRange(newRange);
            }
          }
        }, 0);
      }
    }

    saveHTML();
  }

  /**
   * Handler chamado quando a seleção do texto muda
   * Atualiza os estados dos botões para refletir a formatação atual
   */
  function handleSelectionChange() {
    updateButtonStates();
  }

  /**
   * Handler chamado quando o conteúdo do editor muda (digitação, formatação, etc)
   * Salva o HTML formatado e atualiza os estados dos botões
   */
  function handleInput() {
    saveHTML();
    // Pequeno delay para garantir que a seleção foi atualizada antes de verificar estados
    setTimeout(updateButtonStates, 0);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        // Chama o callback onSend se fornecido, passando assunto e HTML
        if (onSend) {
          onSend({
            subject: fromEmail,
            htmlContent,
            emails,
          });
        }

        // Log para debug
        console.log("Assunto:", fromEmail);
        console.log("HTML do corpo do email:", htmlContent);
      }}
      className="w-full flex justify-center"
    >
      <div className="w-full bg-white p-5 flex flex-col gap-4">
        {/* Campo de assunto do email */}
        <EmailInputSelect value={emails} onChange={setEmails} />

        <Input
          type="text"
          placeholder="Assunto do email"
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          className="rounded-2xl h-12"
        />

        {/* Editor de texto formatado (contentEditable) */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyUp={handleSelectionChange}
          onClick={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          onBlur={handleSelectionChange}
          onSelect={handleSelectionChange}
          className="w-full h-[160px] border rounded-2xl p-3 outline-none text-sm overflow-y-auto"
          style={{ fontSize: "14px", color: "#000000", textAlign: "left" }}
          data-placeholder="Escreva o corpo do email aqui..."
        />

        {/* Input oculto para seleção de imagens */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLocalImageChange}
        />

        {/* Toolbar de formatação */}
        <div className="flex flex-wrap items-center gap-2 border-t pt-3 mt-2 text-gray-600">
          {/* Botão Negrito */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={toggleBold}
            className={isBoldActive ? "bg-gray-200 rounded-xl" : "rounded-xl"}
            title="Negrito (Ctrl+B)"
          >
            <Bold size={16} />
          </Button>

          {/* Botão Itálico */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={toggleItalic}
            className={isItalicActive ? "bg-gray-200 rounded-xl" : "rounded-xl"}
            title="Itálico (Ctrl+I)"
          >
            <Italic size={16} />
          </Button>

          {/* Botões de Alinhamento */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => changeAlign("left")}
            className={
              alignActive === "left" ? "bg-gray-200 rounded-xl" : "rounded-xl"
            }
            title="Alinhar à esquerda"
          >
            <AlignLeft size={16} />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => changeAlign("center")}
            className={
              alignActive === "center" ? "bg-gray-200 rounded-xl" : "rounded-xl"
            }
            title="Centralizar"
          >
            <AlignCenter size={16} />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => changeAlign("right")}
            className={
              alignActive === "right" ? "bg-gray-200 rounded-xl" : "rounded-xl"
            }
            title="Alinhar à direita"
          >
            <AlignRight size={16} />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => changeAlign("justify")}
            className={
              alignActive === "justify"
                ? "bg-gray-200 rounded-xl"
                : "rounded-xl"
            }
            title="Justificar texto"
          >
            <AlignJustify size={16} />
          </Button>

          {/* Seletor de Cor */}
          <input
            type="color"
            value={fontColor}
            onChange={(e) => {
              const newColor = e.target.value;
              setFontColor(newColor);
              applyTextStyle("foreColor", newColor);
            }}
            className="w-7 h-7 cursor-pointer bg-transparent"
            title="Cor do texto"
          />

          {/* Seletor de Tamanho da Fonte */}
          <select
            value={fontSize}
            onChange={(e) => {
              const size = e.target.value;
              setFontSize(size);
              applyTextStyle("fontSize", size);
            }}
            className="border rounded-xl px-2 py-1 text-xs bg-white cursor-pointer"
            title="Tamanho da fonte"
          >
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
          </select>

          {/* Botão Inserir Imagem */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={insertLocalImage}
            className="rounded-xl"
            title="Inserir imagem"
          >
            <ImageIcon size={16} />
          </Button>
        </div>

        <div className="mt-2 flex w-full items-center justify-between">
          {/* Botão de Envio */}
          <Button
            type="submit"
            className="w-[45%] rounded-2xl py-6 text-md cursor-pointer"
          >
            Enviar Email
          </Button>

          {/* Botão de Cancelar */}
          <AlertDialogCancel className="w-[45%] rounded-2xl py-3 text-md border cursor-pointer transition-colors duration-300 hover:bg-black/90 hover:text-white">
            Cancelar
          </AlertDialogCancel>
        </div>
      </div>
    </form>
  );
}
