import { useState, useEffect } from 'react';
import localforage from 'localforage';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const value = await localforage.getItem(key);
        if (value !== null) {
          setStoredValue(value);
        }
      } catch (error) {
        console.error('Error loading from localforage', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [key]);

  const setValue = async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await localforage.setItem(key, valueToStore);
    } catch (error) {
      console.error('Error saving to localforage', error);
    }
  };

  return [storedValue, setValue, isLoading];
}
