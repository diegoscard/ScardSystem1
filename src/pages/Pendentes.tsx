import React, { useState, useMemo } from 'react';
import { Search, X, ClipboardList, Calendar, DollarSign, User as UserIcon, Clock, Receipt, CreditCard } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { FiadoRecord, CashLog, CashSession } from '../types';
import { formatCurrency, parseCurrency } from '../utils/helpers';

export default function Pendentes() {
  const { user, fiados, setFiados, cashSession, setCashSession, cashHistory, notify } = useStore();
  const [search, setSearch] = useState('');
  const [receivingModal, setReceivingModal] = useState<FiadoRecord | null>(null);
  const [selectedFiado, setSelectedFiado] = useState<FiadoRecord | null>(null);
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
      notify('Valor inválido para recebimento.', 'error');
      return;
    }

    const newRemaining = Math.max(0, receivingModal.remainingAmount - receiveAmount);
    const isFullyPaid = newRemaining <= 0.01;

    const newPaymentEntry = {
      date: new Date().toISOString(),
      amount: receiveAmount,
      method: receiveMethod,
      user: user.name
    };

    const updatedFiados: FiadoRecord[] = fiados.map((f: FiadoRecord): FiadoRecord => {
       if (f.id === receivingModal.id) {
          return {
            ...f,
            remainingAmount: newRemaining,
            status: isFullyPaid ? 'paid' : 'pending',
            paymentsHistory: [...(f.paymentsHistory || []), newPaymentEntry]
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

    notify(isFullyPaid ? 'Dívida quitada com sucesso!' : 'Pagamento parcial registrado!', 'success');
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
                  <tr key={f.id} onClick={() => setSelectedFiado(f)} className="hover:bg-slate-50 transition-all cursor-pointer group">
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm uppercase group-hover:text-indigo-600 transition-colors">{f.clientName}</span>
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
                        onClick={(e) => { e.stopPropagation(); setReceivingModal(f); setReceiveAmount(f.remainingAmount); }}
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

       {/* Detalhes do Fiado / Relatorio */}
       {selectedFiado && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[200] animate-in fade-in">
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedFiado(null)}/>
             <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-start shrink-0">
                   <div className="flex gap-4 items-center">
                      <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                         <ClipboardList size={32} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Relatório de Débito</h3>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes e histórico de pagamentos</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedFiado(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-500 transition-all">
                      <X size={24}/>
                   </button>
                </div>

                <div className="flex-1 overflow-auto p-8 custom-scroll space-y-8">
                   {/* Info Cabecalho */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <Calendar className="text-indigo-400 mb-2" size={16} />
                         <span className="text-[8px] font-black text-slate-400 uppercase block">Data Compra</span>
                         <span className="text-xs font-bold text-slate-700">{new Date(selectedFiado.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <Clock className="text-amber-400 mb-2" size={16} />
                         <span className="text-[8px] font-black text-slate-400 uppercase block">Vencimento</span>
                         <span className="text-xs font-bold text-slate-700">{new Date(selectedFiado.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <Receipt className="text-indigo-400 mb-2" size={16} />
                         <span className="text-[8px] font-black text-slate-400 uppercase block">ID Venda</span>
                         <span className="text-xs font-bold text-slate-700">#{selectedFiado.saleId || selectedFiado.id.toString().slice(-6)}</span>
                      </div>
                      <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-100">
                         <DollarSign className="text-white/60 mb-2" size={16} />
                         <span className="text-[8px] font-black text-white/60 uppercase block">Total Original</span>
                         <span className="text-xs font-black text-white italic transition-all">R$ {formatCurrency(selectedFiado.totalAmount)}</span>
                      </div>
                   </div>

                   {/* Resumo do Cliente */}
                   <div className="flex items-center gap-4 bg-slate-900 p-6 rounded-3xl">
                      <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black text-xl italic uppercase">
                         {selectedFiado.clientName.charAt(0)}
                      </div>
                      <div className="flex-1">
                         <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Responsável pelo Débito</p>
                         <h4 className="text-white font-black text-lg uppercase tracking-tight italic">{selectedFiado.clientName}</h4>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Devedor</p>
                         <h4 className="text-red-500 font-black text-2xl font-mono uppercase italic">R$ {formatCurrency(selectedFiado.remainingAmount)}</h4>
                      </div>
                   </div>

                   {/* Historico de Parcelas Pagas */}
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} className="text-indigo-500"/> Histórico de Pagamentos
                         </h5>
                         <span className="text-[9px] font-bold text-slate-400 italic">Total Pago: R$ {formatCurrency(selectedFiado.totalAmount - selectedFiado.remainingAmount)}</span>
                      </div>
                      
                      <div className="space-y-2">
                         {selectedFiado.paymentsHistory && selectedFiado.paymentsHistory.length > 0 ? (
                            selectedFiado.paymentsHistory.map((pay, idx) => (
                               <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all hover:shadow-sm">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <CreditCard size={18}/>
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{new Date(pay.date).toLocaleString()}</p>
                                        <p className="text-xs font-bold text-slate-700">Pagamento via <span className="font-black text-indigo-600 uppercase italic">{pay.method}</span></p>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-xs font-black text-emerald-600 font-mono italic">+ R$ {formatCurrency(pay.amount)}</p>
                                     <p className="text-[8px] font-black text-slate-300 uppercase italic">Resp: {pay.user}</p>
                                  </div>
                               </div>
                            ))
                         ) : (
                            <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
                               <p className="text-xs font-bold text-slate-300 italic uppercase tracking-widest">Nenhuma parcela paga até o momento.</p>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Itens da Venda */}
                   <div className="space-y-4">
                      <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                         <ClipboardList size={14} className="text-indigo-500"/> Itens Comprados
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {selectedFiado.items.map((item, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                               <div>
                                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[150px]">{item.name}</p>
                                  <p className="text-[8px] font-bold text-slate-400">{item.quantity}x R$ {formatCurrency(item.price)}</p>
                               </div>
                               <span className="text-xs font-black text-slate-600 font-mono">R$ {formatCurrency(item.quantity * item.price)}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                   <button 
                    onClick={() => { setReceivingModal(selectedFiado); setReceiveAmount(selectedFiado.remainingAmount); setSelectedFiado(null); }}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                   >
                      <DollarSign size={18} className="text-green-500"/> Lançar Pagamento Agora
                   </button>
                </div>
             </div>
          </div>
       )}

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