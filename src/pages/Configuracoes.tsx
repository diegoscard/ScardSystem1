import React, { useState } from 'react';
import { Save, Tag, Store, CreditCard, Users, Trash } from 'lucide-react';
import { Product, AppSettings } from '../types';
import { useStore } from '../contexts/StoreContext';
import { DEFAULT_SETTINGS } from '../utils/constants';

const SettingsViewComponent = () => {
  const { settings, setSettings, categories, setCategories, products, setProducts, notify } = useStore();
  const [localSettings, setLocalSettings] = useState<AppSettings>({ 
    maxGlobalDiscount: settings?.maxGlobalDiscount ?? 10, 
    cardFees: { 
      debit: settings?.cardFees?.debit ?? 1.99, 
      credit1x: settings?.cardFees?.credit1x ?? 3.49, 
      creditInstallments: settings?.cardFees?.creditInstallments ?? 4.99 
    }, 
    sellerPermissions: settings?.sellerPermissions ?? DEFAULT_SETTINGS.sellerPermissions,
    storeAddress: settings?.storeAddress ?? DEFAULT_SETTINGS.storeAddress,
    storeCnpj: settings?.storeCnpj ?? DEFAULT_SETTINGS.storeCnpj,
    storePhone: settings?.storePhone ?? DEFAULT_SETTINGS.storePhone,
    storeName: settings?.storeName ?? DEFAULT_SETTINGS.storeName,
    storeTagline: settings?.storeTagline ?? DEFAULT_SETTINGS.storeTagline
  });
  const handleSave = () => { setSettings(localSettings); notify('Configurações atualizadas com sucesso!', 'success'); };
  const togglePermission = (viewId: string) => { const perms = (localSettings.sellerPermissions || []).includes(viewId) ? localSettings.sellerPermissions.filter(p => p !== viewId) : [...(localSettings.sellerPermissions || []), viewId]; setLocalSettings({ ...localSettings, sellerPermissions: perms }); };
  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-end"><div className="flex flex-col"><h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Configurações</h2><p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.2em]">Ajustes de taxas e sistema</p></div><button onClick={handleSave} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px]">Salvar Alterações</button></div>
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800 uppercase italic border-b pb-4">Dados da Empresa (Recibo)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nome da Empresa</label>
                    <input type="text" className="w-full border-2 rounded-xl px-4 py-3 text-slate-800 font-bold text-sm" value={localSettings.storeName} onChange={e => setLocalSettings({...localSettings, storeName: e.target.value})} placeholder="SCARD SYS" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Subtítulo / Slogan</label>
                    <input type="text" className="w-full border-2 rounded-xl px-4 py-3 text-slate-800 font-bold text-sm" value={localSettings.storeTagline} onChange={e => setLocalSettings({...localSettings, storeTagline: e.target.value})} placeholder="ENTERPRISE SOLUTION" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Endereço Completo</label>
                    <input type="text" className="w-full border-2 rounded-xl px-4 py-3 text-slate-800 font-bold text-sm" value={localSettings.storeAddress} onChange={e => setLocalSettings({...localSettings, storeAddress: e.target.value})} placeholder="Rua da Moda, 123 - Centro" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">CNPJ</label>
                    <input 
                      type="text" 
                      className="w-full border-2 rounded-xl px-4 py-3 text-slate-800 font-bold text-sm" 
                      value={localSettings.storeCnpj} 
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 14) val = val.slice(0, 14);
                        if (val.length > 12) val = `${val.slice(0, 2)}.${val.slice(2, 5)}.${val.slice(5, 8)}/${val.slice(8, 12)}-${val.slice(12)}`;
                        else if (val.length > 8) val = `${val.slice(0, 2)}.${val.slice(2, 5)}.${val.slice(5, 8)}/${val.slice(8)}`;
                        else if (val.length > 5) val = `${val.slice(0, 2)}.${val.slice(2, 5)}.${val.slice(5)}`;
                        else if (val.length > 2) val = `${val.slice(0, 2)}.${val.slice(2)}`;
                        setLocalSettings({...localSettings, storeCnpj: val});
                      }} 
                      placeholder="00.000.000/0001-00" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Telefone</label>
                    <input 
                      type="text" 
                      className="w-full border-2 rounded-xl px-4 py-3 text-slate-800 font-bold text-sm" 
                      value={localSettings.storePhone} 
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 11) val = val.slice(0, 11);
                        if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                        if (val.length > 6) val = `${val.slice(0, 6)} ${val.slice(6)}`;
                        if (val.length > 11) val = `${val.slice(0, 11)}-${val.slice(11)}`;
                        setLocalSettings({...localSettings, storePhone: val});
                      }} 
                      placeholder="(00) 0 0000-0000" 
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-6 border-t pt-6"><h3 className="text-lg font-black text-slate-800 uppercase italic border-b pb-4">Taxas Bancárias (%)</h3><div className="grid grid-cols-3 gap-4">{['debit', 'credit1x', 'creditInstallments'].map(key => (<div key={key}><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">{key === 'debit' ? 'Débito' : key === 'credit1x' ? 'Crédito 1x' : 'C. Parcelado'}</label><input type="number" step="0.01" onFocus={(e) => e.target.select()} className="w-full border-2 rounded-xl px-4 py-3 text-indigo-600 font-black text-sm" value={(localSettings.cardFees as any)[key]} onChange={e => setLocalSettings({...localSettings, cardFees: {...localSettings.cardFees, [key]: Number(e.target.value)}})} /></div>))}</div></div><div className="space-y-6 border-t pt-6"><h3 className="text-lg font-black text-slate-800 uppercase italic border-b pb-4">Política de Desconto</h3><div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Limite Máximo de Desconto (%)</label><div className="flex items-center gap-3"><input type="number" step="1" onFocus={(e) => e.target.select()} className="w-32 border-2 rounded-xl px-4 py-3 text-red-600 font-black text-sm" value={localSettings.maxGlobalDiscount} onChange={e => setLocalSettings({...localSettings, maxGlobalDiscount: Number(e.target.value)})} /><span className="text-xs font-bold text-slate-400">Limite apenas para vendedor, administrador não se aplica.</span></div></div></div></div>
           <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6"><h3 className="text-lg font-black text-slate-800 uppercase italic border-b pb-4">Permissões do Vendedor</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[{id: 'reports_fluxo', label: 'RELATÓRIOS - ENTRADAS/SANGRIAS'}, {id: 'reports_cash', label: 'RELATÓRIOS - HISTÓRICO CAIXA'}, {id: 'stock', label: 'ESTOQUE'}, {id: 'dashboard', label: 'DASHBOARD'}, {id: 'campaigns', label: 'CAMPANHAS'}, {id: 'delete_sale', label: 'EXCLUIR VENDA'}, {id: 'exchange_sale', label: 'REALIZAR TROCA'}, {id: 'fiado', label: 'PENDENTES (F12)'}].map(v => (<label key={v.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-indigo-50 transition-colors"><input type="checkbox" className="w-4 h-4 rounded text-indigo-600" checked={(localSettings.sellerPermissions || []).includes(v.id)} onChange={() => togglePermission(v.id)} /><span className="text-xs font-black text-slate-700 uppercase">{v.label}</span></label>))}</div><p className="text-[9px] font-bold text-slate-400 uppercase italic">Configure o que é relevante para o vendedor acessar.</p></div>
        </div>
      </div>
    </div>
  );
};

// --- GESTÃO DE EQUIPE ---

export default SettingsViewComponent;
