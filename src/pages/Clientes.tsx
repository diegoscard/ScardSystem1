import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Edit, X, RefreshCw, Layers, Check, Calendar, ArrowRightLeft, Upload } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { Customer, Sale } from '../types';
import { formatCurrency, maskCPFCNPJ, maskPhone, maskDate, parseCurrency } from '../utils/helpers';
import Papa from 'papaparse';

export default function Clientes() {
  const { customers, setCustomers, sales, settings } = useStore();
  const [modal, setModal] = useState(false);
  const [showBirthdays, setShowBirthdays] = useState(false);
  const [form, setForm] = useState<Partial<Customer>>({ name: '', document: '', email: '', phone: '', address: '', birthDate: '', cep: '', addressNumber: '' });
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isFiltering, setIsFiltering] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSearchingCEP, setIsSearchingCEP] = useState(false);

  const handleCEPLookup = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setIsSearchingCEP(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setForm((prev: any) => ({
            ...prev,
            address: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`
          }));
        } else {
          alert('CEP não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        alert('Erro ao buscar CEP. Verifique sua conexão.');
      } finally {
        setIsSearchingCEP(false);
      }
    }
  };

  const handleCopyDelivery = (c: Customer) => {
    const addressWithNumber = c.addressNumber ? `${c.address}, Nº ${c.addressNumber}` : c.address;
    const text = `👤 *CLIENTE:* ${c.name}\n📍 *ENDEREÇO:* ${addressWithNumber || 'Não informado'}`;
    navigator.clipboard.writeText(text);
    alert('Dados de entrega copiados!');
  };

  const isBirthdayToday = (birthDate: string) => {
    if (!birthDate) return false;
    const today = new Date();
    const [day, month] = birthDate.split('/');
    return parseInt(day) === today.getDate() && parseInt(month) === today.getMonth() + 1;
  };

  const getCustomerSpendingInPeriod = (customerId: number) => {
    if (!isFiltering) return null;
    
    return (sales || []).filter((s: Sale) => {
       if (s.customerId !== customerId) return false;
       const sDate = s.date.slice(0,10);
       const sMonth = s.date.slice(0,7);
       const sYear = s.date.slice(0,4);
       if (period === 'day') return sDate === selectedDay;
       if (period === 'month') return sMonth === selectedMonth;
       return sYear === selectedYear;
    }).reduce((acc: number, cur: Sale) => acc + (cur.total - (cur.change || 0)), 0);
  };

  const filtered = useMemo(() => {
    let result = (customers || []).filter((c: Customer) => {
       const hasMatch = c.name.toLowerCase().includes(search.toLowerCase()) || 
              (c.document && c.document.includes(search)) || 
              (c.phone && c.phone.includes(search));
              
       if (!hasMatch) return false;
       if (showBirthdays && !isBirthdayToday(c.birthDate)) return false;
       return true;
    });

    if (isFiltering) {
       result = result.filter((c: Customer) => {
           const spent = getCustomerSpendingInPeriod(c.id);
           return spent !== null && spent > 0;
       });
    }

    return result.sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, search, showBirthdays, isFiltering, period, selectedDay, selectedMonth, selectedYear, sales]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !form.id;
    const id = isNew ? Date.now() : form.id;
    
    if (isNew && customers.some(c => c.document === form.document && !!c.document)) {
      alert('CPF/CNPJ já cadastrado!');
      return;
    }
    
    const validBirthDate = form.birthDate ? maskDate(form.birthDate) : '';

    const customer: Customer = { 
      ...form, 
      id, 
      createdAt: form.createdAt || new Date().toISOString(), 
      totalSpent: form.totalSpent || 0,
      birthDate: validBirthDate,
      name: form.name?.toUpperCase() || ''
    } as Customer;

    if (isNew) {
       setCustomers((prev: Customer[]) => [...prev, customer]);
    } else {
       setCustomers((prev: Customer[]) => prev.map(x => x.id === id ? customer : x));
    }

    setModal(false);
    setForm({ name: '', document: '', email: '', phone: '', address: '', birthDate: '', cep: '', addressNumber: '' });
  };

  return (
    <div className="space-y-6 h-full flex flex-col min-h-0 animate-in fade-in">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">CRM / Clientes</h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gestão de relacionamento e fidelidade</p>
        </div>
        <button onClick={() => { setForm({ name: '', document: '', email: '', phone: '', address: '', birthDate: '', cep: '', addressNumber: '' }); setModal(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg active:scale-95 text-[10px] uppercase">
          <Plus size={16} /> Novo Cadastro
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0 space-y-4">
         <div className="flex flex-wrap gap-4 items-center">
            <div className="relative group flex-1 min-w-[200px]">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Buscar por nome, documento ou telefone..." 
                 className="w-full pl-11 pr-4 py-2 bg-slate-50 border-2 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all uppercase" 
                 value={search} 
                 onChange={(e) => setSearch(e.target.value)} 
               />
            </div>
            
            <button
               onClick={() => setShowBirthdays(!showBirthdays)}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${showBirthdays ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
            >
               Aniversariantes do Dia
            </button>
         </div>

         <div className="pt-4 border-t border-slate-100 flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" checked={isFiltering} onChange={(e) => setIsFiltering(e.target.checked)} className="peer hidden" />
               <div className="w-5 h-5 rounded border-2 border-slate-300 flex items-center justify-center peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all">
                 {isFiltering && <Check size={14} className="text-white" />}
               </div>
               <span className="text-[10px] font-black uppercase text-slate-500">Filtrar Compras por Período</span>
            </label>

            {isFiltering && (
              <div className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2 ml-4">
                 <select className="border-2 rounded-xl px-4 py-1.5 text-[10px] font-black uppercase bg-slate-50 outline-none" value={period} onChange={(e) => setPeriod(e.target.value as any)}>
                    <option value="day">Diário</option>
                    <option value="month">Mensal</option>
                    <option value="year">Anual</option>
                 </select>

                 {period === 'day' && <input type="date" className="border-2 rounded-xl px-4 py-1.5 text-xs font-bold bg-slate-50 outline-none" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} />}
                 {period === 'month' && <input type="month" className="border-2 rounded-xl px-4 py-1.5 text-xs font-bold bg-slate-50 outline-none" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />}
                 {period === 'year' && <input type="number" className="border-2 rounded-xl px-4 py-1.5 text-xs font-bold bg-slate-50 outline-none w-24 text-center" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} />}
              </div>
            )}
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1 custom-scroll">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-slate-50 sticky top-0 z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Identificação</th>
                <th className="px-6 py-4 text-right">{isFiltering ? 'Compras no Período' : 'Total Gasto'}</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => setSelectedCustomer(c === selectedCustomer ? null : c)}>
                  <td className="px-6 py-4">
                     <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm uppercase">{c.name || 'Sem Nome'}</span>
                        <span className="text-[9px] font-black text-slate-400">Desde: {new Date(c.createdAt).toLocaleDateString()}</span>
                     </div>
                     {isBirthdayToday(c.birthDate) && (
                        <span className="mt-1 inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[8px] font-black uppercase w-fit">
                           🎉 Aniversariante
                        </span>
                     )}
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-mono text-slate-600">{maskPhone(c.phone) || 'Sem Telefone'}</span>
                        {c.email && <span className="text-indigo-500 font-medium">{c.email}</span>}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-bold text-slate-600 text-xs">{maskCPFCNPJ(c.document) || 'Não Inf.'}</span>
                        {c.birthDate && <span className="text-[9px] font-black text-slate-400 uppercase">Nasc: {c.birthDate}</span>}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right space-y-1">
                     <span className="font-mono font-black text-slate-800 block">
                         R$ {formatCurrency(isFiltering ? getCustomerSpendingInPeriod(c.id) || 0 : c.totalSpent || 0)}
                     </span>
                     {c.lastPurchase && (
                        <span className="text-[9px] font-black text-slate-400 uppercase block">
                           Última Compra: {new Date(c.lastPurchase).toLocaleDateString()}
                        </span>
                     )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setForm(c); setModal(true); }} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Editar"><Edit size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleCopyDelivery(c); }} className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Copiar Endereço de Entrega"><Layers size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setCustomers(customers.filter(x => x.id !== c.id)); setSelectedCustomer(null); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">Nenhum cliente encomtrado...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[100] animate-in fade-in">
          <form onSubmit={save} className="bg-white p-8 rounded-[2.5rem] w-full max-w-2xl shadow-2xl space-y-6 max-h-[90vh] overflow-hidden flex flex-col relative z-20">
            <div className="flex justify-between items-center border-b pb-4 shrink-0">
               <h3 className="text-xl font-black text-slate-900 uppercase italic">
                  {form.id ? 'Ajustar' : 'Novo'} Cliente
               </h3>
               <button type="button" onClick={() => setModal(false)} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto custom-scroll pr-2">
               <div className="space-y-1 col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Nome / Razão Social</label>
                  <input className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase focus:border-indigo-500 outline-none" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">CPF / CNPJ</label>
                  <input className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:border-indigo-500 outline-none" value={maskCPFCNPJ(form.document || '')} onChange={e => setForm({ ...form, document: e.target.value.replace(/\D/g, '') })} />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Telefone (WhatsApp)</label>
                  <input className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:border-indigo-500 outline-none" value={maskPhone(form.phone || '')} onChange={e => setForm({ ...form, phone: e.target.value })} />
               </div>
               <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">E-mail</label>
                  <input type="email" className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Data de Nascimento</label>
                  <input placeholder="DD/MM/AAAA" className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:border-indigo-500 outline-none text-center" value={maskDate(form.birthDate || '')} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
               </div>

               <div className="col-span-2 pt-4 mt-2 border-t space-y-1 relative">
                  <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Buscar CEP</label>
                  <div className="flex gap-2">
                     <input className="flex-1 max-w-[200px] border-2 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:border-indigo-500 outline-none" placeholder="Apenas Números" value={form.cep || ''} onChange={e => {
                        const val = Array.isArray(e.target.value) ? '' : String(e.target.value);
                        const v = val.replace(/\D/g, '').substring(0, 8);
                        setForm({ ...form, cep: v });
                        if (v.length === 8) handleCEPLookup(v);
                     }} />
                     {isSearchingCEP && <RefreshCw size={24} className="text-indigo-400 animate-spin mt-1" />}
                  </div>
               </div>
               <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Endereço / Logradouro</label>
                  <input className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase focus:border-indigo-500 outline-none" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Número</label>
                  <input className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase focus:border-indigo-500 outline-none" value={form.addressNumber} onChange={e => setForm({ ...form, addressNumber: e.target.value })} />
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-4 shrink-0">
               <button type="button" onClick={() => setModal(false)} className="px-5 py-2 text-slate-400 font-black uppercase text-[10px]">DESCARTAR</button>
               <button type="submit" className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[10px] shadow-xl hover:bg-indigo-700 active:scale-95">SALVAR CLIENTE</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}