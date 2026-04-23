import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, X, RefreshCw, Layers, Check, Calendar, ArrowRightLeft, Upload, Bike, Percent, DollarSign, TicketPercent, Package, Tag, Gift, CalendarDays, Share2, Copy, Target, UserIcon, UserPlus, ShoppingBag, TrendingUp, ShieldAlert, ChevronLeft, ChevronRight, RotateCcw, Wallet, ArrowUpCircle, ArrowDownCircle, ShoppingCart, ReceiptText, Printer, FileText, Download, Filter, Eye, Hash, MapPin, Building2, Store, History, Clock } from 'lucide-react';
import { Product, Sale, FiadoRecord, CashSession, CashHistoryEntry, CashLog, PaymentRecord, SaleItem, User } from '../types';
import { useStore } from '../contexts/StoreContext';
import { formatCurrency, parseCurrency } from '../utils/helpers';

const ReportsViewComponent = ({ setCurrentView }: { setCurrentView: (view: string) => void }) => {
  const { user, sales, setSales, products, setProducts, setMovements, cashHistory, cashSession, setCashSession, settings, setExchangeCredit, dbUsers: vendedores, setCashHistory, notify, confirm } = useStore();
  const [tab, setTab] = useState<'sales' | 'cash' | 'fluxo'>('sales'); const [search, setSearch] = useState(''); const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [reprintSale, setReprintSale] = useState<Sale | null>(null); 
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editSeller, setEditSeller] = useState('');
  const [editSalePayments, setEditSalePayments] = useState<PaymentRecord[]>([]);
  const [editSaleMode, setEditSaleMode] = useState<'options' | 'vendedor' | 'pagamento'>('options');

  // Estados para edição de fluxo (entrada/sangria) - MASTER ONLY
  const [editingCashLog, setEditingCashLog] = useState<CashLog | null>(null);
  const [editCashLogVal, setEditCashLogVal] = useState(0);
  const [editCashLogDesc, setEditCashLogDesc] = useState('');

  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day'); const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10)); const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const isAdmin = user.role === 'admin' || user.id === 0; 
  const isMasterUser = user.id === 0 || user.email === 'master@internal';
  const canDelete = isAdmin || (settings.sellerPermissions || []).includes('delete_sale'); const canExchange = isAdmin || (settings.sellerPermissions || []).includes('exchange_sale');
  const hasSubPermission = (permId: string) => isAdmin || (settings.sellerPermissions || []).includes(permId);
  const showSalesTab = true; const showFluxoTab = hasSubPermission('reports_fluxo'); const showCashTab = hasSubPermission('reports_cash');
  useEffect(() => { if (!showSalesTab) { if (showFluxoTab) setTab('fluxo'); else if (showCashTab) setTab('cash'); } }, [showSalesTab, showFluxoTab, showCashTab]);
  const filteredSalesByPeriod = useMemo(() => {
    return sales.filter((s: Sale) => {
      const d = new Date(s.date);
      if (period === 'day') { const [y, m, day] = selectedDay.split('-').map(Number); return d.getFullYear() === y && (d.getMonth() + 1) === m && d.getDate() === day; }
      if (period === 'month') { const [y, m] = selectedMonth.split('-').map(Number); return d.getFullYear() === y && (d.getMonth() + 1) === m; }
      if (period === 'year') { return d.getFullYear() === Number(selectedYear); }
      return true;
    });
  }, [sales, period, selectedDay, selectedMonth, selectedYear]);
  const filteredSales = useMemo(() => {
    let result = filteredSalesByPeriod;
    if (search) {
      const t = search.toLowerCase();
      result = result.filter((s: Sale) => s.id.toString().includes(t) || s.user.toLowerCase().includes(t) || s.items.some(i => i.name.toLowerCase().includes(t)));
    }
    if (filterPaymentMethod) {
      result = result.filter((s: Sale) => s.payments.some(p => p.method === filterPaymentMethod));
    }
    if (filterValue) {
      const val = parseFloat(filterValue.replace(/\D/g, '')) / 100;
      result = result.filter((s: Sale) => s.total === val);
    }
    return result;
  }, [filteredSalesByPeriod, search, filterPaymentMethod, filterValue]);
  const cashLogs = useMemo(() => {
    let allLogs: CashLog[] = []; if (cashSession) allLogs = [...cashSession.logs]; cashHistory.forEach((h: CashHistoryEntry) => { allLogs = [...allLogs, ...h.logs]; });
    const movements = allLogs.filter(l => l.type === 'entrada' || l.type === 'retirada');
    return movements.filter(l => {
        const d = new Date(l.time); if (period === 'day') { const [y, m, day] = selectedDay.split('-').map(Number); return d.getFullYear() === y && (d.getMonth() + 1) === m && d.getDate() === day; }
        if (period === 'month') { const [y, m] = selectedMonth.split('-').map(Number); return d.getFullYear() === y && (d.getMonth() + 1) === m; }
        if (period === 'year') { return d.getFullYear() === Number(selectedYear); }
        return true;
    }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [cashSession, cashHistory, period, selectedDay, selectedMonth, selectedYear]);
  const filteredCashHistory = useMemo(() => {
    return cashHistory.filter((h: CashHistoryEntry) => {
      const d = new Date(h.closedAt); if (period === 'day') { const [y, m, day] = selectedDay.split('-').map(Number); return d.getFullYear() === y && (d.getMonth() + 1) === m && d.getDate() === day; }
      if (period === 'month') { const [y, m] = selectedMonth.split('-').map(Number); return d.getFullYear() === y && (d.getMonth() + 1) === m; }
      if (period === 'year') { return d.getFullYear() === Number(selectedYear); }
      return true;
    }).sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
  }, [cashHistory, period, selectedDay, selectedMonth, selectedYear]);

  // Excluir venda silenciosamente (sem logs de estorno)
  const handleDeleteSale = async (sale: Sale) => {
    if (!canDelete) return notify('Operação restrita. Você não tem permissão para excluir vendas.', 'error'); 
    
    const ok = await confirm({
        title: 'Excluir Venda',
        message: 'Deseja realmente excluir esta venda? O estoque será devolvido e o saldo do caixa ajustado.',
        type: 'danger',
        confirmLabel: 'Confirmar Exclusão',
        cancelLabel: 'Manter Venda'
    });

    if (!ok) return;
    
    // Devolução de Estoque (Apenas itens NÃO trocados, pois trocados já voltaram ao estoque)
    setProducts((prev: Product[]) => prev.map(p => { 
      const items = sale.items.filter(i => i.productId === p.id && !i.isExchanged); 
      const totalQty = items.reduce((acc, i) => acc + i.quantity, 0); 
      return totalQty > 0 ? { ...p, stock: p.stock + totalQty } : p; 
    }));
    
    // Reverter saldo do caixa silenciosamente
    const cashValue = sale.payments.filter(p => p.method === 'Dinheiro').reduce((acc, p) => acc + p.amount, 0) - (sale.change || 0);
    if (cashValue !== 0 && cashSession) {
      setCashSession((prev: CashSession) => ({
        ...prev,
        currentBalance: prev.currentBalance - cashValue,
      }));
    }

    // Devolver crédito de troca ao sistema se tiver sido usado
    if (sale.exchangeCreditUsed && sale.exchangeCreditUsed > 0) {
      setExchangeCredit((prev: number) => prev + sale.exchangeCreditUsed!);
    }

    setSales((prev: Sale[]) => prev.filter(s => s.id !== sale.id)); 
    notify('Venda removida com sucesso!', 'success');
  };

  const handleItemExchange = async (sale: Sale, item: SaleItem) => {
    if (!canExchange) return notify('Operação restrita. Você não tem permissão para realizar trocas.', 'error'); 
    if (item.isExchanged) return notify('Este item já foi trocado anteriormente!', 'warning');
    
    const itemSubtotal = (item.price * item.quantity) - item.discountValue - item.manualDiscountValue; 
    const totalItemsSubtotal = sale.items.reduce((acc, it) => acc + (it.price * it.quantity - it.discountValue - it.manualDiscountValue), 0); 
    const proportionalFactor = totalItemsSubtotal > 0 ? itemSubtotal / totalItemsSubtotal : 0; 
    const netItemValue = sale.total * proportionalFactor;
    
    const ok = await confirm({
        title: 'Realizar Troca',
        message: `Deseja realizar a troca do item ${item.name}? Um crédito de R$ ${formatCurrency(netItemValue)} será gerado no sistema.`,
        type: 'warning',
        confirmLabel: 'Confirmar Troca',
        cancelLabel: 'Cancelar'
    });

    if (!ok) return;
    
    setProducts((prev: Product[]) => prev.map(p => p.id === item.productId ? { ...p, stock: p.stock + item.quantity } : p ));
    setMovements((prev: any) => [{ id: Math.random(), productId: item.productId, productName: item.name, type: 'entrada', quantity: item.quantity, reason: `Troca Item Venda #${sale.id.toString().slice(-4)}`, date: new Date().toISOString(), user: user.name }, ...prev]);
    setSales((prev: Sale[]) => prev.map(s => { if (s.id === sale.id) { return { ...s, items: s.items.map(it => it.cartId === item.cartId ? { ...it, isExchanged: true } : it) }; } return s; }));
    setExchangeCredit((prev: number) => prev + netItemValue); setSelectedSale(null); setCurrentView('sales'); 
    notify(`Troca realizada! R$ ${formatCurrency(netItemValue)} de crédito adicionado.`, 'success');
  };

  const handleUpdateSaleMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    
    const oldCashContribution = editingSale.payments
        .filter(p => p.method === 'Dinheiro')
        .reduce((acc, p) => acc + p.amount, 0) - (editingSale.change || 0);

    const totalSalePayments = editSalePayments.reduce((acc, p) => acc + p.amount, 0);
    const oldTotalSalePayments = editingSale.payments.reduce((acc, p) => acc + p.amount, 0);
    
    if (Math.abs(totalSalePayments - oldTotalSalePayments) > 0.01) {
        notify('O total dos pagamentos deve ser exatamente R$ ' + formatCurrency(oldTotalSalePayments), 'error');
        return;
    }

    const newCashContribution = editSalePayments
        .filter(p => p.method === 'Dinheiro')
        .reduce((acc, p) => acc + p.amount, 0) - (editSalePayments.some(p => p.method === 'Dinheiro') ? (editingSale.change || 0) : 0);

    const cashDifference = newCashContribution - oldCashContribution;

    if (cashDifference !== 0 && cashSession && setCashSession) {
        const adjustmentLog: CashLog = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'ajuste',
            amount: Math.abs(cashDifference),
            description: `Ajuste Master Venda #${editingSale.id.toString().slice(-4)} (Pagamento)`,
            time: new Date().toISOString(),
            user: user.name
        };

        setCashSession((prev: CashSession) => ({
            ...prev,
            currentBalance: prev.currentBalance + cashDifference,
            logs: [(cashDifference > 0 ? {...adjustmentLog, type: 'entrada'} : {...adjustmentLog, type: 'retirada'}) as CashLog, ...prev.logs]
        }));
    }

    const updatedSales = sales.map((s: Sale) => {
      if (s.id === editingSale.id) {
        return {
          ...s,
          user: editSeller,
          payments: editSalePayments
        };
      }
      return s;
    });

    setSales(updatedSales);
    setEditingSale(null);
    notify('Venda atualizada e saldo de caixa ajustado com sucesso!', 'success');
  };

  const handleDeleteCashLog = async (log: CashLog) => {
    if (!isMasterUser) return;
    
    const ok = await confirm({
        title: 'Excluir Lançamento',
        message: `Deseja realmente EXCLUIR este registro de ${log.type === 'entrada' ? 'Entrada' : 'Sangria'}? O saldo do caixa será corrigido automaticamente.`,
        type: 'danger',
        confirmLabel: 'Excluir',
        cancelLabel: 'Manter'
    });

    if (!ok) return;

    const valDiff = log.type === 'entrada' ? -log.amount : log.amount;

    if (cashSession && cashSession.logs.some(l => l.id === log.id)) {
        setCashSession((prev: CashSession) => ({
            ...prev,
            currentBalance: prev.currentBalance + valDiff,
            logs: prev.logs.filter(l => l.id !== log.id)
        }));
    } else {
        setCashHistory((prev: CashHistoryEntry[]) => prev.map(h => {
            if (h.logs.some(l => l.id === log.id)) {
                return {
                    ...h,
                    closingBalance: h.closingBalance + valDiff,
                    logs: h.logs.filter(l => l.id !== log.id)
                };
            }
            return h;
        }));
    }
    notify('Lançamento removido e saldo de caixa corrigido!', 'success');
  };

  const handleSaveEditCashLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCashLog || !isMasterUser) return;

    const oldVal = editingCashLog.amount;
    const newVal = editCashLogVal;
    
    let diff = 0;
    if (editingCashLog.type === 'entrada') {
        diff = newVal - oldVal;
    } else {
        diff = oldVal - newVal;
    }

    const updatedLog = { ...editingCashLog, amount: newVal, description: editCashLogDesc };

    if (cashSession && cashSession.logs.some(l => l.id === editingCashLog.id)) {
        setCashSession((prev: CashSession) => ({
            ...prev,
            currentBalance: prev.currentBalance + diff,
            logs: prev.logs.map(l => l.id === editingCashLog.id ? updatedLog : l)
        }));
    } else {
        setCashHistory((prev: CashHistoryEntry[]) => prev.map(h => {
            if (h.logs.some(l => l.id === editingCashLog.id)) {
                return {
                    ...h,
                    closingBalance: h.closingBalance + diff,
                    logs: h.logs.map(l => l.id === editingCashLog.id ? updatedLog : l)
                };
            }
            return h;
        }));
    }

    setEditingCashLog(null);
    notify('Lançamento atualizado e saldo de caixa corrigido!', 'success');
  };

  return (
    <div className="space-y-6 h-full flex flex-col min-h-0">
      <div className="flex flex-col gap-6 md:flex-row md:items-end justify-between shrink-0">
        <div><h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Relatórios & Histórico</h2><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acompanhamento operacional detalhado</p></div>
        <div className="flex flex-col items-end gap-2">
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {(['day', 'month', 'year'] as const).map((p) => (<button key={p} onClick={() => setPeriod(p)} className={`px-8 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${period === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>{p === 'day' ? 'DIA' : p === 'month' ? 'MÊS' : 'ANO'}</button>))}
            </div>
            <div className="flex items-center gap-3">
              {period === 'day' && (<div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 animate-in fade-in"><span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">DIA:</span><input type="date" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="bg-transparent text-[11px] font-black text-indigo-700 outline-none cursor-pointer" /></div>)}
              {period === 'month' && (<div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 animate-in fade-in"><span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">MÊS:</span><input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent text-[11px] font-black text-indigo-700 outline-none cursor-pointer" /></div>)}
              {period === 'year' && (<div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 animate-in fade-in"><span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">ANO:</span><input type="number" min="2000" max="2100" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent text-[11px] font-black text-indigo-700 outline-none cursor-pointer w-16" /></div>)}
            </div>
        </div>
      </div>
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm self-start">
           {showSalesTab && <button onClick={() => setTab('sales')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${tab === 'sales' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}><ShoppingCart size={14}/> Vendas</button>}
           {showFluxoTab && <button onClick={() => setTab('fluxo')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${tab === 'fluxo' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}><RefreshCw size={14}/> Entradas/Sangrias</button>}
           {showCashTab && <button onClick={() => setTab('cash')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${tab === 'cash' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}><History size={14}/> Histórico de Caixa</button>}
      </div>
      {tab === 'sales' && showSalesTab && (<><div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 shrink-0 items-center"><div className="relative group flex-1 w-full"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Filtrar por ID, vendedor ou produto..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:border-indigo-500" value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="flex flex-wrap gap-4 items-center"><select className="w-48 px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-600 cursor-pointer" value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)}><option value="">Forma de Pagamento</option><option value="Pix">Pix</option><option value="Dinheiro">Dinheiro</option><option value="C. Débito">C. Débito</option><option value="C. Crédito">C. Crédito</option><option value="C. Parcelado">C. Parcelado</option><option value="Voucher">Voucher</option><option value="Voucher VIP">Voucher VIP</option><option value="F12">F12</option></select><div className="relative w-40"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span><input type="text" placeholder="Valor" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:border-indigo-500" value={filterValue} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setFilterValue(val ? (Number(val) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''); }} /></div>{(search || filterPaymentMethod || filterValue) && (<button onClick={() => { setSearch(''); setFilterPaymentMethod(''); setFilterValue(''); }} className="text-[9px] font-black text-red-400 uppercase hover:text-red-600 transition-colors flex items-center gap-1" title="Limpar Filtros"><X size={16} /></button>)}</div></div><div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 flex-1 flex flex-col min-h-0"><div className="overflow-auto flex-1 custom-scroll"><table className="w-full text-left border-separate border-spacing-0"><thead className="bg-slate-50 sticky top-0 z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b"><tr><th className="px-6 py-4">Data/Hora</th><th className="px-6 py-4">ID</th><th className="px-6 py-4">Vendedor</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-center">Itens</th><th className="px-6 py-4 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredSales.map((s: Sale) => (<tr key={s.id} className="hover:bg-slate-50 transition-all group"><td className="px-6 py-4"><div className="flex flex-col"><span className="text-xs font-bold text-slate-800">{new Date(s.date).toLocaleDateString()}</span><span className="text-[9px] text-slate-400 font-mono">{new Date(s.date).toLocaleTimeString()}</span></div></td><td className="px-6 py-4 text-[10px] font-mono font-black text-indigo-600">#{s.id.toString().slice(-6)}</td><td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">{s.user}</td><td className="px-6 py-4 text-right font-black text-slate-900 font-mono text-xs">R$ {formatCurrency(s.total)}</td><td className="px-6 py-4 text-center"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black text-slate-500">{s.items.length}</span></td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => setSelectedSale(s)} className="p-2 text-slate-400 hover:text-indigo-600" title="Ver Detalhes"><Eye size={16}/></button>{isMasterUser && <button onClick={() => { setEditingSale(s); setEditSeller(s.user); setEditSalePayments(s.payments.map(p => ({...p}))); setEditSaleMode('options'); }} className="p-2 text-slate-400 hover:text-amber-500" title="Editar Venda (MASTER)"><Edit size={16}/></button>}{canDelete && <button onClick={() => handleDeleteSale(s)} className="p-2 text-slate-400 hover:text-red-600" title="Excluir"><Trash2 size={16}/></button>}</div></td></tr>))}{filteredSales.length === 0 && (<tr><td colSpan={6} className="py-20 text-center text-slate-300 font-bold italic">Nenhuma venda encontrada para este período...</td></tr>)}</tbody></table></div></div></>)}
      {tab === 'fluxo' && showFluxoTab && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 flex-1 flex flex-col min-h-0 animate-in fade-in">
          <div className="overflow-auto flex-1 custom-scroll">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-slate-50 sticky top-0 z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">Data e Hora</th>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Descrição/Motivo</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  {isMasterUser && <th className="px-6 py-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">{new Date(log.time).toLocaleDateString()}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{new Date(log.time).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase italic tracking-tight">{log.user}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${log.type === 'entrada' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {log.type === 'entrada' ? 'Entrada' : 'Sangria'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 max-w-xs truncate">{log.description || '-'}</td>
                    <td className={`px-6 py-4 text-right font-black font-mono text-xs ${log.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {log.type === 'entrada' ? '+' : '-'} R$ {formatCurrency(log.amount)}
                    </td>
                    {isMasterUser && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button 
                             onClick={() => { setEditingCashLog(log); setEditCashLogVal(log.amount); setEditCashLogDesc(log.description); }} 
                             className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                             title="Editar Registro"
                           >
                             <Edit size={14}/>
                           </button>
                           <button 
                             onClick={() => handleDeleteCashLog(log)} 
                             className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                             title="Excluir Registro"
                           >
                             <Trash2 size={14}/>
                           </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {cashLogs.length === 0 && (
                  <tr>
                    <td colSpan={isMasterUser ? 6 : 5} className="py-20 text-center text-slate-300 font-bold italic">Nenhuma movimentação de caixa encontrada...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === 'cash' && showCashTab && (<div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 flex-1 flex flex-col min-h-0 animate-in fade-in"><div className="overflow-auto flex-1 custom-scroll"><table className="w-full text-left border-separate border-spacing-0"><thead className="bg-slate-50 sticky top-0 z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b"><tr><th className="px-6 py-4">Abertura / Fechamento</th><th className="px-6 py-4">Usuários</th><th className="px-6 py-4 text-right">Saldo Inicial</th><th className="px-6 py-4 text-right">Saldo Final</th><th className="px-6 py-4 text-center">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredCashHistory.map((h: CashHistoryEntry) => (<tr key={h.id} className="hover:bg-slate-50 transition-all group"><td className="px-6 py-4"><div className="flex flex-col gap-1"><div className="flex items-center gap-2 text-[10px] font-bold text-green-600"><Clock size={10} /> {new Date(h.openedAt).toLocaleString()}</div><div className="flex items-center gap-2 text-[10px] font-bold text-red-500"><Clock size={10} /> {new Date(h.closedAt).toLocaleString()}</div></div></td><td className="px-6 py-4"><div className="flex flex-col gap-1"><span className="text-[10px] font-black uppercase text-slate-400">AB: {h.openedBy}</span><span className="text-[10px] font-black uppercase text-slate-400">FC: {h.closedBy}</span></div></td><td className="px-6 py-4 text-right text-xs font-mono font-bold text-slate-500">R$ {formatCurrency(h.openingBalance)}</td><td className="px-6 py-4 text-right text-xs font-mono font-black text-slate-900">R$ {formatCurrency(h.closingBalance)}</td><td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase">Encerrado</span></td></tr>))}{filteredCashHistory.length === 0 && (<tr><td colSpan={5} className="py-20 text-center text-slate-300 font-bold italic">Nenhum histórico de caixa encontrado para este período...</td></tr>)}</tbody></table></div></div>)}
      
      {editingSale && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[120] animate-in fade-in">
          <form onSubmit={handleUpdateSaleMaster} className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
               <h3 className="text-xl font-black text-slate-900 uppercase italic">Ajustar Venda (MASTER)</h3>
               <button type="button" onClick={() => setEditingSale(null)} className="text-slate-300 hover:text-slate-500"><X size={24}/></button>
            </div>
            
            {editSaleMode === 'options' ? (
                <div className="space-y-4">
                    <p className="text-xs text-slate-500 text-center font-bold mb-4">O que você deseja alterar nesta venda?</p>
                    <button type="button" onClick={() => setEditSaleMode('vendedor')} className="w-full py-4 text-center rounded-2xl border-2 border-indigo-100 bg-indigo-50 text-indigo-600 font-black uppercase text-xs hover:bg-indigo-600 hover:text-white transition-all">
                        Alterar Vendedor
                    </button>
                    <button type="button" onClick={() => setEditSaleMode('pagamento')} className="w-full py-4 text-center rounded-2xl border-2 border-purple-100 bg-purple-50 text-purple-600 font-black uppercase text-xs hover:bg-purple-600 hover:text-white transition-all">
                        Alterar Forma de Pagamento
                    </button>
                    <button type="button" onClick={() => setEditingSale(null)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
                </div>
            ) : editSaleMode === 'vendedor' ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Vendedor</label>
                    <select 
                      className="w-full border-2 rounded-xl px-4 py-3 text-sm font-black uppercase bg-slate-50 outline-none focus:border-indigo-500"
                      value={editSeller}
                      onChange={(e) => setEditSeller(e.target.value)}
                      required
                    >
                      {vendedores.map((v: User) => (<option key={v.id} value={v.name}>{v.name}</option>))}
                      <option value="MASTER SYSTEM">MASTER SYSTEM</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setEditSaleMode('options')} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px]">Voltar</button>
                  <button type="submit" className="flex-[2] py-4 bg-amber-500 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl hover:bg-amber-600">Salvar Alterações</button>
                </div>
              </>
            ) : (
                <>
                <div className="space-y-4 max-h-64 overflow-y-auto custom-scroll pr-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Formas de Pagamento</label>
                  {editSalePayments.map((p, index) => (
                    <div key={index} className="flex flex-col gap-2 p-3 border rounded-xl bg-slate-50 relative">
                        <div className="flex gap-2 items-center">
                             <select className="flex-[2] border rounded-lg px-2 py-2 text-xs font-bold outline-none" value={p.method} onChange={(e) => {
                                 const newP = [...editSalePayments]; 
                                 newP[index].method = e.target.value; 
                                 setEditSalePayments(newP); 
                             }}>
                                <option value="Pix">Pix</option>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="C. Débito">C. Débito</option>
                                <option value="C. Crédito">C. Crédito</option>
                                <option value="C. Parcelado">C. Parcelado</option>
                             </select>
                             <div className="relative flex-1">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">R$</span>
                                <input type="text" className="w-full pl-6 pr-2 py-2 border rounded-lg text-xs font-mono font-bold outline-none" value={formatCurrency(p.amount)} 
                                onChange={(e) => {
                                    const val = Math.max(0, parseFloat(e.target.value.replace(/\D/g, '')) / 100);
                                    const newP = [...editSalePayments]; 
                                    newP[index].amount = val; 
                                    setEditSalePayments(newP); 
                                }} />
                             </div>
                             {editSalePayments.length > 1 && (
                                <button type="button" onClick={() => {
                                    const newP = editSalePayments.filter((_, i) => i !== index);
                                    setEditSalePayments(newP);
                                }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={14} />
                                </button>
                             )}
                        </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                      setEditSalePayments([...editSalePayments, { method: 'Dinheiro', amount: 0, netAmount: 0 }]);
                  }} className="w-full py-2 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-50">
                      + Pagamento
                  </button>
                  <div className="text-right text-[10px] font-black text-slate-500 mt-2">
                    Novo Pagamento: R$ {formatCurrency(editSalePayments.reduce((acc, p) => acc + p.amount, 0))} <br/>
                    Valor da Venda: R$ {formatCurrency(editingSale.payments.reduce((acc, p) => acc + p.amount, 0))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setEditSaleMode('options')} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px]">Voltar</button>
                  <button type="submit" className="flex-[2] py-4 bg-amber-500 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl hover:bg-amber-600">Salvar Alterações</button>
                </div>
                </>
            )}
          </form>
        </div>
      )}

      {editingCashLog && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[120] animate-in fade-in">
          <form onSubmit={handleSaveEditCashLog} className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
               <h3 className="text-xl font-black text-slate-900 uppercase italic">Ajustar {editingCashLog.type === 'entrada' ? 'Entrada' : 'Sangria'}</h3>
               <button type="button" onClick={() => setEditingCashLog(null)} className="text-slate-300 hover:text-slate-500"><X size={24}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Valor (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">R$</span>
                  <input 
                    type="text" 
                    className="w-full border-2 rounded-xl pl-12 pr-4 py-3 text-lg font-black bg-slate-50 outline-none focus:border-indigo-500 font-mono"
                    value={formatCurrency(editCashLogVal)}
                    onChange={(e) => setEditCashLogVal(parseCurrency(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Descrição / Motivo</label>
                <textarea 
                  className="w-full border-2 rounded-xl px-4 py-3 text-sm font-bold bg-slate-50 outline-none focus:border-indigo-500 h-24 resize-none"
                  value={editCashLogDesc}
                  onChange={(e) => setEditCashLogDesc(e.target.value)}
                  placeholder="Motivo da alteração..."
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setEditingCashLog(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
              <button type="submit" className="flex-[2] py-4 bg-amber-500 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl hover:bg-amber-600">Salvar Alterações</button>
            </div>
          </form>
        </div>
      )}
      
      {selectedSale && (<div className="fixed inset-0 flex items-center justify-center p-6 z-[100] animate-in fade-in"><div className="bg-white p-8 rounded-[2rem] w-full max-w-2xl shadow-2xl space-y-6 max-h-[90vh] overflow-auto custom-scroll"><div className="flex justify-between items-center border-b pb-4"><h3 className="text-xl font-black text-slate-900 uppercase italic">Detalhes da Venda #{selectedSale.id.toString().slice(-6)}</h3><div className="flex items-center gap-2"><button onClick={() => setReprintSale(selectedSale)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Reimprimir Cupom"><Printer size={20}/></button><button onClick={() => setSelectedSale(null)} className="text-slate-300 hover:text-slate-500"><X size={24}/></button></div></div><div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border"><div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Data / Hora</p><p className="text-xs font-bold text-slate-700">{new Date(selectedSale.date).toLocaleString()}</p></div><div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendedor</p><p className="text-xs font-black text-indigo-600 uppercase">{selectedSale.user}</p></div></div><div className="space-y-3"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produtos Vendidos</h4><div className="border rounded-2xl overflow-hidden"><table className="w-full text-left text-xs"><thead className="bg-slate-50 font-black text-slate-500 uppercase text-[9px]"><tr><th className="px-4 py-2">Item</th><th className="px-4 py-2 text-center">Qtd</th><th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-center">Troca</th></tr></thead><tbody className="divide-y">{selectedSale.items.map((it, i) => (<tr key={i} className={`bg-white ${it.isExchanged ? 'opacity-50 grayscale' : ''}`}><td className="px-4 py-3"><div className="flex flex-col"><span className="font-bold">{it.name}</span><span className="text-[9px] text-slate-400 font-mono">{it.sku}</span><span className="text-[8px] text-slate-500 italic mt-0.5 uppercase tracking-tighter">tam: {it.size || '-'} / cor: {it.color || '-'}</span>{it.isExchanged && <span className="text-[7px] font-black text-red-500 uppercase mt-0.5 animate-pulse">Item Trocado</span>}</div></td><td className="px-4 py-3 text-center font-bold">{it.quantity}</td><td className="px-4 py-3 text-right font-mono font-bold text-indigo-600">R$ {formatCurrency((it.price * it.quantity) - it.discountValue - it.manualDiscountValue)}</td><td className="px-4 py-3 text-center">{canExchange && !it.isExchanged && (<button onClick={() => handleItemExchange(selectedSale, it)} className="p-1.5 bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-all shadow-sm" title="Trocar Item"><RotateCcw size={14}/></button>)}</td></tr>))}</tbody></table></div></div><div className="border-t pt-6 flex flex-col items-end gap-2"><div className="flex justify-between w-64 text-xs font-bold text-slate-400"><span>Subtotal</span><span className="font-mono">R$ {formatCurrency(selectedSale.subtotal)}</span></div><div className="flex justify-between w-64 text-xs font-bold text-red-400"><span>Desconto ({selectedSale.discountPercent.toFixed(1)}%)</span><span className="font-mono">- R$ {formatCurrency(selectedSale.discount)}</span></div>{selectedSale.exchangeCreditUsed && selectedSale.exchangeCreditUsed > 0 && (<div className="flex justify-between w-64 text-xs font-bold text-amber-500"><span>Crédito Utilizado</span><span className="font-mono">- R$ {formatCurrency(selectedSale.exchangeCreditUsed)}</span></div>)}<div className="flex justify-between w-64 text-xl font-black text-slate-900 border-t pt-2"><span className="italic uppercase tracking-tighter">Total Pago</span><span className="font-mono">R$ {formatCurrency(selectedSale.total)}</span></div></div><div className="space-y-3"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meios de Pagamento</h4><div className="flex flex-wrap gap-2">{selectedSale.payments.map((p, i) => (<div key={i} className={`bg-${(p.method === 'Voucher VIP' || p.method === 'F12') ? 'purple' : 'indigo'}-50 border border-${(p.method === 'Voucher VIP' || p.method === 'F12') ? 'purple' : 'indigo'}-100 px-3 py-2 rounded-xl flex flex-col`}><span className={`text-[8px] font-black text-${(p.method === 'Voucher VIP' || p.method === 'F12') ? 'purple' : 'indigo'}-400 uppercase`}>{p.method} {p.installments ? `${p.installments}x` : ''} {p.voucherCode && p.method !== 'Voucher VIP' ? `(${p.voucherCode})` : ''}{p.method === 'F12' ? ` (${p.f12ClientName})` : ''}</span><span className={`text-xs font-black text-${(p.method === 'Voucher VIP' || p.method === 'F12') ? 'purple' : 'indigo'}-600 font-mono`}>R$ {formatCurrency(p.amount)}</span></div>))}</div></div></div></div>)}

      {reprintSale && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[150] animate-in fade-in no-print-overlay">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl space-y-6 animate-in zoom-in-95 overflow-hidden">
             <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full mx-auto flex items-center justify-center border border-indigo-100">
                    <Printer size={32} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic">Reimpressão</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Confirme a impressão do cupom de venda.</p>
             </div>

             <div id="printable-receipt" className="bg-white border-2 border-dashed border-slate-200 p-6 rounded-2xl font-mono text-[11px] text-slate-700 space-y-4 shadow-inner">
                <div className="text-center space-y-1">
                    <p className="font-black text-base italic leading-none">{settings.storeName || 'SCARD SYS'}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] opacity-60">{settings.storeTagline || 'ENTERPRISE SOLUTION'}</p>
                    <p className="text-[8px] opacity-40">{settings.storeAddress || 'Rua da Moda, 123 - Centro'}</p>
                    {settings.storeCnpj && <p className="text-[8px] opacity-40">CNPJ: {settings.storeCnpj}</p>}
                </div>
                
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] font-bold">
                    <span>CUPOM: #{reprintSale.id.toString().slice(-6)}</span>
                    <span>{new Date(reprintSale.date).toLocaleDateString()} {new Date(reprintSale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>

                <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-1">
                        <span>DESCRIÇÃO</span>
                        <span>TOTAL</span>
                    </div>
                    {reprintSale.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-start leading-tight">
                            <span className="flex-1 pr-4 uppercase">
                                {it.quantity}x {it.name}
                                {it.size && <span className="text-[8px] block text-slate-400">TAM: {it.size} | COR: {it.color}</span>}
                            </span>
                            <span className="font-black">R$ {formatCurrency((it.price * it.quantity) - it.discountValue - it.manualDiscountValue)}</span>
                        </div>
                    ))}
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-500">
                        <span>SUBTOTAL</span>
                        <span>R$ {formatCurrency(reprintSale.subtotal)}</span>
                    </div>
                    {reprintSale.discount > 0 && (
                        <div className="flex justify-between text-red-500 font-bold">
                            <span>DESCONTO GERAL</span>
                            <span>- R$ {formatCurrency(reprintSale.discount)}</span>
                        </div>
                    )}
                    {reprintSale.exchangeCreditUsed && reprintSale.exchangeCreditUsed > 0 && (
                        <div className="flex justify-between text-amber-600 font-bold">
                            <span>CRÉDITO TROCA</span>
                            <span>- R$ {formatCurrency(reprintSale.exchangeCreditUsed)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-300 pt-1 mt-1">
                        <span>TOTAL PAGO</span>
                        <span>R$ {formatCurrency(reprintSale.total)}</span>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase">FORMA(S) DE PAGAMENTO:</p>
                    {reprintSale.payments.map((p, i) => (
                        <div key={i} className="flex justify-between text-[10px]">
                            <span>{p.method} {p.installments ? `(${p.installments}x)` : ''}{p.method === 'F12' ? ` (${p.f12ClientName})` : ''}</span>
                            <span className="font-bold">R$ {formatCurrency(p.amount)}</span>
                        </div>
                    ))}
                    {reprintSale.change > 0 && (
                        <div className="flex justify-between text-amber-600 font-bold">
                            <span>TROCO</span>
                            <span>R$ {formatCurrency(reprintSale.change)}</span>
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-slate-200 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">VENDEDOR:</p>
                    <p className="text-[10px] font-bold uppercase">{reprintSale.user}</p>
                    <p className="text-[8px] mt-4 opacity-40">Obrigado pela preferência!</p>
                </div>
             </div>

             <div className="flex gap-3 pt-2">
                <button 
                    onClick={() => setReprintSale(null)} 
                    className="flex-1 px-4 py-4 border-2 border-slate-100 text-slate-400 font-black uppercase text-[10px] rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                >
                    Fechar
                </button>
                <button 
                    onClick={() => { window.print(); setReprintSale(null); }} 
                    className="flex-[2] px-4 py-4 bg-indigo-600 text-white font-black uppercase text-[10px] rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Printer size={18} />
                    Imprimir Agora
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CONFIGURAÇÕES ---

export default ReportsViewComponent;
