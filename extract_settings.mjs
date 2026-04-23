import fs from 'fs';

const content = fs.readFileSync('index.tsx', 'utf-8').split('\n');
const start = content.findIndex(line => line.includes('const SettingsViewComponent = '));
const end = content.findIndex(line => line.includes('const TeamViewComponent = ')) - 1;

if (start === -1 || (end - start) < 10) {
  process.exit(1);
}

const componentLines = content.slice(start, end);

const imports = `import React, { useState } from 'react';
import { Save, Tag, Store, CreditCard, Users, Trash } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../contexts/StoreContext';

`;

let componentStr = componentLines.join('\n');
componentStr = componentStr.replace(
  `const SettingsViewComponent = ({ settings, setSettings, categories, setCategories, products, setProducts }: any) => {`,
  `const SettingsViewComponent = () => {\n  const { settings, setSettings, categories, setCategories, products, setProducts } = useStore();`
);

fs.writeFileSync('src/pages/Configuracoes.tsx', imports + componentStr + '\n\nexport default SettingsViewComponent;\n');
console.log('src/pages/Configuracoes.tsx created.');

const newIndexLines = [
  ...content.slice(0, start),
  ...content.slice(end)
];

const lazyImportStr = `const Configuracoes = React.lazy(() => import('./src/pages/Configuracoes'));`;
const lazyIdx = newIndexLines.findIndex(line => line.includes('const Relatorios = React.lazy'));
if (lazyIdx !== -1) {
  newIndexLines.splice(lazyIdx + 1, 0, lazyImportStr);
}

let newIndexContent = newIndexLines.join('\n');

newIndexContent = newIndexContent.replace(
  /<SettingsViewComponent[\s\S]*?\/>/m,
  '<Configuracoes />'
);

fs.writeFileSync('index.tsx', newIndexContent);
console.log('index.tsx updated for Configuracoes.');
