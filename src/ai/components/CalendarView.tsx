import React, { useState, useEffect } from 'react';
import { getMaintenances, getCondos } from '../services/storageService';
import { Maintenance, MaintenanceStatus, Condo } from '../types';
import { format, eachDayOfInterval, isSameMonth, isSameDay, addMonths, isValid, differenceInDays } from 'date-fns';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Tag, Loader2, Printer, Building, Clock, Wrench } from 'lucide-react';
import { logger } from "../../shared/observability/logger";
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => {
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    next.setDate(0);
    return next;
};
const startOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay(); 
    const diff = date.getDate() - day;
    const newD = new Date(date.setDate(diff));
    newD.setHours(0,0,0,0);
    return newD;
};
const endOfWeek = (d: Date) => {
    const start = startOfWeek(d);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23,59,59,999);
    return end;
};
const subMonths = (date: Date, months: number) => {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() - months);
    if (d.getDate() !== day) d.setDate(0);
    return d;
};

const parseISO = (dateStr: string | undefined | null): Date => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(NaN);
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

const getStatusColor = (item: Maintenance) => {
  // ✅ concluídas
  if (item.status === MaintenanceStatus.COMPLETED) {
    return "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100";
  }

  // ⚠️ itens com vencimento
  if (item.nextExecutionDate) {
    const diff = differenceInDays(parseISO(item.nextExecutionDate), new Date());

    // 🔴 vencidas
    if (diff < 0) {
      return "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100";
    }

    // 🟡 em dia / a vencer
    return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
  }

  // neutro
  return "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100";
};

const MaintenanceCard: React.FC<{ item: Maintenance; condoName: string; onClick?: (e: any) => void }> = ({ item, condoName, onClick }) => (
  <div onClick={onClick} className={`px-1.5 py-1 rounded border cursor-pointer transition shadow-sm hover:opacity-80 ${getStatusColor(item)}`}>
      <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 font-bold text-[10px] leading-tight overflow-hidden"><span className="truncate w-full">{condoName}</span></div>
          <div className="flex items-center gap-1 opacity-90 text-[9px] leading-tight overflow-hidden"><Tag size={8} className="shrink-0" /> <span className="truncate">{item.title}</span></div>
      </div>
  </div>
);

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<Maintenance[]>([]);
  const [condos, setCondos] = useState<Condo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCondoId, setSelectedCondoId] = useState('all');
  const [selectedItem, setSelectedItem] = useState<Maintenance | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [m, c] = await Promise.all([getMaintenances(), getCondos()]);
        setItems(m); setCondos(c);
      } catch (e) { logger.error("Unexpected error", e); } finally { setLoading(false); }
    };
    load();
  }, []);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const filteredItems = items.filter(item => selectedCondoId === 'all' || item.condoId === selectedCondoId);
  const getDayItems = (day: Date) => filteredItems.filter(item => {
    if (!item.nextExecutionDate) return false;
    try {
        const date = parseISO(item.nextExecutionDate);
        return isValid(date) && isSameDay(date, day);
    } catch { return false; }
  });

  const getCondoName = (id: string) => condos.find(c => c.id === id)?.name || 'Condomínio';
  const formatMonth = (date: Date) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)] print:h-auto">
      <div className="p-4 flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-200 gap-4 print:hidden">
        <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><CalendarIcon className="text-blue-600" /> {formatMonth(currentDate)}</h2>
            <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200"><ChevronLeft size={20} /></button>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200"><ChevronRight size={20} /></button>
            </div>
        </div>
        <div className="flex items-center gap-3">
          <select className="pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none" value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)}>
            <option value="all">Todos os Condomínios</option>
            {condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => window.print()} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"><Printer size={18} /></button>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="p-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">{day}</div>
        ))}
        {calendarDays.map((day) => {
          const dayItems = getDayItems(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);
          return (
            <div key={day.toISOString()} className={`min-h-[100px] border-r border-b border-slate-100 p-1 flex flex-col gap-1 ${!isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'} ${isToday ? 'bg-blue-50/30' : ''}`}>
              <div className={`text-[10px] font-bold p-1 rounded-md w-6 h-6 flex items-center justify-center ${isToday ? 'bg-blue-600 text-white shadow-sm' : isCurrentMonth ? 'text-slate-600' : 'text-slate-300'}`}>{format(day, 'd')}</div>
              <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] scrollbar-none">{dayItems.map(item => (<MaintenanceCard key={item.id} item={item} condoName={getCondoName(item.condoId)} onClick={() => setSelectedItem(item)} />))}</div>
            </div>
          );
        })}
      </div>
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-bold text-slate-900">{selectedItem.title}</h3><button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-50 rounded-xl"><X size={20}/></button></div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600"><Building size={16} className="text-blue-500" /><span className="font-bold">{getCondoName(selectedItem.condoId)}</span></div>
              <div className="flex items-center gap-3 text-sm text-slate-600"><Clock size={16} className="text-blue-500" /><span>Vencimento: <strong>{format(parseISO(selectedItem.nextExecutionDate), 'dd/MM/yyyy')}</strong></span></div>
              <div className="flex items-center gap-3 text-sm text-slate-600"><Tag size={16} className="text-blue-500" /><span>Categoria: <strong>{selectedItem.category}</strong></span></div>
              <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 leading-relaxed italic">{selectedItem.description || 'Sem descrição adicional.'}</div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end"><button onClick={() => setSelectedItem(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CalendarView;
18446744073709551615