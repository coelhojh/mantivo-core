import {
  getStatus3,
  STATUS3_LABEL,
  STATUS3_COLOR_TOKEN,
} from "../../shared/utils/maintenanceStatus";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getMaintenances, getCondos } from "../services/storageService";
import { useTenantDataLoader } from "../tenant/useTenantDataLoader";
import { Maintenance, Condo } from "../types";
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
} from "recharts";
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
} from "lucide-react";
import { differenceInDays, format, isValid } from "date-fns";
import UpgradeModal from "./UpgradeModal";

import { logger } from "../../shared/observability/logger";
import { useTenant } from "../tenant/TenantContext";

import { PieLegend } from "./dashboard/PieLegend";
import { EmptyState } from "./ui/EmptyState";

import { Skeleton } from "./ui/Skeleton";
import { Reveal } from "./ui/Reveal";

const cardBase =
  "rounded-2xl bg-[rgb(var(--surface))] ring-1 ring-black/5 dark:ring-white/10 shadow-sm transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md";

/* ============================================================================
   Helpers
============================================================================ */

const parseDateOnly = (dateStr?: string | null): Date => {
  if (!dateStr) return new Date(NaN);
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/* ============================================================================
   Tooltip
============================================================================ */

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-black/5 bg-[rgb(var(--surface))] px-3 py-2 shadow-lg shadow-black/5 dark:border-white/10 dark:shadow-black/20">
      {label ? (
        <div className="mb-1 text-[11px] uppercase tracking-wide text-black/50 dark:text-white/50">
          {label}
        </div>
      ) : null}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex justify-between gap-6 text-[11px] text-black/70 dark:text-white/70">
            <span className="text-black/60 dark:text-white/60">{p.name}</span>
            <span className="font-semibold text-black/90 dark:text-white">{p.value}</span>
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
  const { tenantEpoch } = useTenant();
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [filtered, setFiltered] = useState<Maintenance[]>([]);
  const [condos, setCondos] = useState<Condo[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [selectedCondo, setSelectedCondo] = useState("all");
  const [timeRange, setTimeRange] = useState("all");

  /* ------------------------------------------------------------------------ */
  /* Load */
  /* ------------------------------------------------------------------------ */

  const loadSeqRef = useRef(0);

  const loadData = useCallback(async () => {
    const seq = ++loadSeqRef.current; // marca esta chamada

    setLoading(true);

    console.log("[Dashboard] loadData start", { tenantEpoch, ts: Date.now() });

    try {
      const [data, condosData] = await Promise.all([
        getMaintenances(),
        getCondos(),
      ]);

      // se não for o último load, abandona
      if (seq !== loadSeqRef.current) return;

      setMaintenances(data);
      setFiltered(data);
      setCondos(condosData);
      console.log("[Dashboard] loadData ok", {
        maintenances: data.length,
        condos: condosData.length,
        tenantEpoch,
      });
    } catch (e) {
      logger.error("Dashboard load error", e);
    } finally {
      if (seq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useTenantDataLoader({
    entities: ["maintenances", "condos", "providers"],
    reload: loadData,
  });

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ------------------------------------------------------------------------ */
  /* Filters */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let data = [...maintenances];
    const now = new Date();

    if (selectedCondo !== "all") {
      data = data.filter((m) => m.condoId === selectedCondo);
    }

    if (timeRange !== "all") {
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
      if (s === "COMPLETED") completed++;
      else if (s === "OVERDUE") overdue++;
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
    return (["OVERDUE", "ON_TIME", "COMPLETED"] as const).map((k) => ({
      name: STATUS3_LABEL[k],
      value:
        k === "OVERDUE"
          ? stats.overdue
          : k === "ON_TIME"
            ? stats.onTime
            : stats.completed,
      color: STATUS3_COLOR_TOKEN[k], // já é CSS válido: rgb(var(--...))
    }));
  }, [stats]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((m) => {
      const key = m.category || "Sem categoria";
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
        return s === "ON_TIME"; // "Próximos ciclos" = tudo que ainda não venceu e não foi concluído
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
        <Loader2 className="animate-spin text-black/50 dark:text-white/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          reason="general"
        />
      )}

      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--surface))] px-3 py-1 text-[11px] uppercase tracking-wide font-semibold text-black/70 dark:text-white/70 ring-1 ring-black/5 dark:ring-white/10 dark:ring-white/10">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "rgb(var(--primary))" }}
            />
            Visão geral operacional
          </div>

          <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight text-[rgb(var(--primary))]">
            <span
              className="grid h-10 w-10 place-items-center rounded-2xl ring-1 ring-black/5 dark:ring-white/10"
              style={{ background: "rgb(var(--primary)/0.08)" }}
            >
              <LayoutDashboard
                size={20}
                className="text-[rgb(var(--primary))]"
              />
            </span>
            Painel Estratégico
          </h1>

          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Status padronizados: <span className="font-semibold">Vencidas</span>
            , <span className="font-semibold">Em dia</span> e{" "}
            <span className="font-semibold">Concluídas</span>.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Building
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
            />
            <select
              className="input pl-9 sm:w-64"
              value={selectedCondo}
              onChange={(e) => setSelectedCondo(e.target.value)}
            >
              <option value="all">Todas as unidades</option>
              {condos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
            />
            <select
              className="input pl-9 sm:w-56"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
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
          {
            label: "Total",
            value: stats.total,
            icon: TrendingUp,
            color: "rgb(var(--primary))",
          },
          {
            label: "Em dia",
            value: stats.onTime,
            icon: Clock,
            color: "rgb(var(--primary))",
          },
          {
            label: "Vencidas",
            value: stats.overdue,
            icon: AlertCircle,
            color: "rgb(var(--danger))",
          },
          {
            label: "Concluídas",
            value: stats.completed,
            icon: CheckCircle,
            color: "rgb(var(--success))",
          },
        ].map((kpi, i) => (
          <div key={i} className={`${cardBase} p-5`}>
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
        <div className={`xl:col-span-2 ${cardBase} p-6`}>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="label-eyebrow">Distribuição</p>
              <h3 className="text-sm font-semibold text-black/80 dark:text-white/80">
                Status operacional
              </h3>
            </div>
          </div>

          <div className="h-[320px] min-h-[240px] w-full">
            {chartsReady && !loading && statusData?.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={95}
                  >
                    {statusData.map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Pie>
                  <ReTooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="Sem dados para o recorte selecionado"
                subtitle="Cadastre manutenções ou ajuste os filtros para visualizar o gráfico."
              />
            )}
          </div>

          <PieLegend
            items={statusData.map((s) => ({
              label: s.name,
              value: s.value,
              color: s.color,
            }))}
          />
        </div>

        <div className={`${cardBase} p-6`}>
          <div className="mb-3">
            <p className="label-eyebrow">Top 6</p>
            <h3 className="text-sm font-semibold text-black/80 dark:text-white/80">
              Maiores incidências
            </h3>
          </div>
          <div className="h-[320px] min-h-[240px] w-full">
            {chartsReady && !loading && categoryData?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} />
                  <ReTooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="rgb(var(--primary))"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="Sem incidências para exibir"
                subtitle="Quando houver manutenções no período, as categorias aparecem aqui."
              />
            )}
          </div>
        </div>
      </div>

      {/* Upcoming (ON_TIME) */}
      <div className={`${cardBase} p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Próximos ciclos (Em dia)</h3>
          <span className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--surface))] px-3 py-1 text-[11px] uppercase tracking-wide font-semibold text-black/70 dark:text-white/70 ring-1 ring-black/5 dark:ring-white/10 dark:ring-white/10">
            <Calendar size={14} className="text-black/50 dark:text-white/50" />
            Agenda
          </span>
        </div>

        {upcomingList.length ? (
          <div className="space-y-3">
            {upcomingList.map((m) => {
              const d = parseDateOnly(m.nextExecutionDate);
              const condoName = condos.find((c) => c.id === m.condoId)?.name;

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-black/10 p-3 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-sm dark:border-white/10"
                >
                  <div className="w-14 text-center font-semibold text-[rgb(var(--primary))]">
                    {isValid(d) ? format(d, "dd/MM") : "--/--"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-black/90 dark:text-white">
                      {m.title}
                    </p>
                    <p className="truncate text-xs text-black/50 dark:text-white/50">
                      {condoName || "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Nenhum ciclo em dia para este recorte"
            subtitle="Ajuste filtros ou cadastre novas manutenções com próxima execução."
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
