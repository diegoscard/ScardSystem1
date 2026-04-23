import fs from 'fs';

const content = fs.readFileSync('index.tsx', 'utf-8').split('\n');
const start = content.findIndex(line => line.includes('const StockManagementView ='));
const end = content.findIndex(line => line.includes('const DashboardViewComponent =')) - 1;

if (start === -1 || end === -1) {
  console.log('Could not find boundaries.');
  process.exit(1);
}

const componentLines = content.slice(start, end);

const imports = `import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Edit, X, RefreshCw, Layers, Check, Calendar, ArrowRightLeft, Upload, Bike, Percent, DollarSign, TicketPercent, Package, Tag, Gift, CalendarDays, Share2, Copy, Target, UserIcon, UserPlus, ShoppingBag, TrendingUp, ShieldAlert, ChevronLeft, ChevronRight, RotateCcw, Wallet, ArrowUpCircle, ArrowDownCircle, ShoppingCart, ReceiptText, Printer } from 'lucide-react';
import { Product, StockMovement } from '../types';
import { useStore } from '../contexts/StoreContext';
import { formatCurrency, parseCurrency } from '../utils/helpers';

`;

let componentStr = componentLines.join('\n');
componentStr = componentStr.replace(
  `const StockManagementView = ({ products, setProducts, categories, setCategories }: any) => {`,
  `const StockManagementView = () => {\n  const { user, products, setProducts, categories, setCategories, movements, setMovements } = useStore();`
);

fs.writeFileSync('src/pages/Estoque.tsx', imports + componentStr + '\n\nexport default StockManagementView;\n');
console.log('src/pages/Estoque.tsx created.');

const newIndexLines = [
  ...content.slice(0, start),
  ...content.slice(end)
];

// Add lazy import to index.tsx
const lazyImportStr = `const Estoque = React.lazy(() => import('./src/pages/Estoque'));`;
const lazyIdx = newIndexLines.findIndex(line => line.includes('const Vendas = React.lazy'));
if (lazyIdx !== -1) {
  newIndexLines.splice(lazyIdx + 1, 0, lazyImportStr);
}

let newIndexContent = newIndexLines.join('\n');

// Update usage in index.tsx
newIndexContent = newIndexContent.replace(
  /<StockManagementView[\s\S]*?\/>/m,
  '<Estoque />'
);

fs.writeFileSync('index.tsx', newIndexContent);
console.log('index.tsx updated for Estoque.');
