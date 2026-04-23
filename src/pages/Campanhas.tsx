import React, { useState } from 'react';
import { Plus, Search, CheckCircle2, TicketPercent, Package, Tag, Gift, CalendarDays, Edit, Trash2, X, Percent, DollarSign } from 'lucide-react';
import { Campaign, Product } from '../types';
import { useStore } from '../contexts/StoreContext';
import { formatCurrency, parseCurrency } from '../utils/helpers';

const CampaignsViewComponent = () => {
  const { campaigns, setCampaigns, products, notify, confirm } = useStore();
  const [modal, setModal] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [form, setForm] = useState<Partial<Campaign>>({
    name: '', description: '', type: 'percentage', discountPercent: 0, pagueX: 0, leveY: 0, voucherCode: '', voucherValue: 0, voucherQuantity: 1, bundleQuantity: 1, bundlePrice: 0, fixedPriceValue: 0, startDate: '', endDate: '', active: true, productIds: []
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const id = form.id || Date.now();
    const c: Campaign = { 
      ...form, 
      id, 
      createdAt: form.createdAt || new Date().toISOString() 
    } as Campaign;

    if (form.id) setCampaigns((prev: Campaign[]) => prev.map(x => x.id === id ? c : x));
    else setCampaigns((prev: Campaign[]) => [...prev, c]);
    
    setModal(false);
    setForm({ name: '', description: '', type: 'percentage', discountPercent: 0, pagueX: 0, leveY: 0, voucherCode: '', voucherValue: 0, voucherQuantity: 1, bundleQuantity: 1, bundlePrice: 0, fixedPriceValue: 0, startDate: '', endDate: '', active: true, productIds: [] });
  };

  const filteredProds = products.filter(p => p.active && (p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.sku.toLowerCase().includes(prodSearch.toLowerCase())));

  const toggleProduct = (pid: number) => {
    const current = form.productIds || [];
    if (current.includes(pid)) {
      setForm({ ...form, productIds: current.filter(id => id !== pid) });
    } else {
      setForm({ ...form, productIds: [...current, pid] });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col min-h-0 animate-in fade-in">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Campanhas</h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gestão de promoções e eventos</p>
        </div>
        <button onClick={() => { setForm({ name: '', description: '', type: 'percentage', discountPercent: 0, pagueX: 0, leveY: 0, voucherCode: '', voucherValue: 0, voucherQuantity: 1, bundleQuantity: 1, bundlePrice: 0, fixedPriceValue: 0, startDate: '', endDate: '', active: true, productIds: [] }); setModal(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg active:scale-95 text-[10px] uppercase">
          <Plus size={16} /> Nova Campanha
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1 custom-scroll">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-slate-50 sticky top-0 z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Campanha</th>
                <th className="px-6 py-4">Tipo/Regra</th>
                <th className="px-6 py-4">Itens/Validade</th>
                <th className="px-6 py-4">Período</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c: Campaign) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm uppercase italic">{c.name}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-xs">{c.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     {c.type === 'percentage' ? (
                       <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black border border-red-100 uppercase">
                          {c.discountPercent}% OFF
                       </span>
                     ) : c.type === 'buy_x_get_y' ? (
                       <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black border border-indigo-100 uppercase flex items-center gap-1.5 w-fit">
                          <TicketPercent size={12} /> PAGUE {c.pagueX} LEVE {c.leveY}
                       </span>
                     ) : c.type === 'bundle' ? (
                        <div className="flex flex-col gap-1">
                            <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black border border-purple-100 uppercase flex items-center gap-1.5 w-fit">
                                <Package size={12} /> {c.bundleQuantity} POR R$ {formatCurrency(c.bundlePrice || 0)}
                            </span>
                        </div>
                     ) : c.type === 'fixed_price' ? (
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-100 uppercase flex items-center gap-1.5 w-fit">
                           <Tag size={12} /> PREÇO FIXO: R$ {formatCurrency(c.fixedPriceValue || 0)}
                        </span>
                     ) : (
                        <div className="flex flex-col gap-1">
                            <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black border border-amber-100 uppercase flex items-center gap-1.5 w-fit">
                                <Gift size={12} /> VOUCHER: {c.voucherCode}
                            </span>
                            <span className="text-[10px] font-black text-slate-500 font-mono">VALOR: R$ {formatCurrency(c.voucherValue || 0)}</span>
                        </div>
                     )}
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col gap-1">
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black w-fit uppercase">
                            {c.type === 'voucher' ? `${c.voucherQuantity} USOS` : `${c.productIds?.length || 0} PRODS`}
                        </span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                      <CalendarDays size={12} className="text-indigo-400" />
                      {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const now = new Date();
                      const start = new Date(c.startDate);
                      const end = new Date(c.endDate);
                      end.setHours(23, 59, 59, 999);
                      
                      if (now > end) return <span className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border bg-red-50 text-red-600 border-red-100">Encerrada</span>;
                      if (now < start) return <span className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border bg-blue-50 text-blue-600 border-blue-100">Agendada</span>;
                      if (c.type === 'voucher' && (c.voucherQuantity || 0) <= 0) return <span className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border bg-slate-100 text-slate-400 border-slate-200">Esgotado</span>;
                      return <span className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border bg-green-50 text-green-600 border-green-100">Ativa</span>;
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => { setForm(c); setModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Edit size={14} /></button>
                       <button onClick={async () => {
                           const ok = await confirm({
                               title: 'Excluir Campanha',
                               message: `Deseja realmente remover a campanha "${c.name}"?`,
                               type: 'warning',
                               confirmLabel: 'Excluir',
                               cancelLabel: 'Manter'
                           });
                           if (ok) {
                               setCampaigns(campaigns.filter((x: any) => x.id !== c.id));
                               notify('Campanha removida.', 'info');
                           }
                       }} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-300 font-bold italic">Nenhuma campanha cadastrada...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[100] animate-in fade-in">
          <form onSubmit={save} className="bg-white p-8 rounded-[2.5rem] w-full max-w-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-hidden flex flex-col relative z-20">
            <div className="flex justify-between items-center border-b pb-4 shrink-0">
               <h3 className="text-xl font-black text-slate-900 uppercase italic">
                  {form.id ? 'Ajustar' : 'Nova'} Campanha
               </h3>
               <button type="button" onClick={() => setModal(false)} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scroll pr-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Nome da Campanha</label>
                      <input className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase focus:border-indigo-500 outline-none" placeholder="Ex: Black Friday" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Descrição</label>
                      <textarea className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold h-20 resize-none focus:border-indigo-500 outline-none" placeholder="Detalhes da promoção..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Tipo de Campanha</label>
                        <select className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase focus:border-indigo-500 outline-none" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
                           <option value="percentage">Desconto Percentual (%)</option>
                           <option value="fixed_price">Preço Fixo (R$)</option>
                           <option value="buy_x_get_y">Pague X, Leve Y (Item Grátis)</option>
                           <option value="bundle">Combo (Ex: 3 por 100)</option>
                           <option value="voucher">Cupom de Desconto (Voucher)</option>
                        </select>
                    </div>

                    {form.type === 'percentage' && (
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Desconto (%)</label>
                          <div className="relative">
                            <Percent size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input 
                              type="number" 
                              step="0.5" 
                              className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-black text-red-600 focus:border-red-300 outline-none" 
                              value={form.discountPercent} 
                              onFocus={() => { if(form.discountPercent === 0) setForm(prev => ({...prev, discountPercent: '' as any})); }} 
                              onBlur={() => { if(form.discountPercent as any === '') setForm(prev => ({...prev, discountPercent: 0})); }}
                              onChange={e => setForm(prev => ({ ...prev, discountPercent: e.target.value === '' ? '' as any : Number(e.target.value) }))} 
                              required 
                            />
                          </div>
                       </div>
                    )}

                    {form.type === 'fixed_price' && (
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Preço Final (R$)</label>
                          <div className="relative">
                            <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input 
                              type="text" 
                              className="w-full border-2 rounded-xl pl-12 pr-4 py-2.5 text-sm font-black text-emerald-600 focus:border-emerald-300 outline-none bg-slate-50" 
                              value={formatCurrency(form.fixedPriceValue || 0)} 
                              onFocus={(e) => e.target.select()}
                              onChange={e => setForm(prev => ({ ...prev, fixedPriceValue: parseCurrency(e.target.value) }))} 
                              required 
                            />
                          </div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 italic">Todos os itens selecionados custarão este valor no caixa.</p>
                       </div>
                    )}

                    {form.type === 'buy_x_get_y' && (
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Pague (Qtd)</label>
                            <input 
                              type="number" 
                              className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-black text-indigo-600 focus:border-indigo-300 outline-none bg-slate-50" 
                              value={form.pagueX} 
                              onFocus={(e) => e.target.select()}
                              onChange={e => setForm(prev => ({ ...prev, pagueX: Number(e.target.value) }))} 
                              required 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Leve (Qtd)</label>
                            <input 
                              type="number" 
                              className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-black text-green-600 focus:border-green-300 outline-none bg-slate-50" 
                              value={form.leveY} 
                              onFocus={(e) => e.target.select()}
                              onChange={e => setForm(prev => ({ ...prev, leveY: Number(e.target.value) }))} 
                              required 
                            />
                          </div>
                          <p className="col-span-2 text-[8px] font-bold text-slate-400 italic uppercase">
                             O sistema dará desconto de 100% nas {(form.leveY || 0) - (form.pagueX || 0)} unidades mais baratas a cada {form.leveY} itens.
                          </p>
                       </div>
                    )}

                    {form.type === 'bundle' && (
                       <div className="grid grid-cols-2 gap-4 bg-purple-50 p-4 rounded-2xl border border-purple-100">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-purple-600 uppercase block ml-1">Qtd Itens</label>
                            <input 
                              type="number" 
                              min="1"
                              className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-black text-purple-700 focus:border-purple-300 outline-none" 
                              value={form.bundleQuantity} 
                              onChange={e => setForm(prev => ({ ...prev, bundleQuantity: Number(e.target.value) }))} 
                              required 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-purple-600 uppercase block ml-1">Preço do Combo (R$)</label>
                            <input 
                              type="text" 
                              className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-black text-purple-700 focus:border-purple-300 outline-none" 
                              value={formatCurrency(form.bundlePrice || 0)} 
                              onChange={e => setForm(prev => ({ ...prev, bundlePrice: parseCurrency(e.target.value) }))} 
                              required 
                            />
                          </div>
                       </div>
                    )}

                    {form.type === 'voucher' && (
                        <div className="space-y-4 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                           <div className="space-y-1">
                                <label className="text-[9px] font-black text-amber-600 uppercase block ml-1">Código do Voucher</label>
                                <input className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-black uppercase text-amber-700 focus:border-amber-400 outline-none" placeholder="Ex: CUPOM10" value={form.voucherCode} onChange={e => setForm({ ...form, voucherCode: e.target.value.toUpperCase() })} required />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                    <label className="text-[9px] font-black text-amber-600 uppercase block ml-1">Valor Fixo (R$)</label>
                                    <input 
                                        type="text" 
                                        className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-black text-amber-700 outline-none" 
                                        value={formatCurrency(form.voucherValue || 0)} 
                                        onChange={e => setForm({ ...form, voucherValue: parseCurrency(e.target.value) })} 
                                        required 
                                    />
                              </div>
                              <div className="space-y-1">
                                    <label className="text-[9px] font-black text-amber-600 uppercase ml-1">Quantidade/Limite</label>
                                    <input 
                                        type="number" 
                                        className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-black text-amber-700 outline-none" 
                                        value={form.voucherQuantity} 
                                        onChange={e => setForm({ ...form, voucherQuantity: Number(e.target.value) })} 
                                        required 
                                    />
                              </div>
                           </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Início</label>
                          <input type="date" className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Término</label>
                          <input type="date" className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col min-h-0">
                    <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Selecionar Produtos Participantes</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Buscar produto por nome ou SKU..." className="w-full border-2 rounded-xl pl-9 pr-4 py-2 text-xs font-bold bg-slate-50 outline-none focus:border-indigo-500" value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
                    </div>
                    <div className="flex-1 border-2 rounded-2xl overflow-y-auto custom-scroll bg-slate-50 p-2 space-y-1 max-h-[300px]">
                        {filteredProds.map(p => (
                          <div key={p.id} onClick={() => toggleProduct(p.id)} className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${form.productIds?.includes(p.id) ? 'bg-indigo-600 text-white shadow-md' : 'bg-white hover:bg-indigo-50 text-slate-700'}`}>
                             <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-black uppercase truncate">{p.name}</span>
                                <span className={`text-[8px] font-mono ${form.productIds?.includes(p.id) ? 'text-indigo-200' : 'text-slate-400'}`}>SKU: {p.sku}</span>
                             </div>
                             {form.productIds?.includes(p.id) ? <CheckCircle2 size={14} /> : <Plus size={14} className="text-slate-300" />}
                          </div>
                        ))}
                        {filteredProds.length === 0 && <p className="text-center py-4 text-[10px] text-slate-400 font-bold uppercase italic">Nenhum produto encontrado...</p>}
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex justify-between items-center">
                       <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Selecionados</span>
                       <span className="text-xs font-black text-indigo-600">{form.productIds?.length || 0} Peças</span>
                    </div>
                  </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-4 shrink-0">
              <button type="button" onClick={() => setModal(false)} className="px-5 py-2 text-slate-400 font-black uppercase text-[10px]">DESCARTAR</button>
              <button type="submit" className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[10px] shadow-xl hover:bg-indigo-700 active:scale-95">SALVAR CAMPANHA</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CampaignsViewComponent;
