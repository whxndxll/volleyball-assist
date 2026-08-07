import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import localforage from 'localforage';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(async () => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  document.documentElement.classList.remove('dark');
  vi.unstubAllGlobals();
  await localforage.clear();
});
