
import React, { useEffect, useState } from 'react';
import { getMaintenances, getUser, getCondos } from '../services/storageService';
import { checkAndSendNotifications } from '../services/notificationService';
import { Maintenance, MaintenanceStatus, Condo } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Crown, Bell, Calendar, Filter, Building, Loader2, LayoutDashboard } from 'lucide-react';
import { differenceInDays, format, isValid } from 'date-fns';
import UpgradeModal from './UpgradeModal';

const parseDate = (dateStr: string | undefined | null): Date => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(NaN);
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

const Dashboard: React.FC = () => {
  const [allMaintenances, setAllMaintenances] = useState<Maintenance[]>([]);
  const [filteredData, setFilteredData] = useState<Maintenance[]>([]);
  const [condos, setCondos] = useState<Condo[]>([]);
  const [notificationsSent, setNotificationsSent] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [selectedCondo, setSelectedCondo] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('all');

  const user = getUser();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getMaintenances();
        const condosData = await getCondos();
        setAllMaintenances(data);
        setFilteredData(data);
        setCondos(condosData);
      } catch (e) {
          console.error("Dashboard Load Error", e);
      } finally {
          setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let data = [...allMaintenances];
    if (selectedCondo !== 'all') data = data.filter(m => m.condoId === selectedCondo);
    if (timeRange !== 'all') {
      const daysLimit = parseInt(timeRange);
      const today = new Date();
      data = data.filter(m => {
        if (!m.nextExecutionDate) return false;
        try {
            const nextDate = parseDate(m.nextExecutionDate);
            if (!isValid(nextDate)) return false;
            const diff = differenceInDays(nextDate, today);
            return diff <= daysLimit; 
        } catch { return false; }
      });
    }
    setFilteredData(data);
  }, [selectedCondo, timeRange, allMaintenances]);

  const stats = {
    total: filteredData.length,
    completed: filteredData.filter(m => m.status === MaintenanceStatus.COMPLETED).length,
    overdue: filteredData.filter(m => m.status === MaintenanceStatus.OVERDUE).length,
    upcoming: filteredData.filter(m => m.status === MaintenanceStatus.ON_TIME || m.status === MaintenanceStatus.WARNING).length,
  };

  const statusData = [
    { name: 'Em dia', value: filteredData.filter(m => m.status === MaintenanceStatus.ON_TIME).length, color: '#3b82f6' },
    { name: 'Atenção', value: filteredData.filter(m => m.status === MaintenanceStatus.WARNING).length, color: '#f59e0b' },
    { name: 'Vencidas', value: stats.overdue, color: '#ef4444' },
    { name: 'Concluídas', value: stats.completed, color: '#10b981' },
  ];

  const categoryCounts = filteredData.reduce((acc, curr) => {
    const cat = curr.category;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 5); 

  const upcomingList = [...filteredData]
    .filter(m => m.status !== MaintenanceStatus.COMPLETED && m.nextExecutionDate)
    .sort((a, b) => {
        try {
            const dateA = parseDate(a.nextExecutionDate).getTime();
            const dateB = parseDate(b.nextExecutionDate).getTime();
            return dateA - dateB;
        } catch { return 0; }
    })
    .slice(0, 5); 

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="space-y-6 pb-10">
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} reason="general" />}

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" />
            Painel Estratégico
          </h2>
        </div>
         
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Building className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <select 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none w-full sm:w-64"
              value={selectedCondo}
              onChange={(e) => setSelectedCondo(e.target.value)}
            >
              <option value="all">Todas as Unidades</option>
              {condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <select 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none w-full sm:w-64"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="all">Todo o Período</option>
              <option value="7">Próximos 7 dias</option>
              <option value="30">Próximos 30 dias</option>
              <option value="90">Próximos 90 dias</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', val: stats.total, icon: TrendingUp, color: 'blue' },
          { label: 'Concluídas', val: stats.completed, icon: CheckCircle, color: 'emerald' },
          { label: 'Vencidas', val: stats.overdue, icon: AlertCircle, color: 'rose' },
          { label: 'A Vencer', val: stats.upcoming, icon: Clock, color: 'blue' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-2xl font-black text-slate-800">{kpi.val}</p>
            </div>
            <div className={`p-3 rounded-xl ${
              kpi.color === 'blue' ? 'bg-blue-50 text-blue-600' :
              kpi.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
              kpi.color === 'amber' ? 'bg-amber-50 text-amber-600' :
              'bg-rose-50 text-rose-600'
            }`}>
              <kpi.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[350px]">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">Status Operacional</h3>
                <div className="h-full pb-10">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                      <Pie data={statusData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                          {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <ReTooltip />
                      </PieChart>
                  </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[350px]">
                <h3 className="font-bold text-slate-800 mb-4">Maiores Incidências</h3>
                {categoryData.length > 0 ? (
                    <div className="h-full pb-10">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoryData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                            <ReTooltip />
                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                          </BarChart>
                      </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sem dados suficientes</div>
                )}
            </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">Próximos Ciclos</h3>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">Agenda</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {upcomingList.length > 0 ? upcomingList.map(item => {
                     const nextDate = parseDate(item.nextExecutionDate);
                     if(!isValid(nextDate)) return null;
                     const isLate = item.status === MaintenanceStatus.OVERDUE;
                     const isNear = item.status === MaintenanceStatus.WARNING;
                     return (
                        <div key={item.id} className="flex gap-3 items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-all group">
                            <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 border ${
                              isLate ? 'bg-rose-50 border-rose-100 text-rose-600' : 
                              isNear ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                              'bg-blue-50 border-blue-100 text-blue-600'
                            }`}>
                                <span className="text-[8px] font-bold uppercase">{format(nextDate, 'MMM')}</span>
                                <span className="text-lg font-black leading-none">{format(nextDate, 'dd')}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                                <p className="text-[10px] text-slate-400 font-bold truncate uppercase">{condos.find(c => c.id === item.condoId)?.name}</p>
                            </div>
                        </div>
                     );
                }) : <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                    <Calendar size={48} className="opacity-20 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">Agenda Livre</p>
                </div>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
