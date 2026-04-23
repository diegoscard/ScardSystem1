const fs = require('fs');

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

// We need to see what `products`, `setProducts`, etc. they were getting from props in index.tsx
// It was passed user, products, setProducts, movements, setMovements, categories, setCategories
// I've destructured them from useStore instead.

fs.writeFileSync('src/pages/Estoque.tsx', imports + componentStr + '\n\nexport default StockManagementView;\n');
console.log('src/pages/Estoque.tsx created.');

const newIndexLines = [
  ...content.slice(0, start),
  'const Estoque = React.lazy(() => import(\'./src/pages/Estoque\'));',
  ...content.slice(end)
];

fs.writeFileSync('index.tsx', newIndexLines.join('\n'));
console.log('index.tsx updated.');
