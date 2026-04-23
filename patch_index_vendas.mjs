import fs from 'fs';

const content = fs.readFileSync('index.tsx', 'utf-8');

let updated = content.replace(
  `const Clientes = React.lazy(() => import('./src/pages/Clientes'));`,
  `const Clientes = React.lazy(() => import('./src/pages/Clientes'));
const Vendas = React.lazy(() => import('./src/pages/Vendas'));`
);

updated = updated.replace(
  `<SalesViewComponent 
                user={user} 
                products={products} 
                setProducts={setProducts} 
                setSales={setSales} 
                setMovements={setMovements} 
                vendedores={dbUsers}
                cashSession={cashSession}
                setCashSession={setCashSession}
                settings={settings}
                exchangeCredit={exchangeCredit}
                setExchangeCredit={setExchangeCredit}
                campaigns={campaigns}
                setCampaigns={setCampaigns}
                fiados={fiados}
                setFiados={setFiados}
                customers={customers}
                setCustomers={setCustomers}
                setCurrentView={setCurrentView}
                pdvState={pdvState}
                setPdvState={setPdvState}
              />`,
  `<Vendas setCurrentView={setCurrentView} />`
);

fs.writeFileSync('index.tsx', updated);
console.log('index.tsx updated.');
