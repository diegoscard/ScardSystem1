import fs from 'fs';

const content = fs.readFileSync('src/types.ts', 'utf-8');

const updated = content.replace(
  `export interface Campaign {\n  id: number;`,
  `export interface Campaign {
  id: number;
  productIds?: number[];
  startDate: string;
  endDate: string;
  voucherValue?: number;
  voucherQuantity?: number;
  bundleQuantity?: number;
  fixedPriceValue?: number;`
);

fs.writeFileSync('src/types.ts', updated);
console.log('src/types.ts updated.');
