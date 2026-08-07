import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import localforage from 'localforage';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(async () => {
  cleanup();
  await localforage.clear();
});
