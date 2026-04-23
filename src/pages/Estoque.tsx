import React, { useState, useMemo, useCallback } from 'react';
import { Search, Plus, Trash2, Edit, X, RefreshCw, Layers, Check, Calendar, ArrowRightLeft, Upload, Bike, Percent, DollarSign, TicketPercent, Package, Tag, Gift, CalendarDays, Share2, Copy, Target, UserIcon, UserPlus, ShoppingBag, TrendingUp, ShieldAlert, ChevronLeft, ChevronRight, RotateCcw, Wallet, ArrowUpCircle, ArrowDownCircle, ShoppingCart, ReceiptText, Printer } from 'lucide-react';
import { Product, StockMovement } from '../types';
import { useStore } from '../contexts/StoreContext';
import { formatCurrency, parseCurrency } from '../utils/helpers';

const StockManagementView = () => {
  const { user, products, setProducts, categories, setCategories, movements, setMovements } = useStore();
  const [modal, setModal] = useState(false);
  const [summaryModal, setSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [form, setForm] = useState<any>({ cost: 0, price: 0, markup: 2.0, category: 'Sem Categoria', stock: 0, size: '', color: '', discountBlocked: false });
  const [search, setSearch] = useState('');
  const [isExact, setIsExact] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterSize, setFilterSize] = useState('');
  const [filterColor, setFilterColor] = useState('');

  const sortedCategories = useMemo(() => { 
    return [...categories].sort((a, b) => { if (a === 'Sem Categoria') return -1; if (b === 'Sem Categoria') return 1; return a.localeCompare(b); }); 
  }, [categories]);

  const updatePrice = useCallback((cost: number, markup: number) => {
    const newPrice = parseFloat((cost * markup).toFixed(2));
    setForm((prev: any) => ({ ...prev, cost, markup, price: newPrice }));
  }, []);
  const updateMarkup = useCallback((cost: number, price: number) => {
    const newMarkup = cost > 0 ? parseFloat((price / cost).toFixed(4)) : 0;
    setForm((prev: any) => ({ ...prev, cost, price, markup: newMarkup }));
  }, []);
  const generateRandomSku = () => {
    const code = Math.floor(100000 + Math.random() * 900000);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetters = letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
    setForm({ ...form, sku: `${code}${randomLetters}` });
  };
  const handleClone = (p: Product) => {
    setForm({ ...p, id: undefined, sku: '' });
    setModal(true);
  };
  const save = (e: any) => {
    e.preventDefault();
    if (products.some((p: Product) => p.sku === form.sku && p.id !== form.id)) return alert('SKU duplicado!');
    // Correct variable assignment typo
    const id = form.id || Date.now();
    const p = { ...form, id, active: true, price: Number(form.price) || 0, cost: Number(form.cost) || 0, markup: Number(form.markup) || 1, stock: Number(form.stock) || 0, discountBlocked: !!form.discountBlocked };
    if (form.id) setProducts((prev: any) => prev.map((x: any) => x.id === id ? p : x));
    else setProducts((prev: any) => [...prev, p]);
    setModal(false); setForm({ cost: 0, price: 0, markup: 2.0, category: 'Sem Categoria', stock: 0, size: '', color: '', discountBlocked: false });
  };
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
      alert('Nenhum produto visível para gerar resumo!');
      return;
    }
    const now = new Date().toLocaleDateString();
    let text = `📦 *RESUMO DE ESTOQUE - ${now}*\n`;
    text += `--------------------------------\n`;
    filteredProducts.forEach((p: Product) => {
      text += `*${p.name}* | Tam: ${p.size || '-'} | Qtd: ${p.stock} un\n`;
    });
    text += `--------------------------------\n`;
    text += `*Total de itens:* ${filteredProducts.reduce((acc: number, p: Product) => acc + p.stock, 0)} unidades.`;
    
    setSummaryText(text);
    setSummaryModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summaryText);
    alert('Resumo copiado para a área de transferência!');
  };

  return (
    <div className="space-y-6 h-full flex flex-col min-h-0">
      {!modal && (
        <div className="flex justify-between items-center shrink-0 animate-in fade-in">
            <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Estoque</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Controle de mercadorias</p>
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={() => setIsExact(!isExact)} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${isExact ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}
                >
                  <Target size={14} className={isExact ? 'animate-pulse' : ''} />
                  {isExact ? 'Exato' : 'Exato'}
                </button>
                <button type="button" onClick={generateWppSummary} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg active:scale-95 text-[10px] uppercase">
                  <Share2 size={16}/> Resumo WhatsApp
                </button>
                <button type="button" onClick={() => { setForm({stock: 0, cost: 0, price: 0, markup: 2.0, size: '', color: '', sku: '', category: 'Sem Categoria', discountBlocked: false}); setModal(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg active:scale-95 text-[10px] uppercase">
                  <Plus size={16}/> Novo Cadastro
                </button>
            </div>
        </div>
      )}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative group flex-[3] min-w-[200px]">
            <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isExact ? 'text-indigo-500' : 'text-slate-400'}`} />
            <input 
              type="text" 
              placeholder={isExact ? "Código SKU ou nome exato..." : "SKU ou nome..."} 
              className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none transition-all ${isExact ? 'border-indigo-500 ring-2 ring-indigo-50' : 'focus:border-indigo-500'}`} 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
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
                <th className="px-6 py-3">Produto</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Info</th>
                <th className="px-6 py-3 text-right">Venda</th>
                <th className="px-6 py-3 text-center">Qtd</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p: Product) => (
                <tr key={p.id} className={`hover:bg-slate-50 transition-all group ${p.stock === 0 ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`font-bold text-xs ${p.stock === 0 ? 'text-red-700' : 'text-slate-800'}`}>{p.name}</span>
                      <span className={`text-[8px] font-black font-mono ${p.stock === 0 ? 'text-red-400' : 'text-indigo-400'}`}>{p.sku}</span>
                      {p.discountBlocked && <span className="text-[7px] text-red-500 font-black uppercase mt-0.5">Sem Desconto</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border ${p.stock === 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border'}`}>{p.category || 'Sem Categoria'}</span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col leading-tight">
                        {p.size && <span className={`text-[12px] font-black uppercase ${p.stock === 0 ? 'text-red-700' : 'text-slate-900'}`}>TAM: {p.size}</span>}
                        {p.color && <span className={`text-[12px] font-bold mt-0.5 ${p.stock === 0 ? 'text-red-600' : 'text-slate-600'}`}>{p.color}</span>}
                        {!p.size && !p.color && <span className="text-[10px] text-slate-300">-</span>}
                     </div>
                  </td>
                  <td className={`px-6 py-4 font-black font-mono text-xs text-right ${p.stock === 0 ? 'text-red-700' : 'text-slate-900'}`}>R$ {formatCurrency(p.price)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-4 py-1 rounded-xl text-[10px] font-black ${p.stock === 0 ? 'text-white bg-red-600 animate-pulse' : p.stock <= 5 ? 'text-red-500 bg-red-50' : 'text-green-600 bg-green-50'}`}>{p.stock}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleClone(p)} className="p-2 text-slate-400 hover:text-green-600" title="Clonar"><Copy size={14}/></button>
                      <button onClick={() => { setForm(p); setModal(true); }} className={`p-2 transition-colors ${p.stock === 0 ? 'text-red-400 hover:text-red-600' : 'text-slate-400 hover:text-indigo-600'}`}><Edit size={14}/></button>
                      <button onClick={() => setProducts(products.filter((x: any) => x.id !== p.id))} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[100] animate-in fade-in">
          <form onSubmit={save} className="bg-white p-8 rounded-[2rem] w-full max-w-2xl shadow-2xl space-y-6 max-h-[90vh] overflow-auto custom-scroll">
            <h3 className="text-xl font-black text-slate-900 uppercase italic border-b pb-4">{form.id ? 'Ajustar' : 'Novo'} Registro de Peça</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2"><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Descrição Comercial</label><input placeholder="Ex: Camiseta Slim Masculina" className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">SKU / Referência</label><div className="flex gap-2"><input className="flex-1 border-2 rounded-xl px-4 py-2.5 text-sm font-mono" value={form.sku || ''} onChange={e => setForm({...form, sku: e.target.value})} required /><button type="button" onClick={generateRandomSku} className="bg-slate-100 p-3 rounded-xl hover:bg-slate-200"><RefreshCw size={16}/></button></div></div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Categoria</label>
                <div className="flex gap-2">
                  <select className="flex-1 border-2 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none" value={form.category || 'Sem Categoria'} onChange={e => setForm({...form, category: e.target.value})} required>
                    {sortedCategories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => {
                      const newCat = prompt('Digite o nome da nova categoria:');
                      if (newCat && newCat.trim()) {
                        const trimmed = newCat.trim();
                        if (categories.includes(trimmed)) return alert('Esta categoria já existe!');
                        setCategories([...categories, trimmed]);
                        setForm({...form, category: trimmed});
                      }
                    }} 
                    className="bg-slate-100 p-3 rounded-xl hover:bg-slate-200 text-slate-600"
                    title="Adicionar Categoria"
                  >
                    <Plus size={16}/>
                  </button>
                  {form.category && form.category !== 'Sem Categoria' && (
                    <button 
                      type="button" 
                      onClick={() => {
                        if (window.confirm(`Remover "${form.category}"? Todos os produtos desta categoria serão movidos para "Sem Categoria".`)) {
                          const catToDelete = form.category;
                          setCategories(categories.filter((c: string) => c !== catToDelete));
                          setProducts((prev: Product[]) => prev.map(p => p.category === catToDelete ? { ...p, category: 'Sem Categoria' } : p ));
                          setForm({...form, category: 'Sem Categoria'});
                        }
                      }} 
                      className="bg-red-50 p-3 rounded-xl hover:bg-red-100 text-red-600"
                      title="Remover Categoria"
                    >
                      <Trash2 size={16}/>
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2"><div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tamanho</label><input placeholder="P, M, G, 42..." className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold" value={form.size || ''} onChange={e => setForm({...form, size: e.target.value})} /></div><div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Cor / Estampa</label><input placeholder="Preto, Floral..." className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold" value={form.color || ''} onChange={e => setForm({...form, color: e.target.value})} /></div></div>
              <div className="grid grid-cols-3 gap-4 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Custo (R$)</label><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">R$</span><input type="text" onFocus={(e) => e.target.select()} className="w-full border-2 rounded-xl pl-7 pr-3 py-2 text-sm font-black" value={formatCurrency(form.cost || 0)} onChange={e => updatePrice(parseCurrency(e.target.value), form.markup)} /></div></div>
                <div><label className="text-[9px] font-black text-indigo-400 uppercase block mb-1">Markup</label><input type="number" step="0.1" onFocus={(e) => e.target.select()} className="w-full border-2 border-indigo-100 rounded-xl px-3 py-2 text-sm font-black text-indigo-700" value={form.markup || 0} onChange={e => updatePrice(form.cost, Number(e.target.value))} /></div>
                <div><label className="text-[9px] font-black text-green-600 uppercase block mb-1">Venda (R$)</label><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">R$</span><input type="text" onFocus={(e) => e.target.select()} className="w-full border-2 border-green-100 rounded-xl pl-7 pr-3 py-2 text-sm font-black text-green-700" value={formatCurrency(form.price || 0)} onChange={e => updateMarkup(form.cost, parseCurrency(e.target.value))} /></div></div>
              </div>
              <div className="md:col-span-2 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Qtd em Estoque</label>
                  <input type="number" onFocus={(e) => e.target.select()} className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-black text-center" value={form.stock || 0} onChange={e => setForm({...form, stock: Number(e.target.value)})} />
                </div>
                <div className="pt-5">
                   <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-dashed border-red-200 cursor-pointer hover:bg-red-50 transition-all">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg text-red-600 accent-red-600" 
                        checked={form.discountBlocked} 
                        onChange={e => setForm({...form, discountBlocked: e.target.checked})} 
                      />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-red-600 uppercase leading-none">Bloquear Desconto</span>                  
                      </div>
                   </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t mt-4"><button type="button" onClick={() => setModal(false)} className="px-5 py-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">DESCARTAR</button><button type="submit" className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95">SALVAR ALTERAÇÕES</button></div>
          </form>
        </div>
      )}

      {summaryModal && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[100] animate-in fade-in bg-slate-900/40 backdrop-blur-sm">
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
                className="w-full flex-1 border-2 rounded-2xl p-6 text-sm font-mono bg-slate-50 focus:outline-none custom-scroll resize-none leading-relaxed"
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
};

// --- COMPONENTE DASHBOARD ---

export default StockManagementView;
