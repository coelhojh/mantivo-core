import { getStatus3, STATUS3_LABEL, STATUS3_COLOR_TOKEN } from '../../shared/utils/maintenanceStatus';
import React, { useEffect, useMemo, useState } from 'react';
import { getMaintenances, getCondos } from '../services/storageService';
import { Maintenance, Condo } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Filter,
  Building,
  Loader2,
  LayoutDashboard,
  Calendar,
} from 'lucide-react';
import { differenceInDays, format, isValid } from 'date-fns';
import UpgradeModal from './UpgradeModal';

/* ============================================================================
   Helpers
============================================================================ */

const parseDateOnly = (dateStr?: string | null): Date => {
  if (!dateStr) return new Date(NaN);
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/* ============================================================================
   Tooltip
============================================================================ */

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      {label ? (
        <div className="mb-1 text-[11px] font-semibold text-slate-700">{label}</div>
      ) : null}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex justify-between gap-6 text-[11px]">
            <span className="text-slate-600">{p.name}</span>
            <span className="font-semibold text-slate-900">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
   Dashboard
============================================================================ */

const Dashboard: React.FC = () => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [filtered, setFiltered] = useState<Maintenance[]>([]);
  const [condos, setCondos] = useState<Condo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [selectedCondo, setSelectedCondo] = useState('all');
  const [timeRange, setTimeRange] = useState('all');

  /* ------------------------------------------------------------------------ */
  /* Load */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getMaintenances();
        const condosData = await getCondos();
        setMaintenances(data);
        setFiltered(data);
        setCondos(condosData);
      } catch (e) {
        console.error('Dashboard load error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Filters */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let data = [...maintenances];
    const now = new Date();

    if (selectedCondo !== 'all') {
      data = data.filter((m) => m.condoId === selectedCondo);
    }

    if (timeRange !== 'all') {
      const limit = Number(timeRange);
      data = data.filter((m) => {
        if (!m.nextExecutionDate) return false;
        const d = parseDateOnly(m.nextExecutionDate);
        if (!isValid(d)) return false;
        return differenceInDays(d, now) <= limit;
      });
    }

    setFiltered(data);
  }, [maintenances, selectedCondo, timeRange]);

  /* ------------------------------------------------------------------------ */
  /* Stats (3 estados padronizados) */
  /* ------------------------------------------------------------------------ */

  const stats = useMemo(() => {
    const now = new Date();

    let overdue = 0;
    let onTime = 0;
    let completed = 0;

    for (const m of filtered) {
      const s = getStatus3(m, now);
      if (s === 'COMPLETED') completed++;
      else if (s === 'OVERDUE') overdue++;
      else onTime++;
    }

    return {
      total: filtered.length,
      overdue,
      onTime,
      completed,
    };
  }, [filtered]);

  /* ------------------------------------------------------------------------ */
  /* Charts */
  /* ------------------------------------------------------------------------ */

  const statusData = useMemo(() => {
    return (['OVERDUE', 'ON_TIME', 'COMPLETED'] as const).map((k) => ({
      name: STATUS3_LABEL[k],
      value: k === 'OVERDUE' ? stats.overdue : k === 'ON_TIME' ? stats.onTime : stats.completed,
      color: STATUS3_COLOR_TOKEN[k], // já é CSS válido: rgb(var(--...))
    }));
  }, [stats]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((m) => {
      const key = m.category || 'Sem categoria';
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filtered]);

  const upcomingList = useMemo(() => {
    const now = new Date();

    return [...filtered]
      .filter((m) => {
        if (!m.nextExecutionDate) return false;
        const s = getStatus3(m, now);
        return s === 'ON_TIME'; // "Próximos ciclos" = tudo que ainda não venceu e não foi concluído
      })
      .sort((a, b) => {
        const da = parseDateOnly(a.nextExecutionDate);
        const db = parseDateOnly(b.nextExecutionDate);
        return da.getTime() - db.getTime();
      })
      .slice(0, 6);
  }, [filtered]);

  /* ------------------------------------------------------------------------ */
  /* Render */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} reason="general" />}

      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
            <span className="h-2 w-2 rounded-full" style={{ background: 'rgb(var(--primary))' }} />
            Visão geral operacional
          </div>

          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <span
              className="grid h-10 w-10 place-items-center rounded-2xl ring-1 ring-black/5"
              style={{ background: 'rgb(var(--primary)/0.08)' }}
            >
              <LayoutDashboard size={20} className="text-[rgb(var(--primary))]" />
            </span>
            Painel Estratégico
          </h2>

          <p className="text-sm text-slate-600">
            Status padronizados: <span className="font-semibold">Vencidas</span>,{' '}
            <span className="font-semibold">Em dia</span> e{' '}
            <span className="font-semibold">Concluídas</span>.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative">
            <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select className="input pl-9 sm:w-64" value={selectedCondo} onChange={(e) => setSelectedCondo(e.target.value)}>
              <option value="all">Todas as unidades</option>
              {condos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select className="input pl-9 sm:w-56" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="all">Todo o período</option>
              <option value="7">Próximos 7 dias</option>
              <option value="30">Próximos 30 dias</option>
              <option value="90">Próximos 90 dias</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, icon: TrendingUp, color: 'rgb(var(--primary))' },
          { label: 'Em dia', value: stats.onTime, icon: Clock, color: 'rgb(var(--primary))' },
          { label: 'Vencidas', value: stats.overdue, icon: AlertCircle, color: 'rgb(var(--danger))' },
          { label: 'Concluídas', value: stats.completed, icon: CheckCircle, color: 'rgb(var(--success))' },
        ].map((kpi, i) => (
          <div key={i} className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between gap-4">
              <div>
                <p className="label-eyebrow">{kpi.label}</p>
                <p className="mt-2 text-3xl font-semibold">{kpi.value}</p>
              </div>
              <kpi.icon size={22} style={{ color: kpi.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 surface p-6">
          <h3 className="mb-3 font-semibold">Status operacional</h3>
          <div className="h-[320px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={60} outerRadius={95}>
                  {statusData.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <ReTooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-6">
          <h3 className="mb-3 font-semibold">Maiores incidências</h3>
          <div className="h-[320px]">
            <ResponsiveContainer>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} />
                <ReTooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="rgb(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Upcoming (ON_TIME) */}
      <div className="surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Próximos ciclos (Em dia)</h3>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
            <Calendar size={14} className="text-slate-500" />
            Agenda
          </span>
        </div>

        {upcomingList.length ? (
          <div className="space-y-3">
            {upcomingList.map((m) => {
              const d = parseDateOnly(m.nextExecutionDate);
              const condoName = condos.find((c) => c.id === m.condoId)?.name;

              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <div className="w-14 text-center font-semibold text-[rgb(var(--primary))]">
                    {isValid(d) ? format(d, 'dd/MM') : '--/--'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-slate-900">{m.title}</p>
                    <p className="truncate text-xs text-slate-500">{condoName || '—'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhum ciclo em dia para o recorte selecionado.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
