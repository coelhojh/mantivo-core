
import React, { useState, useEffect } from 'react';
import { Condo } from '../types';
import { getCondos, saveCondo, updateCondo, deleteCondo, checkPlanLimits, getUser } from '../services/storageService';
import { Building, MapPin, Search, Edit2, Trash2, X, Loader2, AtSign, LayoutGrid, List, Info, Phone, Mail, Globe, MessageCircle } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

const CondoList: React.FC = () => {
  const [condos, setCondos] = useState<Condo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCep, setLoadingCep] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [condoToDelete, setCondoToDelete] = useState<Condo | null>(null);
  const [formData, setFormData] = useState<Partial<Condo>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const currentUser = getUser();
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.permissions?.canEdit;
  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.permissions?.canDelete;

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
        const data = await getCondos();
        setCondos(data);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleEdit = (condo: Condo) => {
    if (!canEdit) return;
    setFormData({ ...condo });
    setEditingId(condo.id);
    setFormError('');
    setShowModal(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, condo: Condo) => {
    e.preventDefault();
    e.stopPropagation(); 
    if (!canDelete) return;
    setCondoToDelete(condo);
  };

  const confirmDelete = async () => {
    if (!condoToDelete) return;
    try {
        await deleteCondo(condoToDelete.id);
        setCondoToDelete(null);
        refreshData();
    } catch (err: any) {
        alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const openNewModal = async () => {
    if (!canEdit) return;
    const allowed = await checkPlanLimits('condo');
    if (!allowed) {
      setShowUpgradeModal(true);
      return;
    }
    setFormData({});
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const handleCEPBlur = async () => {
    const cep = formData.cep?.replace(/\D/g, '');
    if (cep && cep.length === 8) {
        setLoadingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    street: data.logradouro,
                    district: data.bairro,
                    city: data.localidade,
                    state: data.uf
                }));
            } else { setFormError('CEP não encontrado.'); }
        } catch (e) { setFormError('Erro ao buscar CEP.'); } finally { setLoadingCep(false); }
    }
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); 
    if (value.length > 14) value = value.slice(0, 14);
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    setFormData({ ...formData, cnpj: value });
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    setFormData({ ...formData, cep: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (formData.name && formData.managerEmail && formData.street && formData.number && formData.city) {
        try {
            const fullAddress = `${formData.street}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''}, ${formData.district}, ${formData.city} - ${formData.state}`;
            const condoData = { ...formData, address: fullAddress } as Condo;
            if (editingId) await updateCondo(condoData);
            else await saveCondo(condoData);
            setShowModal(false);
            refreshData();
        } catch (err: any) { setFormError(`Erro: ${err.message}`); }
    } else { setFormError('Preencha os campos obrigatórios (*).'); }
  };

  const normalize = (str: string) => 
    str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const filteredCondos = condos.filter(c => {
    const term = normalize(searchTerm);
    const condoName = normalize(c.name);
    const termDigits = searchTerm.replace(/\D/g, '');
    const condoCnpjDigits = (c.cnpj || '').replace(/\D/g, '');
    return condoName.includes(term) || (termDigits !== '' && condoCnpjDigits.includes(termDigits));
  }).sort((a, b) => a.name.localeCompare(b.name));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} reason="condo" />}

      <div className="flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building className="text-blue-600" />
            Condomínios
          </h2>
          <p className="text-sm text-slate-500">Gestão das unidades sob sua responsabilidade técnica.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Nome ou CNPJ..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none font-medium text-sm shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><LayoutGrid size={20}/></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><List size={20}/></button>
            </div>
            {canEdit && (
                <button onClick={openNewModal} className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-bold active:scale-95">
                    Adicionar
                </button>
            )}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCondos.map(condo => (
            <div key={condo.id} className="bg-white rounded-[32px] border border-slate-100 border-r-[6px] border-r-blue-600 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300">
                <div className="p-8 flex-1 flex flex-col">
                    <div className="flex justify-end gap-2 mb-2 h-8 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {canEdit && <button onClick={() => handleEdit(condo)} className="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"><Edit2 size={16}/></button>}
                        {canDelete && <button onClick={(e) => handleDeleteClick(e, condo)} className="p-2 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all"><Trash2 size={16}/></button>}
                    </div>
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900 leading-tight truncate">{condo.name}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">{condo.cnpj || 'CNPJ NÃO INFORMADO'}</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MapPin size={10} /> Localização</label>
                            <p className="text-xs font-medium text-slate-700 leading-relaxed break-words">{condo.address}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-50">
                            <label className="block text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-1.5"><AtSign size={10} /> Canal Digital</label>
                            <p className="text-xs font-bold text-blue-600 break-all">{condo.managerEmail}</p>
                        </div>
                    </div>
                </div>
            </div>
            ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50">
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Condomínios</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contatos</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {filteredCondos.map(condo => (
                        <tr key={condo.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-10 py-6">
                                <p className="font-bold text-slate-900 text-sm">{condo.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-tight">{condo.cnpj || 'Sem Registro'}</p>
                            </td>
                            <td className="px-10 py-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]"><Phone size={12} className="text-slate-400"/> {condo.contactPhone || '—'}</div>
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]"><Mail size={12} className="text-slate-400"/> {condo.managerEmail || '—'}</div>
                                </div>
                            </td>
                            <td className="px-10 py-6">
                                <div className="text-xs text-slate-600 font-medium break-words max-w-[300px]">{condo.address}</div>
                            </td>
                            <td className="px-10 py-6 text-right">
                                <div className="flex items-center justify-end gap-3">
                                    <button onClick={() => handleEdit(condo)} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm"><Edit2 size={18}/></button>
                                    <button onClick={(e) => handleDeleteClick(e, condo)} className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full sm:max-w-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
               <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <Building size={24} />
                   </div>
                   <div>
                       <h3 className="font-black text-2xl text-slate-900 tracking-tighter">Condomínio</h3>
                       <p className="text-sm text-slate-500 font-medium">Registro de unidade e contatos.</p>
                   </div>
               </div>
               <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
                {formError && ( <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-semibold border border-rose-100 flex items-center gap-3"> <Info size={14} /> {formError} </div> )}
                <form id="condoForm" onSubmit={handleSave} className="space-y-8">
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-widest ml-1"> 1. Identificação </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-blue-500/50 outline-none font-medium text-slate-800 text-sm" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nome do Condomínio *" />
                            </div>
                            <div className="md:col-span-2">
                                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-blue-500/50 outline-none font-medium text-slate-800 text-sm" value={formData.cnpj || ''} onChange={handleCNPJChange} placeholder="CNPJ (00.000.000/0000-00)" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-widest ml-1"> 2. Canais de Contato </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-slate-400" size={16}/>
                                <input type="email" className="w-full bg-slate-50 border border-slate-200 p-4 pl-11 rounded-2xl focus:border-blue-500/50 outline-none font-medium text-slate-800 text-sm" required value={formData.managerEmail || ''} onChange={(e) => setFormData({...formData, managerEmail: e.target.value})} placeholder="E-mail do Síndico *" />
                            </div>
                            <div className="relative">
                                <Globe className="absolute left-4 top-4 text-slate-400" size={16}/>
                                <input className="w-full bg-slate-50 border border-slate-200 p-4 pl-11 rounded-2xl focus:border-blue-500/50 outline-none font-medium text-slate-800 text-sm" value={formData.additionalEmails || ''} onChange={(e) => setFormData({...formData, additionalEmails: e.target.value})} placeholder="E-mails Adicionais (separados por vírgula)" />
                            </div>
                            <div className="relative md:col-span-2">
                                <Phone className="absolute left-4 top-4 text-slate-400" size={16}/>
                                <input className="w-full bg-slate-50 border border-slate-200 p-4 pl-11 rounded-2xl focus:border-blue-500/50 outline-none font-medium text-slate-800 text-sm" value={formData.contactPhone || ''} onChange={(e) => setFormData({...formData, contactPhone: e.target.value})} placeholder="Telefone de Contato" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-widest ml-1"> 3. Localização </label>
                        <div className="grid grid-cols-3 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                             <div className="col-span-3 md:col-span-1">
                                <div className="relative">
                                    <input className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none font-medium text-blue-700 text-sm shadow-sm" placeholder="CEP *" required value={formData.cep || ''} onChange={handleCEPChange} onBlur={handleCEPBlur} />
                                    {loadingCep && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
                                </div>
                             </div>
                             <div className="col-span-3 md:col-span-2">
                                <input className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-800 text-sm shadow-sm" required value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} placeholder="Logradouro / Rua *" />
                             </div>
                             <div className="col-span-1">
                                <input className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-800 text-sm shadow-sm" required value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} placeholder="Nº *" />
                             </div>
                             <div className="col-span-2">
                                <input className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-800 text-sm shadow-sm" value={formData.complement || ''} onChange={e => setFormData({...formData, complement: e.target.value})} placeholder="Complemento / Apto" />
                             </div>
                             <div className="col-span-3 md:col-span-1">
                                <input className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-800 text-sm shadow-sm" value={formData.district || ''} onChange={e => setFormData({...formData, district: e.target.value})} placeholder="Bairro" />
                             </div>
                             <div className="col-span-2 md:col-span-1">
                                <input className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-800 text-sm shadow-sm" required value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Cidade *" />
                             </div>
                             <div className="col-span-1">
                                <input className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-800 text-sm shadow-sm" required value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="UF *" />
                             </div>
                        </div>
                    </div>
                </form>
            </div>
            
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4 shrink-0">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-4 text-slate-400 hover:text-slate-800 font-bold uppercase text-xs tracking-widest transition-colors">Cancelar</button>
                <button type="submit" form="condoForm" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95 shadow-blue-100"> {editingId ? 'Atualizar Unidade' : 'Salvar Unidade'} </button>
            </div>
          </div>
        </div>
      )}

      {condoToDelete && (
          <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="bg-white rounded-[48px] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash2 size={32} /></div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">Remover?</h3>
                  <p className="text-sm text-slate-500 font-medium mb-10">Esta ação apagará <strong>{condoToDelete.name}</strong> permanentemente.</p>
                  <div className="flex flex-col gap-3">
                      <button onClick={confirmDelete} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95">Excluir</button>
                      <button onClick={() => setCondoToDelete(null)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">Cancelar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CondoList;
