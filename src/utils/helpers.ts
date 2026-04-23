export const getDeviceFingerprint = () => {
  const { userAgent, language, hardwareConcurrency, platform } = navigator;
  const { width, height, colorDepth, availWidth, availHeight } = window.screen;
  return `${userAgent}|${language}|${hardwareConcurrency}|${platform}|${width}x${height}|${availWidth}x${availHeight}|${colorDepth}`;
};

export const generateHWID = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return Math.abs(hash).toString(36).toUpperCase();
};

export const formatCurrency = (val: number) => {
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const parseCurrency = (val: string) => {
  const clean = val.replace(/\D/g, '');
  return Number(clean) / 100;
};

export const maskCPFCNPJ = (value: string) => {
  const v = value.replace(/\D/g, '');
  if (v.length <= 11) {
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else {
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
};

export const maskPhone = (value: string) => {
  const v = value.replace(/\D/g, '');
  if (v.length <= 10) {
    return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else {
    return v.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
  }
};

export const maskDate = (value: string) => {
  const v = value.replace(/\D/g, '');
  return v.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
};

export const maskCEP = (val: string) => {
  const clean = val.replace(/\D/g, '');
  return clean.replace(/^(\d{5})(\d{3}).*/, '$1-$2').substring(0, 9);
};
