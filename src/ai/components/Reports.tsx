import React, { useState, useEffect } from 'react';
import { getMaintenances, getCondos } from '../services/storageService';
import { Maintenance, Condo, MaintenanceStatus } from '../types';
import { Filter, Calendar, FileText, Loader2, Printer, Building, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { format, isAfter, isBefore, endOfDay, isValid } from 'date-fns';
import { logger } from "../../shared/observability/logger";

const startOfDay = (d: Date) => {
  const newDate = new Date(d);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const parseDate = (dateStr: string | undefined | null): Date => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(NaN);
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

const Reports: React.FC = () => {
  const [condos, setCondos] = useState<Condo[]>([]);
  const [items, setItems] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCondoId, setSelectedCondoId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const c = await getCondos();
        const m = await getMaintenances();
        setCondos(c);
        setItems(m);
      } catch(e) { logger.error("Error", e); }
      setLoading(false);
    };
    load();
  }, []);

  const filteredItems = items.filter(item => {
    const condoMatch = selectedCondoId === 'all' || item.condoId === selectedCondoId;
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    let dateMatch = true;
    if (startDate && endDate) {
      if (!item.nextExecutionDate) return false;
      try {
        const itemDate = parseDate(item.nextExecutionDate);
        if (!isValid(itemDate)) return false;
        const start = startOfDay(parseDate(startDate));
        const end = endOfDay(parseDate(endDate));
        dateMatch = (isAfter(itemDate, start) || itemDate.getTime() === start.getTime()) && (isBefore(itemDate, end) || itemDate.getTime() === end.getTime());
      } catch { return false; }
    }
    return condoMatch && statusMatch && dateMatch;
  }).sort((a, b) => {
    const condoNameA = condos.find(c => c.id === a.condoId)?.name || '';
    const condoNameB = condos.find(c => c.id === b.condoId)?.name || '';
    if (condoNameA !== condoNameB) return condoNameA.localeCompare(condoNameB);
    return (a.nextExecutionDate || '').localeCompare(b.nextExecutionDate || '');
  });

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    window.print();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" />
            Relatórios Gerenciais
          </h2>
          <p className="text-sm text-slate-500">Documentos para prestação de contas e planejamento.</p>
        </div>
        <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold shadow-lg shadow-blue-100">
          <Printer size={18} /> Imprimir / PDF
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 no-print space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold border-b pb-2"> <Filter size={18} /> Filtros de Relatório </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Condomínio</label>
                <select className="w-full border p-2 rounded-lg text-sm bg-slate-50 outline-none" value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)}>
                    <option value="all">Todos</option>
                    {condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
                <select className="w-full border p-2 rounded-lg text-sm bg-slate-50 outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">Todos</option>
                    {Object.values(MaintenanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">De</label>
                <input type="date" className="w-full p-2 border rounded-lg text-sm bg-slate-50 outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Até</label>
                <input type="date" className="w-full p-2 border rounded-lg text-sm bg-slate-50 outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm print:shadow-none print:border-none">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-2xl">M</div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Relatório Operacional</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sistema Mantivo • Gestão de Manutenção</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Emitido em</p>
                <p className="text-sm font-bold text-slate-800">{format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Analisado</p>
                <p className="text-2xl font-black text-slate-900">{filteredItems.length}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Concluídas</p>
                <p className="text-2xl font-black text-emerald-700">{filteredItems.filter(i => i.status === MaintenanceStatus.COMPLETED).length}</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Pendentes/Vencidas</p>
                <p className="text-2xl font-black text-rose-700">{filteredItems.filter(i => i.status !== MaintenanceStatus.COMPLETED).length}</p>
            </div>
        </div>

        <div className="space-y-1">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-900 text-white">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-tl-xl">Data Ref.</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Condomínio</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Manutenção</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Status</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right rounded-tr-xl">Custo</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-x border-b border-slate-200">
                    {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="px-4 py-4 text-xs font-bold text-slate-600">
                                {item.status === MaintenanceStatus.COMPLETED ? format(parseDate(item.lastExecutionDate), 'dd/MM/yy') : format(parseDate(item.nextExecutionDate), 'dd/MM/yy')}
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-slate-900 uppercase">
                                {condos.find(c => c.id === item.condoId)?.name}
                            </td>
                            <td className="px-4 py-4">
                                <p className="text-xs font-black text-slate-800 leading-tight">{item.title}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{item.category}</p>
                            </td>
                            <td className="px-4 py-4">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                    item.status === MaintenanceStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                                    item.status === MaintenanceStatus.OVERDUE ? 'bg-rose-100 text-rose-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {item.status}
                                </span>
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-slate-900 text-right">
                                {item.cost > 0 ? item.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : (item.estimatedCost ? item.estimatedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—')}
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={5} className="px-4 py-20 text-center text-slate-400 font-bold italic">Nenhum registro encontrado para os filtros selecionados.</td></tr>
                    )}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-100">
                        <td colSpan={4} className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total Acumulado</td>
                        <td className="px-4 py-4 text-sm font-black text-slate-900 text-right">
                            {filteredItems.reduce((acc, curr) => acc + (curr.cost || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <div className="mt-20 flex justify-between items-end gap-10">
            <div className="flex-1 border-t border-slate-300 pt-2 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assinatura do Responsável Técnico</p>
            </div>
            <div className="flex-1 border-t border-slate-300 pt-2 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assinatura do Síndico / Gestor</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;18446744073709551614