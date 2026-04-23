import fs from 'fs';

// 1. Update src/pages/Campanhas.tsx to use useStore()
let campanhasContent = fs.readFileSync('src/pages/Campanhas.tsx', 'utf-8');
campanhasContent = campanhasContent.replace(
  `import { Campaign, Product } from '../types';`,
  `import { Campaign, Product } from '../types';\nimport { useStore } from '../contexts/StoreContext';`
);
campanhasContent = campanhasContent.replace(
  `const CampaignsViewComponent = ({ campaigns, setCampaigns, products }: { campaigns: Campaign[], setCampaigns: any, products: Product[] }) => {`,
  `const CampaignsViewComponent = () => {\n  const { campaigns, setCampaigns, products } = useStore();`
);
fs.writeFileSync('src/pages/Campanhas.tsx', campanhasContent);
console.log('src/pages/Campanhas.tsx updated to use useStore()');

// 2. Clear index.tsx
let indexContent = fs.readFileSync('index.tsx', 'utf-8').split('\n');

// Find boundaries
const campStart = indexContent.findIndex(line => line.includes('const CampaignsViewComponent ='));
const dataProvStart = indexContent.findIndex(line => line.includes('const DataProvider = ')); 

if (campStart === -1 || dataProvStart === -1) {
  console.log('Error slicing...');
  process.exit(1);
}

// Slice out from CampaignsViewComponent to right before DataProvider start
const newIndexLines = [
  ...indexContent.slice(0, campStart),
  ...indexContent.slice(dataProvStart)
];

let finalIndexContent = newIndexLines.join('\n');

// Replace usages
finalIndexContent = finalIndexContent.replace(
  /<CampaignsViewComponent[\s\S]*?\/>/m,
  '<Campanhas />'
);

// Add to lazy loads
finalIndexContent = finalIndexContent.replace(
  /const Equipe = React.lazy.*?;/m,
  `const Equipe = React.lazy(() => import('./src/pages/Equipe'));\nconst Campanhas = React.lazy(() => import('./src/pages/Campanhas'));`
);

fs.writeFileSync('index.tsx', finalIndexContent);
console.log('index.tsx cleaned.');
