import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import localforage from 'localforage';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(async () => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  await localforage.clear();
});
