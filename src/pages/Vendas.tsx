import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, X, RefreshCw, Layers, Check, Calendar, ArrowRightLeft, Upload, Bike, Percent, DollarSign, TicketPercent, Package, Tag, Gift, CalendarDays, Share2, Copy, Target, UserIcon, UserPlus, ShoppingBag, TrendingUp, ShieldAlert, ChevronLeft, ChevronRight, RotateCcw, Wallet, ArrowUpCircle, ArrowDownCircle, ShoppingCart, ReceiptText, Printer } from 'lucide-react';
import { Customer, Sale, SaleItem, Product, FiadoRecord, CashLog, CashSession, Campaign, User, AppSettings as Settings } from '../types';
import { useStore } from '../contexts/StoreContext';
import { formatCurrency, maskCPFCNPJ, maskPhone, maskDate, parseCurrency } from '../utils/helpers';

const SalesViewComponent = ({ setCurrentView }: { setCurrentView: (view: string) => void }) => {
  const { user, products, setProducts, setSales, setMovements, dbUsers: vendedores, cashSession, setCashSession, settings, exchangeCredit, setExchangeCredit, campaigns, setCampaigns, fiados, setFiados, customers, setCustomers, pdvState, setPdvState } = useStore();
  
  if (!user) return null;
  const isMasterUser = user.id === 0 || user.email === 'master@internal';
  const isAdmin = user.role === 'admin' || isMasterUser;
  
  const cart = pdvState.cart;
  const setCart = (newCart: any) => setPdvState((prev: any) => ({ ...prev, cart: typeof newCart === 'function' ? newCart(prev.cart) : newCart }));

  const appliedPayments = pdvState.appliedPayments;
  const setAppliedPayments = (newPayments: any) => setPdvState((prev: any) => ({ ...prev, appliedPayments: typeof newPayments === 'function' ? newPayments(prev.appliedPayments) : newPayments }));

  const discountType = pdvState.discountType;
  const setDiscountType = (val: any) => setPdvState((prev: any) => ({ ...prev, discountType: typeof val === 'function' ? val(prev.discountType) : val }));

  const discountInput = pdvState.discountInput;
  const setDiscountInput = (val: any) => setPdvState((prev: any) => ({ ...prev, discountInput: typeof val === 'function' ? val(prev.discountInput) : val }));

  const selectedCustomer = pdvState.selectedCustomer;
  const setSelectedCustomer = (val: any) => setPdvState((prev: any) => ({ ...prev, selectedCustomer: typeof val === 'function' ? val(prev.selectedCustomer) : val }));

  const assignedVendedor = pdvState.assignedVendedor || user.name;
  const setAssignedVendedor = (val: any) => setPdvState((prev: any) => ({ ...prev, assignedVendedor: typeof val === 'function' ? val(prev.assignedVendedor) : val }));

  const [search, setSearch] = useState('');
  const [isExact, setIsExact] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [currentPayMethod, setCurrentPayMethod] = useState('Pix');
  const [currentPayAmount, setCurrentPayAmount] = useState(0);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [f12Client, setF12Client] = useState('');
  const [f12Desc, setF12Desc] = useState('');
  const [f12Date, setF12Date] = useState('');
  const [installments, setInstallments] = useState(1);
  const [modalFluxo, setModalFluxo] = useState<'entrada' | 'retirada' | null>(null);
  const [authRequest, setAuthRequest] = useState<'entrada' | 'retirada' | null>(null);
  const [fluxoDesc, setFluxoDesc] = useState('');
  const [fluxoVal, setFluxoVal] = useState(0);
  const [receiptData, setReceiptData] = useState<Sale | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    const t = customerSearch.toLowerCase();
    return (customers || []).filter((c: Customer) => 
      c.name.toLowerCase().includes(t) || 
      c.document.includes(t) || 
      c.phone.includes(t)
    );
  }, [customers, customerSearch]);

  const filtered = useMemo(() => {
    const active = products.filter((p: Product) => p.active && p.stock > 0);
    if (!search) return active;
    const t = search.toLowerCase();
    return active.filter((p: Product) => {
      if (isExact) {
        return p.name.toLowerCase() === t || p.sku.toLowerCase() === t;
      }
      return p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t);
    });
  }, [products, search, isExact]);

  const getQualifyingCampaign = useCallback((productId: number) => {
    const now = new Date();
    return (campaigns || []).find((c: Campaign) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      end.setHours(23, 59, 59, 999);
      return now >= start && now <= end && c.productIds?.includes(productId);
    });
  }, [campaigns]);

  const applyAutomaticCampaigns = useCallback((currentCart: SaleItem[]) => {
    let newCart = [...currentCart];
    
    newCart = newCart.map(item => ({ 
      ...item, 
      discountValue: 0, 
      campaignName: undefined, 
      campaignType: undefined 
    }));

    const activeXYCampaigns = (campaigns || []).filter((c: Campaign) => {
      const now = new Date();
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      end.setHours(23, 59, 59, 999);
      return c.type === 'buy_x_get_y' && now >= start && now <= end;
    });

    activeXYCampaigns.forEach((camp: Campaign) => {
      const qualifyingItems = newCart.filter(item => camp.productIds.includes(item.productId));
      const totalUnits = qualifyingItems.reduce((acc, item) => acc + item.quantity, 0);
      
      const leveY = camp.leveY || 1;
      const pagueX = camp.pagueX || 0;
      
      if (totalUnits >= leveY) {
        const freePerBundle = leveY - pagueX;
        const freeUnitsTotal = Math.floor(totalUnits / leveY) * freePerBundle;
        
        let allUnits: { cartId: string, price: number }[] = [];
        qualifyingItems.forEach(item => {
          for(let k = 0; k < item.quantity; k++) {
            allUnits.push({ cartId: item.cartId, price: item.price });
          }
        });

        allUnits.sort((a, b) => a.price - b.price);
        
        const unitsToDiscount = allUnits.slice(0, freeUnitsTotal);
        
        unitsToDiscount.forEach(unit => {
          const cartIdx = newCart.findIndex(it => it.cartId === unit.cartId);
          if (cartIdx !== -1) {
            newCart[cartIdx].discountValue += unit.price;
            newCart[cartIdx].campaignName = camp.name;
            newCart[cartIdx].campaignType = 'buy_x_get_y';
          }
        });
      }
    });

    const activeBundleCampaigns = (campaigns || []).filter((c: Campaign) => {
      const now = new Date();
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      end.setHours(23, 59, 59, 999);
      return c.type === 'bundle' && now >= start && now <= end;
    });

    activeBundleCampaigns.forEach((camp: Campaign) => {
      const qualifyingItems = newCart.filter(item => camp.productIds.includes(item.productId));
      const totalQty = qualifyingItems.reduce((acc, item) => acc + item.quantity, 0);
      const bundleQty = camp.bundleQuantity || 1;

      if (totalQty >= bundleQty) {
        const setsCount = Math.floor(totalQty / bundleQty);
        const targetPricePerSet = camp.bundlePrice || 0;
        
        let allUnits: { cartId: string, price: number }[] = [];
        qualifyingItems.forEach(item => {
          for(let k = 0; k < item.quantity; k++) {
            allUnits.push({ cartId: item.cartId, price: item.price });
          }
        });

        allUnits.sort((a, b) => b.price - a.price);

        const unitsInBundles = allUnits.slice(0, setsCount * bundleQty);
        const originalBundlesTotal = unitsInBundles.reduce((acc, u) => acc + u.price, 0);
        const targetBundlesTotal = setsCount * targetPricePerSet;
        const totalDiscountToApply = Math.max(0, originalBundlesTotal - targetBundlesTotal);

        unitsInBundles.forEach(unit => {
          const cartIdx = newCart.findIndex(it => it.cartId === unit.cartId);
          if (cartIdx !== -1) {
            const proportionalDiscount = totalDiscountToApply / unitsInBundles.length;
            newCart[cartIdx].discountValue += proportionalDiscount;
            newCart[cartIdx].campaignName = camp.name;
            newCart[cartIdx].campaignType = 'bundle';
          }
        });
      }
    });

    newCart = newCart.map(item => {
      if (item.campaignType) return item; 
      const camp = getQualifyingCampaign(item.productId);
      if (camp && camp.type === 'fixed_price') {
        const fixedVal = camp.fixedPriceValue || 0;
        const disc = Math.max(0, (item.price - fixedVal) * item.quantity);
        return { ...item, discountValue: disc, campaignName: camp.name, campaignType: 'fixed_price' };
      }
      return item;
    });

    newCart = newCart.map(item => {
      if (item.campaignType) return item; 
      const camp = getQualifyingCampaign(item.productId);
      if (camp && camp.type === 'percentage') {
        const disc = (item.price * item.quantity) * (camp.discountPercent / 100);
        return { ...item, discountValue: disc, campaignName: camp.name, campaignType: 'percentage' };
      }
      return item;
    });

    return newCart;
  }, [campaigns, getQualifyingCampaign]);

  const addDirectly = useCallback((p: Product) => {
    const totalInCart = cart.filter(item => item.productId === p.id).reduce((acc, item) => acc + item.quantity, 0);
    if (totalInCart + 1 > p.stock) {
        alert('Estoque insuficiente para este produto!');
        return;
    }

    const newItem: SaleItem = { 
      cartId: Math.random().toString(36).substr(2, 9),
      productId: p.id, 
      name: p.name, 
      sku: p.sku,
      quantity: 1,
      price: p.price,
      size: p.size,
      color: p.color,
      discountValue: 0,
      manualDiscountValue: 0,
      manualDiscountInput: 0,
      manualDiscountType: 'value',
      discountBlocked: p.discountBlocked || false
    };

    const updatedCart = applyAutomaticCampaigns([...cart, newItem]);
    setCart(updatedCart);
    setSelectedId(''); 
    setSearch(''); 
    setTimeout(() => searchInputRef.current?.focus(), 10);
  }, [cart, applyAutomaticCampaigns]);

  const updateQuantity = (cartId: string, delta: number) => {
    const item = cart.find(i => i.cartId === cartId);
    if (!item) return;
    
    const prod = products.find((p: Product) => p.id === item.productId);
    if (!prod) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      const updated = applyAutomaticCampaigns(cart.filter(i => i.cartId !== cartId));
      setCart(updated);
      return;
    }

    if (delta > 0) {
       const totalInCart = cart.filter(i => i.productId === item.productId).reduce((acc, it) => acc + it.quantity, 0);
       if (totalInCart + 1 > prod.stock) return alert('Limite de estoque!');
    }

    const updatedItems = cart.map(i => i.cartId === cartId ? { ...i, quantity: newQty } : i);
    setCart(applyAutomaticCampaigns(updatedItems));
  };

  const removeFromCart = (cartId: string) => {
    setCart(applyAutomaticCampaigns(cart.filter(i => i.cartId !== cartId)));
  };

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length >= 3) {
      const match = products.find((p: Product) => p.active && p.sku.toLowerCase() === trimmed.toLowerCase());
      if (match) { addDirectly(match); }
    }
  }, [search, products, addDirectly]);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, i) => acc + (i.price * i.quantity) - i.discountValue - i.manualDiscountValue, 0);
  }, [cart]);

  const totalGrossDiscretionaryBase = useMemo(() => {
    return cart.filter(it => !it.discountBlocked).reduce((acc, i) => acc + (i.price * i.quantity), 0);
  }, [cart]);

  const totalManualItemDiscounts = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.manualDiscountValue, 0);
  }, [cart]);
  
  const globalDiscountValue = useMemo(() => {
    const inputVal = Number(discountInput) || 0;
    const limitPct = isAdmin ? 100 : settings.maxGlobalDiscount;
    
    const maxTotalBudget = totalGrossDiscretionaryBase * (limitPct / 100);
    const availableForGlobal = Math.max(0, maxTotalBudget - totalManualItemDiscounts);

    let requested = 0;
    if (discountType === 'percent') {
      requested = totalGrossDiscretionaryBase * (inputVal / 100);
    } else {
      requested = inputVal;
    }

    return Math.min(requested, availableForGlobal);
  }, [cart, discountInput, discountType, settings.maxGlobalDiscount, isAdmin, totalGrossDiscretionaryBase, totalManualItemDiscounts]);

  const totalCartBeforeCredit = Math.max(0, subtotal - globalDiscountValue);
  const creditToUse = Math.min(totalCartBeforeCredit, exchangeCredit);
  const remainingExchangeCredit = Math.max(0, exchangeCredit - creditToUse);
  const totalFinalToPay = Math.max(0, totalCartBeforeCredit - exchangeCredit);
  
  const totalPaid = appliedPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalanceToSettle = Math.max(0, totalFinalToPay - totalPaid);
  const changeValue = Math.max(0, totalPaid - totalFinalToPay);

  useEffect(() => {
    setCurrentPayAmount(parseFloat(remainingBalanceToSettle.toFixed(2)));
  }, [totalFinalToPay, totalPaid, remainingBalanceToSettle]);

  const calculatedInstallment = useMemo(() => {
    if (currentPayMethod !== 'C. Parcelado' || installments < 1) return currentPayAmount;
    const totalWithInterest = currentPayAmount * (1 + (settings.cardFees.creditInstallments / 100));
    return totalWithInterest / installments;
  }, [currentPayAmount, currentPayMethod, installments, settings.cardFees.creditInstallments]);

  const handleFinish = () => {
    if (cart.length === 0) return;
    const isVip = appliedPayments.some(p => p.method === 'Voucher VIP');
    if (totalPaid < totalFinalToPay - 0.01 && totalFinalToPay > 0 && !isVip) {
      alert(`Pendente de recebimento: R$ ${remainingBalanceToSettle.toFixed(2)}`);
      return;
    }
    
    const totalDiscountRecorded = cart.reduce((acc, i) => acc + i.discountValue + i.manualDiscountValue, 0) + globalDiscountValue;
    const initialBruto = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const sale: Sale = { 
      id: Date.now(), 
      date: new Date().toISOString(), 
      subtotal: initialBruto, 
      discount: totalDiscountRecorded, 
      discountPercent: initialBruto > 0 ? (totalDiscountRecorded / initialBruto) * 100 : 0,
      total: isVip ? 0 : totalFinalToPay, 
      payments: [...appliedPayments], 
      user: assignedVendedor, 
      adminUser: user.name, 
      items: [...cart], 
      change: changeValue,
      exchangeCreditUsed: creditToUse,
      customerId: selectedCustomer?.id
    };
    setSales((prev: any) => [sale, ...prev]);

    if (selectedCustomer) {
      setCustomers((prev: Customer[]) => prev.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, totalSpent: c.totalSpent + sale.total, lastPurchase: sale.date } 
          : c
      ));
    }

    const f12Payments = appliedPayments.filter(p => p.method === 'F12');
    if (f12Payments.length > 0) {
       const newFiados: FiadoRecord[] = f12Payments.map(p => ({
          id: Math.random().toString(36).substr(2, 9),
          saleId: sale.id,
          clientName: p.f12ClientName || 'Desconhecido',
          description: p.f12Description || 'Sem observação',
          totalAmount: p.amount,
          remainingAmount: p.amount,
          createdAt: new Date().toISOString(),
          dueDate: p.f12DueDate || new Date().toISOString(),
          vendedor: assignedVendedor,
          status: 'pending',
          items: [...cart]
       }));
       setFiados((prev: FiadoRecord[]) => [...newFiados, ...prev]);
    }

    setProducts(products.map((p: Product) => {
      const items = cart.filter(i => i.productId === p.id);
      const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);
      return totalQty > 0 ? { ...p, stock: p.stock - totalQty } : p;
    }));

    setMovements((prev: any) => [...cart.map(i => ({
      id: Math.random(), productId: i.productId, productName: i.name, type: 'saida', quantity: i.quantity, reason: 'Venda PDV', date: new Date().toISOString(), user: assignedVendedor
    })), ...prev]);

    const voucherPayments = appliedPayments.filter(p => (p.method === 'Voucher' || p.method === 'Voucher VIP') && p.voucherCode);
    if (voucherPayments.length > 0) {
        setCampaigns((prev: Campaign[]) => prev.map(c => {
            const hasVoucherInSale = voucherPayments.some(vp => vp.voucherCode === c.voucherCode);
            if (hasVoucherInSale && c.type === 'voucher') {
                return { ...c, voucherQuantity: (c.voucherQuantity || 1) - 1 };
            }
            return c;
        }));
    }

    const cashPaid = appliedPayments.filter(p => p.method === 'Dinheiro').reduce((acc, p) => acc + p.amount, 0) - changeValue;
    if (cashPaid !== 0 && (cashSession || isMasterUser)) {
      const newLog: CashLog = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'venda',
        amount: Math.abs(cashPaid),
        description: `Venda #${sale.id.toString().slice(-4)}`,
        time: new Date().toISOString(),
        user: assignedVendedor
      };
      if (cashSession) {
          setCashSession((prev: CashSession) => ({
            ...prev,
            currentBalance: prev.currentBalance + cashPaid,
            logs: [newLog, ...prev.logs]
          }));
      }
    }
    
    setReceiptData(sale);
    setCart([]); 
    setAppliedPayments([]); 
    setDiscountInput(0); 
    setExchangeCredit(remainingExchangeCredit);
    setSelectedCustomer(null);
  };

  const validateVoucher = () => {
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;

    const voucher = campaigns.find((c: Campaign) => c.type === 'voucher' && c.voucherCode === code && c.active);
    
    if (!voucher) {
        alert('Código de voucher inválido ou não encontrado.');
        return;
    }

    const now = new Date();
    const start = new Date(voucher.startDate);
    const end = new Date(voucher.endDate);
    end.setHours(23, 59, 59, 999);

    if (now < start || now > end) {
        alert('Este voucher está fora do período de validade.');
        return;
    }

    if ((voucher.voucherQuantity || 0) <= 0) {
        alert('Este voucher atingiu o limite máximo de utilizações.');
        return;
    }

    const valueToApply = Math.min(remainingBalanceToSettle, voucher.voucherValue || 0);
    setCurrentPayAmount(valueToApply);
    alert(`Voucher "${voucher.name}" validado! R$ ${formatCurrency(valueToApply)} pronto para lançar.`);
  };

  const addPayment = () => {
    if (currentPayAmount <= 0 && currentPayMethod !== 'Voucher VIP') return;
    
    if (currentPayMethod === 'Voucher VIP') {
        const fullRemaining = remainingBalanceToSettle;
        setAppliedPayments([...appliedPayments, { 
          method: 'Voucher VIP', 
          amount: fullRemaining,
          netAmount: 0,
          voucherCode: 'VIP_INTERNAL'
        }]);
        setCurrentPayAmount(0);
        return;
    }

    if (currentPayMethod === 'F12') {
       if (!f12Client.trim()) {
          alert('Por favor, informe o nome do cliente para o registro F12.');
          return;
       }
    }

    let net = currentPayAmount;
    if (currentPayMethod === 'C. Débito') net = currentPayAmount * (1 - settings.cardFees.debit / 100);
    else if (currentPayMethod === 'C. Crédito') net = currentPayAmount * (1 - settings.cardFees.credit1x / 100);
    else if (currentPayMethod === 'C. Parcelado') net = currentPayAmount * (1 - settings.cardFees.creditInstallments / 100);
    else if (currentPayMethod === 'F12') net = 0; 
    
    setAppliedPayments([...appliedPayments, { 
      method: currentPayMethod, 
      amount: currentPayAmount,
      installments: currentPayMethod === 'C. Parcelado' ? installments : undefined,
      installmentValue: currentPayMethod === 'C. Parcelado' ? calculatedInstallment : undefined,
      netAmount: parseFloat(net.toFixed(2)),
      voucherCode: currentPayMethod === 'Voucher' ? voucherCodeInput.trim().toUpperCase() : undefined,
      f12ClientName: currentPayMethod === 'F12' ? f12Client.trim().toUpperCase() : undefined,
      f12Description: currentPayMethod === 'F12' ? f12Desc.trim() : undefined,
      f12DueDate: currentPayMethod === 'F12' ? f12Date : undefined
    }]);

    setF12Client('');
    setF12Desc('');
    setF12Date('');
    setInstallments(1);
    setCurrentPayAmount(0);
    setVoucherCodeInput('');
  };

  const removePayment = (index: number) => {
    setAppliedPayments(prev => prev.filter((_, i) => i !== index));
  };

  const requestFluxo = (type: 'entrada' | 'retirada') => {
    if (type === 'entrada' || isAdmin) {
      setModalFluxo(type);
    } else {
      setAuthRequest(type);
    }
  };

  const handleAuthorization = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const userOrEmail = (form.elements.namedItem('authUser') as HTMLInputElement).value;
    const pass = (form.elements.namedItem('authPass') as HTMLInputElement).value;
    const isAuthMaster = userOrEmail === 'master' && pass === '965088';
    const authAdmin = vendedores.find((v: User) => (v.email === userOrEmail || v.name === userOrEmail) && v.password === pass && v.role === 'admin');
    if (isAuthMaster || authAdmin) {
      setModalFluxo(authRequest);
      setAuthRequest(null);
    } else {
      alert('Credenciais de Administrador inválidas!');
    }
  };

  const creditBalanceResult = exchangeCredit - totalCartBeforeCredit;

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between shrink-0">
         <h2 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">Caixa - Painel de Vendas</h2>
         <div className="flex items-center gap-3">
            {exchangeCredit > 0 && (
              <div className={`${creditBalanceResult >= 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'} px-4 py-1.5 rounded-lg border flex items-center gap-2 animate-pulse shadow-sm`}>
                <RotateCcw size={14} />
                <span className="text-xs font-black uppercase">
                  {creditBalanceResult >= 0 
                    ? `CRÉDITO RESTANTE: R$ ${creditBalanceResult.toFixed(2)}` 
                    : `PENDENTE: R$ ${Math.abs(creditBalanceResult).toFixed(2)}`}
                </span>
                <button onClick={() => setExchangeCredit(0)} className="ml-1 hover:opacity-70 transition-opacity"><X size={14}/></button>
              </div>
            )}
            <div className="bg-slate-950 text-white px-4 py-1.5 rounded-lg shadow-lg border border-slate-800 flex items-center gap-2">
               <Wallet size={14} className="text-indigo-400"/>
               <span className="text-base font-black font-mono">R$ {cashSession?.currentBalance?.toFixed(2) || '0.00'}</span>
            </div>
            {(cashSession || isMasterUser) && (
              <div className="flex gap-1">
                 <button type="button" onClick={() => requestFluxo('entrada')} className="bg-white border border-slate-200 p-2 rounded-lg text-green-600 hover:bg-green-50 transition-all shadow-sm" title="Entrada de Caixa"><ArrowUpCircle size={18}/></button>
                 <button type="button" onClick={() => requestFluxo('retirada')} className="bg-white border border-slate-200 p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all shadow-sm" title="Sangria de Caixa"><ArrowDownCircle size={18}/></button>
              </div>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <div className="flex gap-3 items-end">
              <div className="flex-[5] space-y-0.5">
                <div className="flex justify-between items-center ml-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">BUSCAR</label>
                   <button 
                    type="button" 
                    onClick={() => setIsExact(!isExact)}
                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded transition-all flex items-center gap-1 ${isExact ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                   >
                     <Target size={10} /> {isExact ? 'EXATA' : 'PARCIAL'}
                   </button>
                </div>
                <div className="relative group">
                  <Search size={14} className={`absolute left-3 top-2.5 transition-colors ${isExact ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <input 
                    ref={searchInputRef} 
                    type="text" 
                    placeholder={isExact ? "Nome Exato ou SKU..." : "Nome ou SKU..."} 
                    className={`w-full border rounded-lg pl-9 pr-3 py-2 bg-slate-50 text-slate-800 outline-none transition-all font-bold text-[11px] ${isExact ? 'border-indigo-500 ring-2 ring-indigo-50' : 'focus:border-indigo-500'}`} 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    autoFocus 
                  />
                </div>
              </div>
              <div className="flex-[7] space-y-0.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SELECIONAR</label>
                <select className="w-full border rounded-lg px-3 py-2 bg-slate-50 text-slate-800 font-bold outline-none focus:border-indigo-500 transition-all text-[11px] cursor-pointer" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                  <option value="">Lista de itens...</option>
                  {filtered.map((p: Product) => (<option key={p.id} value={p.id}>[{p.sku}] {p.name} - R$ {formatCurrency(p.price)}</option>))}
                </select>
              </div>
              <div className="flex items-end">
                <button type="button" onClick={() => { const p = products.find((x: Product) => x.id === Number(selectedId)); if (p) addDirectly(p); }} className="px-8 py-2 bg-indigo-600 text-white font-black rounded-lg hover:bg-indigo-700 transition-all uppercase text-[10px] tracking-widest shadow active:scale-95 h-[34px]">OK</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1.5"><ShoppingCart size={12} className="text-indigo-600"/>CHECKOUT</h3>
               <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{cart.length} itens</span>
            </div>
            <div className="flex-1 overflow-auto custom-scroll">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-slate-50 sticky top-0 z-10 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-4 py-2">ITEM</th>
                    <th className="px-4 py-2 text-center">UN</th>
                    <th className="px-4 py-2 text-right">PREÇO</th>
                    <th className="px-4 py-2 text-center">DESC. AUTO</th>
                    <th className="px-4 py-2 text-center">DESC. ITEM</th>
                    <th className="px-4 py-2 text-right">TOTAL</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.map((item) => (
                    <tr key={item.cartId} className="hover:bg-slate-50 transition-all group">
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[11px] leading-tight">{item.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] font-black text-indigo-600 uppercase font-mono">{item.sku}</span>
                            {(item.size || item.color) && (
                              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                                • {item.size ? `TAM: ${item.size}` : ''} {item.color ? ` / COR: ${item.color}` : ''}
                              </span>
                            )}
                          </div>
                          {item.campaignName && (
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md w-fit mt-1 uppercase italic shadow-sm animate-in zoom-in ${
                                item.campaignType === 'buy_x_get_y' ? 'bg-indigo-100 text-indigo-700' : 
                                item.campaignType === 'percentage' ? 'bg-red-100 text-red-600' : 
                                item.campaignType === 'bundle' ? 'bg-purple-100 text-purple-700' : 
                                item.campaignType === 'fixed_price' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-amber-100 text-amber-700'}`}>
                                {item.campaignType === 'buy_x_get_y' ? 'Promo Leve+' : 
                                 item.campaignType === 'percentage' ? 'Promo' : 
                                 item.campaignType === 'bundle' ? 'Combo' : 
                                 item.campaignType === 'fixed_price' ? 'Preço Fixo' :
                                 'Cupom'}: {item.campaignName}
                            </span>
                          )}
                          {item.discountBlocked && (
                            <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md w-fit mt-1 uppercase bg-slate-900 text-white shadow-sm flex items-center gap-1">
                               <ShieldAlert size={8} /> Desconto Bloqueado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5 bg-slate-100 rounded-md p-0.5 w-fit mx-auto">
                           <button onClick={() => updateQuantity(item.cartId, -1)} className="p-0.5 hover:text-red-500 transition-colors"><ChevronLeft size={14}/></button>
                           <span className="font-black text-slate-600 text-[11px] min-w-[12px] text-center">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.cartId, 1)} className="p-0.5 hover:text-indigo-600 transition-colors"><ChevronRight size={14}/></button>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-[10px] text-slate-400">R$ {formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 text-center">
                         <span className={`text-[10px] font-black font-mono ${item.discountValue > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                           - R$ {formatCurrency(item.discountValue)}
                         </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`relative w-40 mx-auto flex items-center bg-slate-50 border rounded-lg transition-all ${item.discountBlocked ? 'opacity-30 pointer-events-none' : 'focus-within:border-red-400'}`}>
                            <div className="flex bg-slate-100 rounded-l-lg border-r overflow-hidden h-full shrink-0">
                               <button 
                                 type="button" 
                                 onClick={() => {
                                   setCart(prev => prev.map(it => it.cartId === item.cartId ? { ...it, manualDiscountType: 'percent', manualDiscountValue: 0, manualDiscountInput: 0 } : it));
                                 }} 
                                 className={`w-8 py-1 flex items-center justify-center ${item.manualDiscountType === 'percent' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                               >
                                 <Percent size={14} />
                               </button>
                               <button 
                                 type="button" 
                                 onClick={() => {
                                   setCart(prev => prev.map(it => it.cartId === item.cartId ? { ...it, manualDiscountType: 'value', manualDiscountValue: 0, manualDiscountInput: 0 } : it));
                                 }} 
                                 className={`w-8 py-1 flex items-center justify-center ${item.manualDiscountType === 'value' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                               >
                                 <DollarSign size={14} />
                               </button>
                            </div>
                            <input 
                              type="text"
                              disabled={item.discountBlocked}
                              className="w-full px-2 py-1 text-[10px] font-black font-mono text-center outline-none bg-transparent"
                              placeholder="0"
                              value={item.manualDiscountType === 'value' ? formatCurrency(item.manualDiscountInput || 0) : (item.manualDiscountInput || 0)}
                              onChange={(e) => {
                                const raw = e.target.value;
                                let val = 0;
                                if (item.manualDiscountType === 'value') {
                                  val = parseCurrency(raw);
                                } else {
                                  val = Number(raw.replace(/\D/g, '')) || 0;
                                }

                                const totalGross = cart.filter(it => !it.discountBlocked).reduce((acc, i) => acc + (i.price * i.quantity), 0);
                                const limitPct = isAdmin ? 100 : settings.maxGlobalDiscount;
                                const maxTotalBudget = isAdmin ? totalGross : (totalGross * (limitPct / 100));

                                const otherManualItems = cart.filter(it => it.cartId !== item.cartId).reduce((acc, it) => acc + it.manualDiscountValue, 0);
                                
                                let currentGlobalVal = 0;
                                if (discountType === 'percent') { currentGlobalVal = totalGross * (discountInput / 100); }
                                else { currentGlobalVal = discountInput; }
                                currentGlobalVal = Math.min(currentGlobalVal, maxTotalBudget);

                                const budgetRemainingForThisItem = Math.max(0, maxTotalBudget - otherManualItems - currentGlobalVal);

                                const itemGross = item.price * item.quantity;
                                let absoluteRequested = 0;
                                if (item.manualDiscountType === 'percent') { absoluteRequested = itemGross * (val / 100); }
                                else { absoluteRequested = val; }

                                const clampedAbsolute = Math.min(absoluteRequested, budgetRemainingForThisItem, itemGross);
                                
                                let clampedInput = val;
                                if (clampedAbsolute < absoluteRequested) {
                                   if (item.manualDiscountType === 'percent') {
                                      clampedInput = itemGross > 0 ? (clampedAbsolute / itemGross) * 100 : 0;
                                   } else {
                                      clampedInput = clampedAbsolute;
                                   }
                                }
                                
                                setCart(prev => prev.map(it => it.cartId === item.cartId ? { ...it, manualDiscountInput: clampedInput, manualDiscountValue: clampedAbsolute } : it));
                              }}
                              onFocus={(e) => e.target.select()}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right"><span className="font-black text-slate-900 font-mono text-[11px]">R$ {formatCurrency((item.price * item.quantity) - item.discountValue - item.manualDiscountValue)}</span></td>
                      <td className="px-4 py-2 text-right">
                        <button type="button" onClick={() => removeFromCart(item.cartId)} className="p-1 text-slate-300 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-3 min-0">
          <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-200 flex flex-col h-full overflow-hidden">
            <h3 className="text-[11px] font-black text-slate-800 mb-3 flex items-center gap-2 border-b pb-2 uppercase tracking-tighter italic"><ReceiptText size={14} className="text-indigo-600" /> RESUMO</h3>
            <div className="space-y-4 flex-1 overflow-auto custom-scroll pr-1">
              <div className="bg-slate-950 p-4 rounded-xl text-white relative overflow-hidden shadow-xl">
                 <div className="relative z-10 space-y-2">
                   <div className="flex justify-between items-center opacity-40">
                      <span className="text-[8px] font-black uppercase">SUBTOTAL (C/ DESC. ITENS)</span>
                      <span className="text-[9px] font-mono font-black">R$ {formatCurrency(subtotal)}</span>
                   </div>
                   {creditToUse > 0 && (
                     <div className="flex justify-between items-center border-t border-white/10 pt-1">
                       <span className="text-[8px] font-black uppercase text-amber-400">CRÉDITO UTILIZADO</span>
                       <span className="text-[9px] font-mono font-black text-amber-400">- R$ {formatCurrency(creditToUse)}</span>
                     </div>
                   )}
                   <div className="space-y-1 pt-1 border-t border-slate-800">
                      <label className="text-[8px] font-black text-indigo-400 uppercase">DESCONTO GERAL</label>
                      <div className="flex items-center gap-1.5">
                         <div className="flex bg-slate-900 rounded-md overflow-hidden border border-slate-800">
                            <button type="button" onClick={() => setDiscountType('percent')} className={`px-1.5 py-1 text-[9px] ${discountType === 'percent' ? 'bg-indigo-600' : 'text-slate-500'}`}><Percent size={10}/></button>
                            <button type="button" onClick={() => setDiscountType('value')} className={`px-1.5 py-1 text-[9px] ${discountType === 'value' ? 'bg-indigo-600' : 'text-slate-500'}`}><DollarSign size={10}/></button>
                         </div>
                         <div className="relative flex-1">
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-mono mr-1">{discountType === 'percent' ? '%' : 'R$'}</span>
                            <input 
                              type="text" 
                              onFocus={(e) => e.target.select()} 
                              className="w-full bg-transparent border-b border-slate-800 outline-none text-red-400 font-black text-sm pr-4 text-right font-mono" 
                              value={discountType === 'value' ? formatCurrency(discountInput) : discountInput} 
                              onChange={e => {
                                if (discountType === 'value') {
                                  setDiscountInput(parseCurrency(e.target.value));
                                } else {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setDiscountInput(Number(val));
                                }
                              }} 
                            />
                         </div>
                      </div>
                   </div>
                   <div className="flex justify-between items-end pt-1 border-b border-slate-800 pb-2">
                      <span className="text-[8px] font-black uppercase text-indigo-300">TOTAL FINAL</span>
                      <span className="text-2xl font-black text-white font-mono">R$ {formatCurrency(totalFinalToPay)}</span>
                   </div>
                   <div className="flex justify-between items-center pt-2 mt-1 bg-white/5 p-2 rounded-lg">
                      <span className="text-[9px] font-black uppercase text-amber-400">TROCO</span>
                      <span className="text-xl font-black text-amber-500 font-mono italic">R$ {formatCurrency(changeValue)}</span>
                   </div>
                 </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1 relative">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Cliente</label>
                  {!selectedCustomer ? (
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Buscar por Nome, CPF ou CNPJ..."
                        className="w-full border rounded-lg px-2.5 py-2 bg-slate-50 text-slate-800 font-bold text-[10px] uppercase outline-none focus:border-indigo-500 transition-all"
                        value={customerSearch}
                        onChange={e => {
                          setCustomerSearch(e.target.value);
                          setShowCustomerSearch(true);
                        }}
                        onFocus={() => setShowCustomerSearch(true)}
                      />
                      {showCustomerSearch && customerSearch && (
                        <div className="absolute bottom-full left-0 w-full bg-white border rounded-xl shadow-2xl mb-2 z-50 overflow-hidden animate-in slide-in-from-bottom-2">
                          {filteredCustomers.length > 0 ? (
                            <div className="max-h-48 overflow-auto custom-scroll">
                              {filteredCustomers.map((c: Customer) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  className="w-full px-4 py-3 text-left hover:bg-slate-50 flex flex-col border-b last:border-0"
                                  onClick={() => {
                                    setSelectedCustomer(c);
                                    setShowCustomerSearch(false);
                                    setCustomerSearch('');
                                  }}
                                >
                                  <span className="text-[10px] font-black text-slate-900 uppercase">{c.name}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{c.document || 'Sem Documento'}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nenhum cliente encontrado</p>
                              <button 
                                type="button"
                                onClick={() => setCurrentView('customers')}
                                className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-2 hover:underline"
                              >
                                Cadastrar Novo
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-700 uppercase">{selectedCustomer.name}</span>
                        <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">{selectedCustomer.document}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedCustomer(null)}
                        className="p-1 text-indigo-300 hover:text-indigo-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">VENDEDOR RESPONSÁVEL</label>
                  <select className="w-full border rounded-lg px-2.5 py-2 bg-slate-50 text-slate-800 font-black text-[10px] uppercase cursor-pointer focus:border-indigo-500 outline-none transition-all" value={assignedVendedor} onChange={e => setAssignedVendedor(e.target.value)}>
                    {vendedores.map((v: User) => (<option key={v.id} value={v.name}>{v.name}</option>))}
                    {user.id === 0 && !vendedores.find((v: User) => v.name === user.name) && (<option value={user.name}>{user.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">FORMA DE PAGAMENTO</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    <select className="w-full border rounded-lg px-2.5 py-2 bg-slate-50 text-slate-800 font-black text-[10px] uppercase cursor-pointer focus:border-indigo-500 outline-none transition-all" value={currentPayMethod} onChange={e => {
                        const val = e.target.value;
                        setCurrentPayMethod(val);
                        if (val === 'Voucher VIP' || val === 'F12') setCurrentPayAmount(remainingBalanceToSettle);
                    }}>
                      <option>Pix</option><option>Dinheiro</option><option>C. Débito</option><option>C. Crédito</option><option>C. Parcelado</option><option>Voucher</option>
                      {(isAdmin || isMasterUser) && <option>Voucher VIP</option>}
                      {isAdmin && <option value="F12">F12</option>}
                    </select>

                    {currentPayMethod === 'Voucher' && (
                        <div className="animate-in fade-in slide-in-from-top-1 bg-amber-50 p-3 rounded-lg border border-amber-200 space-y-2">
                            <label className="text-[8px] font-black uppercase text-amber-600">Código do Voucher</label>
                            <div className="flex gap-1.5">
                                <input 
                                    type="text" 
                                    placeholder="Ex: CUPOM10"
                                    className="flex-1 border rounded-md px-2 py-1.5 text-[10px] font-black uppercase bg-white outline-none focus:border-amber-400"
                                    value={voucherCodeInput}
                                    onChange={e => setVoucherCodeInput(e.target.value.toUpperCase())}
                                />
                                <button type="button" onClick={validateVoucher} className="bg-amber-600 text-white px-3 py-1.5 rounded-md font-black text-[9px] uppercase hover:bg-amber-700">Validar</button>
                            </div>
                        </div>
                    )}

                    {currentPayMethod === 'F12' && (
                        <div className="animate-in fade-in slide-in-from-top-1 bg-indigo-50 p-3 rounded-lg border border-indigo-200 space-y-2">
                           <div>
                              <label className="text-[8px] font-black uppercase text-indigo-600">Nome do Cliente</label>
                              <input 
                                type="text" 
                                placeholder="CLIENTE AMIGO"
                                className="w-full border rounded-md px-2 py-1.5 text-[10px] font-black uppercase bg-white outline-none focus:border-indigo-400 mt-0.5"
                                value={f12Client}
                                onChange={e => setF12Client(e.target.value.toUpperCase())}
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                              <div>
                                 <label className="text-[8px] font-black uppercase text-indigo-600">Vencimento</label>
                                 <input 
                                    type="date" 
                                    className="w-full border rounded-md px-2 py-1 text-[10px] font-black bg-white outline-none focus:border-indigo-400 mt-0.5"
                                    value={f12Date}
                                    onChange={e => setF12Date(e.target.value)}
                                 />
                              </div>
                              <div>
                                 <label className="text-[8px] font-black uppercase text-indigo-600">Condições/Desc.</label>
                                 <input 
                                    type="text" 
                                    placeholder="Ex: 2x no mês"
                                    className="w-full border rounded-md px-2 py-1 text-[10px] font-black bg-white outline-none focus:border-indigo-400 mt-0.5"
                                    value={f12Desc}
                                    onChange={e => setF12Desc(e.target.value)}
                                 />
                              </div>
                           </div>
                        </div>
                    )}

                    {currentPayMethod === 'C. Parcelado' && (
                      <div className="animate-in fade-in slide-in-from-top-1 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between">
                              <label className="text-[8px] font-black uppercase text-slate-400">Parcelas</label>
                              <input type="number" min="1" max="12" onFocus={(e) => e.target.select()} className="w-14 border rounded px-1.5 py-0.5 text-[11px] text-center font-black" value={installments} onChange={e => setInstallments(Math.min(12, Math.max(1, Number(e.target.value))))} />
                          </div>
                          <div className="text-center pt-0.5 border-t border-slate-100">
                              <p className="text-[9px] font-black text-indigo-600 leading-none">{installments}x R$ {formatCurrency(calculatedInstallment)}</p>
                              <p className="text-[7px] text-slate-400 italic">Taxa: {settings.cardFees.creditInstallments}%</p>
                          </div>
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">R$</span>
                        <input 
                          type="text" 
                          onFocus={(e) => e.target.select()} 
                          className="w-full border rounded-lg pl-7 pr-2.5 py-2 bg-slate-50 text-slate-800 font-black text-[11px] text-right font-mono focus:border-indigo-500 outline-none transition-all" 
                          value={formatCurrency(currentPayAmount)} 
                          onChange={e => setCurrentPayAmount(parseCurrency(e.target.value))} 
                        />
                      </div>
                      <button type="button" onClick={addPayment} className={`px-3 ${(currentPayMethod === 'Voucher VIP' || currentPayMethod === 'F12') ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg active:scale-90 flex items-center justify-center shadow transition-all`} title={currentPayMethod === 'Voucher VIP' ? 'Aplicar VIP' : 'Adicionar Pagamento'}><Plus size={16}/></button>
                    </div>
                    {appliedPayments.length > 0 && (
                      <div className="mt-3 bg-indigo-50/50 p-3 rounded-xl border border-dashed border-indigo-200 space-y-2 animate-in fade-in">
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Wallet size={10} /> Pagamentos Lançados
                        </p>
                        <div className="space-y-1.5">
                          {appliedPayments.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-indigo-50 group">
                              <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black text-slate-700 uppercase truncate">
                                    {p.method} {p.voucherCode && p.method !== 'Voucher VIP' ? `(${p.voucherCode})` : ''}
                                    {p.method === 'F12' ? ` (${p.f12ClientName})` : ''}
                                </span>
                                {p.installments && <span className="text-[7px] text-slate-400 font-bold">{p.installments}x de R$ {formatCurrency(p.installmentValue || 0)}</span>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className={`text-[10px] font-black font-mono ${(p.method === 'Voucher VIP' || p.method === 'F12') ? 'text-purple-600' : p.method === 'Voucher' ? 'text-amber-600' : 'text-indigo-600'}`}>R$ {formatCurrency(p.amount)}</span>
                                <button type="button" onClick={() => removePayment(idx)} className="text-slate-300 hover:text-red-500 transition-colors p-0.5 hover:bg-red-50 rounded">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button 
              type="button" 
              onClick={handleFinish} 
              disabled={((totalFinalToPay > 0 && totalPaid < totalFinalToPay - 0.01 && !appliedPayments.some(p => p.method === 'Voucher VIP'))) || cart.length === 0} 
              className={`w-full py-3 rounded-lg font-black text-xs shadow-lg transition-all uppercase tracking-[0.2em] mt-3 active:scale-95 ${(((totalFinalToPay > 0 && totalPaid < totalFinalToPay - 0.01 && !appliedPayments.some(p => p.method === 'Voucher VIP'))) || cart.length === 0) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              Concluir
            </button>
          </div>
        </div>
      </div>

      {receiptData && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[150] animate-in fade-in no-print-overlay">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl space-y-6 animate-in zoom-in-95 overflow-hidden">
             <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full mx-auto flex items-center justify-center border border-green-100">
                    <Check size={32} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic">Venda Concluída!</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Os dados foram lançados com sucesso no sistema.</p>
             </div>

             <div id="printable-receipt" className="bg-white border-2 border-dashed border-slate-200 p-6 rounded-2xl font-mono text-[11px] text-slate-700 space-y-4 shadow-inner">
                <div className="text-center space-y-1">
                    <p className="font-black text-base italic leading-none">{settings.storeName || 'SCARD SYS'}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] opacity-60">{settings.storeTagline || 'ENTERPRISE SOLUTION'}</p>
                    <p className="text-[8px] opacity-40">{settings.storeAddress || 'Rua da Moda, 123 - Centro'}</p>
                    {settings.storeCnpj && <p className="text-[8px] opacity-40">CNPJ: {settings.storeCnpj}</p>}
                </div>
                
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] font-bold">
                    <span>CUPOM: #{receiptData.id.toString().slice(-6)}</span>
                    <span>{new Date(receiptData.date).toLocaleDateString()} {new Date(receiptData.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>

                <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-1">
                        <span>DESCRIÇÃO</span>
                        <span>TOTAL</span>
                    </div>
                    {receiptData.items.map((it, idx) => (
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
                        <span>R$ {formatCurrency(receiptData.subtotal)}</span>
                    </div>
                    {receiptData.discount > 0 && (
                        <div className="flex justify-between text-red-500 font-bold">
                            <span>DESCONTO GERAL</span>
                            <span>- R$ {formatCurrency(receiptData.discount)}</span>
                        </div>
                    )}
                    {receiptData.exchangeCreditUsed && receiptData.exchangeCreditUsed > 0 && (
                        <div className="flex justify-between text-amber-600 font-bold">
                            <span>CRÉDITO TROCA</span>
                            <span>- R$ {formatCurrency(receiptData.exchangeCreditUsed)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-300 pt-1 mt-1">
                        <span>TOTAL PAGO</span>
                        <span>R$ {formatCurrency(receiptData.total)}</span>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase">FORMA(S) DE PAGAMENTO:</p>
                    {receiptData.payments.map((p, i) => (
                        <div key={i} className="flex justify-between text-[10px]">
                            <span>{p.method} {p.installments ? `(${p.installments}x)` : ''}{p.method === 'F12' ? ` (${p.f12ClientName})` : ''}</span>
                            <span className="font-bold">R$ {formatCurrency(p.amount)}</span>
                        </div>
                    ))}
                    {receiptData.change > 0 && (
                        <div className="flex justify-between text-amber-600 font-bold">
                            <span>TROCO</span>
                            <span>R$ {formatCurrency(receiptData.change)}</span>
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-slate-200 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">VENDEDOR:</p>
                    <p className="text-[10px] font-bold uppercase">{receiptData.user}</p>
                    <p className="text-[8px] mt-4 opacity-40">Obrigado pela preferência!</p>
                </div>
             </div>

             <div className="flex gap-3 pt-2">
                <button 
                    onClick={() => { setReceiptData(null); setTimeout(() => searchInputRef.current?.focus(), 100); }} 
                    className="flex-1 px-4 py-4 border-2 border-slate-100 text-slate-400 font-black uppercase text-[10px] rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                >
                    Fechar
                </button>
                <button 
                    onClick={() => { window.print(); setReceiptData(null); setTimeout(() => searchInputRef.current?.focus(), 100); }} 
                    className="flex-[2] px-4 py-4 bg-indigo-600 text-white font-black uppercase text-[10px] rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Printer size={18} />
                    Confirmar & Imprimir
                </button>
             </div>
          </div>
        </div>
      )}

      {authRequest && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[120] animate-in fade-in">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center border border-amber-100"><ShieldAlert size={32} /></div>
              <h3 className="text-xl font-black text-slate-900 uppercase italic">Autorização Necessária</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Operação restrita a administradores.</p>
            </div>
            <form onSubmit={handleAuthorization} className="space-y-4">
              <input name="authUser" type="text" placeholder="Usuário ou 'master'" className="w-full border-2 rounded-xl px-4 py-3 text-sm font-bold bg-slate-50 outline-none focus:border-indigo-500" required autoFocus />
              <input name="authPass" type="password" placeholder="Senha" className="w-full border-2 rounded-xl px-4 py-3 text-sm font-bold bg-slate-50 outline-none focus:border-indigo-500" required />
              <div className="flex gap-2">
                <button type="button" onClick={() => setAuthRequest(null)} className="flex-1 px-4 py-3 border-2 border-slate-100 text-slate-400 font-black uppercase text-[10px] rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-black uppercase text-[10px] rounded-xl">Validar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalFluxo && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[110] animate-in fade-in">
          <form onSubmit={(e) => {
             e.preventDefault();
             if (fluxoVal <= 0) return alert('Valor inválido!');
             const amt = modalFluxo === 'retirada' ? -fluxoVal : fluxoVal;
             const log: CashLog = { id: Math.random().toString(36).substr(2, 9), type: modalFluxo, amount: fluxoVal, description: fluxoDesc || (modalFluxo === 'retirada' ? 'Sangria manual' : 'Entrada manual'), time: new Date().toISOString(), user: user.name };
             setCashSession((prev: CashSession) => ({ ...prev, currentBalance: prev.currentBalance + amt, logs: [log, ...prev.logs] }));
             setModalFluxo(null); setFluxoVal(0); setFluxoDesc('');
          }} className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl space-y-8 animate-in fade-in zoom-in-95">
             <div className="flex justify-between items-center border-b border-slate-100 pb-4">
               <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                {modalFluxo === 'retirada' ? 'Sangria de Caixa' : 'Entrada de Caixa'}
               </h3>
               <button type="button" onClick={() => setModalFluxo(null)} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={24}/></button>
             </div>
             <div className="space-y-6">
                <div className="relative group">
                   <div className="absolute inset-0 bg-indigo-600/5 rounded-2xl border-2 border-indigo-600/20 group-focus-within:border-indigo-600 group-focus-within:bg-indigo-600/10 transition-all"></div>
                   <div className="relative px-6 py-8 flex items-center gap-4">
                      <span className="text-xl font-black text-slate-400">R$</span>
                      <input 
                        type="text" 
                        className="flex-1 bg-transparent text-5xl font-black text-indigo-700 outline-none font-mono" 
                        value={formatCurrency(fluxoVal)} 
                        onChange={e => setFluxoVal(parseCurrency(e.target.value))} 
                        required autoFocus onFocus={(e) => e.target.select()}
                      />
                   </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <textarea 
                    className="w-full bg-transparent text-sm font-bold text-slate-600 outline-none h-32 resize-none placeholder:text-slate-400" 
                    placeholder="Digite o motivo ou observação..." 
                    value={fluxoDesc} 
                    onChange={e => setFluxoDesc(e.target.value)} 
                  />
                </div>
             </div>
             <button 
              type="submit" 
              className={`w-full py-5 rounded-2xl text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${modalFluxo === 'retirada' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' : 'bg-green-600 hover:bg-green-700 shadow-green-600/30'}`}
             >
                Confirmar Lançamento
             </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SalesViewComponent;
