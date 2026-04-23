export type UserRole = 'admin' | 'atendente';

export interface Customer {
  id: number;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  createdAt: string;
  totalSpent: number;
  lastPurchase?: string;
  cep?: string;
  addressNumber?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: string;
}

export interface AppSettings {
  maxGlobalDiscount: number;
  cardFees: {
    debit: number;
    credit1x: number;
    credit1xLabel?: string;
    creditInstallments: number;
  };
  sellerPermissions: string[]; 
  storeAddress?: string;
  storeCnpj?: string;
  storePhone?: string;
  storeName?: string; 
  storeTagline?: string; 
}

export interface Product {
  id: number;
  name: string;
  category: string;
  sku: string;
  price: number;
  cost: number;
  markup: number; 
  stock: number;
  size: string;
  color: string;
  active: boolean;
  supplierId?: number;
  discountBlocked?: boolean;
}

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  reason: string;
  date: string;
  user: string;
}

export interface SaleItem {
  cartId: string;
  productId: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  discountValue: number; 
  manualDiscountValue: number; 
  manualDiscountInput?: number;
  manualDiscountType?: 'value' | 'percent';
  isExchanged?: boolean; 
  campaignName?: string; 
  campaignType?: 'percentage' | 'buy_x_get_y' | 'voucher' | 'bundle' | 'fixed_price';
  discountBlocked?: boolean;
}

export interface PaymentRecord {
  method: string;
  amount: number;
  installments?: number;
  installmentValue?: number;
  netAmount: number;
  voucherCode?: string;
  f12ClientName?: string;
  f12Description?: string;
  f12DueDate?: string;
}

export interface FiadoRecord {
  id: string;
  saleId: number;
  clientName: string;
  description: string;
  totalAmount: number;
  remainingAmount: number;
  createdAt: string;
  dueDate: string;
  vendedor: string;
  status: 'pending' | 'paid';
  items: SaleItem[];
}

export interface CashLog {
  id: string;
  type: 'entrada' | 'retirada' | 'venda' | 'abertura' | 'ajuste';
  amount: number;
  description: string;
  time: string;
  user: string;
}

export interface CashSession {
  isOpen: boolean;
  openingBalance: number;
  currentBalance: number;
  openedAt: string;
  openedBy: string;
  logs: CashLog[];
}

export interface CashHistoryEntry {
  id: string;
  openedBy: string;
  openedAt: string;
  openingBalance: number;
  closedBy: string;
  closedAt: string;
  closingBalance: number;
  logs: CashLog[];
}

export interface Sale {
  id: number;
  date: string;
  subtotal: number;
  discount: number;
  discountPercent: number;
  total: number;
  payments: PaymentRecord[];
  user: string; 
  adminUser: string; 
  items: SaleItem[];
  change: number; 
  exchangeCreditUsed?: number; 
  customerId?: number;
}

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Campaign {
  id: number;
  productIds?: number[];
  startDate: string;
  endDate: string;
  createdAt?: string;
  voucherValue?: number;
  voucherQuantity?: number;
  bundleQuantity?: number;
  fixedPriceValue?: number;
  name: string;
  description: string;
  type: 'percentage' | 'buy_x_get_y' | 'voucher' | 'bundle' | 'fixed_price';
  discountPercent: number;
  pagueX?: number; 
  leveY?: number;  
  voucherCode?: string;
  bundleItems?: number[]; 
  bundlePrice?: number;
  appliesToSkus?: string;
  active: boolean;
}

export interface CommissionTier {
  min: number;
  rate: number;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

export interface PromptOptions {
  title: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}
