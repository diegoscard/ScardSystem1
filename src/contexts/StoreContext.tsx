import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';
import { DEFAULT_SETTINGS, INITIAL_CATEGORIES } from '../utils/constants';
import { getDeviceFingerprint, generateHWID } from '../utils/helpers';
import {
  User, Customer, Product, Supplier, StockMovement,
  Sale, Campaign, CashSession, CashHistoryEntry,
  AppSettings, FiadoRecord, CommissionTier, SaleItem, PaymentRecord
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
      pdvState, setPdvState
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
