import { useState, useRef, useCallback, useEffect } from 'react';

const TOAST_MS = 5000;
const MAX_VISIBLE = 3;

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(0);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const dismissToast = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Cada aviso ocupa a própria fatia: um segundo "Desfazer" não pode apagar o
  // undo de uma exclusão anterior, que ainda estava no prazo.
  const showToast = useCallback((message, actionLabel, onAction) => {
    const id = ++nextId.current;
    setToasts(prev => [...prev, { id, message, actionLabel, onAction }].slice(-MAX_VISIBLE));
    timers.current.set(id, setTimeout(() => dismissToast(id), TOAST_MS));
    return id;
  }, [dismissToast]);

  return { toasts, showToast, dismissToast };
}