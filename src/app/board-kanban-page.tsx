"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@/lib/dnd-kit";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';
import { getLists, List, createList, updateList } from "@/services/listService";
import { getCards, Card, createCard, updateCard } from "@/services/cardService";
import { useDeleteList } from "../hooks/useDeleteList";
import { useDeleteCard } from "../hooks/useDeleteCard";
import CardModal from "@/components/ui/CardModal";
import { useSearchParams } from "next/navigation";

function SortableList({list, children}: {list: List, children: React.ReactNode}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: list.id});
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="kanban-list" {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function SortableCard({card, children}: {card: Card, children: React.ReactNode}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: card.id});
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };
  return (
    <li ref={setNodeRef} style={style} className="kanban-card-item" {...attributes} {...listeners}>
      {children}
    </li>
  );
}

export default function BoardKanbanPage() {
    // Modal de detalhes do cartão
    const [modalCardId, setModalCardId] = useState<string | null>(null);
    // Drag and drop states
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const sensors = useSensors(useSensor(PointerSensor));

    // Helper: get card by id
    const getCardById = (id: string) => cards.find((c) => c.id === id);
    const getListById = (id: string) => lists.find((l) => l.id === id);
  const searchParams = useSearchParams();
  const boardId = searchParams.get("boardId");
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [search, setSearch] = useState("");
  const [newCardTitles, setNewCardTitles] = useState<{ [listId: string]: string }>({});
  const [creatingCard, setCreatingCard] = useState<{ [listId: string]: boolean }>({});
  const [cardError, setCardError] = useState<{ [listId: string]: string | null }>({});
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState<string>("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingCardTitle, setEditingCardTitle] = useState<string>("");
    async function handleCreateCard(e: React.FormEvent, listId: string) {
      e.preventDefault();
      const title = newCardTitles[listId]?.trim();
      if (!title) return;
      setCreatingCard((prev) => ({ ...prev, [listId]: true }));
      setCardError((prev) => ({ ...prev, [listId]: null }));
      try {
        const created = await createCard({ title, listId });
        setCards((prev) => [...prev, created]);
        setNewCardTitles((prev) => ({ ...prev, [listId]: "" }));
      } catch (err: any) {
        setCardError((prev) => ({ ...prev, [listId]: err.message || "Erro ao criar cartão" }));
      } finally {
        setCreatingCard((prev) => ({ ...prev, [listId]: false }));
      }
    }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [creatingList, setCreatingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    Promise.all([
      getLists(boardId),
      // Buscando todos os cards de todas as listas depois
    ])
      .then(async ([listsData]) => {
        setLists(listsData);
        // Buscar todos os cards de todas as listas
        const allCards: Card[] = [];
        for (const list of listsData) {
          try {
            const cardsData = await getCards(list.id);
            allCards.push(...cardsData);
          } catch (e) {}
        }
        setCards(allCards);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [boardId]);

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim() || !boardId) return;
    setCreatingList(true);
    setListError(null);
    try {
      const created = await createList({ title: newListName, boardId });
      setLists((prev) => [...prev, created]);
      setNewListName("");
    } catch (err: any) {
      setListError(err.message || "Erro ao criar lista");
    } finally {
      setCreatingList(false);
    }
  }

  if (!boardId) return <div>Quadro não encontrado.</div>;
  if (loading) return <div>Carregando listas e cartões...</div>;
  if (error) return <div>Erro: {error}</div>;

  // Filtro de cartões por busca
  const filteredCards = search.trim()
    ? cards.filter(card => card.title.toLowerCase().includes(search.trim().toLowerCase()))
    : cards;

  // Exclusão de lista (usando hook)
  const { loading: deletingList, error: deleteListError, handleDelete: handleDeleteList } = useDeleteList();
  async function onDeleteList(listId: string) {
    if (!window.confirm("Tem certeza que deseja excluir esta lista?")) return;
    const ok = await handleDeleteList(listId);
    if (ok) {
      setLists((prev) => prev.filter((l) => l.id !== listId));
      setCards((prev) => prev.filter((c) => c.listId !== listId));
    }
  }

  // Edição de lista
  function startEditList(list: List) {
    setEditingListId(list.id);
    setEditingListName(list.title);
  }
  async function handleEditList(e: React.FormEvent, listId: string) {
    e.preventDefault();
    if (!editingListName.trim()) return;
    try {
      await updateList(listId, { title: editingListName });
      setLists((prev) => prev.map((l) => l.id === listId ? { ...l, title: editingListName } : l));
      setEditingListId(null);
    } catch (err: any) {
      setListError(err.message || "Erro ao editar lista");
    }
  }

  // Exclusão de cartão (usando hook)
  const { loading: deletingCard, error: deleteCardError, handleDelete: handleDeleteCard } = useDeleteCard();
  async function onDeleteCard(cardId: string) {
    if (!window.confirm("Tem certeza que deseja excluir este cartão?")) return;
    const ok = await handleDeleteCard(cardId);
    if (ok) {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    }
  }

  // Edição de cartão
  function startEditCard(card: Card) {
    setEditingCardId(card.id);
    setEditingCardTitle(card.title);
  }
  async function handleEditCard(e: React.FormEvent, cardId: string) {
    e.preventDefault();
    if (!editingCardTitle.trim()) return;
    try {
      await updateCard(cardId, { title: editingCardTitle });
      setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, title: editingCardTitle } : c));
      setEditingCardId(null);
    } catch (err: any) {
      setCardError((prev) => ({ ...prev, [getCardById(cardId)?.listId || '']: err.message || "Erro ao editar cartão" }));
    }
  }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => {
        if (event.active.data.current?.type === 'card') setActiveCardId(event.active.id as string);
        if (event.active.data.current?.type === 'list') setActiveListId(event.active.id as string);
      }}
      onDragEnd={(event) => {
        setActiveCardId(null);
        setActiveListId(null);
        const {active, over} = event;
        if (!over) return;
        // Reordenar listas
        if (active.data.current?.type === 'list' && over.id !== active.id) {
          const oldIndex = lists.findIndex(l => l.id === active.id);
          const newIndex = lists.findIndex(l => l.id === over.id);
          setLists(arrayMove(lists, oldIndex, newIndex));
        }
        // Mover cartão entre listas
        if (active.data.current?.type === 'card') {
          const card = getCardById(active.id as string);
          if (!card) return;
          // Encontrar lista destino
          const overListId = over.data.current?.listId;
          // Encontrar posição destino
          const overCardId = over.id;
          if (overListId) {
            // Filtrar cartões da lista destino
            const destCards = cards.filter(c => c.listId === overListId && c.id !== card.id);
            let newIndex = destCards.findIndex(c => c.id === overCardId);
            if (newIndex === -1) newIndex = destCards.length;
            // Remover cartão da lista antiga e inserir na nova posição
            let updatedCards = cards.filter(c => c.id !== card.id);
            const movedCard = { ...card, listId: overListId };
            updatedCards.splice(newIndex, 0, movedCard);
            setCards(updatedCards);
            // Persistir no backend (ajustar para incluir campo order se existir)
            updateCard(card.id, { listId: overListId /*, order: newIndex */ }).catch(() => {
              setCards(cards);
              alert('Erro ao mover cartão para outra lista.');
            });
          }
        }
      }}
    >
      {/* Campo de busca */}
      <div className="kanban-search-bar">
        <input
          type="text"
          placeholder="Buscar cartões..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="kanban-search-input"
        />
      </div>
      <SortableContext items={lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
        <div className="kanban-lists-row">
          {lists.map((list) => (
            <SortableList key={list.id} list={list}>
              <div>
                <div className="kanban-list-header">
                  {editingListId === list.id ? (
                    <form onSubmit={(e) => handleEditList(e, list.id)} className="kanban-list-form">
                      <input
                        value={editingListName}
                        onChange={e => setEditingListName(e.target.value)}
                        autoFocus
                        className="kanban-list-input"
                      />
                      <button type="submit" className="kanban-btn">Salvar</button>
                      <button type="button" onClick={() => setEditingListId(null)} className="kanban-btn-cancel">Cancelar</button>
                    </form>
                  ) : (
                    <>
                      <h3 className="kanban-list-title">{list.title}</h3>
                      <button onClick={() => startEditList(list)} className="kanban-btn" style={{ background: 'transparent', color: '#0070f3' }}>✏️</button>
                      <button onClick={() => onDeleteList(list.id)} className="kanban-btn-delete" disabled={deletingList}>🗑️</button>
                    </>
                  )}
                </div>
                <SortableContext items={cards.filter(c => c.listId === list.id).map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <ul className="kanban-card-list">
                    {filteredCards.filter((card) => card.listId === list.id).map((card) => (
                      <SortableCard key={card.id} card={card}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {editingCardId === card.id ? (
                            <form onSubmit={e => handleEditCard(e, card.id)} className="kanban-card-form" style={{ width: '100%' }}>
                              <input
                                value={editingCardTitle}
                                onChange={e => setEditingCardTitle(e.target.value)}
                                autoFocus
                                className="kanban-card-input"
                                style={{ flex: 1 }}
                              />
                              <button type="submit" className="kanban-btn">Salvar</button>
                              <button type="button" onClick={() => setEditingCardId(null)} className="kanban-btn-cancel">Cancelar</button>
                            </form>
                          ) : (
                            <>
                              <span onClick={() => setModalCardId(card.id)} className="kanban-card-title">
                                <strong>{card.title}</strong>
                              </span>
                              <button onClick={() => startEditCard(card)} className="kanban-btn" style={{ background: 'transparent', color: '#0070f3' }}>✏️</button>
                              <button onClick={() => onDeleteCard(card.id)} className="kanban-btn-delete" disabled={deletingCard}>🗑️</button>
                              {deleteListError && <div className="kanban-error">{deleteListError}</div>}
                              {deleteCardError && <div className="kanban-error">{deleteCardError}</div>}
                            </>
                          )}
                        </div>
                        {card.description && <div className="kanban-card-desc">{card.description}</div>}
                      </SortableCard>
                    ))}
                        {/* Modal detalhado do cartão */}
                        <CardModal
                          open={!!modalCardId}
                          onClose={() => setModalCardId(null)}
                          card={modalCardId ? (cards.find(c => c.id === modalCardId) || { id: '', title: '' }) : { id: '', title: '' }}
                        />
                  </ul>
                </SortableContext>
                {/* Formulário para criar novo cartão */}
                <form onSubmit={(e) => handleCreateCard(e, list.id)} className="kanban-card-form" style={{ flexDirection: 'column', gap: 4 }}>
                  <input
                    type="text"
                    placeholder="Adicionar cartão..."
                    value={newCardTitles[list.id] || ""}
                    onChange={(e) => setNewCardTitles((prev) => ({ ...prev, [list.id]: e.target.value }))}
                    disabled={!!creatingCard[list.id]}
                    className="kanban-card-input"
                  />
                  <button type="submit" disabled={!!creatingCard[list.id] || !(newCardTitles[list.id]?.trim())} className="kanban-btn">
                    {creatingCard[list.id] ? "Criando..." : "Adicionar Cartão"}
                  </button>
                  {cardError[list.id] && <div className="kanban-error">{cardError[list.id]}</div>}
                </form>
              </div>
            </SortableList>
          ))}
          {/* Formulário para criar nova lista */}
          <form onSubmit={handleCreateList} className="kanban-form-create-list">
            <input
              type="text"
              placeholder="Nova lista..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              disabled={creatingList}
              className="kanban-form-input"
            />
            <button type="submit" disabled={creatingList || !newListName.trim()} className="kanban-form-btn">
              {creatingList ? "Criando..." : "Adicionar Lista"}
            </button>
            {listError && <div className="kanban-error">{listError}</div>}
          </form>
        </div>
      </SortableContext>
      {/* Drag overlay para feedback visual */}
      <DragOverlay>
        {activeCardId ? (
          (() => {
            const card = getCardById(activeCardId);
            return card ? (
              <div style={{ background: "#fff", padding: 8, borderRadius: 4, boxShadow: "0 2px 8px #0002", minWidth: 200 }}>
                <strong>{card.title}</strong>
                {card.description && <div style={{ fontSize: 12, color: "#666" }}>{card.description}</div>}
              </div>
            ) : null;
          })()
        ) : activeListId ? (
          (() => {
            const list = getListById(activeListId);
            return list ? (
              <div style={{ background: "#f4f4f4", padding: 16, borderRadius: 8, minWidth: 200 }}>
                <h3>{list.title}</h3>
              </div>
            ) : null;
          })()
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
