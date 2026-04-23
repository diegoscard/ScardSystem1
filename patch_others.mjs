import fs from 'fs';

let content = fs.readFileSync('src/pages/Vendas.tsx', 'utf-8');
content = content.replace('Settings } from', 'AppSettings as Settings } from');
fs.writeFileSync('src/pages/Vendas.tsx', content);
console.log('src/pages/Vendas.tsx settings fixed.');

let pendentes = fs.readFileSync('src/pages/Pendentes.tsx', 'utf-8');
pendentes = pendentes.replace(
  `status: f.id === receivingModal.id && remaining === 0 ? 'paid' : f.status`,
  `status: (f.id === receivingModal.id && remaining === 0 ? 'paid' : f.status) as 'pending' | 'paid'`
);
fs.writeFileSync('src/pages/Pendentes.tsx', pendentes);
console.log('src/pages/Pendentes.tsx cast fixed.');
