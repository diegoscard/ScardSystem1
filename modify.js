const fs = require('fs');
const content = fs.readFileSync('index.tsx', 'utf-8');

const startTarget = 'const CustomerManagementView = ';
const endTarget = '// --- COMPONENTE PDV ---';

const startIndex = content.indexOf(startTarget);
if (startIndex === -1) {
    console.error('Start marker not found');
    process.exit(1);
}

const endIndex = content.indexOf(endTarget, startIndex);
if (endIndex === -1) {
    console.error('End marker not found');
    process.exit(1);
}

const newContent = content.substring(0, startIndex) + content.substring(endIndex);
fs.writeFileSync('index.tsx', newContent);
console.log('Successfully removed CustomerManagementView segment');
