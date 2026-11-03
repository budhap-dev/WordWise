import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { db } from '../db/db';

afterEach(async () => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  await Promise.all(db.tables.map((t) => t.clear()));
});
