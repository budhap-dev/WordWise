import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import './index.css';
// Start listening for the install prompt before React renders.
import './lib/install';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
