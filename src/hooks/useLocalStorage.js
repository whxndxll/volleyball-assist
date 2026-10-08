import { useState, useEffect, useRef, useCallback } from 'react';
import localforage from 'localforage';

export function useLocalStorage(key, initialValue, onError) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const valueRef = useRef(initialValue);
  const onErrorRef = useRef(onError);

  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    async function loadData() {
      try {
        const value = await localforage.getItem(key);
        if (value !== null) {
          valueRef.current = value;
          setStoredValue(value);
        }
      } catch (error) {
        console.error('Error loading from localforage', error);
        onErrorRef.current?.();
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [key]);

  const setValue = useCallback((value) => {
    const valueToStore = value instanceof Function ? value(valueRef.current) : value;
    valueRef.current = valueToStore;
    setStoredValue(valueToStore);
    return localforage.setItem(key, valueToStore).catch((error) => {
      // Sem isto a UI mostra a alteração como salva e ela nunca chega ao disco.
      console.error('Error saving to localforage', error);
      onErrorRef.current?.();
    });
  }, [key]);

  return [storedValue, setValue, isLoading];
}
