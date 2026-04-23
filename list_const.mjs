import fs from 'fs';
const lines = fs.readFileSync('index.tsx', 'utf-8').split('\n');
lines.forEach((l, i) => {
  if (l.startsWith('const ') && l.includes('=')) {
    console.log(i + 1, l);
  }
});
