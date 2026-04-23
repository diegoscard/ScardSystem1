import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
content = content.replace(
  `import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';\n`,
  ''
);

content = content.replace(
  `} from 'lucide-react';`,
  `, Star, HandCoins, Box, CreditCard, Banknote, QrCode, Trophy, Medal, Award, Calculator, Zap } from 'lucide-react';`
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log('src/pages/Dashboard.tsx fixed.');
