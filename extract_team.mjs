import fs from 'fs';

const content = fs.readFileSync('index.tsx', 'utf-8').split('\n');
const start = content.findIndex(line => line.includes('const TeamViewComponent = '));
const end = content.findIndex(line => line.includes('const DataProvider = ')) - 1;

if (start === -1 || (end - start) < 10) {
  process.exit(1);
}

const componentLines = content.slice(start, end);

const imports = `import React, { useState } from 'react';
import { UserIcon, Edit, Trash2, Key, HelpCircle, ShieldAlert, BadgeInfo } from 'lucide-react';
import { User } from '../types';
import { useStore } from '../contexts/StoreContext';

`;

let componentStr = componentLines.join('\n');
componentStr = componentStr.replace(
  `const TeamViewComponent = ({ currentUser, users, setUsers }: any) => {`,
  `const TeamViewComponent = () => {\n  const { user: currentUser, dbUsers: users, setDbUsers: setUsers } = useStore();`
);

fs.writeFileSync('src/pages/Equipe.tsx', imports + componentStr + '\n\nexport default TeamViewComponent;\n');
console.log('src/pages/Equipe.tsx created.');

const newIndexLines = [
  ...content.slice(0, start),
  ...content.slice(end)
];

const lazyImportStr = `const Equipe = React.lazy(() => import('./src/pages/Equipe'));`;
const lazyIdx = newIndexLines.findIndex(line => line.includes('const Configuracoes = React.lazy'));
if (lazyIdx !== -1) {
  newIndexLines.splice(lazyIdx + 1, 0, lazyImportStr);
}

let newIndexContent = newIndexLines.join('\n');

newIndexContent = newIndexContent.replace(
  /<TeamViewComponent[\s\S]*?\/>/m,
  '<Equipe />'
);

fs.writeFileSync('index.tsx', newIndexContent);
console.log('index.tsx updated for Equipe.');
