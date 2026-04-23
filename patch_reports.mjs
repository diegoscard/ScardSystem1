import fs from 'fs';

let content = fs.readFileSync('src/pages/Relatorios.tsx', 'utf-8');

content = content.replace(
  `import React, { useState, useMemo, useRef } from 'react';`,
  `import React, { useState, useMemo, useRef, useEffect } from 'react';`
);

content = content.replace(
  `from 'lucide-react';`,
  `, History, Clock, User } from 'lucide-react';`
);

fs.writeFileSync('src/pages/Relatorios.tsx', content);
console.log('src/pages/Relatorios.tsx fixed.');
