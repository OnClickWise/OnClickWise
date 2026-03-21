import { getCardById, updateCard } from "@/services/cardService";

export interface CardChecklist {
  id: string;
  cardId: string;
  title: string;
  items: { id: string; text: string; checked: boolean }[];
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeChecklists(raw: any, cardId: string): CardChecklist[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((checklist: any) => ({
    id: String(checklist?.id || generateId()),
    cardId,
    title: String(checklist?.title || "Checklist"),
    items: Array.isArray(checklist?.items)
      ? checklist.items.map((item: any) => ({
          id: String(item?.id || generateId()),
          text: String(item?.text || ""),
          checked: Boolean(item?.checked),
        }))
      : [],
  }));
}

async function getCardChecklists(cardId: string): Promise<CardChecklist[]> {
  const card = await getCardById(cardId);
  return normalizeChecklists(card.metadata?.checklists, cardId);
}

async function saveCardChecklists(cardId: string, checklists: CardChecklist[]): Promise<void> {
  const card = await getCardById(cardId);
  const metadata = {
    ...(card.metadata || {}),
    checklists,
  };
  await updateCard(cardId, { metadata });
}

export async function getChecklists(cardId: string): Promise<CardChecklist[]> {
  return getCardChecklists(cardId);
}

export async function addChecklist(cardId: string, title: string): Promise<CardChecklist> {
  const checklists = await getCardChecklists(cardId);
  const checklist: CardChecklist = {
    id: generateId(),
    cardId,
    title,
    items: [],
  };
  const updated = [...checklists, checklist];
  await saveCardChecklists(cardId, updated);
  return checklist;
}

export async function addChecklistItem(cardId: string, checklistId: string, text: string): Promise<CardChecklist> {
  const checklists = await getCardChecklists(cardId);
  const updated = checklists.map((checklist) => {
    if (checklist.id !== checklistId) return checklist;
    return {
      ...checklist,
      items: [...checklist.items, { id: generateId(), text, checked: false }],
    };
  });

  await saveCardChecklists(cardId, updated);
  const checklist = updated.find((item) => item.id === checklistId);
  if (!checklist) throw new Error("Checklist nao encontrado");
  return checklist;
}

export async function toggleChecklistItem(cardId: string, checklistId: string, itemId: string, checked: boolean): Promise<CardChecklist> {
  const checklists = await getCardChecklists(cardId);
  const updated = checklists.map((checklist) => {
    if (checklist.id !== checklistId) return checklist;
    return {
      ...checklist,
      items: checklist.items.map((item) =>
        item.id === itemId ? { ...item, checked } : item,
      ),
    };
  });

  await saveCardChecklists(cardId, updated);
  const checklist = updated.find((item) => item.id === checklistId);
  if (!checklist) throw new Error("Checklist nao encontrado");
  return checklist;
}

export async function deleteChecklist(cardId: string, checklistId: string) {
  const checklists = await getCardChecklists(cardId);
  const updated = checklists.filter((item) => item.id !== checklistId);
  await saveCardChecklists(cardId, updated);
  return { success: true };
}

export async function updateChecklistItem(cardId: string, checklistId: string, itemId: string, newText: string): Promise<CardChecklist> {
  const checklists = await getCardChecklists(cardId);
  const updated = checklists.map((checklist) => {
    if (checklist.id !== checklistId) return checklist;
    return {
      ...checklist,
      items: checklist.items.map((item) =>
        item.id === itemId ? { ...item, text: newText } : item,
      ),
    };
  });

  await saveCardChecklists(cardId, updated);
  const checklist = updated.find((item) => item.id === checklistId);
  if (!checklist) throw new Error("Checklist nao encontrado");
  return checklist;
}

export async function deleteChecklistItem(cardId: string, checklistId: string, itemId: string): Promise<CardChecklist> {
  const checklists = await getCardChecklists(cardId);
  const updated = checklists.map((checklist) => {
    if (checklist.id !== checklistId) return checklist;
    return {
      ...checklist,
      items: checklist.items.filter((item) => item.id !== itemId),
    };
  });

  await saveCardChecklists(cardId, updated);
  const checklist = updated.find((item) => item.id === checklistId);
  if (!checklist) throw new Error("Checklist nao encontrado");
  return checklist;
}
