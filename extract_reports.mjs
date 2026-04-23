import fs from 'fs';

const content = fs.readFileSync('index.tsx', 'utf-8').split('\n');
const start = content.findIndex(line => line.includes('const ReportsViewComponent = '));
const end = content.findIndex(line => line.includes('const SettingsViewComponent = ')) - 1;

if (start === -1 || Math.abs(end - start) < 10) {
  console.log('Boundaries missing or invalid.');
  process.exit(1);
}

const componentLines = content.slice(start, end);

const imports = `import React, { useState, useMemo, useRef } from 'react';
import { Search, Plus, Trash2, Edit, X, RefreshCw, Layers, Check, Calendar, ArrowRightLeft, Upload, Bike, Percent, DollarSign, TicketPercent, Package, Tag, Gift, CalendarDays, Share2, Copy, Target, UserIcon, UserPlus, ShoppingBag, TrendingUp, ShieldAlert, ChevronLeft, ChevronRight, RotateCcw, Wallet, ArrowUpCircle, ArrowDownCircle, ShoppingCart, ReceiptText, Printer, FileText, Download, Filter, Eye, Hash, MapPin, Building2, Store } from 'lucide-react';
import { Product, Sale, FiadoRecord, CashSession, CashHistoryEntry, CashLog, PaymentRecord, SaleItem } from '../types';
import { useStore } from '../contexts/StoreContext';
import { formatCurrency, parseCurrency } from '../utils/helpers';

`;

let componentStr = componentLines.join('\n');
componentStr = componentStr.replace(
  `const ReportsViewComponent = ({ user, sales, setSales, products, setProducts, setMovements, cashHistory, cashSession, setCashSession, settings, setExchangeCredit, setCurrentView, vendedores, setCashHistory }: any) => {`,
  `const ReportsViewComponent = ({ setCurrentView }: { setCurrentView: (view: string) => void }) => {\n  const { user, sales, setSales, products, setProducts, setMovements, cashHistory, cashSession, setCashSession, settings, setExchangeCredit, dbUsers: vendedores, setCashHistory } = useStore();`
);

fs.writeFileSync('src/pages/Relatorios.tsx', imports + componentStr + '\n\nexport default ReportsViewComponent;\n');
console.log('src/pages/Relatorios.tsx created.');

const newIndexLines = [
  ...content.slice(0, start),
  ...content.slice(end)
];

const lazyImportStr = `const Relatorios = React.lazy(() => import('./src/pages/Relatorios'));`;
const lazyIdx = newIndexLines.findIndex(line => line.includes('const Dashboard = React.lazy'));
if (lazyIdx !== -1) {
  newIndexLines.splice(lazyIdx + 1, 0, lazyImportStr);
}

let newIndexContent = newIndexLines.join('\n');

// Replace usage
newIndexContent = newIndexContent.replace(
  /<ReportsViewComponent[\s\S]*?\/>/m,
  '<Relatorios setCurrentView={setCurrentView} />'
);

fs.writeFileSync('index.tsx', newIndexContent);
console.log('index.tsx updated for Relatorios.');
