import { useState, useCallback } from "react";

interface UseFormModalReturn {
  isOpen: boolean;
  isLoading: boolean;
  editingItem: any | null;
  openModal: (item?: any) => void;
  closeModal: () => void;
  setLoading: (loading: boolean) => void;
  resetModal: () => void;
}

export const useFormModal = (): UseFormModalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const openModal = useCallback((item?: any) => {
    setEditingItem(item || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setEditingItem(null);
    setIsLoading(false);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const resetModal = useCallback(() => {
    setIsOpen(false);
    setEditingItem(null);
    setIsLoading(false);
  }, []);

  return {
    isOpen,
    isLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading,
    resetModal,
  };
}; 