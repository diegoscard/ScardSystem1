import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { FiadoRecord, CashLog, CashSession } from '../types';
import { formatCurrency, parseCurrency } from '../utils/helpers';

export default function Pendentes() {
  const { user, fiados, setFiados, cashSession, setCashSession, cashHistory } = useStore();
  const [search, setSearch] = useState('');
  const [receivingModal, setReceivingModal] = useState<FiadoRecord | null>(null);
  const [receiveAmount, setReceiveAmount] = useState(0);
  const [receiveMethod, setReceiveMethod] = useState('Dinheiro');

  const pendingFiados = useMemo(() => {
    return fiados.filter((f: FiadoRecord) => f.status === 'pending' && 
      (f.clientName.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase())));
  }, [fiados, search]);

  const handleReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingModal || !user) return;

    if (receiveAmount <= 0 || receiveAmount > receivingModal.remainingAmount + 0.01) {
      alert('Valor inválido para recebimento.');
      return;
    }

    const newRemaining = Math.max(0, receivingModal.remainingAmount - receiveAmount);
    const isFullyPaid = newRemaining <= 0.01;

    const updatedFiados: FiadoRecord[] = fiados.map((f: FiadoRecord): FiadoRecord => {
       if (f.id === receivingModal.id) {
          return {
            ...f,
            remainingAmount: newRemaining,
            status: isFullyPaid ? 'paid' : 'pending'
          };
       }
       return f;
    });

    setFiados(updatedFiados);

    if (cashSession && (receiveMethod === 'Dinheiro' || receiveMethod === 'Pix')) {
       const newLog: CashLog = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'entrada',
          amount: receiveAmount,
          description: `Rec. Pendente: ${receivingModal.clientName} (${receiveMethod})`,
          time: new Date().toISOString(),
          user: user.name
       };

       setCashSession((prev: CashSession | null) => {
          if(!prev) return prev;
          return {
            ...prev,
            currentBalance: prev.currentBalance + (receiveMethod === 'Dinheiro' ? receiveAmount : 0),
            logs: [newLog, ...prev.logs]
          }
       });
    }

    alert(isFullyPaid ? 'Dívida quitada com sucesso!' : 'Pagamento parcial registrado!');
    setReceivingModal(null);
    setReceiveAmount(0);
  };

  return (
    <div className="space-y-6 h-full flex flex-col min-h-0 animate-in fade-in">
       <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Gestão de Pendentes (F12)</h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Controle de pagamentos pendentes de clientes</p>
       </div>

       <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4 shrink-0">
          <div className="relative group flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou descrição..." 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:border-indigo-500" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
       </div>

       <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 flex-1 flex flex-col min-h-0">
          <div className="overflow-auto flex-1 custom-scroll">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-slate-50 sticky top-0 z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Acordo / Descrição</th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4 text-right">Valor Inicial</th>
                  <th className="px-6 py-4 text-right">Pendente</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingFiados.map((f: FiadoRecord) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm uppercase">{f.clientName}</span>
                          <span className="text-[9px] font-black text-indigo-500">VENDA #{f.id.toString().slice(-4)}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-xs font-bold text-slate-500 italic max-w-xs">{f.description}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded text-[10px] font-black border ${new Date(f.dueDate) < new Date() ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                          {new Date(f.dueDate).toLocaleDateString()}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-400 text-sm">R$ {formatCurrency(f.totalAmount)}</td>
                    <td className="px-6 py-4 text-right">
                       <span className="font-black text-red-600 font-mono text-sm">R$ {formatCurrency(f.remainingAmount)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                        onClick={() => { setReceivingModal(f); setReceiveAmount(f.remainingAmount); }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase shadow-md hover:bg-green-700 active:scale-95 transition-all"
                       >
                          Dar Baixa
                       </button>
                    </td>
                  </tr>
                ))}
                {pendingFiados.length === 0 && (
                   <tr>
                     <td colSpan={6} className="py-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">Nenhum registro pendente encontrado...</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
       </div>

       {receivingModal && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[200] animate-in fade-in">
             <form onSubmit={handleReceive} className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                   <h3 className="text-xl font-black text-slate-900 uppercase italic">Baixa de Pagamento</h3>
                   <button type="button" onClick={() => setReceivingModal(null)} className="text-slate-300 hover:text-slate-500"><X size={24}/></button>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
                   <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Cliente</span>
                   <p className="text-lg font-black text-indigo-700 uppercase">{receivingModal.clientName}</p>
                   <div className="mt-2 flex justify-center gap-4">
                      <div>
                         <span className="text-[8px] font-black text-slate-400 uppercase block">Total Devido</span>
                         <span className="font-mono font-black text-red-600">R$ {formatCurrency(receivingModal.remainingAmount)}</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Valor do Pagamento</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">R$</span>
                         <input 
                           type="text" 
                           className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl text-2xl font-black text-indigo-700 outline-none focus:border-indigo-500"
                           value={formatCurrency(receiveAmount)}
                           onChange={(e) => setReceiveAmount(parseCurrency(e.target.value))}
                           onFocus={(e) => e.target.select()}
                         />
                      </div>
                   </div>

                   <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Meio de Recebimento</label>
                      <select 
                        className="w-full border-2 rounded-2xl px-4 py-3 text-sm font-black uppercase bg-slate-50 outline-none"
                        value={receiveMethod}
                        onChange={(e) => setReceiveMethod(e.target.value)}
                      >
                         <option>Dinheiro</option>
                         <option>Pix</option>
                         <option>Cartão</option>
                      </select>
                   </div>
                </div>

                <div className="flex gap-3 pt-4">
                   <button type="button" onClick={() => setReceivingModal(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
                   <button type="submit" className="flex-[2] py-4 bg-green-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl hover:bg-green-700">Confirmar Recebimento</button>
                </div>
             </form>
          </div>
       )}
    </div>
  );
}