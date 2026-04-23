import { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  maxGlobalDiscount: 10,
  cardFees: {
    debit: 1.99,
    credit1x: 3.49,
    creditInstallments: 4.99
  },
  sellerPermissions: ['exchange_sale'],
  storeAddress: 'Rua da Moda, 123 - Centro',
  storeCnpj: '00.000.000/0001-00',
  storePhone: '',
  storeName: 'SCARD SYS',
  storeTagline: 'ENTERPRISE SOLUTION'
};

export const INITIAL_CATEGORIES = [
  'Sem Categoria', 'Camisetas', 'Calças', 'Vestidos', 'Bermudas', 'Casacos', 
  'Acessórios', 'Moda Íntima', 'Jeans', 'Blusas', 
  'Saias', 'Fitness', 'Bonés'
];
