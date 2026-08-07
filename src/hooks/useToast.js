import { useState, useRef, useCallback, useEffect } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const showToast = useCallback((message, actionLabel, onAction) => {
    clearTimeout(timer.current);
    setToast({ message, actionLabel, onAction });
    timer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  return { toast, showToast, dismissToast };
}
