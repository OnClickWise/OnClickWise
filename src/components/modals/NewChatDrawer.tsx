"use client";

import { ArrowLeft, Search, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface NewChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (phone: string, name: string) => Promise<void>;
  contacts: Contact[];
}

export function NewChatDrawer({ isOpen, onClose, onSelectContact, contacts }: NewChatDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  // Filtro básico para a busca
  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    contact.phone.includes(searchTerm)
  );

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 z-50 bg-white flex flex-col border-r border-[#e9edef]"
    >
      {/* Header com fundo branco e borda discreta */}
      <div className="h-[60px] bg-white flex items-center px-4 gap-6 shrink-0 border-b border-[#f0f2f5]">
        <button 
          onClick={onClose} 
          className="text-[#54656f] hover:text-[#111b21] transition-colors flex items-center gap-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-[16px] text-[#111b21]">Nova conversa</span>
        </button>
      </div>

      {/* Busca de Contatos - Exatamente igual ao seu componente principal */}
      <div className="px-3 py-2 bg-white shrink-0">
        <div className="flex items-center bg-[#f0f2f5] rounded-full px-4 h-10 border border-transparent hover:border-[#dee1e3] transition-all">
          <Search size={16} className="text-[#54656f] shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar ou começar uma nova conversa"
            className="bg-transparent border-none outline-none focus:ring-0 w-full h-full ml-3 text-[14.5px] text-[#111b21] placeholder:text-[#667781] placeholder:font-light"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Contatos */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="px-6 py-5 text-[#00a884] text-[14px] font-normal uppercase">
          Seus Contatos
        </div>

        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact.phone, contact.name)}
              className="flex items-center px-3 h-[72px] hover:bg-[#f5f6f6] cursor-pointer transition-colors"
            >
              <div className="h-12 w-12 bg-[#dfe5e7] rounded-full flex items-center justify-center mr-3 text-[#54656f] shrink-0">
                <UserCircle size={32} strokeWidth={1.2} />
              </div>
              
              <div className="flex-1 min-w-0 border-b border-[#f2f2f2] h-full flex flex-col justify-center">
                <h3 className="text-[16px] text-[#111b21] truncate font-normal">
                  {contact.name || contact.phone}
                </h3>
                <p className="text-[13px] text-[#667781] truncate">Disponível</p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-[#667781] text-sm">
            <p>Nenhum contato encontrado.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}