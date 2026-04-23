const fs = require('fs');
const content = fs.readFileSync('index.tsx', 'utf-8').split('\n');
const componentLines = content.slice(1820, 2990);
const imports = `import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, X, RefreshCw, Layers, Check, Calendar, ArrowRightLeft, Upload, Bike, Percent, DollarSign, TicketPercent, Package, Tag, Gift, CalendarDays, Share2, Copy, Target, UserIcon, UserPlus, ShoppingBag, TrendingUp, ShieldAlert, ChevronLeft, ChevronRight, RotateCcw, Wallet, ArrowUpCircle, ArrowDownCircle, ShoppingCart, ReceiptText, Printer } from 'lucide-react';
import { Customer, Sale, SaleItem, Product, FiadoRecord, CashLog, CashSession, Campaign, User, Settings } from '../types';
import { formatCurrency, maskCPFCNPJ, maskPhone, maskDate, parseCurrency } from '../utils/helpers';

`;

fs.writeFileSync('src/pages/Vendas.tsx', imports + componentLines.join('\n') + '\n\nexport default SalesViewComponent;\n');
console.log('src/pages/Vendas.tsx created.');

const newIndexLines = [...content.slice(0, 1820), '  // SalesViewComponent was extracted to src/pages/Vendas.tsx', ...content.slice(2990)];
fs.writeFileSync('index.tsx', newIndexLines.join('\n'));
console.log('index.tsx modified.');
