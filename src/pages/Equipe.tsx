import React, { useState } from 'react';
import { UserIcon, Edit, Trash2, Key, HelpCircle, ShieldAlert, BadgeInfo, Eye, Lock } from 'lucide-react';
import { User, UserRole } from '../types';
import { useStore } from '../contexts/StoreContext';

const TeamViewComponent = () => {
  const { user: currentUser, dbUsers: users, setDbUsers: setUsers } = useStore();
  const [editModal, setEditModal] = useState<User | null>(null);
  const [showPass, setShowPass] = useState(false);
  
  const [changingPass, setChangingPass] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');

  const isMaster = currentUser.id === 0 || currentUser.email === 'master@internal';

  const handleToggleShowPass = () => {
    if (showPass) {
      setShowPass(false);
      return;
    }
    if (isMaster) {
      setShowPass(true);
    } else {
      alert("Apenas o usuário MASTER tem permissão para visualizar senhas cadastradas diretamente.");
    }
  };

  const handleDeleteUser = (id: number) => { 
    if (id === currentUser.id) return alert('Você não pode excluir seu próprio usuário!'); 
    if (window.confirm('Excluir este colaborador?')) setUsers(users.filter((u: User) => u.id !== id)); 
  };

  const handleUpdateProfile = (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!editModal) return; 

    let updatedUser = { ...editModal };

    if (!isMaster && changingPass) {
      if (currentPassInput !== currentUser.password) {
        alert("Sua senha atual está incorreta. Autorização negada para alteração.");
        return;
      }
      if (!newPassInput.trim()) {
        alert("Informe a nova senha desejada.");
        return;
      }
      updatedUser.password = newPassInput;
    }

    setUsers(users.map((u: User) => u.id === updatedUser.id ? updatedUser : u)); 
    setEditModal(null); 
    setShowPass(false);
    setChangingPass(false);
    setCurrentPassInput('');
    setNewPassInput('');
    alert('Perfil updated com sucesso!'); 
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Gestão de Equipe</h2>
        <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.2em]">Controle de acessos</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u: User) => (
          <div key={u.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl mx-auto mb-4 flex items-center justify-center border">
              <UserIcon size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase mb-1">{u.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 mb-4">{u.email}</p>
            <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase border ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              {u.role}
            </span>
            <div className="border-t border-slate-100 mt-6 pt-4 flex justify-center gap-3">
              <button onClick={() => { setEditModal(u); setShowPass(false); setChangingPass(false); }} className="text-[9px] font-black uppercase text-indigo-600">Editar</button>
              {u.id !== currentUser.id && (
                <button onClick={() => handleDeleteUser(u.id)} className="text-[9px] font-black uppercase text-red-400">Excluir</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {editModal && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[100] animate-in fade-in">
          <form onSubmit={handleUpdateProfile} className="bg-white p-10 rounded-[2rem] w-full max-w-sm shadow-2xl space-y-5 relative">
            <h3 className="text-2xl font-black text-slate-900 uppercase italic">Editar Usuário</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Nome</label>
                <input className="w-full border-2 rounded-xl px-4 py-3 text-sm font-bold bg-slate-50/50" value={editModal.name} onChange={e => setEditModal({...editModal, name: e.target.value})} required placeholder="Nome" />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">E-mail</label>
                <input type="email" className="w-full border-2 rounded-xl px-4 py-3 text-sm font-bold bg-slate-50/50" value={editModal.email} onChange={e => setEditModal({...editModal, email: e.target.value})} required placeholder="E-mail" />
              </div>

              {isMaster ? (
                <div className="space-y-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Senha (Visível para Master)</label>
                   <div className="relative">
                      <input 
                        type={showPass ? "text" : "password"} 
                        className="w-full border-2 rounded-xl px-4 py-3 text-sm pr-12 font-bold bg-slate-50" 
                        value={editModal.password || ''} 
                        onChange={e => editModal.id === 0 ? null : setEditModal({...editModal, password: e.target.value})} 
                        placeholder="Senha" 
                        disabled={editModal.id === 0}
                      />
                      <button 
                        type="button" 
                        onClick={handleToggleShowPass}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                        {showPass ? <Eye size={18} /> : <Lock size={18} />}
                      </button>
                   </div>
                </div>
              ) : currentUser.id === editModal.id && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={changingPass} onChange={e => setChangingPass(e.target.checked)} className="w-4 h-4 rounded text-indigo-600" />
                    <span className="text-[10px] font-black uppercase text-slate-500">Alterar minha senha</span>
                  </label>
                  {changingPass && (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                       <input type="password" placeholder="Senha Atual" className="w-full border-2 rounded-xl px-4 py-2 text-xs font-bold" value={currentPassInput} onChange={e => setCurrentPassInput(e.target.value)} />
                       <input type="password" placeholder="Nova Senha" className="w-full border-2 rounded-xl px-4 py-2 text-xs font-bold" value={newPassInput} onChange={e => setNewPassInput(e.target.value)} />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Nível de Acesso</label>
                 <select 
                   disabled={editModal.id === 0 || (currentUser.role !== 'admin' && !isMaster)} 
                   className="w-full border-2 rounded-xl px-4 py-3 text-sm font-bold bg-slate-50/50 appearance-none disabled:opacity-50"
                   value={editModal.role}
                   onChange={e => setEditModal({...editModal, role: e.target.value as UserRole})}
                 >
                    <option value="atendente">Vendedor (Atendente)</option>
                    <option value="admin">Administrador</option>
                 </select>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button type="button" onClick={() => setEditModal(null)} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
              <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg shadow-indigo-100">Atualizar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeamViewComponent;
