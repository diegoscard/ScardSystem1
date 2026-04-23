import React, { useRef } from 'react';
import { 
  ShoppingCart, Search, Users, HandCoins, TrendingUp, Package,
  Megaphone, LayoutDashboard, Settings, Download, Upload, Wallet, LogOut
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  hasPermission: (viewId: string) => boolean;
  isAdmin: boolean;
  isMasterUser: boolean;
  handleExportBackup: () => void;
  handleImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCloseCashAction: () => void;
}

const NavBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-4 w-full px-5 py-4 rounded-2xl transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
  >
    {icon}
    <span className="font-black uppercase text-[10px] tracking-widest">{label}</span>
  </button>
);

export default function Sidebar({
  currentView, setCurrentView, hasPermission, isAdmin, isMasterUser,
  handleExportBackup, handleImportBackup, handleCloseCashAction
}: SidebarProps) {
  const { user, setUser, deviceHwid, cashSession } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!user) return null;

  const isCashOpen = cashSession && cashSession.isOpen;

  const handleLogout = () => {
    setUser(null);
    fetch('/api/auth/session', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ hwid: deviceHwid, user: null }) 
    });
  };

  return (
    <aside className="w-64 bg-slate-950 text-white flex flex-col shrink-0 border-r border-slate-800 shadow-2xl relative z-20">
      <div className="p-8">
        <h2 className="text-2xl font-black tracking-tighter uppercase italic">SCARD<span className="text-indigo-500 font-normal">SYS</span></h2>
        <div className="flex items-center gap-3 mt-6 bg-slate-900 p-3 rounded-2xl border border-slate-800/50 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-xs shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">
                {user.role === 'admin' ? 'Administrador' : 'Vendedor'}
              </span>
              <p className="text-xs font-black text-slate-100 uppercase tracking-tight truncate mt-1">{user.name}</p>
            </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scroll">
        <NavBtn active={currentView === 'sales'} onClick={() => setCurrentView('sales')} icon={<ShoppingCart size={18}/>} label="Caixa PDV" />
        <NavBtn active={currentView === 'product_search'} onClick={() => setCurrentView('product_search')} icon={<Search size={18}/>} label="Consultar" />
        <NavBtn active={currentView === 'customers'} onClick={() => setCurrentView('customers')} icon={<Users size={18}/>} label="Clientes" />
        {hasPermission('fiado') && <NavBtn active={currentView === 'fiado'} onClick={() => setCurrentView('fiado')} icon={<HandCoins size={18}/>} label="Pendentes (F12)" />}
        <NavBtn active={currentView === 'reports'} onClick={() => setCurrentView('reports')} icon={<TrendingUp size={18}/>} label="Relatórios" />
        {hasPermission('stock') && <NavBtn active={currentView === 'stock'} onClick={() => setCurrentView('stock')} icon={<Package size={18}/>} label="Estoque" />}
        
        {(isAdmin || hasPermission('dashboard') || hasPermission('campaigns')) && (
          <div className="pt-6 mt-6 border-t border-slate-900 space-y-1">
              <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Admin</p>
              {hasPermission('campaigns') && <NavBtn active={currentView === 'campaigns'} onClick={() => setCurrentView('campaigns')} icon={<Megaphone size={18}/>} label="Campanhas" />}
              {hasPermission('dashboard') && <NavBtn active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard size={18}/>} label="Dashboard" />}
              {isAdmin && <NavBtn active={currentView === 'team'} onClick={() => setCurrentView('team')} icon={<Users size={18}/>} label="Equipe" />}
              {isAdmin && <NavBtn active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={<Settings size={18}/>} label="Ajustes" />}
          </div>
        )}
      </nav>

      <div className="p-4 mt-auto space-y-2 border-t border-slate-800/50">
        <button type="button" title="Gerar backup protegido dos dados" onClick={handleExportBackup} className="flex items-center space-x-3 text-emerald-400 hover:text-emerald-300 transition-all w-full px-4 py-2.5 rounded-xl hover:bg-emerald-400/5 group">
          <Download size={16} />
          <span className="font-black uppercase text-[9px] tracking-widest">Salvar Backup</span>
        </button>
        {isMasterUser && (
          <button type="button" title="Restaurar dados de um arquivo de backup" onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-3 text-sky-400 hover:text-sky-300 transition-all w-full px-4 py-2.5 rounded-xl hover:bg-sky-400/5 group">
            <Upload size={16} />
            <span className="font-black uppercase text-[9px] tracking-widest">Restaurar Backup</span>
            <input ref={fileInputRef} type="file" accept=".json,.scard" className="hidden" onChange={e => {
              if (handleImportBackup) handleImportBackup(e);
            }} />
          </button>
        )}
        {isCashOpen && (
          <button type="button" onClick={handleCloseCashAction} className="flex items-center space-x-3 text-amber-500 hover:text-amber-400 transition-all w-full px-4 py-3 rounded-xl hover:bg-amber-500/5 group">
            <Wallet size={18} />
            <span className="font-black uppercase text-[9px] tracking-widest">Fechar Caixa</span>
          </button>
        )}
        <button type="button" onClick={handleLogout} className="flex items-center space-x-3 text-slate-500 hover:text-red-400 transition-all w-full px-4 py-3 rounded-xl hover:bg-red-500/5 group">
          <LogOut size={18} />
          <span className="font-black uppercase text-[9px] tracking-widest">Sair</span>
        </button>
      </div>
    </aside>
  );
}
