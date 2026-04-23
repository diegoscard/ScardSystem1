import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Edit, X, RefreshCw, Layers, Check, Calendar, ArrowRightLeft, Upload, Share2, Copy, Target } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { Product } from '../types';
import { formatCurrency } from '../utils/helpers';

export default function Consultar() {
  const { products, categories, notify } = useStore();
  const [search, setSearch] = useState('');
  const [isExact, setIsExact] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterSize, setFilterSize] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [summaryModal, setSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  const sortedCategories = useMemo(() => { 
    return [...categories].sort((a, b) => { 
      if (a === 'Sem Categoria') return -1; 
      if (b === 'Sem Categoria') return 1; 
      return a.localeCompare(b); 
    }); 
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const t = search.toLowerCase();
    const s = filterSize.toLowerCase();
    const c = filterColor.toLowerCase();
    return products.filter((p: Product) => {
      let matchSearch = false;
      if (!t) {
        matchSearch = p.active;
      } else {
        if (isExact) {
          matchSearch = p.active && (p.name.toLowerCase() === t || p.sku.toLowerCase() === t);
        } else {
          matchSearch = p.active && (p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t));
        }
      }

      const matchCategory = filterCategory === 'Todas' ? true : p.category === filterCategory;
      const matchSize = s ? p.size?.toLowerCase().includes(s) : true;
      const matchColor = c ? p.color?.toLowerCase().includes(c) : true;
      return matchSearch && matchCategory && matchSize && matchColor;
    });
  }, [products, search, isExact, filterCategory, filterSize, filterColor]);

  const generateWppSummary = () => {
    if (filteredProducts.length === 0) {
      notify('Filtre alguns produtos para gerar o resumo.', 'warning');
      return;
    }
    let text = `📦 *PEÇAS*\n`;
    text += `--------------------------------\n`;
    filteredProducts.forEach((p: Product) => {
      text += `*${p.sku}* - *${p.name}* | Tam: ${p.size || '-'} | R$ ${formatCurrency(p.price)}\n`;
    });
    text += `--------------------------------\n`;
    
    setSummaryText(text);
    setSummaryModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summaryText);
    notify('Resumo copiado com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 h-full flex flex-col min-h-0 animate-in fade-in">
       <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Consulta de Produtos</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verificação rápida de preço e estoque</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsExact(!isExact)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${isExact ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}
            >
              <Target size={14} className={isExact ? 'animate-pulse' : ''} />
              {isExact ? 'Busca Exata Ativa' : 'Ativar Busca Exata'}
            </button>
            <button type="button" onClick={generateWppSummary} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg active:scale-95 text-[10px] uppercase">
              <Share2 size={16}/> Resumo WhatsApp
            </button>
          </div>
       </div>
       
       <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative group flex-[3] min-w-[200px]">
              <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isExact ? 'text-indigo-500' : 'text-slate-400'}`} />
              <input 
                type="text" 
                placeholder={isExact ? "Digite o nome exato ou SKU..." : "Buscar por SKU ou nome..."} 
                className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none transition-all ${isExact ? 'border-indigo-500 ring-2 ring-indigo-50' : 'focus:border-indigo-500'}`} 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                autoFocus 
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="TAM" 
                className="w-16 md:w-20 px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:border-indigo-500 uppercase text-center"
                value={filterSize}
                onChange={e => setFilterSize(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="COR" 
                className="w-24 md:w-32 px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:border-indigo-500 uppercase"
                value={filterColor}
                onChange={e => setFilterColor(e.target.value)}
              />
            </div>
            <select className="flex-1 min-w-[150px] bg-slate-50 px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase outline-none focus:border-indigo-500" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
               <option value="Todas">Todas Categorias</option>
               {sortedCategories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            {(filterSize || filterColor) && (
              <button onClick={() => { setFilterSize(''); setFilterColor(''); }} className="text-[9px] font-black text-red-400 uppercase hover:text-red-600 transition-colors flex items-center gap-1" title="Limpar Filtros">
                <X size={16} />
              </button>
            )}
          </div>
       </div>

       <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 flex-1 flex flex-col min-h-0">
          <div className="overflow-auto flex-1 custom-scroll">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-slate-50 sticky top-0 z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Detalhes</th>
                  <th className="px-6 py-4 text-right">Preço de Venda</th>
                  <th className="px-6 py-4 text-center">Estoque Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                        <span className="text-[10px] font-black text-indigo-500 font-mono">{p.sku}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 text-[8px] font-black uppercase border">{p.category || 'Sem Categoria'}</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col text-[11px] font-bold text-slate-600">
                          {p.size && <span>TAM: {p.size}</span>}
                          {p.color && <span>COR: {p.color}</span>}
                          {!p.size && !p.color && <span className="text-slate-300">-</span>}
                       </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 font-mono text-sm text-right">R$ {formatCurrency(p.price)}</td>
                    <td className="px-6 py-4 text-center">
                       <span className={`px-4 py-1.5 rounded-xl text-[11px] font-black ${p.stock <= 5 ? 'text-red-500 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                          {p.stock} un
                       </span>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">Nenhum produto {isExact ? 'idêntico' : ''} encontrado...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
       </div>

       {summaryModal && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[200] animate-in fade-in bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-xl shadow-2xl space-y-6 flex flex-col relative">
            <div className="flex justify-between items-center border-b pb-4 shrink-0">
               <h3 className="text-xl font-black text-slate-900 uppercase italic flex items-center gap-2">
                 <Share2 size={24} className="text-emerald-600" /> Resumo WhatsApp
               </h3>
               <button type="button" onClick={() => setSummaryModal(false)} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col gap-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conteúdo do Resumo (Filtrado)</p>
              <textarea 
                readOnly
                className="w-full flex-1 border-2 rounded-2xl p-6 text-sm font-mono bg-slate-50 focus:outline-none custom-scroll resize-none leading-relaxed focus:border-emerald-500"
                value={summaryText}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t shrink-0">
              <button type="button" onClick={copyToClipboard} className="w-full py-4 bg-emerald-600 text-white font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-700 transition-all active:scale-95">
                <Copy size={16} /> Copiar para WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}