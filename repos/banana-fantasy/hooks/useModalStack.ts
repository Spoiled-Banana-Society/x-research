import { useState, useCallback } from 'react';

type ModalId = string;

interface UseModalStackReturn {
  stack: ModalId[];
  push: (id: ModalId) => void;
  pop: () => void;
  replace: (id: ModalId) => void;
  closeAll: () => void;
  isOpen: (id: ModalId) => boolean;
  current: ModalId | null;
}

export function useModalStack(): UseModalStackReturn {
  const [stack, setStack] = useState<ModalId[]>([]);

  const push = useCallback((id: ModalId) => {
    setStack(prev => [...prev, id]);
  }, []);

  const pop = useCallback(() => {
    setStack(prev => prev.slice(0, -1));
  }, []);

  const replace = useCallback((id: ModalId) => {
    setStack(prev => [...prev.slice(0, -1), id]);
  }, []);

  const closeAll = useCallback(() => {
    setStack([]);
  }, []);

  const isOpen = useCallback((id: ModalId) => {
    return stack.includes(id);
  }, [stack]);

  const current = stack.length > 0 ? stack[stack.length - 1] : null;

  return { stack, push, pop, replace, closeAll, isOpen, current };
}
