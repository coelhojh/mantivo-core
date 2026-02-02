
import React, { useState, useEffect, useRef } from 'react';
import { Maintenance, MaintenanceStatus, FrequencyType, MaintenanceType, Condo, Category, Provider, AttachmentType, MaintenanceAttachment } from '../types';
import { getMaintenances, saveMaintenance, updateMaintenance, deleteMaintenance, completeMaintenance, undoCompleteMaintenance, getCondos, getCategories, checkPlanLimits, getUser, getProviders } from '../services/storageService';
import { Plus, Search, Calendar, CheckCircle, Trash2, Edit2, X, Loader2, RotateCcw, LayoutList, Building, AlertTriangle, Clock, Columns, CheckSquare, AlertCircle, Wrench, Eye, Check, Filter, Timer, DollarSign, Briefcase, Info, AlignLeft, Paperclip, FileText, Upload, ChevronDown, ExternalLink, User as UserIcon, Phone, Mail } from 'lucide-react';
import { format, isValid, differenceInDays, isAfter, isBefore, endOfDay, parseISO as parseISODateFns } from 'date-fns';
import UpgradeModal from './UpgradeModal';

const parseDateOnly = (dateStr: string | undefined | null): Date => {

  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(NaN);
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

const parseUploadDate = (dateStr: string | undefined | null): Date => {
  if (!dateStr) return new Date(NaN);

  // 1) ISO padrão (ex: 2026-02-01T12:30:00.000Z)
  if (dateStr.includes('T')) {
    try {
      return parseISODateFns(dateStr);
    } catch {
      // continua o fluxo
    }
  }

  // 2) Formato "yyyy-MM-dd HH:mm:ss" (com espaço)
  // Ex: 2026-02-01 12:30:00
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(dateStr)) {
    const normalized = dateStr.replace(' ', 'T');
    try {
      return parseISODateFns(normalized);
    } catch {
      // continua o fluxo
    }
  }

  // 3) yyyy-MM-dd (ex: 2026-02-01)
  const d = parseDateOnly(dateStr);
  return d;
};



const startOfDayLocal = (d: Date) => {
  const newDate = new Date(d);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const DOC_TYPE_PRIORITY: Record<string, number> = {
  [AttachmentType.BUDGET]: 1,
  [AttachmentType.INVOICE]: 2,
  [AttachmentType.ART_RRT]: 3,
  [AttachmentType.TECHNICAL_REPORT]: 4,
  [AttachmentType.MAINTENANCE_REPORT]: 4,
  [AttachmentType.CERTIFICATE]: 5,
  [AttachmentType.OTHER]: 6,
};

const MaintenanceList: React.FC = () => {
  const [items, setItems] = useState<Maintenance[]>([]);
  const [condos, setCondos] = useState<Condo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]); 
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondo, setFilterCondo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Maintenance | null>(null);
  const [itemToComplete, setItemToComplete] = useState<Maintenance | null>(null);
  const [itemToView, setItemToView] = useState<Maintenance | null>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isUndoing, setIsUndoing] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Maintenance>>({});
  const [completeData, setCompleteData] = useState({ 
    date: format(new Date(), 'yyyy-MM-dd'), 
    cost: 0,
    providerName: '',
    providerContact: '',
    providerEmail: '',
    providerPhone: '',
    attachments: [] as MaintenanceAttachment[]
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedFileType, setSelectedFileType] = useState<string>(AttachmentType.BUDGET);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const completeFileInputRef = useRef<HTMLInputElement>(null);

  const user = getUser();
  const canEdit = user?.role === 'admin' || user?.role === 'super_admin' || user?.permissions?.canEdit;
  const canDelete = user?.role === 'admin' || user?.role === 'super_admin' || user?.permissions?.canDelete;

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [m, c, cat, p] = await Promise.all([getMaintenances(), getCondos(), getCategories(), getProviders()]);
      setItems(m); 
      setCondos(c); 
      setCategories(cat);
      const sortedProviders = [...p].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setProviders(sortedProviders);
    } catch (e) { 
        console.error("Refresh Error:", e); 
    } finally { 
        setLoading(false); 
    }
  };

  const formatBRL = (value: number | undefined) => {
    if (value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleCurrencyInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: number) => void) => {
    const value = e.target.value.replace(/\D/g, '');
    const numericValue = parseInt(value, 10) / 100;
    setter(numericValue || 0);
  };

  const handleOpenModal = async (maintenance?: Maintenance) => {
    if (!canEdit) return;
    if (maintenance) {
      const sortedAttachments = sortAttachments(maintenance.attachments || []);
      setFormData({ ...maintenance, attachments: sortedAttachments });
      setEditingId(maintenance.id);
    } else {
      const allowed = await checkPlanLimits('maintenance');
      if (!allowed) { setShowUpgradeModal(true); return; }
      setFormData({ 
        status: MaintenanceStatus.ON_TIME, 
        frequencyType: FrequencyType.MONTHLY, 
        frequencyDays: 30,
        type: MaintenanceType.PREVENTIVE, 
        cost: 0, 
        estimatedCost: 0, 
        attachments: [],
        nextExecutionDate: format(new Date(), 'yyyy-MM-dd')
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleOpenViewModal = (item: Maintenance) => {
    setItemToView(item);
    setShowViewModal(true);
  };

  const handleOpenCompleteModal = (item: Maintenance) => {
    setItemToComplete(item);
    setCompleteData({
        date: format(new Date(), 'yyyy-MM-dd'),
        cost: item.estimatedCost || 0,
        providerName: item.providerName || '',
        providerContact: item.providerContact || '',
        providerEmail: item.providerEmail || '',
        providerPhone: item.providerPhone || '',
        attachments: sortAttachments(item.attachments || [])
    });
    setShowCompleteModal(true);
  };

  const handleUndoComplete = async (id: string) => {
    if (isUndoing) return;
    if (!window.confirm("Deseja desfazer a conclusão desta manutenção?")) return;
    
    setIsUndoing(id);
    try {
      await undoCompleteMaintenance(id);
      await refreshData();
    } catch (e) {
      alert("Erro ao desfazer conclusão.");
    } finally {
      setIsUndoing(null);
    }
  };

  const handleProviderChange = (providerId: string) => {
    const selected = providers.find(p => p.id === providerId);
    if (selected) {
      const p = selected as Provider;
      setFormData({
        ...formData,
        providerId: p.id,
        providerName: p.name,
        providerContact: p.contactName,
        providerEmail: p.email,
        providerPhone: p.phone || p.whatsapp
      });
    } else {
      setFormData({
        ...formData,
        providerId: '',
        providerName: '',
        providerContact: '',
        providerEmail: '',
        providerPhone: ''
      });
    }
  };

  const sortAttachments = (attachments: MaintenanceAttachment[]): MaintenanceAttachment[] => {
    return [...attachments].sort((a, b) => {
      const priorityA = DOC_TYPE_PRIORITY[a.type] || 99;
      const priorityB = DOC_TYPE_PRIORITY[b.type] || 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      const dateA = a.uploadDate || '';
      const dateB = b.uploadDate || '';
      return dateB.localeCompare(dateA);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isCompleteModal: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: MaintenanceAttachment[] = Array.from(files).map((file: any) => ({
      fileName: file.name,
      type: selectedFileType,
      url: '#', 
      uploadDate: new Date().toISOString()
    }));

    if (isCompleteModal) {
      setCompleteData(prev => ({
        ...prev,
        attachments: sortAttachments([...(prev.attachments || []), ...newItems])
      }));
      if (completeFileInputRef.current) completeFileInputRef.current.value = '';
    } else {
      setFormData(prev => ({
        ...prev,
        attachments: sortAttachments([...(prev.attachments || []), ...newItems])
      }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number, isCompleteModal: boolean = false) => {
    if (isCompleteModal) {
      setCompleteData(prev => ({
        ...prev,
        attachments: (prev.attachments || []).filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        attachments: (prev.attachments || []).filter((_, i) => i !== index)
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.condoId || !formData.category || !formData.type) {
        alert("Preencha os campos obrigatórios.");
        return;
    }
    
    const finalData = { ...formData };
    if (formData.type === MaintenanceType.CORRECTIVE) {
        finalData.frequencyType = FrequencyType.CUSTOM; 
        finalData.frequencyDays = 0; 
    }

    try {
      if (editingId) await updateMaintenance(finalData as Maintenance);
      else await saveMaintenance(finalData as Maintenance);
      setShowModal(false);
      refreshData();
    } catch (error: any) { alert(`Erro ao salvar: ${error.message}`); }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToComplete) return;
    setIsCompleting(true);
    try {
      await completeMaintenance(
        itemToComplete.id, 
        completeData.date, 
        completeData.cost, 
        completeData.attachments || [], 
        { 
          name: completeData.providerName, 
          contact: completeData.providerContact, 
          email: completeData.providerEmail, 
          phone: completeData.providerPhone 
        }
      );
      setShowCompleteModal(false);
      refreshData();
    } catch (error: any) {
      alert("Erro ao concluir manutenção.");
    } finally {
      setIsCompleting(false);
      setItemToComplete(null);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMaintenance(itemToDelete.id);
      setItemToDelete(null);
      refreshData();
    } catch (error: any) {
      alert("Erro ao excluir manutenção.");
    } finally {
      setIsDeleting(false);
    }
  };

  const safeFormatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return '--/--/--';
    try {
        const date = parseDateOnly(dateStr);

        return isValid(date) ? format(date, 'dd/MM/yy') : '--/--/--';
    } catch (e) {
        return '--/--/--';
    }
  };

  const getTypeClasses = (type: MaintenanceType) => {
    switch (type) {
      case MaintenanceType.PREVENTIVE: return 'bg-amber-50 text-amber-700 border-amber-200'; 
      case MaintenanceType.CORRECTIVE: return 'bg-purple-50 text-purple-700 border-purple-200'; 
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getDocTypeColor = (type: string | AttachmentType) => {
    switch (type) {
      case AttachmentType.BUDGET: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case AttachmentType.INVOICE: return 'bg-blue-50 text-blue-600 border-blue-100';
      case AttachmentType.ART_RRT: return 'bg-purple-50 text-purple-600 border-purple-100';
      case AttachmentType.TECHNICAL_REPORT:
      case AttachmentType.MAINTENANCE_REPORT: return 'bg-amber-50 text-amber-600 border-amber-100';
      case AttachmentType.CERTIFICATE: return 'bg-sky-50 text-sky-600 border-sky-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getSimplifiedStatus = (item: Maintenance) => {
    if (item.status === MaintenanceStatus.COMPLETED) return "Concluída";
    const diff = item.nextExecutionDate ? differenceInDays(parseDateOnly(item.nextExecutionDate), new Date()) : 0;

    if (diff < 0) return "Vencida";
    return "A Vencer"; 
  };

  const filteredItems = items.filter(item => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(s) || item.category.toLowerCase().includes(s);
    const matchesCondo = filterCondo === 'all' || item.condoId === filterCondo;
    const matchesType = filterType === 'all' || item.type === filterType;
    const currentStatus = getSimplifiedStatus(item);
    const matchesStatus = filterStatus === 'all' || currentStatus === filterStatus;

    let matchesPeriod = true;
    if (filterStartDate || filterEndDate) {
        if (!item.nextExecutionDate) {
            matchesPeriod = false;
        } else {
            const date = parseDateOnly(item.nextExecutionDate);

            if (filterStartDate) {
                const start = startOfDayLocal(parseDateOnly(filterStartDate));

                if (isBefore(date, start)) matchesPeriod = false;
            }
            if (filterEndDate) {
                const end = endOfDay(parseDateOnly(filterEndDate));

                if (isAfter(date, end)) matchesPeriod = false;
            }
        }
    }
    return matchesSearch && matchesCondo && matchesStatus && matchesType && matchesPeriod;
  }).sort((a, b) => (a.nextExecutionDate || '').localeCompare(b.nextExecutionDate || ''));

  const kanbanColumnsData = {
    "Vencida": filteredItems.filter(i => getSimplifiedStatus(i) === "Vencida"),
    "A Vencer": filteredItems.filter(i => getSimplifiedStatus(i) === "A Vencer"),
    "Concluída": filteredItems.filter(i => getSimplifiedStatus(i) === "Concluída"),
  };

  const columnConfig = [
      { id: 'Vencida', title: 'Vencidas', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
      { id: 'A Vencer', title: 'A Vencer', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      { id: 'Concluída', title: 'Concluídas', icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  ];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  const isCorrective = formData.type === MaintenanceType.CORRECTIVE;

  return (
    <div className="space-y-6 pb-4 flex flex-col h-full">
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} reason="maintenance" />}

      <div className="flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="text-blue-600" />
            Cronograma de Manutenções
          </h2>
          <p className="text-sm text-slate-500 font-medium">Gestão operacional de prazos e atividades.</p>
        </div>
        
        {canEdit && (
            <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg font-semibold active:scale-95 flex items-center gap-2">
                <Plus size={18} /> Nova Manutenção
            </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4 shrink-0">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                      <input className="w-full pl-10 pr-4 py-2 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-medium" placeholder="Buscar por título ou categoria..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <select className="border border-slate-100 rounded-xl px-3 py-2 outline-none w-full sm:w-auto text-sm bg-slate-50 font-semibold text-slate-600" value={filterCondo} onChange={e => setFilterCondo(e.target.value)}>
                      <option value="all">Todos Condomínios</option>
                      {condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-inner' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                  >
                    <Filter size={16} /> Filtros {showFilters ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
                  </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                  <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`} title="Modo Kanban"><Columns size={18}/></button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`} title="Modo Lista"><LayoutList size={18}/></button>
                </div>
              </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2 duration-200">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                    <select className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none text-sm bg-white font-medium" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="all">Todos</option>
                        <option value="A Vencer">Em dia / A Vencer</option>
                        <option value="Vencida">Vencida</option>
                        <option value="Concluída">Concluída</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipo</label>
                    <select className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none text-sm bg-white font-medium" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="all">Todos</option>
                        <option value={MaintenanceType.PREVENTIVE}>Preventiva</option>
                        <option value={MaintenanceType.CORRECTIVE}>Corretiva</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Período De</label>
                    <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none text-sm bg-white font-medium" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Período Até</label>
                    <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none text-sm bg-white font-medium" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                </div>
            </div>
          )}
      </div>

      <div className="flex-1 overflow-hidden min-h-0 relative">
        {viewMode === 'kanban' ? (
            <div className="h-full overflow-x-auto pb-4 px-1">
                <div className={`flex h-full gap-5 min-w-[900px]`}>
                    {columnConfig.map(col => {
                        const colItems = kanbanColumnsData[col.id as keyof typeof kanbanColumnsData] || [];
                        const Icon = col.icon;
                        
                        return (
                            <div key={col.id} className="flex-1 flex flex-col min-w-[300px] bg-slate-100/40 rounded-[32px] border border-slate-200/40 overflow-hidden shadow-sm">
                                <div className={`p-4 border-b ${col.bg} ${col.border} flex justify-between items-center shrink-0`}>
                                    <div className="flex items-center gap-2 font-bold text-slate-600 uppercase text-[10px] tracking-wider"> 
                                      <Icon size={14} className={col.color} /> 
                                      {col.title} 
                                    </div>
                                    <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200"> {colItems.length} </span>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar-hover">
                                    {colItems.length > 0 ? (
                                      colItems.map(item => {
                                          const statusLabel = getSimplifiedStatus(item);
                                          const isOverdue = statusLabel === "Vencida";
                                          
                                          return (
                                              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative animate-in fade-in zoom-in-95 duration-200">
                                                  <div className="flex justify-between items-center mb-2.5 h-6">
                                                      <span className={`shrink-0 text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded-md border ${getTypeClasses(item.type)}`}>
                                                          {item.type}
                                                      </span>
                                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0 z-10">
                                                          <button onClick={() => handleOpenViewModal(item)} className="p-1.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200" title="Visualizar">
                                                              <Eye size={13}/>
                                                          </button>
                                                          {canEdit && (
                                                            <button onClick={() => handleOpenModal(item)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100" title="Editar">
                                                              <Edit2 size={13}/>
                                                            </button>
                                                          )}
                                                          {canEdit && statusLabel !== "Concluída" && (
                                                              <button onClick={() => handleOpenCompleteModal(item)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100" title="Concluir">
                                                                  <Check size={13}/>
                                                              </button>
                                                          )}
                                                          {canEdit && statusLabel === "Concluída" && (
  <button
    type="button"
    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
    onClick={() => handleUndoComplete(item.id)}
    disabled={isUndoing === item.id}
    className="p-1.5 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-all"
    title="Desfazer Conclusão"
  >
    {isUndoing === item.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
  </button>
)}

                                                          {canDelete && (
                                                              <button onClick={() => setItemToDelete(item)} className="p-1.5 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100" title="Excluir">
                                                                  <Trash2 size={13}/>
                                                              </button>
                                                          )}
                                                      </div>
                                                  </div>

                                                  <div className="flex items-center mb-3 min-w-0">
                                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate flex-1">
                                                          {condos.find(c => c.id === item.condoId)?.name}
                                                      </span>
                                                  </div>

                                                  <h3 className="font-bold text-slate-800 text-sm leading-tight break-words mb-4">{item.title}</h3>
                                                  
                                                  <div className="pt-3 border-t border-slate-50 space-y-2">
                                                      <div className={`flex items-center gap-1.5 text-[10px] text-slate-600 ${isOverdue ? '' : 'px-2'}`}>
                                                          <DollarSign size={12} className={statusLabel === "Concluída" ? "text-emerald-600" : "text-blue-500"} />
                                                          <span className="font-normal">
                                                              {statusLabel === "Concluída" ? `Execução: ${formatBRL(item.cost)}` : `Estimado: ${formatBRL(item.estimatedCost)}`}
                                                          </span>
                                                      </div>

                                                      <div className="flex items-center justify-between">
                                                          <div className={`flex items-center gap-1.5 text-[10px] font-semibold transition-all ${isOverdue ? 'text-red-600' : 'bg-slate-50 text-slate-500 px-2 py-1 rounded-lg'}`}>
                                                              <Calendar size={12} className={isOverdue ? 'text-red-500' : 'text-slate-300'} />
                                                              <span>{statusLabel === "Concluída" ? "Concl: " + safeFormatDate(item.lastExecutionDate) : "Venc: " + safeFormatDate(item.nextExecutionDate)}</span>
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                              {item.attachments && item.attachments.length > 0 && (
                                                                  <div className="flex items-center gap-0.5 text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                                                                      <Paperclip size={10} />
                                                                      {item.attachments.length}
                                                                  </div>
                                                              )}
                                                              <div className="text-[10px] font-bold text-slate-300 uppercase">
                                                                {item.category}
                                                              </div>
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          );
                                      })
                                    ) : (
                                      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 opacity-60">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest">Sem itens</p>
                                      </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : (
            <div className="h-full overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custos</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Datas</th>
                            <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredItems.map(item => {
                            const statusLabel = getSimplifiedStatus(item);
                            const isOverdue = statusLabel === "Vencida";
                            const isCompleted = statusLabel === "Concluída";

                            return (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 text-center"> 
                                        <div className="flex justify-center">
                                            <div className={`w-3 h-3 rounded-full shadow-sm ${isOverdue ? 'bg-red-500' : isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} title={statusLabel} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"> 
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-slate-800 text-sm">{item.title}</div> 
                                            {item.attachments && item.attachments.length > 0 && (
                                                <div className="flex items-center gap-0.5 text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100" title={`${item.attachments.length} arquivo(s) anexado(s)`}>
                                                    <Paperclip size={10} />
                                                    {item.attachments.length}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1">
                                          <Building size={10} />
                                          {condos.find(c => c.id === item.condoId)?.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${getTypeClasses(item.type)}`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-[11px] font-normal text-slate-600">
                                          <p>Est: {formatBRL(item.estimatedCost)}</p>
                                          {isCompleted && <p className="text-emerald-600 font-medium">Exec: {formatBRL(item.cost)}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-[11px] font-normal">
                                          <p className={isOverdue ? 'text-red-600' : 'text-slate-500'}>Venc: {safeFormatDate(item.nextExecutionDate)}</p>
                                          {item.lastExecutionDate && <p className="text-emerald-600 font-medium">Concl: {safeFormatDate(item.lastExecutionDate)}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenViewModal(item)} className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shadow-sm" title="Visualizar">
                                                <Eye size={16}/>
                                            </button>
                                            {canEdit && (
                                                <button onClick={() => handleOpenModal(item)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all shadow-sm" title="Editar">
                                                    <Edit2 size={16}/>
                                                </button>
                                            )}
                                            {canEdit && (
  isCompleted ? (
    <button
      type="button"
      onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onClick={() => handleUndoComplete(item.id)}
      disabled={isUndoing === item.id}
      className="relative z-30 p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-all shadow-sm"
      title="Desfazer Conclusão"
    >
      {isUndoing === item.id ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <RotateCcw size={16} />
      )}
    </button>
  ) : (
    <button
      type="button"
      onClick={() => handleOpenCompleteModal(item)}
      className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all shadow-sm"
      title="Concluir"
    >
      <Check size={16} />
    </button>
  )
)}


                                            
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>
        )}
      </div>

      {showViewModal && itemToView && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[80] p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Eye size={24} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight truncate">
                                {itemToView.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${getTypeClasses(itemToView.type)}`}>
                                    {itemToView.type}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">Visualização de registro</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setShowViewModal(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={20} /></button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/30">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">1. Informações Gerais</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Condomínio</label>
                                <p className="text-sm font-semibold text-slate-800">{condos.find(c => c.id === itemToView.condoId)?.name || 'N/A'}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Categoria</label>
                                <p className="text-sm font-semibold text-slate-800">{itemToView.category}</p>
                            </div>
                            <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Status Operacional</label>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${getSimplifiedStatus(itemToView) === "Vencida" ? 'bg-red-500' : getSimplifiedStatus(itemToView) === "Concluída" ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                    <p className="text-sm font-semibold text-slate-800">{getSimplifiedStatus(itemToView)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">2. Datas e Ciclo</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Próximo Vencimento</label>
                                <p className={`text-sm font-semibold ${getSimplifiedStatus(itemToView) === "Vencida" ? 'text-red-600' : 'text-slate-800'}`}>
                                    {safeFormatDate(itemToView.nextExecutionDate)}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Última Execução</label>
                                <p className="text-sm font-semibold text-emerald-600">{safeFormatDate(itemToView.lastExecutionDate)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Frequência</label>
                                <p className="text-sm font-semibold text-slate-800">
                                    {itemToView.type === MaintenanceType.CORRECTIVE ? '—' : `${itemToView.frequencyType} ${itemToView.frequencyDays ? `(${itemToView.frequencyDays}d)` : ''}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">3. Fornecedor e Custos</h4>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Valor Estimado</label>
                                    <p className="text-sm font-semibold text-slate-800">{formatBRL(itemToView.estimatedCost)}</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Valor da Execução</label>
                                    <p className="text-sm font-semibold text-emerald-600">{formatBRL(itemToView.cost)}</p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-50">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-wider">Empresa Responsável</label>
                                {itemToView.providerName ? (
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-slate-800">{itemToView.providerName}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
                                            <div className="flex items-center gap-1.5 font-medium"><UserIcon size={12}/> {itemToView.providerContact || 'Sem contato'}</div>
                                            <div className="flex items-center gap-1.5 font-medium"><Phone size={12}/> {itemToView.providerPhone || 'Sem telefone'}</div>
                                            <div className="flex items-center gap-1.5 font-medium md:col-span-2"><Mail size={12}/> {itemToView.providerEmail || 'Sem email'}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm italic text-slate-400 font-medium">Nenhum fornecedor vinculado.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {itemToView.description && (
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">4. Descrição / Observações</h4>
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-sm text-slate-800 font-semibold leading-relaxed whitespace-pre-line">{itemToView.description}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">5. Documentos e Anexos</h4>
                        {itemToView.attachments && itemToView.attachments.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                                {itemToView.attachments.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-2xl group transition-all hover:border-blue-300">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2 rounded-lg shrink-0 ${getDocTypeColor(doc.type)}`}>
                                                <FileText size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{doc.fileName}</p>
                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border ${getDocTypeColor(doc.type)}`}>
                                                    {doc.type}
                                                </span>
                                            </div>
                                        </div>
                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Ver Arquivo">
                                            <ExternalLink size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum documento anexado</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
                    {canEdit && (
                        <button onClick={() => { setShowViewModal(false); handleOpenModal(itemToView); }} className="px-6 py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-blue-100 transition-all flex items-center gap-2">
                            <Edit2 size={14} /> Editar Registro
                        </button>
                    )}
                    <button onClick={() => setShowViewModal(false)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Wrench size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{editingId ? 'Editar Manutenção' : 'Nova Manutenção'}</h3>
                            <p className="text-sm text-slate-500 font-medium">Gestão de cronograma e recorrência.</p>
                        </div>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={20} /></button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
                    <form id="maintenanceForm" onSubmit={handleSave} className="space-y-8 font-sans">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider"><Info size={14} /> Detalhes da Atividade</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Título da Atividade *</label>
                                    <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-blue-500/50 outline-none text-sm font-medium transition-all" required value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Manutenção de Elevadores" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><AlignLeft size={12} /> Descrição / Observações</label>
                                    <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-blue-500/50 outline-none text-sm font-medium transition-all min-h-[100px] resize-none" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descreva detalhes técnicos, pontos de atenção ou histórico relevante..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Condomínio *</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-blue-500/50 outline-none text-sm font-medium transition-all" required value={formData.condoId || ''} onChange={e => setFormData({...formData, condoId: e.target.value})}>
                                        <option value="">Selecionar...</option>
                                        {condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Categoria *</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-blue-500/50 outline-none text-sm font-medium transition-all" required value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        <option value="">Selecionar...</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider"><RotateCcw size={14} /> Ciclo e Agendamento</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tipo de Manutenção *</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button type="button" onClick={() => setFormData({...formData, type: MaintenanceType.PREVENTIVE})} className={`p-4 rounded-2xl border text-[11px] font-semibold uppercase tracking-wider transition-all ${formData.type === MaintenanceType.PREVENTIVE ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>Preventiva</button>
                                        <button type="button" onClick={() => setFormData({...formData, type: MaintenanceType.CORRECTIVE})} className={`p-4 rounded-2xl border text-[11px] font-semibold uppercase tracking-wider transition-all ${formData.type === MaintenanceType.CORRECTIVE ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>Corretiva</button>
                                    </div>
                                </div>
                                
                                {!isCorrective && (
                                    <div className="p-6 rounded-[32px] border bg-slate-50 border-slate-100 shadow-inner md:col-span-2 space-y-4">
                                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider"><Timer size={14} /> Periodicidade</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Frequência</label>
                                                <select className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" required value={formData.frequencyType || ''} onChange={e => setFormData({...formData, frequencyType: e.target.value as FrequencyType})}>
                                                    {Object.values(FrequencyType).map(type => <option key={type} value={type}>{type}</option>)}
                                                </select>
                                            </div>
                                            {formData.frequencyType === FrequencyType.CUSTOM && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">A cada (dias) *</label>
                                                    <input type="number" className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" required value={formData.frequencyDays || ''} onChange={e => setFormData({...formData, frequencyDays: parseInt(e.target.value) || 0})} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{isCorrective ? 'Data Programada *' : 'Próximo Vencimento *'}</label>
                                    <input type="date" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-blue-500/50 outline-none text-sm font-medium transition-all" required value={formData.nextExecutionDate || ''} onChange={e => setFormData({...formData, nextExecutionDate: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider"><Briefcase size={14} /> Responsável e Orçamento</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[32px] border bg-slate-50/50 border-slate-100 shadow-sm">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Prestador de Serviço</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-4 top-4 text-slate-300" size={16} />
                                        <select className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-blue-500/50 outline-none text-sm font-medium transition-all appearance-none" value={formData.providerId || ''} onChange={e => handleProviderChange(e.target.value)}>
                                            <option value="">Nenhum / Selecionar...</option>
                                            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Valor Estimado</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-4 text-slate-300" size={16} />
                                        <input type="text" className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-blue-500/50 outline-none text-sm font-medium transition-all" value={formatBRL(formData.estimatedCost)} onChange={e => handleCurrencyInputChange(e, (val) => setFormData({...formData, estimatedCost: val}))} placeholder="R$ 0,00" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider"><Paperclip size={14} /> Documentos e Anexos</div>
                            <div className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Documento</label>
                                        <select className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all" value={selectedFileType} onChange={(e) => setSelectedFileType(e.target.value)}>
                                            <option value={AttachmentType.BUDGET}>Orçamentos</option>
                                            <option value={AttachmentType.INVOICE}>Notas Fiscais</option>
                                            <option value={AttachmentType.ART_RRT}>ART / RRT</option>
                                            <option value={AttachmentType.TECHNICAL_REPORT}>Laudos Técnicos</option>
                                            <option value={AttachmentType.MAINTENANCE_REPORT}>Relatórios</option>
                                            <option value={AttachmentType.CERTIFICATE}>Certificados</option>
                                            <option value={AttachmentType.OTHER}>Outros</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, false)} className="hidden" multiple />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600 p-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider">
                                            <Upload size={16} /> Selecionar Arquivos
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arquivos Anexados ({formData.attachments?.length || 0})</h4>
                                    {formData.attachments && formData.attachments.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2">
                                            {formData.attachments.map((doc, index) => (
                                                <div key={index} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-2xl group animate-in slide-in-from-left-2 duration-200">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`p-2 rounded-lg shrink-0 ${getDocTypeColor(doc.type)}`}><FileText size={16} /></div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{doc.fileName}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border ${getDocTypeColor(doc.type)}`}>{doc.type}</span>
                                                               <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
  <Clock size={10} />
  {(() => {
    const d = parseUploadDate(doc.uploadDate);
    return isValid(d) ? format(d, 'dd/MM/yy HH:mm') : '--/--/-- --:--';
  })()}
</span>


                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => removeAttachment(index, false)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <Paperclip className="mx-auto text-slate-300 mb-2" size={24} />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum documento anexado</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 shrink-0">
                    <button onClick={() => setShowModal(false)} className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider hover:text-slate-800 transition-colors">Cancelar</button>
                    <button type="submit" form="maintenanceForm" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-semibold text-xs uppercase tracking-wider shadow-xl hover:bg-blue-700 active:scale-95 transition-all shadow-blue-100">{editingId ? 'Atualizar' : 'Criar Manutenção'}</button>
                </div>
            </div>
        </div>
      )}

      {showCompleteModal && itemToComplete && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[70] p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Concluir Manutenção</h3>
                            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">{itemToComplete.title}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowCompleteModal(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-8 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
                    <form id="completeForm" onSubmit={handleCompleteSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider"><Calendar size={14} /> Dados da Execução e Custo</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Data de Execução *</label>
                                    <input type="date" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-emerald-500/50 outline-none text-sm font-medium transition-all" value={completeData.date} onChange={e => setCompleteData({...completeData, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Custo Final</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-4 text-slate-300" size={16} />
                                        <input type="text" className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500/50 outline-none text-sm font-medium transition-all" value={formatBRL(completeData.cost)} onChange={e => handleCurrencyInputChange(e, (val) => setCompleteData({...completeData, cost: val}))} placeholder="R$ 0,00" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Previsto: {formatBRL(itemToComplete.estimatedCost)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider"><Briefcase size={14} /> Fornecedor (Conferência)</div>
                            <div className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nome da Empresa</label>
                                        <input className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none text-sm font-medium transition-all" value={completeData.providerName} onChange={e => setCompleteData({...completeData, providerName: e.target.value})} placeholder="Ex: Elevadores Silva" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pessoa de Contato</label>
                                        <input className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none text-sm font-medium transition-all" value={completeData.providerContact} onChange={e => setCompleteData({...completeData, providerContact: e.target.value})} placeholder="Técnico responsável" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Telefone</label>
                                        <input className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none text-sm font-medium transition-all" value={completeData.providerPhone} onChange={e => setCompleteData({...completeData, providerPhone: e.target.value})} placeholder="(00) 00000-0000" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">E-mail</label>
                                        <input type="email" className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none text-sm font-medium transition-all" value={completeData.providerEmail} onChange={e => setCompleteData({...completeData, providerEmail: e.target.value})} placeholder="email@prestador.com" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-wider"><Paperclip size={14} /> Documentação Final</div>
                            <div className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Documento</label>
                                        <select className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500" value={selectedFileType} onChange={(e) => setSelectedFileType(e.target.value)}>
                                            <option value={AttachmentType.BUDGET}>Orçamentos</option>
                                            <option value={AttachmentType.INVOICE}>Notas Fiscais</option>
                                            <option value={AttachmentType.ART_RRT}>ART / RRT</option>
                                            <option value={AttachmentType.TECHNICAL_REPORT}>Laudos Técnicos</option>
                                            <option value={AttachmentType.MAINTENANCE_REPORT}>Relatórios</option>
                                            <option value={AttachmentType.CERTIFICATE}>Certificados</option>
                                            <option value={AttachmentType.OTHER}>Outros</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <input type="file" ref={completeFileInputRef} onChange={(e) => handleFileUpload(e, true)} className="hidden" multiple />
                                        <button type="button" onClick={() => completeFileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 p-3 rounded-xl font-bold text-xs uppercase tracking-wider">
                                            <Upload size={16} /> Selecionar Arquivos
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arquivos da Execução ({completeData.attachments?.length || 0})</h4>
                                    {completeData.attachments && completeData.attachments.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2">
                                            {completeData.attachments.map((doc, index) => (
                                                <div key={index} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-2xl group animate-in slide-in-from-left-2 duration-200">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`p-2 rounded-lg shrink-0 ${getDocTypeColor(doc.type)}`}><FileText size={16} /></div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{doc.fileName}</p>
                                                            <div className="flex items-center gap-2 mt-1"><span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border ${getDocTypeColor(doc.type)}`}>{doc.type}</span></div>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => removeAttachment(index, true)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <Paperclip className="mx-auto text-slate-300 mb-2" size={24} />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum documento final</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 shrink-0">
                    <button type="button" onClick={() => setShowCompleteModal(false)} className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider hover:text-slate-800 transition-colors">Cancelar</button>
                    <button type="submit" form="completeForm" disabled={isCompleting} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-semibold text-xs uppercase tracking-wider shadow-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-emerald-100">{isCompleting ? 'Processando...' : 'Confirmar Execução'}</button>
                </div>
            </div>
        </div>
      )}

      {itemToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                  <div className="p-10 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mb-6 shadow-inner"><Trash2 size={32} /></div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Remover?</h3>
                      <p className="text-sm text-slate-500 font-medium px-4 leading-relaxed">Esta ação apagará <strong>{itemToDelete.title}</strong> permanentemente.</p>
                  </div>
                  <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                      <button onClick={confirmDelete} disabled={isDeleting} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold uppercase text-xs tracking-wider shadow-xl active:scale-95 disabled:opacity-50 hover:bg-rose-700 transition-colors shadow-rose-100">{isDeleting ? 'Excluindo...' : 'Sim, Excluir'}</button>
                      <button onClick={() => setItemToDelete(null)} className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold uppercase text-xs tracking-wider transition-all hover:bg-slate-50">Cancelar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default MaintenanceList;
