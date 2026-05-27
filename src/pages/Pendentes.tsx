import React, { useState, useMemo } from 'react';
import { 
  Search, X, ClipboardList, Calendar, DollarSign, User as UserIcon, 
  Clock, Receipt, CreditCard, AlertTriangle, CheckCircle2, TrendingUp,
  Share2, Send, Copy, Sparkles, Trash2
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { FiadoRecord, CashLog, CashSession } from '../types';
import { formatCurrency, parseCurrency } from '../utils/helpers';

export default function Pendentes() {
  const { user, fiados, setFiados, cashSession, setCashSession, notify, settings, confirm, customers } = useStore();
  const [search, setSearch] = useState('');

  const calculateLateCharges = (f: FiadoRecord) => {
    if (f.status !== 'pending' || !f.dueDate) return 0;
    const now = new Date();
    const dueDate = new Date(f.dueDate);
    if (now <= dueDate) return 0;

    const diffTime = Math.abs(now.getTime() - dueDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const lateFee = (settings.crediarioLateFee || 0);
    const dailyInterest = (f.remainingAmount * (settings.crediarioLateInterestPerDay || 0) / 100) * diffDays;

    return lateFee + dailyInterest;
  };

  const getAdjustedBalance = (f: FiadoRecord) => {
    return f.remainingAmount + calculateLateCharges(f);
  };
  const [receivingModal, setReceivingModal] = useState<FiadoRecord | null>(null);
  const [selectedFiado, setSelectedFiado] = useState<FiadoRecord | null>(null);
  const [receiveAmount, setReceiveAmount] = useState(0);
  const [receiveMethod, setReceiveMethod] = useState('Dinheiro');
  const [filterTab, setFilterTab] = useState<'all_pending' | 'overdue' | 'paid'>('all_pending');

  // Multi-dimensional statistics calculation for the Crediário panel
  const statsCrediario = useMemo(() => {
    const active = fiados.filter((f: FiadoRecord) => f.status === 'pending');
    const totalPending = active.reduce((acc, f) => acc + getAdjustedBalance(f), 0);
    const uniqueClients = new Set(active.map(f => f.clientName.trim().toUpperCase())).size;
    
    const now = new Date();
    const overdue = active.filter(f => f.dueDate && new Date(f.dueDate) < now);
    const overdueTotal = overdue.reduce((acc, f) => acc + getAdjustedBalance(f), 0);

    let totalPaymentsReceived = 0;
    fiados.forEach((f: FiadoRecord) => {
      if (f.paymentsHistory) {
        f.paymentsHistory.forEach(p => {
          totalPaymentsReceived += p.amount;
        });
      }
    });

    return { 
      totalPending, 
      uniqueClients, 
      overdueCount: overdue.length, 
      overdueTotal, 
      totalPaymentsReceived 
    };
  }, [fiados]);

  // Filtering based on tab state and search query
  const filteredFiados = useMemo(() => {
    const now = new Date();
    return fiados.filter((f: FiadoRecord) => {
      const matchesSearch = f.clientName.toLowerCase().includes(search.toLowerCase()) || 
        f.description.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filterTab === 'all_pending') {
        return f.status === 'pending';
      } else if (filterTab === 'overdue') {
        return f.status === 'pending' && f.dueDate && new Date(f.dueDate) < now;
      } else if (filterTab === 'paid') {
        return f.status === 'paid';
      }
      return true;
    });
  }, [fiados, filterTab, search]);

  const handleReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingModal || !user) return;

    const maxAllowed = getAdjustedBalance(receivingModal);
    if (receiveAmount <= 0 || receiveAmount > maxAllowed + 0.01) {
      notify('Valor inválido para recebimento.', 'error');
      return;
    }

    const lateCharges = calculateLateCharges(receivingModal);
    const newRemaining = Math.max(0, (receivingModal.remainingAmount + lateCharges) - receiveAmount);
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
            totalAmount: f.totalAmount + lateCharges,
            remainingAmount: newRemaining,
            status: isFullyPaid ? 'paid' : 'pending',
            paymentsHistory: [...(f.paymentsHistory || []), newPaymentEntry],
            dueDate: isFullyPaid ? f.dueDate : new Date().toISOString() // Reset due date if partially paid? Or keep it?
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
          description: `Rec. Crediário: ${receivingModal.clientName} (${receiveMethod})`,
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

    notify(isFullyPaid ? 'Crediário quitado com sucesso!' : 'Pagamento parcial registrado no crediário!', 'success');
    
    // Maintain updated reference if currently previewed
    if (selectedFiado && selectedFiado.id === receivingModal.id) {
      setSelectedFiado({
        ...receivingModal,
        remainingAmount: newRemaining,
        status: isFullyPaid ? 'paid' : 'pending',
        paymentsHistory: [...(receivingModal.paymentsHistory || []), newPaymentEntry]
      });
    }

    setReceivingModal(null);
    setReceiveAmount(0);
  };

  const handleCopyStatement = (f: FiadoRecord) => {
    const isOverdue = new Date(f.dueDate) < new Date();
    const dueDateStr = new Date(f.dueDate).toLocaleDateString('pt-BR');
    
    let paymentsText = '';
    if (f.paymentsHistory && f.paymentsHistory.length > 0) {
      paymentsText = '\n*HISTÓRICO DE PARCELAS PAGAS:*\n' + f.paymentsHistory.map(p => {
        return `* ${new Date(p.date).toLocaleDateString('pt-BR')} ${new Date(p.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}: R$ ${formatCurrency(p.amount)} via ${p.method}`;
      }).join('\n');
    } else {
      paymentsText = '\nNenhum pagamento parcial registrado.';
    }

    const itemsText = f.items ? f.items.map(it => `* ${it.quantity}x ${it.name}`).join('\n') : '';

    const instCount = f.installments || 1;
    const instVal = f.installmentValue || (f.totalAmount / instCount);
    
    const installmentDates = [];
    const baseDate = new Date(f.dueDate);
    for (let i = 0; i < instCount; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setMonth(baseDate.getMonth() + i);
      installmentDates.push(`* Parcela ${i + 1}/${instCount}: ${nextDate.toLocaleDateString('pt-BR')} (R$ ${formatCurrency(instVal)})`);
    }

    const customer = (customers || []).find((c: any) => c.name.trim().toUpperCase() === f.clientName.trim().toUpperCase());
    const limit = customer?.creditLimit || 0;
    const used = (fiados || [])
      .filter((rec: FiadoRecord) => rec.clientName.trim().toUpperCase() === f.clientName.trim().toUpperCase() && rec.status === 'pending')
      .reduce((acc, rec) => acc + rec.remainingAmount, 0);
    const available = Math.max(0, limit - used);

    const statement = `*EXTRATO DE CREDIÁRIO - SCARDSYS*\n\n` + 
      `*Cliente:* ${f.clientName}\n` +
      `*Limite disponível:* R$ ${formatCurrency(available)}\n` +
      `*Limite utilizado:* R$ ${formatCurrency(used)}\n` +
      `*Cód. Compra:* #${f.saleId || f.id.toString().slice(-6)}\n` +
      `*Data da Compra:* ${new Date(f.createdAt).toLocaleDateString('pt-BR')}\n` +
      `*Data de Vencimento:* ${dueDateStr}${isOverdue ? ' ⚠️ (CONTA EM ATRASO)' : ''}\n` +
      `*Compra parcelada em:* ${instCount}x\n\n` +
      `*VENCIMENTOS DAS PARCELAS:*\n${installmentDates.join('\n')}\n\n` +
      `*PRODUTOS ADQUIRIDOS:*\n${itemsText}\n\n` +
      `*VALOR TOTAL COMPRA:* R$ ${formatCurrency(f.totalAmount)}\n` +
      `*PAGO ATÉ O MOMENTO:* R$ ${formatCurrency(f.totalAmount - f.remainingAmount)}\n` +
      `*SALDO RESTANTE FINAL:* R$ ${formatCurrency(f.remainingAmount)}\n` +
      paymentsText + 
      `\n\n_Para qualquer esclarecimento, por favor entre em contato._`;
    
    navigator.clipboard.writeText(statement);
    notify('Extrato detalhado do crediário copiado para a área de transferência!', 'success');
  };

  const handleSendWhatsAppNotification = (f: FiadoRecord) => {
    const dueDateStr = new Date(f.dueDate).toLocaleDateString('pt-BR');
    const message = `Olá, ${f.clientName}! Passando para registrar o extrato da sua fatura no Crediário. Seu saldo devedor atualizado é de *R$ ${formatCurrency(f.remainingAmount)}* com vencimento limite em *${dueDateStr}*. Qualquer observação e comprovantes de transferência Pix podem ser enviados por aqui. Obrigado!`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    notify('Abrindo WhatsApp para enviar notificação de cobrança...', 'success');
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Excluir Lançamento',
      message: 'Tem certeza que deseja excluir este registro de crediário? Esta ação é irreversível.',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar'
    });

    if (ok) {
      setFiados((prev: FiadoRecord[]) => prev.filter(f => f.id !== id));
      notify('Registro de crediário excluído com sucesso!', 'success');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col min-h-0 animate-in fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
           <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-2">
                 Controle de Crediário
              </h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contas e extratos de pagamentos parcelados e pendentes de clientes</p>
           </div>
        </div>

        {/* Dynamic Statistics Panel mirroring a true Store Credit Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
               <AlertTriangle size={20} />
            </div>
            <div>
               <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider leading-none mb-1">Atrasos Atuais</span>
               <p className="text-lg font-black text-red-600 font-mono tracking-tight">{statsCrediario.overdueCount} {statsCrediario.overdueCount === 1 ? 'fatura' : 'faturas'}</p>
               <span className="text-[8px] font-black text-slate-500 font-mono">R$ {formatCurrency(statsCrediario.overdueTotal)} total</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
               <DollarSign size={20} />
            </div>
            <div>
               <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider leading-none mb-1">Total a Receber</span>
               <p className="text-lg font-black text-indigo-700 font-mono tracking-tight">R$ {formatCurrency(statsCrediario.totalPending)}</p>
               <span className="text-[8px] font-black text-slate-500 font-mono">{statsCrediario.uniqueClients} clientes devedores</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
               <CheckCircle2 size={20} />
            </div>
            <div>
               <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider leading-none mb-1">Total Amortizado</span>
               <p className="text-lg font-black text-emerald-600 font-mono tracking-tight">R$ {formatCurrency(statsCrediario.totalPaymentsReceived)}</p>
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Amortizações de fiados</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
               <TrendingUp size={20} />
            </div>
            <div>
               <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider leading-none mb-1">Recibo Único</span>
               <p className="text-lg font-black text-amber-600 font-mono tracking-tight">WhatsApp / Extrato</p>
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Enviável a qualquer cliente</span>
            </div>
          </div>
        </div>

        {/* Filter bars and Tabs for Crediário categorization */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 shrink-0 items-center justify-between">
           <div className="relative group w-full md:max-w-xs">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar cliente, observação ou código..." 
               className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border rounded-2xl text-xs font-bold outline-none focus:border-indigo-500" 
               value={search} 
               onChange={(e) => setSearch(e.target.value)} 
             />
           </div>

           <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
             <button 
               onClick={() => setFilterTab('all_pending')}
               className={`flex-1 md:flex-initial px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filterTab === 'all_pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
             >
                Em Aberto ({fiados.filter(f => f.status === 'pending').length})
             </button>
             <button 
               onClick={() => setFilterTab('overdue')}
               className={`flex-1 md:flex-initial px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${filterTab === 'overdue' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
             >
                <AlertTriangle size={12} className={filterTab === 'overdue' ? 'text-white' : 'text-red-500'} />
                Vencidos ({fiados.filter(f => f.status === 'pending' && f.dueDate && new Date(f.dueDate) < new Date()).length})
             </button>
             <button 
               onClick={() => setFilterTab('paid')}
               className={`flex-1 md:flex-initial px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filterTab === 'paid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
             >
                Quitados ({fiados.filter(f => f.status === 'paid').length})
             </button>
           </div>
        </div>

        {/* Core Table listing filtered Crediário records */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200 flex-1 flex flex-col min-h-0">
           <div className="overflow-auto flex-1 custom-scroll">
             <table className="w-full text-left border-separate border-spacing-0">
               <thead className="bg-slate-50 sticky top-0 z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                 <tr>
                   <th className="px-6 py-4">Cliente</th>
                   <th className="px-6 py-4">Acordo / Origem</th>
                   <th className="px-6 py-4">Status &amp; Vencimento</th>
                   <th className="px-6 py-4 text-right">Faturamento Original</th>
                   <th className="px-6 py-4 text-right">Saldo Devedor</th>
                   <th className="px-6 py-4 text-center">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {filteredFiados.map((f: FiadoRecord) => {
                   const isOverdue = f.status === 'pending' && f.dueDate && new Date(f.dueDate) < new Date();
                   return (
                     <tr key={f.id} onClick={() => setSelectedFiado(f)} className="hover:bg-slate-50/70 transition-all cursor-pointer group">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs uppercase italic ${f.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : isOverdue ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
                                {f.clientName.charAt(0)}
                             </div>
                             <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-sm uppercase group-hover:text-indigo-600 transition-colors">{f.clientName}</span>
                                <span className="text-[9px] font-black text-slate-400">ID COMPRA #{f.saleId || f.id.toString().slice(-6)}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-500 italic max-w-xs truncate">{f.description || 'Sem descrição registado'}</p>
                       </td>
                       <td className="px-6 py-4">
                          {f.status === 'paid' ? (
                            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black border bg-emerald-50 text-emerald-700 border-emerald-100 uppercase">
                               Quitado
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                               <span className={`px-2 py-0.5 rounded text-[10px] font-black border w-max ${isOverdue ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                                  Limite: {new Date(f.dueDate).toLocaleDateString()}
                               </span>
                               {isOverdue && <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">* Em Atraso</span>}
                            </div>
                          )}
                       </td>
                       <td className="px-6 py-4 text-right font-mono font-bold text-slate-400 text-sm">R$ {formatCurrency(f.totalAmount)}</td>
                       <td className="px-6 py-4 text-right">
                          <span className={`font-black font-mono text-sm ${f.status === 'paid' ? 'text-emerald-600' : 'text-red-600'}`}>
                             R$ {formatCurrency(getAdjustedBalance(f))}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                             {f.status === 'pending' && (
                               <button 
                                 onClick={() => { setReceivingModal(f); setReceiveAmount(getAdjustedBalance(f)); }}
                                 className="bg-green-600 text-white px-3.5 py-1.5 rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-green-700 active:scale-95 transition-all flex items-center gap-1"
                               >
                                  <DollarSign size={13}/> Quitar
                               </button>
                             )}
                             <button
                               onClick={() => handleCopyStatement(f)}
                               className="p-2 bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 rounded-xl transition-all"
                               title="Copiar Extrato"
                             >
                                <Copy size={14}/>
                             </button>
                             {f.status === 'pending' && (
                               <button
                                 onClick={() => handleSendWhatsAppNotification(f)}
                                 className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                                 title="Cobrança WhatsApp"
                               >
                                  <Send size={14}/>
                               </button>
                             )}
                             <button
                               onClick={() => handleDelete(f.id)}
                               className="p-2 bg-red-50 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                               title="Excluir Registro"
                             >
                                <Trash2 size={14}/>
                             </button>
                          </div>
                       </td>
                     </tr>
                   );
                 })}
                 {filteredFiados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">Nenhum registro de crediário localizado para esses filtros...</td>
                    </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Detailed client statement visualised dynamically */}
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
                         <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Demonstrativo de Crediário</h3>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Extrato de pagamentos e amortizações do cliente</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedFiado(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-500 transition-all">
                      <X size={24}/>
                   </button>
                </div>

                <div className="flex-1 overflow-auto p-8 custom-scroll space-y-8">
                   {/* Info Header columns */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <Calendar className="text-indigo-400 mb-2" size={16} />
                         <span className="text-[8px] font-black text-slate-400 uppercase block">Início Crediário</span>
                         <span className="text-xs font-bold text-slate-700">{new Date(selectedFiado.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <Clock className="text-amber-400 mb-2" size={16} />
                         <span className="text-[8px] font-black text-slate-400 uppercase block">Vencimento Final</span>
                         <span className="text-xs font-bold text-slate-700">{new Date(selectedFiado.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <Receipt className="text-indigo-400 mb-2" size={16} />
                         <span className="text-[8px] font-black text-slate-400 uppercase block font-mono">Cód. Transação</span>
                         <span className="text-xs font-bold text-slate-700 font-mono">#{selectedFiado.saleId || selectedFiado.id.toString().slice(-6)}</span>
                      </div>
                      <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg">
                         <DollarSign className="text-white/60 mb-2" size={16} />
                         <span className="text-[8px] font-black text-white/60 uppercase block">Fatura Original</span>
                         <span className="text-xs font-black text-white italic">R$ {formatCurrency(selectedFiado.totalAmount)}</span>
                      </div>
                   </div>

                   {/* Debtor client details summary banner */}
                   <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-900 p-6 rounded-3xl relative overflow-hidden">
                      <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
                         <Sparkles className="text-white" size={120} />
                      </div>
                      
                      <div className="flex items-center gap-4 relative z-10">
                         <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black text-xl italic uppercase shrink-0">
                            {selectedFiado.clientName.charAt(0)}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Responsável de Venda</p>
                            <h4 className="text-white font-black text-lg uppercase tracking-tight italic truncate">{selectedFiado.clientName}</h4>
                            <p className="text-[9px] text-zinc-500 font-bold italic">Registro indexado pelo vendedor: {selectedFiado.vendedor || 'Padrão'}</p>
                         </div>
                      </div>
                      <div className="text-right md:ml-auto relative z-10 shrink-0">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Devedor Atual</p>
                         <h4 className={`font-black text-2xl font-mono uppercase italic ${selectedFiado.status === 'paid' ? 'text-emerald-400' : 'text-red-500'}`}>
                            R$ {formatCurrency(getAdjustedBalance(selectedFiado))}
                         </h4>
                      </div>
                   </div>

                   {/* Payment and amortization history timelines */}
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} className="text-indigo-500"/> Histórico de Parcelas &amp; Amortizações
                         </h5>
                         <span className="text-[9px] font-bold text-slate-400 italic">Total Amortizado: R$ {formatCurrency(selectedFiado.totalAmount - selectedFiado.remainingAmount)}</span>
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
                                        <p className="text-xs font-bold text-slate-700">Amortização via <span className="font-black text-indigo-600 uppercase italic">{pay.method}</span></p>
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
                               <p className="text-xs font-bold text-slate-300 italic uppercase tracking-widest">Nenhuma parcela paga para esse registro até o momento.</p>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Purchased items catalog */}
                   <div className="space-y-4">
                      <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                         <ClipboardList size={14} className="text-indigo-500"/> Itens Comprados no Crediário
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {selectedFiado.items && selectedFiado.items.map((item, idx) => (
                            <div key={idx} className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-center">
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

                <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0 flex flex-col md:flex-row gap-3">
                   <button 
                    onClick={() => handleCopyStatement(selectedFiado)}
                    className="flex-1 bg-white text-slate-750 border border-slate-200 py-4 rounded-xl font-black uppercase tracking-wider shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs"
                   >
                      <Copy size={16} className="text-slate-500"/> Copiar Extrato
                   </button>
                   
                   {selectedFiado.status === 'pending' && (
                     <button 
                      onClick={() => handleSendWhatsAppNotification(selectedFiado)}
                      className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-wider shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs"
                     >
                        <Send size={16} className="text-white"/> Notificar WhatsApp
                     </button>
                   )}

                   {selectedFiado.status === 'pending' && (
                     <button 
                      onClick={() => { setReceivingModal(selectedFiado); setReceiveAmount(selectedFiado.remainingAmount); setSelectedFiado(null); }}
                      className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-wider shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs"
                     >
                        <DollarSign size={16} className="text-green-500"/> Dar Baixa
                     </button>
                   )}
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
                         <span className="text-[8px] font-black text-slate-400 uppercase block">Saldo Devedor total</span>
                         <span className="font-mono font-black text-red-600">R$ {formatCurrency(getAdjustedBalance(receivingModal))}</span>
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
                           className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl text-2xl font-black text-indigo-700 outline-none focus:border-indigo-500 animate-pulse"
                           value={formatCurrency(receiveAmount)}
                           onChange={(e) => setReceiveAmount(parseCurrency(e.target.value))}
                           onFocus={(e) => e.target.select()}
                         />
                      </div>
                   </div>

                   <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Meio de Recebimento</label>
                      <select 
                        className="w-full border-2 rounded-2xl px-4 py-3 text-sm font-black uppercase bg-slate-50 outline-none cursor-pointer"
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
