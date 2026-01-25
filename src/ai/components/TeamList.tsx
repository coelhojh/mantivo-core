import React, { useState, useEffect } from 'react';
import { User, PLAN_LIMITS, Condo } from '../types';
import { getTeamMembers, inviteTeamMember, getUser, checkPlanLimits, getCondos, updateUserAccess } from '../services/storageService';
import { Users, Plus, Mail, Shield, User as UserIcon, Loader2, AlertCircle, Settings, CheckSquare, Square, Building, Lock, Crown, X, Info, ShieldCheck, Check } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

const TeamList: React.FC = () => {
  const [members, setMembers] = useState<User[]>([]);
  const [condos, setCondos] = useState<Condo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permEdit, setPermEdit] = useState(false);
  const [permDelete, setPermDelete] = useState(false);
  const [selectedCondos, setSelectedCondos] = useState<string[]>([]);
  const [savingAccess, setSavingAccess] = useState(false);

  const currentUser = getUser();
  const currentPlan = currentUser?.plan || 'free';
  const limit = PLAN_LIMITS[currentPlan]?.users || PLAN_LIMITS.free.users;

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    setLoading(true);
    const m = await getTeamMembers();
    const c = await getCondos();
    setMembers(m);
    setCondos(c);
    setLoading(false);
  };

  const handleOpenInvite = async () => {
    const allowed = await checkPlanLimits('team');
    if (!allowed) { setShowUpgradeModal(true); return; }
    setEmail(''); setName(''); setMessage(''); setShowInviteModal(true);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    try {
        const res = await inviteTeamMember(email, name);
        setMessage(res.message);
        setTimeout(() => { setShowInviteModal(false); setMessage(''); refreshData(); }, 3000);
    } catch (e) { setMessage("Erro ao enviar convite."); }
  };

  const handleOpenAccess = (user: User) => {
    setSelectedUser(user);
    setPermEdit(user.permissions?.canEdit || false);
    setPermDelete(user.permissions?.canDelete || false);
    setSelectedCondos(user.allowedCondos || []);
    setShowAccessModal(true);
  };

  const toggleCondo = (id: string) => {
    if (selectedCondos.includes(id)) setSelectedCondos(selectedCondos.filter(c => c !== id));
    else setSelectedCondos([...selectedCondos, id]);
  };

  const saveAccess = async () => {
    if (!selectedUser) return;
    setSavingAccess(true);
    try {
        await updateUserAccess(selectedUser.id, { canEdit: permEdit, canDelete: permDelete }, selectedCondos);
        setShowAccessModal(false);
        refreshData();
    } catch (e) { alert("Erro ao salvar permissões."); } finally { setSavingAccess(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="space-y-6">
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} reason="team" />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-600" />
            Gestão de Usuários
          </h2>
          <p className="text-sm text-slate-500">Controle de acesso da equipe e permissões por unidade.</p>
        </div>
        
        <button onClick={handleOpenInvite} className={`px-6 py-3 rounded-2xl text-white font-bold transition shadow-lg ${members.length >= limit ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
          <Plus size={18} className="inline mr-2" /> Novo Usuário
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2"> <span className="text-slate-500">Uso do Plano</span> <span className={members.length >= limit ? 'text-red-600' : 'text-blue-600'}> {members.length} de {limit} usuários </span> </div>
          <div className="w-full bg-slate-100 rounded-full h-2"> <div className={`h-2 rounded-full ${members.length >= limit ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((members.length / limit) * 100, 100)}%` }}></div> </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
            <div key={member.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col gap-4 group hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl"> {member.name.charAt(0).toUpperCase()} </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800 truncate">{member.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{member.email}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase border px-2 py-0.5 rounded-full text-slate-500">{member.role}</span>
                    {currentUser?.role === 'super_admin' && (
                        <button onClick={() => handleOpenAccess(member)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                            <Settings size={16} />
                        </button>
                    )}
                </div>
            </div>
        ))}
      </div>

      {showInviteModal && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[80] p-4 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-900">Convidar Membro</h3>
                      <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleInvite} className="p-8 space-y-6">
                      {message ? (
                          <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl border border-blue-100 text-sm font-bold flex items-center gap-3">
                              <Info size={16}/> {message}
                          </div>
                      ) : (
                          <>
                              <div>
                                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome Completo</label>
                                  <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none text-sm font-bold" required value={name} onChange={e => setName(e.target.value)} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">E-mail de Acesso</label>
                                  <input type="email" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none text-sm font-bold" required value={email} onChange={e => setEmail(e.target.value)} />
                              </div>
                              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all">Enviar Convite</button>
                          </>
                      )}
                  </form>
              </div>
          </div>
      )}

      {showAccessModal && selectedUser && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[90] p-4 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                               <ShieldCheck size={24} />
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-slate-900">Acessos: {selectedUser.name}</h3>
                              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">{selectedUser.email}</p>
                          </div>
                      </div>
                      <button onClick={() => setShowAccessModal(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 text-slate-400"><X size={20}/></button>
                  </div>

                  <div className="p-8 overflow-y-auto space-y-8 scrollbar-thin">
                      <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1"> 1. Ações Permitidas </h4>
                          <div className="grid grid-cols-2 gap-4">
                               <button onClick={() => setPermEdit(!permEdit)} className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${permEdit ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                                   <div className="flex items-center gap-3">
                                       <div className={`p-2 rounded-lg ${permEdit ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}><Plus size={16}/></div>
                                       <span className="font-bold text-sm">Criar / Editar</span>
                                   </div>
                                   {permEdit ? <CheckSquare size={18}/> : <Square size={18}/>}
                               </button>
                               <button onClick={() => setPermDelete(!permDelete)} className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${permDelete ? 'border-rose-500 bg-rose-50/50 text-rose-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                                   <div className="flex items-center gap-3">
                                       <div className={`p-2 rounded-lg ${permDelete ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-400'}`}><X size={16}/></div>
                                       <span className="font-bold text-sm">Excluir Dados</span>
                                   </div>
                                   {permDelete ? <CheckSquare size={18}/> : <Square size={18}/>}
                               </button>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1"> 2. Unidades com Acesso </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                               {condos.map(c => {
                                   const isSelected = selectedCondos.includes(c.id);
                                   return (
                                       <button key={c.id} onClick={() => toggleCondo(c.id)} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${isSelected ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-slate-300 text-slate-500'}`}>
                                           <div className="flex items-center gap-3 truncate">
                                                <Building size={14} className={isSelected ? 'text-blue-500' : 'text-slate-300'} />
                                                <span className="text-xs font-bold truncate">{c.name}</span>
                                           </div>
                                           {isSelected ? <Check size={14} className="shrink-0" /> : <div className="w-3 h-3 border rounded-full border-slate-300 shrink-0"/>}
                                       </button>
                                   );
                               })}
                          </div>
                      </div>
                  </div>

                  <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4 shrink-0">
                      <button onClick={() => setShowAccessModal(false)} className="px-6 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
                      <button onClick={saveAccess} disabled={savingAccess} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl active:scale-95">
                          {savingAccess ? 'Salvando...' : 'Salvar Permissões'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TeamList;