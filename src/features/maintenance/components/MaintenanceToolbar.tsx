import React from "react";
import { Condo, MaintenanceType } from "../../../ai/types";


import { Columns, Filter, LayoutList, Search, ChevronDown } from "lucide-react";

type ViewMode = "kanban" | "list";

type MaintenanceToolbarProps = {
  // search
  searchTerm: string;
  onSearchChange: (value: string) => void;

  // condo filter
  condos: Condo[];
  filterCondo: string;
  onFilterCondoChange: (value: string) => void;

  // filters panel toggle
  showFilters: boolean;
  onToggleFilters: () => void;

  // view mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;

  // advanced filters (rendered outside, but toolbar owns the container visual)
  children?: React.ReactNode;
};

const MaintenanceToolbar: React.FC<MaintenanceToolbarProps> = ({
  searchTerm,
  onSearchChange,
  condos,
  filterCondo,
  onFilterCondoChange,
  showFilters,
  onToggleFilters,
  viewMode,
  onViewModeChange,
  children,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4 shrink-0">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        {/* Left side: Search / Condo / Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              className="w-full pl-10 pr-4 py-2 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-medium"
              placeholder="Buscar por título ou categoria..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <select
            className="border border-slate-100 rounded-xl px-3 py-2 outline-none w-full sm:w-auto text-sm bg-slate-50 font-semibold text-slate-600"
            value={filterCondo}
            onChange={(e) => onFilterCondoChange(e.target.value)}
          >
            <option value="all">Todos Condomínios</option>
            {condos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={onToggleFilters}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all ${
              showFilters
                ? "bg-blue-50 border-blue-200 text-blue-600 shadow-inner"
                : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
            }`}
            type="button"
          >
            <Filter size={16} />
            Filtros
            <ChevronDown
              size={14}
              className={showFilters ? "rotate-180 transition-transform" : "transition-transform"}
            />
          </button>
        </div>

        {/* Right side: View toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => onViewModeChange("kanban")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "kanban"
                  ? "bg-white shadow text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Modo Kanban"
              type="button"
            >
              <Columns size={18} />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-white shadow text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Modo Lista"
              type="button"
            >
              <LayoutList size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters content (optional) */}
      {children ? children : null}
    </div>
  );
};

export default MaintenanceToolbar;
