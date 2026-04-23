import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';
import { DEFAULT_SETTINGS, INITIAL_CATEGORIES } from '../utils/constants';
import { getDeviceFingerprint, generateHWID } from '../utils/helpers';
import { 
  CheckCircle2, AlertTriangle, AlertCircle, Info as InfoIcon, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Customer, Product, Supplier, StockMovement,
  Sale, Campaign, CashSession, CashHistoryEntry,
  AppSettings, FiadoRecord, CommissionTier, SaleItem, PaymentRecord,
  Notification, NotificationType, ConfirmationOptions, PromptOptions
} from '../types';

interface PdvState {
  cart: SaleItem[];
  appliedPayments: PaymentRecord[];
  discountType: 'value' | 'percent';
  discountInput: number;
  selectedCustomer: Customer | null;
  assignedVendedor: string;
}

interface StoreContextData {
  deviceHwid: string;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  dbUsers: User[];
  setDbUsers: React.Dispatch<React.SetStateAction<User[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  movements: StockMovement[];
  setMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  cashSession: CashSession | null;
  setCashSession: React.Dispatch<React.SetStateAction<CashSession | null>>;
  cashHistory: CashHistoryEntry[];
  setCashHistory: React.Dispatch<React.SetStateAction<CashHistoryEntry[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  exchangeCredit: number;
  setExchangeCredit: React.Dispatch<React.SetStateAction<number>>;
  fiados: FiadoRecord[];
  setFiados: React.Dispatch<React.SetStateAction<FiadoRecord[]>>;
  commTiers: CommissionTier[];
  setCommTiers: React.Dispatch<React.SetStateAction<CommissionTier[]>>;

  pdvState: PdvState;
  setPdvState: React.Dispatch<React.SetStateAction<PdvState>>;

  // UI helpers
  notify: (message: string, type?: NotificationType) => void;
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const StoreContext = createContext<StoreContextData>({} as StoreContextData);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const deviceHwid = useMemo(() => generateHWID(getDeviceFingerprint()), []);
  const [user, setUser] = useState<User | null>(null);

  const [dbUsers, setDbUsers] = usePersistedState<User[]>('db_users', []);
  const [customers, setCustomers] = usePersistedState<Customer[]>('db_customers', []);
  const [products, setProducts] = usePersistedState<Product[]>('db_products', []);
  const [suppliers, setSuppliers] = usePersistedState<Supplier[]>('db_suppliers', []);
  const [categories, setCategories] = usePersistedState<string[]>('db_categories', INITIAL_CATEGORIES);
  const [movements, setMovements] = usePersistedState<StockMovement[]>('db_movements', []);
  const [sales, setSales] = usePersistedState<Sale[]>('db_sales', []);
  const [campaigns, setCampaigns] = usePersistedState<Campaign[]>('db_campaigns', []);
  const [cashSession, setCashSession] = usePersistedState<CashSession | null>('db_cash_session', null);
  const [cashHistory, setCashHistory] = usePersistedState<CashHistoryEntry[]>('db_cash_history', []);
  const [settings, setSettings] = usePersistedState<AppSettings>('db_settings', DEFAULT_SETTINGS);
  const [exchangeCredit, setExchangeCredit] = usePersistedState<number>('db_exchange_credit', 0);
  const [fiados, setFiados] = usePersistedState<FiadoRecord[]>('db_fiados', []);
  const [commTiers, setCommTiers] = usePersistedState<CommissionTier[]>('db_comm_tiers', [
    { min: 0, rate: 1 },
    { min: 20000, rate: 2 },
    { min: 30000, rate: 3 },
    { min: 40000, rate: 4 },
    { min: 50000, rate: 5 }
  ]);

  const [pdvState, setPdvState] = useState<PdvState>({
    cart: [],
    appliedPayments: [],
    discountType: 'percent',
    discountInput: 0,
    selectedCustomer: null,
    assignedVendedor: '',
  });

  // UI States
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmation, setConfirmation] = useState<{
    options: ConfirmationOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const [promptData, setPromptData] = useState<{
    options: PromptOptions;
    resolve: (value: string | null) => void;
  } | null>(null);
  const [promptInputValue, setPromptInputValue] = useState('');

  const notify = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const confirm = useCallback((options: ConfirmationOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmation({ options, resolve });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    setPromptInputValue('');
    return new Promise<string | null>((resolve) => {
      setPromptData({ options, resolve });
    });
  }, []);

  const handleConfirmAction = (value: boolean) => {
    if (confirmation) {
      confirmation.resolve(value);
      setConfirmation(null);
    }
  };

  const handlePromptAction = (value: string | null) => {
    if (promptData) {
      promptData.resolve(value);
      setPromptData(null);
    }
  };

  return (
    <StoreContext.Provider value={{
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
      notify, confirm, prompt
    }}>
      {children}

      {/* Notifications Portal */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border min-w-[320px] max-w-md ${
                n.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' :
                n.type === 'error' ? 'bg-red-600 border-red-500 text-white' :
                n.type === 'warning' ? 'bg-amber-500 border-amber-400 text-white' :
                'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <div className="shrink-0">
                {n.type === 'success' && <CheckCircle2 size={24} />}
                {n.type === 'error' && <AlertCircle size={24} />}
                {n.type === 'warning' && <AlertTriangle size={24} />}
                {n.type === 'info' && <InfoIcon size={24} />}
              </div>
              <p className="flex-1 text-sm font-bold tracking-tight leading-tight">{n.message}</p>
              <button 
                onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal Portal */}
      <AnimatePresence>
        {confirmation && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
            >
              <div className="p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-4 rounded-2xl ${
                    confirmation.options.type === 'danger' ? 'bg-red-50 text-red-600' :
                    confirmation.options.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                    'bg-indigo-50 text-indigo-600'
                  }`}>
                    {confirmation.options.type === 'danger' ? <AlertCircle size={32} /> : 
                     confirmation.options.type === 'warning' ? <AlertTriangle size={32} /> : 
                     <InfoIcon size={32} />}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{confirmation.options.title}</h3>
                </div>
                <p className="text-slate-500 font-bold text-sm leading-relaxed mb-10 translate-x-1">
                  {confirmation.options.message}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleConfirmAction(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                  >
                    {confirmation.options.cancelLabel || 'Não, cancelar'}
                  </button>
                  <button
                    onClick={() => handleConfirmAction(true)}
                    className={`flex-1 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-lg transition-all active:scale-95 ${
                      confirmation.options.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                      confirmation.options.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' :
                      'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                    }`}
                  >
                    {confirmation.options.confirmLabel || 'Sim, confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prompt Modal Portal */}
      <AnimatePresence>
        {promptData && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
            >
              <div className="p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
                    <InfoIcon size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{promptData.options.title}</h3>
                </div>
                <p className="text-slate-500 font-bold text-sm leading-relaxed mb-6 translate-x-1">
                  {promptData.options.message}
                </p>
                <div className="mb-10">
                  <input 
                    type="text"
                    autoFocus
                    placeholder={promptData.options.placeholder || 'Digite aqui...'}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    value={promptInputValue}
                    onChange={e => setPromptInputValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handlePromptAction(promptInputValue);
                      if (e.key === 'Escape') handlePromptAction(null);
                    }}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => handlePromptAction(null)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                  >
                    {promptData.options.cancelLabel || 'Cancelar'}
                  </button>
                  <button
                    onClick={() => handlePromptAction(promptInputValue)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 text-center"
                  >
                    {promptData.options.confirmLabel || 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
