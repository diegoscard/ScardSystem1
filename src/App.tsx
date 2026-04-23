import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, ArrowRightLeft, 
  LogOut, TrendingUp, Truck, Plus, Trash2, Edit, Search, X, 
  DollarSign, Box, AlertTriangle, CreditCard, Banknote, QrCode,
  Tag, User as UserIcon, ReceiptText, Percent, Wallet, ArrowUpCircle, ArrowDownCircle,
  BarChart3, RefreshCw, ClipboardList, Copy, Filter, Layers, Settings, Users,
  ShieldCheck, Landmark, PercentCircle, Eye, Info, Lock, ShieldAlert, Calendar,
  History, Clock, UserCheck, RotateCcw, Award, Zap, Calculator, Trophy, Star, Medal,
  ChevronLeft, ChevronRight, ListOrdered, Download, Upload, Save, FileWarning,
  Megaphone, CalendarDays, CheckCircle2, TicketPercent, Gift, ShieldCheck as ShieldIcon,
  Printer, Check, Key, Shield, Monitor, UserPlus, HandCoins, Share2, FileText, Target,
  Cake, Bike
} from 'lucide-react';

import { 
  User, Customer, Product, Supplier, StockMovement, Sale, 
  Campaign, CashSession, CashHistoryEntry, AppSettings, 
  FiadoRecord, CommissionTier, SaleItem, PaymentRecord 
} from './types';

import { 
  getDeviceFingerprint, generateHWID, formatCurrency, 
  parseCurrency, maskCPFCNPJ, maskPhone, maskDate, maskCEP 
} from './utils/helpers';

import { usePersistedState } from './hooks/usePersistedState';
import { INITIAL_CATEGORIES, DEFAULT_SETTINGS } from './utils/constants';

// Lazy loading components
const Pendentes = React.lazy(() => import('./pages/Pendentes'));
const Consultar = React.lazy(() => import('./pages/Consultar'));
const Clientes = React.lazy(() => import('./pages/Clientes'));
const Vendas = React.lazy(() => import('./pages/Vendas'));
const Estoque = React.lazy(() => import('./pages/Estoque'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Relatorios = React.lazy(() => import('./pages/Relatorios'));
const Configuracoes = React.lazy(() => import('./pages/Configuracoes'));
const Equipe = React.lazy(() => import('./pages/Equipe'));
const Campanhas = React.lazy(() => import('./pages/Campanhas'));

import { useStore } from './contexts/StoreContext';

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center space-x-4 w-full px-5 py-3 rounded-xl transition-all font-bold text-sm ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-100'}`}>
    <span>{icon}</span>
    <span className="tracking-tight">{label}</span>
  </button>
);

const App = () => {
  const {
    deviceHwid, user, setUser,
    dbUsers, setDbUsers,
    customers, setCustomers,
    products, setProducts,
    suppliers, setSuppliers,
    categories, setCategories,
    movements, setMovements,
    sales, setSales,
    campaigns, setCampaigns,
    cashSession, setCashSession,
    cashHistory, setCashHistory,
    settings, setSettings,
    exchangeCredit, setExchangeCredit,
    fiados, setFiados,
    commTiers, setCommTiers,
    pdvState, setPdvState,
    notify, confirm
  } = useStore();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [openingBalanceInput, setOpeningBalanceInput] = useState(0);

  useEffect(() => {
    // Tenta desbloquear automaticamente se o HWID deste dispositivo já possui uma chave ativa no banco
    if (deviceHwid) {
      setIsRestoringSession(true);
      fetch('/api/license/check-hwid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hwid: deviceHwid })
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setIsUnlocked(true);
          // Após desbloquear o hardware, tenta restaurar a sessão do usuário (F5 persistence)
          return fetch(`/api/auth/session/${deviceHwid}`);
        }
        return null;
      })
      .then(res => res ? res.json() : null)
      .then(sessionData => {
        if (sessionData && sessionData.user) {
          setUser(sessionData.user);
          // Restaurar vista baseada no cargo
          if (sessionData.user.role === 'atendente') {
            setCurrentView('sales');
          } else {
            setCurrentView('dashboard');
          }
        }
      })
      .catch(err => console.error("Erro ao verificar sessão automática:", err))
      .finally(() => {
        setIsRestoringSession(false);
      });
    } else {
      setIsRestoringSession(false);
    }
  }, [deviceHwid, setUser]);


  const handleVerifyAccessKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setAuthError('');
    const trimmedKey = accessKeyInput.trim();

    try {
      const response = await fetch('/api/license/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: trimmedKey, hwid: deviceHwid })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setIsUnlocked(true);
      } else {
        setAuthError(data.message || 'Chave de acesso inválida.');
        setAccessKeyInput('');
      }
    } catch (e) {
      setAuthError('Erro de conexão ao verificar a licença. Verifique sua rede.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (email === 'master' && password === '965088') {
      const masterUser: User = {
        id: 0,
        name: 'MASTER SYSTEM',
        email: 'master@internal',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      setUser(masterUser);
      // Salvar sessão no servidor para F5 persistence
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hwid: deviceHwid, user: masterUser })
      });
      setCurrentView('dashboard');
      return;
    }

    const foundUser = dbUsers.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      // Salvar sessão no servidor para F5 persistence
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hwid: deviceHwid, user: foundUser })
      });
      if (foundUser.role === 'atendente') {
        setCurrentView('sales');
      } else {
        setCurrentView('dashboard');
      }
    } else { 
      setAuthError('E-mail ou senha incorretos!'); 
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('regName') as HTMLInputElement).value;
    const email = (form.elements.namedItem('regEmail') as HTMLInputElement).value;
    const password = (form.elements.namedItem('regPassword') as HTMLInputElement).value;

    if (dbUsers.some(u => u.email === email)) {
      notify('Este e-mail já está cadastrado no sistema!', 'error');
      return;
    }

    const newUser: User = {
      id: Date.now(),
      name,
      email,
      password,
      role: dbUsers.length === 0 ? 'admin' : 'atendente', 
      createdAt: new Date().toISOString()
    };

    setDbUsers([...dbUsers, newUser]);
    notify(`Usuário ${name} cadastrado com sucesso!`, 'success');
    form.reset();
    setAuthMode('login');
  };

  const handleExportBackup = async () => {
    try {
      const dbRes = await fetch('/api/sync');
      const data = await dbRes.json();
      const backupData: Record<string, any> = {};
      for (const k in data) {
         backupData[k] = data[k].data;
      }

      const jsonString = JSON.stringify(backupData);
      const encodedData = btoa(unescape(encodeURIComponent(jsonString)));
      const secureContent = `SCARDSYS_SECURE_BKPV1:${encodedData}`;

      const blob = new Blob([secureContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const datePart = `${day}-${month}-${year}`;
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timePart = `${hours}-${minutes}-${seconds}`;
      
      const fileName = `backup_scardsys_${datePart}_${timePart}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch(err) {
      notify("Erro crítico ao gerar arquivo de exportação.", "error");
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!(await confirm({
      title: "Confirmar Restauração",
      message: "ATENÇÃO: Restaurar o backup irá sobrescrever TODOS os dados atuais (estoque, vendas, usuários e licenças). Esta operação é irreversível. Deseja continuar?",
      type: "danger",
      confirmLabel: "Sim, restaurar tudo"
    }))) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        if (!content.startsWith('SCARDSYS_SECURE_BKPV1:')) {
          throw new Error("Formato de arquivo inválido ou corrompido.");
        }
        const encodedData = content.replace('SCARDSYS_SECURE_BKPV1:', '');
        const decodedString = decodeURIComponent(escape(atob(encodedData)));
        const data = JSON.parse(decodedString);
        
        for (const [key, value] of Object.entries(data)) {
          if (value !== null) {
            await fetch(`/api/sync/${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(value)
            });
          }
        }
        
        notify("Backup restaurado com sucesso! O sistema será reiniciado.", "success");
        setTimeout(() => window.location.reload(), 2000);
      } catch (err) {
        notify("O arquivo selecionado não é um backup válido ou está corrompido.", "error");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenCash = (amount: number) => {
    if (!user) return;

    // --- REGRAS DE SEGURANÇA PARA ABERTURA DE CAIXA ---
    if (cashHistory.length > 0) {
      const lastSession = cashHistory[0]; 
      const previousClosingBalance = lastSession.closingBalance;
      
      if (Math.abs(amount - previousClosingBalance) > 0.01) {
        notify(`BLOQUEIO: O saldo inicial (R$ ${formatCurrency(amount)}) não confere com o saldo de fechamento anterior (R$ ${formatCurrency(previousClosingBalance)}).`, 'error');
        return;
      }
    }

    const newSession: CashSession = {
      isOpen: true,
      openingBalance: amount,
      currentBalance: amount,
      openedAt: new Date().toISOString(),
      openedBy: user.name,
      logs: [{
        id: Math.random().toString(36).substr(2, 9),
        type: 'abertura',
        amount: amount,
        description: 'Abertura de Caixa',
        time: new Date().toISOString(),
        user: user.name
      }]
    };
    setCashSession(newSession);
    setOpeningBalanceInput(0); 
  };

  const handleCloseCashAction = async () => {
    if (!user || !cashSession) return;
    if (await confirm({
      title: "Encerrar Caixa",
      message: "Deseja realmente encerrar a sessão de caixa atual? Todos os registros serão movidos para o histórico.",
      type: "warning",
      confirmLabel: "Sim, encerrar"
    })) {
      const historyEntry: CashHistoryEntry = {
        id: Math.random().toString(36).substr(2, 9),
        openedBy: cashSession.openedBy,
        openedAt: cashSession.openedAt,
        openingBalance: cashSession.openingBalance,
        closedBy: user.name,
        closedAt: new Date().toISOString(),
        closingBalance: cashSession.currentBalance,
        logs: [...cashSession.logs]
      };
      setCashHistory(prev => [historyEntry, ...prev]);
      setCashSession(null);
      notify('Caixa encerrado e registrado com sucesso!', 'success');
    }
  };

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col gap-4 items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-indigo-600/50 text-[10px] uppercase font-black tracking-widest animate-pulse">Restaurando Sua Sessão...</p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-6 font-sans text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-800/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 animate-pulse"></div>
        
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-sm border border-slate-800/50 relative z-10 animate-in fade-in zoom-in-95 duration-500 text-center">
          <div className="mb-10 inline-flex p-5 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            {isValidating ? <RefreshCw size={48} className="animate-spin text-indigo-500" /> : <Shield size={48} strokeWidth={1.5} />}
          </div>
          
          <div className="mb-10">
            <h1 className="text-4xl font-black text-white tracking-tighter italic mb-2">SCARD<span className="text-indigo-500">PRO</span></h1>
            <p className="text-slate-500 font-black uppercase text-[9px] tracking-[0.3em]">Hardware Access Protection</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/50 border border-red-900/50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 justify-center text-red-500 mb-1">
                <AlertTriangle size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Erro de Validação</span>
              </div>
              <p className="text-red-400/80 text-xs font-bold leading-relaxed">{authError}</p>
            </div>
          )}

          <form onSubmit={handleVerifyAccessKey} className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1 text-center">Insira sua Chave de Acesso</label>
              <div className="relative group">
                <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500/50 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="password" 
                  autoFocus 
                  disabled={isValidating}
                  placeholder="••••••••••••" 
                  className="w-full rounded-2xl border-2 border-slate-800 bg-slate-950/50 px-12 py-5 text-indigo-400 focus:border-indigo-500 outline-none transition-all font-mono font-bold text-center tracking-widest placeholder:text-slate-800"
                  value={accessKeyInput}
                  onChange={(e) => setAccessKeyInput(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 cursor-pointer hover:bg-slate-950/60 transition-colors" onClick={() => setRememberKey(!rememberKey)}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${rememberKey ? 'bg-indigo-600 border-indigo-600' : 'border-slate-700 bg-transparent'}`}>
                    {rememberKey && <Check size={14} className="text-white" />}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-left">Concordo com os Termos de Uso e Licença de Terminal Único</span>
            </div>
            
            <button 
                type="submit" 
                disabled={!rememberKey || isValidating}
                className={`w-full rounded-2xl py-5 text-white font-black shadow-[0_10px_30px_rgba(79,70,229,0.3)] transition-all active:scale-95 uppercase text-xs tracking-[0.2em] ${(!rememberKey || isValidating) ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-50'}`}
            >
              {isValidating ? 'Validando HWID...' : 'Validar Acesso'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800/50 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-slate-500 opacity-60">
              <Monitor size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Identificador do Terminal</span>
            </div>
            <code className="bg-slate-950/80 px-3 py-1.5 rounded-lg text-[9px] font-mono font-black text-indigo-500/80 border border-slate-800/50">{deviceHwid}</code>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6 font-sans text-slate-900 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-slate-200 relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-black text-slate-800 tracking-tighter italic mb-2">SCARD<span className="text-indigo-600">SYS</span></h1>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Enterprise Solution</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 justify-center text-red-600 mb-1">
                <AlertTriangle size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Falha no Login</span>
              </div>
              <p className="text-red-500/80 text-xs font-bold leading-relaxed text-center">{authError}</p>
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail ou Master</label>
                <input name="email" type="text" placeholder="usuário" className="w-full rounded-2xl border-2 border-slate-100 px-5 py-4 text-slate-800 bg-slate-50 focus:border-indigo-500 outline-none transition-all font-bold text-sm shadow-sm" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Senha</label>
                <input name="password" type="password" placeholder="••••••••" className="w-full rounded-2xl border-2 border-slate-100 px-5 py-4 text-slate-800 bg-slate-50 focus:border-indigo-500 outline-none transition-all font-bold text-sm shadow-sm" required />
              </div>
              <button type="submit" className="w-full rounded-2xl bg-indigo-600 py-5 text-white font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase text-xs tracking-widest mt-2">
                Acessar Terminal
              </button>
              <div className="text-center mt-6">
                <button type="button" onClick={() => setAuthMode('register')} className="text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
               <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                <input name="regName" type="text" placeholder="Nome" className="w-full rounded-2xl border-2 border-slate-100 px-5 py-4 text-slate-800 bg-slate-50 focus:border-indigo-500 outline-none transition-all font-bold text-sm shadow-sm" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail</label>
                <input name="regEmail" type="email" placeholder="admin@loja.com" className="w-full rounded-2xl border-2 border-slate-100 px-5 py-4 text-slate-800 bg-slate-50 focus:border-indigo-500 outline-none transition-all font-bold text-sm shadow-sm" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Senha</label>
                <input name="regPassword" type="password" placeholder="••••••••" className="w-full rounded-2xl border-2 border-slate-100 px-5 py-4 text-slate-800 bg-slate-50 focus:border-indigo-500 outline-none transition-all font-bold text-sm shadow-sm" required />
              </div>
              <button type="submit" className="w-full rounded-2xl bg-slate-800 py-5 text-white font-black hover:bg-slate-900 shadow-xl shadow-slate-200 transition-all active:scale-95 uppercase text-xs tracking-widest mt-2">
                Criar Conta
              </button>
              <div className="text-center mt-6">
                <button type="button" onClick={() => setAuthMode('login')} className="text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                  Voltar para Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const isMasterUser = user.id === 0 || user.email === 'master@internal';
  const isAdmin = user.role === 'admin' || isMasterUser;
  const isCashOpen = cashSession && cashSession.isOpen;

  const hasPermission = (viewId: string) => {
    if (isAdmin || viewId === 'sales' || viewId === 'reports' || viewId === 'product_search') return true; 
    return (settings.sellerPermissions || []).includes(viewId);
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans text-slate-900 selection:bg-indigo-100 overflow-hidden">
      <aside className="w-64 bg-slate-950 text-white flex flex-col shrink-0 border-r border-slate-800 shadow-2xl relative z-20">
        <div className="p-8">
          <h2 className="text-2xl font-black tracking-tighter uppercase italic">SCARD<span className="text-indigo-500 font-normal">SYS</span></h2>
          <div className="flex items-center gap-3 mt-6 bg-slate-900 p-3 rounded-2xl border border-slate-800/50 group">
             <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-xs shadow-lg">
                {user.name.charAt(0).toUpperCase()}
             </div>
             <div className="flex flex-col min-w-0">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">{user.role === 'admin' ? 'Administrador' : 'Vendedor'}</span>
                <p className="text-xs font-black text-slate-100 uppercase tracking-tight truncate mt-1">{user.name}</p>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scroll">
          <NavBtn active={currentView === 'sales'} onClick={() => setCurrentView('sales')} icon={<ShoppingCart size={18}/>} label="Caixa PDV" />
          <NavBtn active={currentView === 'product_search'} onClick={() => setCurrentView('product_search')} icon={<Search size={18}/>} label="Consultar" />
          <NavBtn active={currentView === 'customers'} onClick={() => setCurrentView('customers')} icon={<Users size={18}/>} label="Clientes" />
          {hasPermission('fiado') && <NavBtn active={currentView === 'fiado'} onClick={() => setCurrentView('fiado')} icon={<HandCoins size={18}/>} label="Pendentes (F12)" />}
          <NavBtn active={currentView === 'reports'} onClick={() => setCurrentView('reports')} icon={<TrendingUp size={18}/>} label="Relatórios" />
          {hasPermission('stock') && <NavBtn active={currentView === 'stock'} onClick={() => setCurrentView('stock')} icon={<Package size={18}/>} label="Estoque" />}
          
          {(isAdmin || hasPermission('dashboard') || hasPermission('campaigns')) && (
            <div className="pt-6 mt-6 border-t border-slate-900 space-y-1">
               <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Admin</p>
               {hasPermission('campaigns') && <NavBtn active={currentView === 'campaigns'} onClick={() => setCurrentView('campaigns')} icon={<Megaphone size={18}/>} label="Campanhas" />}
               {hasPermission('dashboard') && <NavBtn active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard size={18}/>} label="Dashboard" />}
               {isAdmin && <NavBtn active={currentView === 'team'} onClick={() => setCurrentView('team')} icon={<Users size={18}/>} label="Equipe" />}
               {isAdmin && <NavBtn active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={<Settings size={18}/>} label="Ajustes" />}
            </div>
          )}
        </nav>

        <div className="p-4 mt-auto space-y-2 border-t border-slate-800/50">
          <button type="button" title="Gerar backup protegido dos dados" onClick={handleExportBackup} className="flex items-center space-x-3 text-emerald-400 hover:text-emerald-300 transition-all w-full px-4 py-2.5 rounded-xl hover:bg-emerald-400/5 group">
            <Download size={16} />
            <span className="font-black uppercase text-[9px] tracking-widest">Salvar Backup</span>
          </button>
          {isMasterUser && (
            <button type="button" title="Restaurar dados de um arquivo de backup" onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-3 text-sky-400 hover:text-sky-300 transition-all w-full px-4 py-2.5 rounded-xl hover:bg-sky-400/5 group">
              <Upload size={16} />
              <span className="font-black uppercase text-[9px] tracking-widest">Restaurar Backup</span>
              <input ref={fileInputRef} type="file" accept=".json,.scard" className="hidden" onChange={handleImportBackup} />
            </button>
          )}
          {isCashOpen && (
            <button type="button" onClick={handleCloseCashAction} className="flex items-center space-x-3 text-amber-500 hover:text-amber-400 transition-all w-full px-4 py-3 rounded-xl hover:bg-amber-500/5 group">
              <Wallet size={18} />
              <span className="font-black uppercase text-[9px] tracking-widest">Fechar Caixa</span>
            </button>
          )}
          <button type="button" onClick={() => { 
            setUser(null); 
            setAuthError('');
            fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hwid: deviceHwid, user: null }) });
          }} className="flex items-center space-x-3 text-slate-500 hover:text-red-400 transition-all w-full px-4 py-3 rounded-xl hover:bg-red-500/5 group">
            <LogOut size={18} />
            <span className="font-black uppercase text-[9px] tracking-widest">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative">
        <div className="max-w-[1550px] mx-auto px-10 py-12 h-full flex flex-col">
          <React.Suspense fallback={<div className="flex-1 flex items-center justify-center p-6"><div className="w-10 h-10 border-4 border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div></div>}>
          {currentView === 'sales' && (
            !isCashOpen ? (
              <div className="flex-1 flex items-center justify-center animate-in fade-in">
                <div className="bg-white p-12 rounded-[3rem] shadow-xl w-full max-w-lg border border-slate-200">
                  <div className="flex flex-col items-center mb-10">
                    <div className="p-6 bg-indigo-50 text-indigo-600 rounded-[2rem] mb-6 shadow-inner border border-indigo-100">
                      <Wallet size={48} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Abertura de Caixa</h2>
                    <p className="text-slate-400 font-bold text-xs text-center mt-3 px-10 leading-relaxed uppercase tracking-widest opacity-70">Informe o saldo inicial disponível em espécie.</p>
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleOpenCash(openingBalanceInput);
                  }} className="space-y-8">
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300">R$</span>
                      <input 
                        name="amount" 
                        type="text" 
                        autoComplete="off" 
                        autoFocus 
                        className="w-full text-center text-5xl font-black bg-slate-50 rounded-3xl border-2 border-slate-100 focus:border-indigo-500 outline-none py-8 transition-all text-indigo-700 shadow-inner pl-14" 
                        placeholder="0,00" 
                        required 
                        value={formatCurrency(openingBalanceInput)}
                        onChange={(e) => setOpeningBalanceInput(parseCurrency(e.target.value))}
                      />
                    </div>
                    <button type="submit" className="w-full rounded-2xl bg-indigo-600 py-6 text-white font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase text-sm tracking-[0.2em]">
                      Abrir Caixa
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <Vendas setCurrentView={setCurrentView} />
            )
          )}
          {currentView === 'customers' && <Clientes />}
          {currentView === 'product_search' && <Consultar />}
          {currentView === 'fiado' && <Pendentes />}
          {currentView === 'stock' && (
            <Estoque />
          )}
          {currentView === 'campaigns' && (
            <Campanhas />
          )}
          {currentView === 'dashboard' && (
            <Dashboard />
          )}
          {currentView === 'reports' && (
            <Relatorios setCurrentView={setCurrentView} />
          )}
          {currentView === 'team' && (
            <Equipe />
          )}
          {currentView === 'settings' && (
            <Configuracoes />
          )}
          </React.Suspense>
        </div>
      </main>
    </div>
  );
};

export default App;
