"use client";

import { useState } from "react";
import { createBoard, updateBoard, deleteBoard, CreateBoardRequest, Board } from "../services/boardService";

export function useBoardForm(initialData?: Partial<Board>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(data: CreateBoardRequest) {
    setLoading(true);
    setError("");
    try {
      const board = await createBoard(data);
      return board;
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'message' in e) {
        setError((e as any).message || "Erro ao criar quadro");
      } else {
        setError("Erro ao criar quadro");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(boardId: string, data: Partial<CreateBoardRequest>) {
    setLoading(true);
    setError("");
    try {
      const board = await updateBoard(boardId, data);
      return board;
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'message' in e) {
        setError((e as any).message || "Erro ao atualizar quadro");
      } else {
        setError("Erro ao atualizar quadro");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(boardId: string) {
    setLoading(true);
    setError("");
    try {
      await deleteBoard(boardId);
      return true;
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'message' in e) {
        setError((e as any).message || "Erro ao excluir quadro");
      } else {
        setError("Erro ao excluir quadro");
      }
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, handleCreate, handleUpdate, handleDelete };
}
