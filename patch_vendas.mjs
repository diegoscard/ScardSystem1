import fs from 'fs';

const content = fs.readFileSync('src/pages/Vendas.tsx', 'utf-8');

const updated = content.replace(
  `const SalesViewComponent = ({ user, products, setProducts, setSales, setMovements, vendedores, cashSession, setCashSession, settings, exchangeCredit, setExchangeCredit, campaigns, setCampaigns, fiados, setFiados, customers, setCustomers, setCurrentView, pdvState, setPdvState }: any) => {`,
  `const SalesViewComponent = ({ setCurrentView }: { setCurrentView: (view: string) => void }) => {
  const { user, products, setProducts, setSales, setMovements, dbUsers: vendedores, cashSession, setCashSession, settings, exchangeCredit, setExchangeCredit, campaigns, setCampaigns, fiados, setFiados, customers, setCustomers, pdvState, setPdvState } = useStore();
  
  if (!user) return null;`
);

fs.writeFileSync('src/pages/Vendas.tsx', updated);
console.log('src/pages/Vendas.tsx updated.');
