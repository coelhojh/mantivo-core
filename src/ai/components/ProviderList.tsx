
import React, { useState, useEffect } from 'react';
import { Provider, Category } from '../types';
import { getProviders, saveProvider, updateProvider, deleteProvider, getCategories, getUser } from '../services/storageService';
import { 
  Plus, Search, Edit2, Trash2, X, Loader2, LayoutGrid, List, AtSign, MessageCircle, Truck, Phone, User, Info, Briefcase, Filter, AlignLeft, Mail
} from 'lucide-react';

const ProviderList: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Provider>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Provider | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currentUser = getUser();
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.permissions?.canEdit;
  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.permissions?.canDelete;

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
        const [p, c] = await Promise.all([getProviders(), getCategories()]);
        setProviders(p);
        setCategories(c);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleOpenModal = (provider?: Provider) => {
      if (!canEdit) return;
      setFormError('');
      if (provider) {
          setFormData({ ...provider, categories: Array.isArray(provider.categories) ? provider.categories : [] });
          setEditingId(provider.id);
      } else {
          setFormData({ categories: [], phone: '', whatsapp: '', email: '', contactName: '', notes: '' });
          setEditingId(null);
      }
      setShowModal(true);
  };

  const toggleCategory = (catName: string) => {
      const current = formData.categories || [];
      if (current.includes(catName)) setFormData({ ...formData, categories: current.filter(c => c !== catName) });
      else setFormData({ ...formData, categories: [...current, catName] });
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError('');
      if (!formData.name) { setFormError("O nome da empresa é obrigatório"); return; }
      setIsSaving(true);
      try {
          const payload = { ...formData, categories: formData.categories || [] };
          if (editingId) await updateProvider(payload as Provider);
          else await saveProvider(payload as Provider);
          setShowModal(false);
          refreshData();
      } catch (e: any) { setFormError(e.message || "Erro ao salvar."); } finally { setIsSaving(false); }
  };

  const confirmDelete = async () => {
      if (!itemToDelete) return;
      setIsDeleting(true);
      try {
          await deleteProvider(itemToDelete.id);
          setItemToDelete(null);
          refreshData();
      } catch (e: any) { alert("Erro ao excluir."); } finally { setIsDeleting(false); }
  };

  const normalize = (str: string) => 
    str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const filteredProviders = providers.filter(p => {
    const term = normalize(searchTerm);
    const providerName = normalize(p.name);
    const termDigits = searchTerm.replace(/\D/g, '');
    const providerCnpjDigits = (p.cnpj || '').replace(/\D/g, '');
    const matchesText = providerName.includes(term) || (termDigits !== '' && providerCnpjDigits.includes(termDigits));
    const matchesCategory = filterCategory === 'all' || p.categories.includes(filterCategory);
    return matchesText && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="text-blue-600" />
            Prestadores de Serviço
          </h2>
          <p className="text-sm text-slate-500">Empresas e técnicos credenciados para manutenções.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Empresa ou CNPJ..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none font-medium text-sm shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="relative flex-1 sm:w-56">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none font-medium text-sm shadow-sm cursor-pointer appearance-none"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="all">Todas as categorias</option>
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
            </div>

            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><LayoutGrid size={20}/></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><List size={20}/></button>
            </div>
            
            {canEdit && (
                <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg font-bold active:scale-95">
                    Adicionar
                </button>
            )}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProviders.map(provider => (
                <div key={provider.id} className="bg-white rounded-[32px] border border-slate-100 border-l-[6px] border-l-blue-600 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300">
                    <div className="p-8 flex-1 flex flex-col">
                        <div className="flex justify-end gap-2 mb-2 h-8 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            {canEdit && <button onClick={() => handleOpenModal(provider)} className="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 shadow-sm transition-all"><Edit2 size={16}/></button>}
                            {canDelete && <button onClick={() => setItemToDelete(provider)} className="p-2 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 shadow-sm transition-all"><Trash2 size={16}/></button>}
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900 leading-tight truncate">{provider.name}</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">{provider.cnpj || 'CNPJ NÃO INFORMADO'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-8">
                            {provider.categories.map((cat, idx) => (
                                <span key={idx} className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border bg-slate-100 text-slate-600 border-slate-200">{cat}</span>
                            ))}
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Responsável</label>
                                <p className="text-xs font-bold text-slate-700">{provider.contactName || 'Não informado'}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-5 pt-6 border-t border-slate-50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Telefone</label>
                                        <p className="text-xs font-bold text-slate-800">{provider.phone || '—'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">WhatsApp</label>
                                        <p className="text-xs font-bold text-slate-800">{provider.whatsapp || '—'}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Mail size={10} /> Canal Oficial</label>
                                    <p className="text-xs font-bold text-slate-800 break-all">{provider.email || '—'}</p>
                                </div>
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
                        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contatos</th>
                        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                        <th className="px-6 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {filteredProviders.map(provider => (
                        <tr key={provider.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-6">
                                <p className="font-bold text-slate-900 text-sm">{provider.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-tight">{provider.cnpj || 'Sem Registro'}</p>
                            </td>
                            <td className="px-6 py-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]"><Phone size={12} className="text-slate-400"/> {provider.phone || '—'}</div>
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]"><MessageCircle size={12} className="text-slate-400"/> {provider.whatsapp || '—'}</div>
                                </div>
                            </td>
                            <td className="px-6 py-6">
                                <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]">
                                    <Mail size={12} className="text-slate-400" />
                                    {provider.email || '—'}
                                </div>
                            </td>
                            <td className="px-6 py-6">
                                <div className="flex flex-wrap gap-1">
                                    {provider.categories.length > 0 ? provider.categories.map((cat, idx) => (
                                        <span key={idx} className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border bg-slate-100 text-slate-500 border-slate-200">
                                            {cat}
                                        </span>
                                    )) : <span className="text-[10px] text-slate-300 italic">Nenhuma</span>}
                                </div>
                            </td>
                            <td className="px-6 py-6 text-right">
                                <div className="flex items-center justify-end gap-3">
                                    <button onClick={() => handleOpenModal(provider)} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm"><Edit2 size={18}/></button>
                                    <button onClick={() => setItemToDelete(provider)} className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white w-full sm:max-w-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
               <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"> <Briefcase size={24} /> </div>
                   <div>
                       <h3 className="font-black text-2xl text-slate-900 tracking-tighter">Prestador</h3>
                       <p className="text-sm text-slate-500 font-medium">Empresas e técnicos credenciados.</p>
                   </div>
               </div>
               <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
                {formError && ( <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-semibold uppercase tracking-widest border border-rose-100 flex items-center gap-3"> <Info size={14} /> {formError} </div> )}
                <form id="providerForm" onSubmit={handleSave} className="space-y-8">
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-widest ml-1"> 1. Identificação </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-blue-500/50 outline-none font-medium text-slate-800 text-sm" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nome Fantasia / Razão Social *" />
                            </div>
                            <div className="md:col-span-2">
                                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-blue-500/50 outline-none font-medium text-slate-800 text-sm" value={formData.cnpj || ''} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} placeholder="CNPJ (00.000.000/0000-00)" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-widest ml-1"> 2. Canais de Contato </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                            <div className="relative md:col-span-2">
                                <User className="absolute left-4 top-4 text-slate-400" size={14}/>
                                <input className="w-full bg-white border border-slate-200 p-3.5 pl-10 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-800 text-sm shadow-sm" value={formData.contactName || ''} onChange={(e) => setFormData({...formData, contactName: e.target.value})} placeholder="Pessoa de Contato / Responsável Técnico" />
                            </div>
                            <div className="relative md:col-span-2">
                                <Mail className="absolute left-4 top-4 text-slate-400" size={14}/>
                                <input type="email" className="w-full bg-white border border-slate-200 p-3.5 pl-10 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-800 text-sm shadow-sm" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="E-mail Corporativo" />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-4 top-4 text-slate-400" size={14}/>
                                <input className="w-full bg-white border border-slate-200 p-3.5 pl-10 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-800 text-sm shadow-sm" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Telefone Fixo" />
                            </div>
                            <div className="relative">
                                <MessageCircle className="absolute left-4 top-4 text-slate-400" size={14}/>
                                <input className="w-full bg-white border border-slate-200 p-3.5 pl-10 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-800 text-sm shadow-sm" value={formData.whatsapp || ''} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} placeholder="WhatsApp" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-widest ml-1"> 3. Especialidades / Áreas de Atuação </label>
                        <div className="flex flex-wrap gap-2 p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                            {categories.length > 0 ? categories.map(cat => {
                                const isSelected = formData.categories?.includes(cat.name);
                                return (
                                    <button 
                                        key={cat.id}
                                        type="button"
                                        onClick={() => toggleCategory(cat.name)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 ${isSelected ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-white hover:border-slate-200'}`}
                                    >
                                        {cat.name}
                                    </button>
                                );
                            }) : (
                                <p className="text-xs text-slate-400 font-medium py-2">Nenhuma categoria cadastrada.</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-widest ml-1"> 4. Observações e Notas </label>
                        <div className="relative">
                            <AlignLeft className="absolute left-4 top-4 text-slate-400" size={16}/>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-200 p-4 pl-11 rounded-2xl focus:border-blue-500/50 outline-none font-medium text-slate-800 text-sm min-h-[120px]" 
                                value={formData.notes || ''} 
                                onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                                placeholder="Anotações sobre qualidade de serviço, agilidade ou referências..."
                            />
                        </div>
                    </div>
                </form>
            </div>
            
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4 shrink-0">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-4 text-slate-400 hover:text-slate-800 font-black uppercase text-xs tracking-widest transition-colors">Cancelar</button>
                <button type="submit" form="providerForm" disabled={isSaving} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95 shadow-blue-100">
                    {isSaving ? 'Gravando...' : (editingId ? 'Atualizar Prestador' : 'Salvar Prestador')}
                </button>
            </div>
          </div>
        </div>
      )}

      {itemToDelete && (
          <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="bg-white rounded-[48px] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash2 size={32} /></div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">Remover Prestador?</h3>
                  <p className="text-sm text-slate-500 font-medium mb-10">Esta ação apagará <strong>{itemToDelete.name}</strong> permanentemente.</p>
                  <div className="flex flex-col gap-3">
                      <button onClick={confirmDelete} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95">Excluir</button>
                      <button onClick={() => setItemToDelete(null)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">Cancelar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProviderList;
