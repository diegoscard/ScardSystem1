import React from 'react';
import { createRoot } from 'react-dom/client';
import DataProvider from './src/components/DataProvider';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = (window as any)._root || createRoot(rootElement);
  (window as any)._root = root;
  root.render(<DataProvider />);
}
