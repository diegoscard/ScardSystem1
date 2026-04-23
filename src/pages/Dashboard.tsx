import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Edit, X, RefreshCw, Layers, Check, Calendar, ArrowRightLeft, Upload, Bike, Percent, DollarSign, TicketPercent, Package, Tag, Gift, CalendarDays, Share2, Copy, Target, UserIcon, UserPlus, ShoppingBag, TrendingUp, ShieldAlert, ChevronLeft, ChevronRight, RotateCcw, Wallet, ArrowUpCircle, ArrowDownCircle, ShoppingCart, ReceiptText, Printer , Star, HandCoins, Box, CreditCard, Banknote, QrCode, Trophy, Medal, Award, Calculator, Zap } from 'lucide-react';
import { Product, Sale, FiadoRecord, CashSession, CashHistoryEntry, CommissionTier } from '../types';
import { useStore } from '../contexts/StoreContext';
import { formatCurrency, parseCurrency } from '../utils/helpers';

const DashboardViewComponent = () => {
  const { user, products, sales, cashSession, fiados, cashHistory, commTiers, setCommTiers, dbUsers: vendedores } = useStore();
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const [commFilterMonth, setCommFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  const filteredSales = useMemo(() => {
    return sales.filter((s: Sale) => {
      const d = new Date(s.date);
      if (period === 'day') {
        const [y, m, day] = selectedDay.split('-').map(Number);
        return d.getFullYear() === y && (d.getMonth() + 1) === m && d.getDate() === day;
      }
      if (period === 'month') {
        const [y, m] = selectedMonth.split('-').map(Number);
        return d.getFullYear() === y && (d.getMonth() + 1) === m;
      }
      if (period === 'year') {
        return d.getFullYear() === Number(selectedYear);
      }
      return true;
    });
  }, [sales, period, selectedDay, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    let totals = { total: 0, cash: 0, pix: 0, card: 0, voucher: 0, voucherVip: 0, f12: 0, count: 0 };
    let productsCount: Record<number, { name: string, qty: number, size?: string, color?: string }> = {};

    filteredSales.forEach((s: Sale) => {
      totals.count += 1;
      s.payments.forEach(p => {
        if (p.method === 'F12') {
           totals.f12 += p.amount;
        } else {
           if (p.method !== 'Voucher VIP') {
              totals.total += p.amount;
           }
           
           if (p.method === 'Dinheiro') totals.cash += p.amount; 
           else if (p.method === 'Pix') totals.pix += p.amount; 
           else if (p.method === 'Voucher') totals.voucher += p.amount;
           else if (p.method === 'Voucher VIP') totals.voucherVip += p.amount;
           else totals.card += p.amount;
        }
      });
      s.items.forEach(item => {
        if (!productsCount[item.productId]) { productsCount[item.productId] = { name: item.name, qty: 0, size: item.size, color: item.color }; }
        productsCount[item.productId].qty += item.quantity;
      });
    });

    const allLogs = [
      ...(cashSession?.logs || []),
      ...(cashHistory?.flatMap((h: any) => h.logs) || [])
    ];

    allLogs.forEach(log => {
       const logDate = new Date(log.time);
       let matchPeriod = false;
       if (period === 'day') {
          const [y, m, d] = selectedDay.split('-').map(Number);
          matchPeriod = logDate.getFullYear() === y && (logDate.getMonth() + 1) === m && logDate.getDate() === d;
       } else if (period === 'month') {
          const [y, m] = selectedMonth.split('-').map(Number);
          matchPeriod = logDate.getFullYear() === y && (logDate.getMonth() + 1) === m;
       } else {
          matchPeriod = logDate.getFullYear() === Number(selectedYear);
       }

       if (matchPeriod && log.description.startsWith('Rec. Pendente:')) {
          totals.total += log.amount;
          if (log.description.includes('(Dinheiro)')) totals.cash += log.amount;
          else if (log.description.includes('(Pix)')) totals.pix += log.amount;
          else totals.card += log.amount;
       }
    });

    const productsRank = Object.values(productsCount).sort((a, b) => b.qty - a.qty).slice(0, 5);
    return { totals, productsRank };
  }, [filteredSales, cashSession, cashHistory, period, selectedDay, selectedMonth, selectedYear]);

  const commissionContext = useMemo(() => {
    let sellersMap: Record<string, number> = {};
    let totalMonthly = 0;
    
    const [y, m] = commFilterMonth.split('-').map(Number);
    
    sales.forEach((s: Sale) => {
      const sd = new Date(s.date);
      if (sd.getFullYear() === y && (sd.getMonth() + 1) === m) {
        if (!sellersMap[s.user]) sellersMap[s.user] = 0;
        sellersMap[s.user] += s.total;
        totalMonthly += s.total;
      }
    });
    return { sellers: Object.entries(sellersMap).sort((a, b) => b[1] - a[1]), total: totalMonthly };
  }, [sales, commFilterMonth]);

  const getTierForValue = (val: number) => {
    const sorted = [...commTiers].sort((a, b) => b.min - a.min);
    return sorted.find(t => val >= t.min) || commTiers[0];
  };

  const handleUpdateTier = (index: number, field: 'min' | 'rate', value: number) => {
    const newTiers = [...commTiers];
    newTiers[index][field] = value;
    setCommTiers(newTiers);
  };

  const handleAddTier = () => {
    const maxMin = Math.max(...commTiers.map(t => t.min), 0);
    setCommTiers([...commTiers, { min: maxMin + 10000, rate: 1 }]);
  };

  const handleRemoveTier = (index: number) => {
    if (commTiers.length <= 1) return;
    setCommTiers(commTiers.filter((_, i) => i !== index));
  };

  const totalStock = products.reduce((acc: number, p: any) => acc + p.stock, 0);
  const totalStockCost = products.reduce((acc: number, p: any) => acc + (p.cost * p.stock), 0);
  const totalStockSaleValue = products.reduce((acc: number, p: any) => acc + (p.price * p.stock), 0);
  const totalFiadoPending = fiados.filter((f: FiadoRecord) => f.status === 'pending').reduce((acc: number, f: FiadoRecord) => acc + f.remainingAmount, 0);
  
  const totalReceivedForBadges = stats.totals.cash + stats.totals.pix + stats.totals.card + stats.totals.voucher + stats.totals.voucherVip;

  return (
    <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col"><h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Painel Indicadores</h2><p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Visão estratégica do negócio</p></div>
        <div className="flex flex-col items-end gap-2">
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {(['day', 'month', 'year'] as const).map((p) => (
                    <button key={p} onClick={() => setPeriod(p)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${period === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>{p === 'day' ? 'DIA' : p === 'month' ? 'MÊS' : 'ANO'}</button>
                ))}
            </div>
            <div className="flex items-center gap-3">
              {period === 'day' && (<div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 animate-in fade-in shadow-sm"><span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">ESCOLHA O DIA:</span><input type="date" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="bg-transparent text-sm font-black text-indigo-700 outline-none cursor-pointer" /></div>)}
              {period === 'month' && (<div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 animate-in fade-in shadow-sm"><span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">ESCOLHA O MÊS:</span><input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent text-sm font-black text-indigo-700 outline-none cursor-pointer" /></div>)}
              {period === 'year' && (<div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 animate-in fade-in shadow-sm"><span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">ESCOLHA O ANO:</span><input type="number" min="2000" max="2100" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent text-sm font-black text-indigo-700 outline-none cursor-pointer w-20" /></div>)}
            </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CardStat icon={<TrendingUp size={24}/>} label="Faturamento Real" val={`R$ ${stats.totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="green" />
        <CardStat icon={<Star size={24}/>} label="Voucher VIP" val={`R$ ${formatCurrency(stats.totals.voucherVip)}`} color="amber" />
        <CardStat icon={<HandCoins size={24}/>} label="Pendente (F12)" val={`R$ ${formatCurrency(totalFiadoPending)}`} color="red" />
        <CardStat icon={<Box size={24}/>} label="Total Estoque" val={`${totalStock} peças`} subVal={
          <div className="flex flex-col">
            <span className="text-red-500">Custo Total R$ {formatCurrency(totalStockCost)}</span>
            <span className="text-emerald-600 mt-0.5">Venda Total R$ {formatCurrency(totalStockSaleValue)}</span>
          </div>
        } color="blue" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
              <div className="flex justify-between items-center"><h3 className="text-lg font-black text-slate-800 uppercase italic flex items-center gap-2"><CreditCard size={20} className="text-indigo-600" /> Meios de Recebimento</h3><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Período Selecionado</span></div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                 <PaymentBadge label="Dinheiro" val={stats.totals.cash} color="green" total={totalReceivedForBadges} icon={<Banknote size={16}/>} />
                 <PaymentBadge label="Pix" val={stats.totals.pix} color="blue" total={totalReceivedForBadges} icon={<QrCode size={16}/>} />
                 <PaymentBadge label="Cartão" val={stats.totals.card} color="indigo" total={totalReceivedForBadges} icon={<CreditCard size={16}/>} />
                 <PaymentBadge label="Voucher" val={stats.totals.voucher} color="amber" total={totalReceivedForBadges} icon={<Gift size={16}/>} />
                 <PaymentBadge label="Pendentes (F12)" val={stats.totals.f12} color="red" total={totalReceivedForBadges + stats.totals.f12} icon={<HandCoins size={16}/>} />
              </div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 uppercase italic mb-8 flex items-center gap-2"><Trophy size={20} className="text-amber-500" /> Ranking de Produtos</h3>
              <div className="space-y-4">
                 {stats.productsRank.length > 0 ? stats.productsRank.map((p, idx) => (
                    <div key={idx} className="bg-slate-50 p-5 rounded-3xl flex items-center justify-between border border-slate-100 hover:border-amber-200 transition-all group">
                       <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-white transition-all group-hover:scale-110 ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-orange-600'}`}>
                             {idx === 0 ? <Medal size={24}/> : idx === 1 ? <Medal size={24}/> : <Award size={24}/>}
                          </div>
                          <div>
                             <div className="flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{idx + 1}º mais vendido</span></div>
                             <h4 className="text-lg font-black text-slate-900 uppercase italic leading-tight">{p.name}</h4>
                             {(p.size || p.color) && (<p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-80 flex items-center gap-2">{p.size && <span>tam: <span className="text-indigo-500">{p.size}</span></span>}{p.color && <span>/ cor: <span className="text-indigo-500">{p.color}</span></span>}</p>)}
                          </div>
                       </div>
                       <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Qtd Saída</p><p className="text-xl font-black text-indigo-600">{p.qty} <span className="text-[10px] text-slate-400 uppercase">un</span></p></div>
                    </div>
                 )) : (<div className="py-12 text-center text-slate-300 font-bold italic">Sem movimentação de produtos no período...</div>)}
              </div>
           </div>
        </div>
        <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col h-fit">
           <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
           <div className="relative z-10 flex flex-col">
              <div className="mb-8">
                 <h3 className="text-lg font-black uppercase italic flex items-center gap-2"><Calculator size={20} className="text-indigo-400" /> Equipe & Comissões</h3>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 mb-2">Configuração de metas escalonadas</p>
                 
                 <div className="flex items-center gap-2 mb-4 bg-white/5 p-3 rounded-2xl border border-white/10 group focus-within:border-indigo-500 transition-colors">
                    <Calendar size={14} className="text-slate-500 group-focus-within:text-indigo-400" />
                    <input 
                      type="month" 
                      value={commFilterMonth} 
                      onChange={(e) => setCommFilterMonth(e.target.value)}
                      className="bg-transparent text-[10px] font-black text-indigo-400 outline-none uppercase cursor-pointer flex-1"
                    />
                 </div>

                 <div className="space-y-3 mb-6 bg-white/5 p-4 rounded-3xl border border-white/10">
                    <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Ajuste de Faixas</span>
                        <button onClick={handleAddTier} className="text-[8px] font-black text-indigo-400 hover:text-indigo-300 uppercase flex items-center gap-1">
                          <Plus size={10} /> Adicionar
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scroll pr-1">
                        {commTiers.sort((a,b) => a.min - b.min).map((tier, idx) => (
                          <div key={idx} className="flex items-center gap-2 animate-in slide-in-from-right-1">
                             <div className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-2 py-1.5 flex items-center gap-1.5">
                                <span className="text-[8px] font-black text-slate-600 uppercase">Min</span>
                                <input 
                                  type="text" 
                                  className="w-full bg-transparent text-[10px] font-black text-white outline-none" 
                                  value={formatCurrency(tier.min)} 
                                  onChange={e => handleUpdateTier(idx, 'min', parseCurrency(e.target.value))}
                                />
                             </div>
                             <div className="w-16 bg-slate-900 border border-white/5 rounded-xl px-2 py-1.5 flex items-center gap-1">
                                <input 
                                  type="number" 
                                  className="w-full bg-transparent text-[10px] font-black text-indigo-400 outline-none text-center" 
                                  value={tier.rate} 
                                  onChange={e => handleUpdateTier(idx, 'rate', Number(e.target.value))}
                                />
                                <Percent size={10} className="text-slate-600"/>
                             </div>
                             <button onClick={() => handleRemoveTier(idx)} className="p-1.5 text-red-500/50 hover:text-red-500"><Trash2 size={12}/></button>
                          </div>
                        ))}
                    </div>
                 </div>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-auto custom-scroll pr-2">
                 {commissionContext.sellers.map(([name, val], idx) => {
                    const tier = getTierForValue(val);
                    const rate = tier.rate;
                    const commission = val * (rate / 100);
                    const isTop = idx === 0 && val > 0;
                    
                    return (
                       <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                          <div className="flex justify-between items-center mb-3">
                             <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${isTop ? 'bg-amber-600/30 text-amber-400 border-amber-600/20' : 'bg-indigo-600/30 text-indigo-400 border-indigo-600/20'}`}>
                                    {idx + 1}º
                                </div>
                                <span className="text-xs font-black uppercase tracking-tight group-hover:text-indigo-300 transition-colors">{name}</span>
                             </div>
                             <span className="text-xs font-black font-mono">R$ {val.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full mb-3 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${rate >= 4 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (val / (commissionContext.total || 1)) * 100)}%` }}></div>
                          </div>
                          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-md ${rate >= 4 ? 'bg-amber-500/10 text-amber-500' : 'bg-white/10 text-slate-400'}`}>Taxa: {rate}%</span>
                                {rate >= 4 && <Zap size={8} className="text-amber-500 animate-pulse" />}
                            </div>
                            <div className="text-right">
                                <span className={`${rate >= 4 ? 'text-amber-400' : 'text-indigo-400'} text-[10px] font-mono italic`}>Comissão: R$ {formatCurrency(commission)}</span>
                            </div>
                          </div>
                       </div>
                    );
                 })}
                 {commissionContext.sellers.length === 0 && (<div className="h-full flex items-center justify-center py-20"><p className="text-slate-700 font-bold uppercase text-[10px] tracking-widest">Sem movimentação</p></div>)}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const CardStat = ({ icon, label, val, color, subVal }: any) => (
  <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-xl hover:-translate-y-1 transition-all group">
    <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">{label}</p>
      <p className="text-2xl font-black text-slate-900 font-mono italic tracking-tighter leading-tight truncate pr-2.5">{val}</p>
      {subVal && <div className="text-[9px] font-black uppercase mt-1 tracking-tight">{subVal}</div>}
    </div>
  </div>
);

const PaymentBadge = ({ label, val, color, total, icon }: any) => {
  const percent = total > 0 ? (val / total) * 100 : 0;
  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className={`p-1.5 rounded-lg bg-${color}-50 text-${color}-500`}>{icon}</div><span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{label}</span></div><span className="text-[10px] font-black text-slate-400">{percent.toFixed(1)}%</span></div>
       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-colors"><p className="text-base font-black text-slate-800 font-mono">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
       <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full bg-${color}-500 rounded-full transition-all duration-700`} style={{ width: `${percent}%` }}></div></div>
    </div>
  );
};

// --- RELATÓRIOS ---

export default DashboardViewComponent;
