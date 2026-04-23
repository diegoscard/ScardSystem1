import fs from 'fs';

const content = fs.readFileSync('index.tsx', 'utf-8').split('\n');
const start = content.findIndex(line => line.includes('const DashboardViewComponent ='));
const end = content.findIndex(line => line.includes('const ReportsViewComponent =')) - 1;

if (start === -1 || end === -1) {
  console.log('Could not find boundaries.');
  process.exit(1);
}

const componentLines = content.slice(start, end);

const imports = `import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Edit, X, RefreshCw, Layers, Check, Calendar, ArrowRightLeft, Upload, Bike, Percent, DollarSign, TicketPercent, Package, Tag, Gift, CalendarDays, Share2, Copy, Target, UserIcon, UserPlus, ShoppingBag, TrendingUp, ShieldAlert, ChevronLeft, ChevronRight, RotateCcw, Wallet, ArrowUpCircle, ArrowDownCircle, ShoppingCart, ReceiptText, Printer } from 'lucide-react';
import { Product, Sale, FiadoRecord, CashSession, CashHistoryEntry, CommissionTier } from '../types';
import { useStore } from '../contexts/StoreContext';
import { formatCurrency, parseCurrency } from '../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

`;

let componentStr = componentLines.join('\n');
componentStr = componentStr.replace(
  `const DashboardViewComponent = ({ products, sales, cashSession, fiados, cashHistory, commTiers, setCommTiers }: any) => {`,
  `const DashboardViewComponent = () => {\n  const { user, products, sales, cashSession, fiados, cashHistory, commTiers, setCommTiers, dbUsers: vendedores } = useStore();`
);

fs.writeFileSync('src/pages/Dashboard.tsx', imports + componentStr + '\n\nexport default DashboardViewComponent;\n');
console.log('src/pages/Dashboard.tsx created.');

const newIndexLines = [
  ...content.slice(0, start),
  ...content.slice(end)
];

const lazyImportStr = `const Dashboard = React.lazy(() => import('./src/pages/Dashboard'));`;
const lazyIdx = newIndexLines.findIndex(line => line.includes('const Estoque = React.lazy'));
if (lazyIdx !== -1) {
  newIndexLines.splice(lazyIdx + 1, 0, lazyImportStr);
}

let newIndexContent = newIndexLines.join('\n');

// Replace usage
newIndexContent = newIndexContent.replace(
  /<DashboardViewComponent[\s\S]*?\/>/m,
  '<Dashboard />'
);

fs.writeFileSync('index.tsx', newIndexContent);
console.log('index.tsx updated for Dashboard.');
