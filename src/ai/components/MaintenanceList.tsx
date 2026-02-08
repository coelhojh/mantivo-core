import BaseModal from "../../shared/ui/modal/BaseModal";
import UpgradeModal from "./UpgradeModal";
import { useMaintenanceUpsert } from "../../features/maintenances/hooks/useMaintenanceUpsert";
import { useMaintenanceAttachments } from "../../features/maintenances/hooks/useMaintenanceAttachments";
import { buildMaintenancePayload } from "./maintenance/mappers/buildMaintenancePayload";
import { resolveFrequencyPreset } from "./maintenance/mappers/resolveFrequencyPreset";
import { getEmptyMaintenanceFormData } from "./maintenance/mappers/getEmptyMaintenanceFormData";
import { getFormDataFromMaintenance } from "./maintenance/mappers/getFormDataFromMaintenance";
import React, { useEffect, useRef, useState } from "react";
import MaintenanceCompleteModal from "../../features/maintenances/components/modals/MaintenanceCompleteModal";
import MaintenanceDeleteModal from "../../features/maintenances/components/modals/MaintenanceDeleteModal";
import MaintenanceUndoModal from "../../features/maintenances/components/modals/MaintenanceUndoModal";
import MaintenanceViewModal from "../../features/maintenances/components/modals/MaintenanceViewModal";
import MaintenanceUpsertModal from "./modals/MaintenanceUpsertModal";
import type { MaintenanceUpsertFormData } from "./maintenance/types";
import type { MaintenanceCompleteData } from "../../features/maintenances/types/MaintenanceCompleteData";
import type { FrequencyPreset } from "./maintenance/types";

import {
  Maintenance,
  MaintenanceStatus,
  FrequencyType,
  MaintenanceType,
  Condo,
  Category,
  Provider,
  AttachmentType,
  MaintenanceAttachment,
} from "../types";
import {
  getMaintenances,
  saveMaintenance,
  updateMaintenance,
  deleteMaintenance,
  completeMaintenance,
  undoCompleteMaintenance,
  getCondos,
  getCategories,
  checkPlanLimits,
  getUser,
  getProviders,
} from "../services/storageService";
import {
  Plus,
  Search,
  Calendar,
  CheckCircle,
  Trash2,
  Edit2,
  X,
  Loader2,
  RotateCcw,
  LayoutList,
  Building,
  Clock,
  Columns,
  CheckSquare,
  AlertCircle,
  Wrench,
  Eye,
  Check,
  Filter,
  Timer,
  DollarSign,
  Briefcase,
  Info,
  AlignLeft,
  Paperclip,
  FileText,
  Upload,
  ChevronDown,
  ExternalLink,
  User as UserIcon,
  Phone,
  Mail,
} from "lucide-react";
import {
  format,
  isValid,
  differenceInDays,
  isAfter,
  isBefore,
  endOfDay,
  parseISO as parseISODateFns,
} from "date-fns";

// ✅ Status padronizado Mantivo (3 estados)
import {
  getStatus3,
  STATUS3_LABEL,
  STATUS3_COLOR_TOKEN,
  type MantivoStatus3,
} from "../../shared/utils/maintenanceStatus";

const parseDateOnly = (dateStr: string | undefined | null): Date => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split("-");
  if (parts.length !== 3) return new Date(NaN);
  return new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
};

const parseUploadDate = (dateStr: string | undefined | null): Date => {
  if (!dateStr) return new Date(NaN);

  // 1) ISO padrão (ex: 2026-02-01T12:30:00.000Z)
  if (dateStr.includes("T")) {
    try {
      return parseISODateFns(dateStr);
    } catch {
      // continua
    }
  }

  // 2) "yyyy-MM-dd HH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(dateStr)) {
    const normalized = dateStr.replace(" ", "T");
    try {
      return parseISODateFns(normalized);
    } catch {
      // continua
    }
  }

  // 3) yyyy-MM-dd
  return parseDateOnly(dateStr);
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
// --- Attachment tag helpers ---

const attachmentTypeLabel: Record<AttachmentType, string> = {
  [AttachmentType.BUDGET]: "Orçamento",
  [AttachmentType.INVOICE]: "Nota fiscal",
  [AttachmentType.ART_RRT]: "ART/RRT",
  [AttachmentType.SERVICE_ORDER]: "Ordem de Serviço",
  [AttachmentType.PHOTOS]: "Fotos",
  [AttachmentType.TECHNICAL_REPORT]: "Laudo",
  [AttachmentType.MAINTENANCE_REPORT]: "Relatório",
  [AttachmentType.CERTIFICATE]: "Certificado",
  [AttachmentType.OTHER]: "Outro",
};

const attachmentTypeClass: Record<AttachmentType, string> = {
  [AttachmentType.BUDGET]: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  [AttachmentType.INVOICE]:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  [AttachmentType.ART_RRT]:
    "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  [AttachmentType.SERVICE_ORDER]:
    "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200",
  [AttachmentType.PHOTOS]: "bg-lime-50 text-lime-700 ring-1 ring-lime-200",
  [AttachmentType.TECHNICAL_REPORT]:
    "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  [AttachmentType.MAINTENANCE_REPORT]:
    "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  [AttachmentType.CERTIFICATE]: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  [AttachmentType.OTHER]: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

function AttachmentTag({ type }: { type: AttachmentType }) {
  const label = attachmentTypeLabel[type] ?? "Anexo";
  const cls =
    attachmentTypeClass[type] ?? attachmentTypeClass[AttachmentType.OTHER];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

const MaintenanceList: React.FC = () => {
  const [items, setItems] = useState<Maintenance[]>([]);
  const [condos, setCondos] = useState<Condo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCondo, setFilterCondo] = useState("all");
  const [filterStatus, setFilterStatus] = useState<MantivoStatus3 | "all">(
    "all",
  );
  const [filterType, setFilterType] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [itemToUndo, setItemToUndo] = useState<Maintenance | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Maintenance | null>(null);
  const [itemToComplete, setItemToComplete] = useState<Maintenance | null>(
    null,
  );
  const [itemToView, setItemToView] = useState<Maintenance | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isUndoing, setIsUndoing] = useState<string | null>(null);

  const [formData, setFormData] = useState<MaintenanceUpsertFormData>({
    title: "",
    condoId: "",
    category: "",
    type: "" as MaintenanceUpsertFormData["type"],
    nextExecutionDate: "",
    frequencyType: undefined,
    frequencyDays: undefined,
    estimatedCost: 0,
    providerId: "",
    providerContact: "",
    providerPhone: "",
    providerEmail: "",
    attachments: [],
  });
  const [completeData, setCompleteData] = useState<MaintenanceCompleteData>({
    date: format(new Date(), "yyyy-MM-dd"),
    cost: 0,
    providerName: "",
    providerContact: "",
    providerEmail: "",
    providerPhone: "",
    attachments: [],
  });
  const [selectedFileTypeUpsert, setSelectedFileTypeUpsert] = useState<AttachmentType>(
  AttachmentType.BUDGET,
);
const [selectedFileTypeComplete, setSelectedFileTypeComplete] = useState<AttachmentType>(
  AttachmentType.BUDGET,
);
  const [frequencyPreset, setFrequencyPreset] =
    useState<FrequencyPreset>("MONTHLY");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const completeFileInputRef = useRef<HTMLInputElement>(null);

  const user = getUser();
  const canEdit =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.permissions?.canEdit;
  const canDelete =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.permissions?.canDelete;


  const sortAttachments = (
    attachments: MaintenanceAttachment[],
  ): MaintenanceAttachment[] => {
    return [...attachments].sort((a, b) => {
      const priorityA = DOC_TYPE_PRIORITY[a.type] || 99;
      const priorityB = DOC_TYPE_PRIORITY[b.type] || 99;
      if (priorityA !== priorityB) return priorityA - priorityB;

      const timeA = parseUploadDate(a.uploadDate).getTime();
      const timeB = parseUploadDate(b.uploadDate).getTime();
      const safeA = Number.isFinite(timeA) ? timeA : 0;
      const safeB = Number.isFinite(timeB) ? timeB : 0;
      return safeB - safeA;
    });
  };


  const upsert = useMaintenanceUpsert({
    canEdit,
    checkPlanLimits,
    setShowUpgradeModal,
    setShowModal,
    setFormData,
    getEmptyMaintenanceFormData,
    getFormDataFromMaintenance,
    sortAttachments,
  });

  const attachmentsCtrl = useMaintenanceAttachments({ sortAttachments });


  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [m, c, cat, p] = await Promise.all([
        getMaintenances(),
        getCondos(),
        getCategories(),
        getProviders(),
      ]);
      setItems(m);
      setCondos(c);
      setCategories(cat);
      const sortedProviders = [...p].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR"),
      );
      setProviders(sortedProviders);
    } catch (e) {
      console.error("Refresh Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatBRL = (value: number | undefined) => {
    if (value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleCurrencyInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
  ) => {
    const value = e.target.value.replace(/\D/g, "");
    const numericValue = parseInt(value, 10) / 100;
    setter(numericValue || 0);
  };

  const handleOpenViewModal = (item: Maintenance) => {
    setItemToView(item);
    setShowViewModal(true);
  };

  const handleOpenCompleteModal = (item: Maintenance) => {
    setItemToComplete(item);
    setCompleteData({
      date: format(new Date(), "yyyy-MM-dd"),
      cost: item.estimatedCost || 0,
      providerName: item.providerName || "",
      providerContact: item.providerContact || "",
      providerEmail: item.providerEmail || "",
      providerPhone: item.providerPhone || "",
      attachments: sortAttachments(item.attachments || []),
    });
    setShowCompleteModal(true);
  };

  const handleUndoComplete = async (id: string) => {
    // Em vez de confirmar aqui, apenas abre o modal
    const item = filteredItems.find((m) => m.id === id);
    if (!item) return;

    setItemToUndo(item);
    setShowUndoModal(true);
  };

  const handleConfirmUndo = async () => {
    if (!itemToUndo) return;
    if (isUndoing) return;

    setIsUndoing(itemToUndo.id);
    try {
      await undoCompleteMaintenance(itemToUndo.id);
      await refreshData();

      setShowUndoModal(false);
      setItemToUndo(null);
    } catch (e) {
      alert("Erro ao desfazer conclusão.");
    } finally {
      setIsUndoing(null);
    }
  };

  const handleProviderChange = (providerId: string) => {
  const selected = providers.find((p: any) => p.id === providerId);

  if (selected) {
    setFormData((prev) => ({
      ...prev,
      providerId: selected.id,
      providerName: selected.name,
      providerContact: selected.contactName ?? "",
      providerEmail: selected.email ?? "",
      providerPhone: selected.phone ?? selected.whatsapp ?? "",
    }));
    return;
  }

  // Sem prestador
  setFormData((prev) => ({
    ...prev,
    providerId: "",
    providerName: "",
    providerContact: "",
    providerEmail: "",
    providerPhone: "",
  }));
};
const handleFileUpload = (
  e: React.ChangeEvent<HTMLInputElement>,
  isCompleteModal: boolean = false,
) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  const newItems = attachmentsCtrl.buildNewItems(
    files,
    isCompleteModal ? selectedFileTypeComplete : selectedFileTypeUpsert,
  );

  if (isCompleteModal) {
    attachmentsCtrl.appendTo(setCompleteData, newItems);
    attachmentsCtrl.resetInput(completeFileInputRef);
  } else {
    attachmentsCtrl.appendTo(setFormData, newItems);
    attachmentsCtrl.resetInput(fileInputRef);
  }
};

const removeAttachment = (index: number, isCompleteModal: boolean = false) => {
  if (isCompleteModal) {
    attachmentsCtrl.removeAt(setCompleteData, index);
  } else {
    attachmentsCtrl.removeAt(setFormData, index);
  }
};

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();

      await upsert.submit({
        formData,
        frequencyPreset,
        selectedFileType: selectedFileTypeUpsert,
        items,
        resolveFrequencyPreset,
        buildMaintenancePayload,
        onClose: () => setShowModal(false),
        onSuccess: () => refreshData(),
        onError: (message) => alert(message),
      });
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
          phone: completeData.providerPhone,
        },
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
    if (!dateStr) return "--/--/--";
    try {
      const date = parseDateOnly(dateStr);
      return isValid(date) ? format(date, "dd/MM/yy") : "--/--/--";
    } catch {
      return "--/--/--";
    }
  };

  const getTypeClasses = (type: MaintenanceType) => {
    switch (type) {
      case MaintenanceType.PREVENTIVE:
        return "bg-amber-50 text-amber-700 border-amber-200";
      case MaintenanceType.CORRECTIVE:
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getDocTypeColor = (type: string | AttachmentType) => {
    switch (type) {
      case AttachmentType.BUDGET:
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case AttachmentType.INVOICE:
        return "bg-blue-50 text-blue-600 border-blue-100";
      case AttachmentType.ART_RRT:
        return "bg-purple-50 text-purple-600 border-purple-100";
      case AttachmentType.TECHNICAL_REPORT:
      case AttachmentType.MAINTENANCE_REPORT:
        return "bg-amber-50 text-amber-600 border-amber-100";
      case AttachmentType.CERTIFICATE:
        return "bg-sky-50 text-sky-600 border-sky-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  // ✅ 3 estados: OVERDUE / ON_TIME / COMPLETED
  const getStatusOrder3 = (s: MantivoStatus3): number => {
    if (s === "OVERDUE") return 1; // Vencidas primeiro
    if (s === "ON_TIME") return 2; // Em dia
    return 3; // Concluídas por último
  };

  const filteredItems = (items ?? [])
    .filter((item) => {
      const s = (searchTerm ?? "").toLowerCase();
      const title = (item?.title ?? "").toLowerCase();
      const category = (item?.category ?? "").toLowerCase();

      const matchesSearch = title.includes(s) || category.includes(s);
      const matchesCondo =
        filterCondo === "all" || item?.condoId === filterCondo;
      const matchesType = filterType === "all" || item?.type === filterType;

      const status3 = getStatus3(item as Maintenance, new Date());
      const matchesStatus = filterStatus === "all" || status3 === filterStatus;

      let matchesPeriod = true;
      if (filterStartDate || filterEndDate) {
        if (!item?.nextExecutionDate) {
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

      return (
        matchesSearch &&
        matchesCondo &&
        matchesStatus &&
        matchesType &&
        matchesPeriod
      );
    })
    .sort((a, b) => {
      // 1) Ordena por status 3 (Vencidas -> Em dia -> Concluídas)
      const sa = getStatus3(a as Maintenance, new Date());
      const sb = getStatus3(b as Maintenance, new Date());
      const groupDiff = getStatusOrder3(sa) - getStatusOrder3(sb);
      if (groupDiff !== 0) return groupDiff;

      // 2) Mesmo status: ordena por nextExecutionDate (antiga -> recente)
      const safeTime = (dateStr?: string | null) => {
        if (!dateStr) return Number.MAX_SAFE_INTEGER;
        const d = parseDateOnly(dateStr);
        const t = d.getTime();
        return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
      };

      const timeA = safeTime((a as Maintenance).nextExecutionDate);
      const timeB = safeTime((b as Maintenance).nextExecutionDate);
      return timeA - timeB;
    });

  const kanbanColumnsData: Record<MantivoStatus3, Maintenance[]> = {
    OVERDUE: [],
    ON_TIME: [],
    COMPLETED: [],
  };

  for (const it of filteredItems) {
    const k = getStatus3(it as Maintenance, new Date());
    (kanbanColumnsData[k] ??= []).push(it);
  }

  const columnConfig: Array<{
    id: MantivoStatus3;
    title: string;
    icon: any;
    colorClass: string;
    headerBg: string;
    headerBorder: string;
  }> = [
    {
      id: "OVERDUE",
      title: "Vencidas",
      icon: AlertCircle,
      colorClass: "text-red-600",
      headerBg: "bg-red-50",
      headerBorder: "border-red-200",
    },
    {
      id: "ON_TIME",
      title: "Em dia",
      icon: Clock,
      colorClass: "text-blue-600",
      headerBg: "bg-blue-50",
      headerBorder: "border-blue-200",
    },
    {
      id: "COMPLETED",
      title: "Concluídas",
      icon: CheckSquare,
      colorClass: "text-emerald-600",
      headerBg: "bg-emerald-50",
      headerBorder: "border-emerald-200",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const isCorrective = formData.type === MaintenanceType.CORRECTIVE;

  return (
    <div className="space-y-6 pb-4 flex flex-col h-full">
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          reason="maintenance"
        />
      )}

      <div className="flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="text-[rgb(var(--primary))]" />
            Cronograma de Manutenções
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Gestão operacional de prazos e atividades.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => upsert.openCreate()}
            className="px-6 py-3 rounded-2xl transition-all shadow-lg font-semibold active:scale-95 flex items-center gap-2"
            style={{ background: "rgb(var(--primary))", color: "white" }}
          >
            <Plus size={18} /> Nova Manutenção
          </button>
        )}
      </div>

      <div
        className="rounded-2xl bg-white ring-1 ring-slate-200/70 p-4
 border border-slate-200 flex flex-col gap-4 shrink-0"
      >
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={18}
              />
              <input
                className="w-full pl-10 pr-4 py-2 border border-slate-100 rounded-xl outline-none focus:ring-2 text-sm bg-slate-50 font-medium"
                style={{ boxShadow: "none" }}
                placeholder="Buscar por título ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="border border-slate-100 rounded-xl px-3 py-2 outline-none w-full sm:w-auto text-sm bg-slate-50 font-semibold text-slate-600"
              value={filterCondo}
              onChange={(e) => setFilterCondo(e.target.value)}
            >
              <option value="all">Todos Condomínios</option>
              {condos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all ${
                showFilters
                  ? "bg-blue-50 border-blue-200 text-blue-600 shadow-inner"
                  : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Filter size={16} /> Filtros{" "}
              {showFilters ? (
                <ChevronDown size={14} className="rotate-180" />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "kanban"
                    ? "bg-white shadow text-blue-600"
                    : "text-slate-500"
                }`}
                title="Modo Kanban"
              >
                <Columns size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-white shadow text-blue-600"
                    : "text-slate-500"
                }`}
                title="Modo Lista"
              >
                <LayoutList size={18} />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">Todos</option>
                <option value="ON_TIME">Em dia</option>
                <option value="OVERDUE">Vencidas</option>
                <option value="COMPLETED">Concluídas</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Tipo
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value={MaintenanceType.PREVENTIVE}>Preventiva</option>
                <option value={MaintenanceType.CORRECTIVE}>Corretiva</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Período De
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Período Até
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden min-h-0 relative">
        {viewMode === "kanban" ? (
          <div className="h-full overflow-x-auto pb-4 px-1">
            <div className="flex h-full gap-5 min-w-[900px]">
              {columnConfig.map((col) => {
                const colItems = kanbanColumnsData[col.id] || [];
                const Icon = col.icon;

                return (
                  <div
                    key={col.id}
                    className="flex-1 flex flex-col min-w-[300px] bg-slate-100/40 rounded-[32px] border border-slate-200/40 overflow-hidden shadow-sm"
                  >
                    <div
                      className={`p-4 border-b ${col.headerBg} ${col.headerBorder} flex justify-between items-center shrink-0`}
                    >
                      <div className="flex items-center gap-2 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                        <Icon size={14} className={col.colorClass} />
                        {col.title}
                      </div>
                      <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200">
                        {colItems.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar-hover">
                      {colItems.length > 0 ? (
                        colItems.map((item) => {
                          const s3 = getStatus3(item, new Date());
                          const isCompleted = s3 === "COMPLETED";
                          const isOverdue = s3 === "OVERDUE";

                          const statusColor = STATUS3_COLOR_TOKEN[s3];

                          return (
                            <div
                              key={item.id}
                              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative animate-in fade-in zoom-in-95 duration-200"
                            >
                              <div className="flex justify-between items-center mb-2.5 h-6">
                                <span
                                  className={`shrink-0 text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded-md border ${getTypeClasses(item.type)}`}
                                >
                                  {item.type}
                                </span>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0 z-10">
                                  <button
                                    onClick={() => handleOpenViewModal(item)}
                                    className="p-1.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                                    title="Visualizar"
                                  >
                                    <Eye size={13} />
                                  </button>

                                  {canEdit && (
                                    <button
                                      onClick={() => upsert.openEdit(item)}
                                      className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                                      title="Editar"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                  )}

                                  {canEdit && !isCompleted && (
                                    <button
                                      onClick={() =>
                                        handleOpenCompleteModal(item)
                                      }
                                      className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                                      title="Concluir"
                                    >
                                      <Check size={13} />
                                    </button>
                                  )}

                                  {canEdit && isCompleted && (
                                    <button
                                      type="button"
                                      onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      onClick={() =>
                                        handleUndoComplete(item.id)
                                      }
                                      disabled={isUndoing === item.id}
                                      className="p-1.5 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-all"
                                      title="Desfazer Conclusão"
                                    >
                                      {isUndoing === item.id ? (
                                        <Loader2
                                          size={13}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <RotateCcw size={13} />
                                      )}
                                    </button>
                                  )}

                                  {canDelete && (
                                    <button
                                      onClick={() => setItemToDelete(item)}
                                      className="p-1.5 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"
                                      title="Excluir"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center mb-2 min-w-0">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate flex-1">
                                  {
                                    condos.find((c) => c.id === item.condoId)
                                      ?.name
                                  }
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-3 mb-3">
                                <h3 className="font-bold text-slate-800 text-sm leading-tight break-words min-w-0">
                                  {item.title}
                                </h3>
                              </div>

                              <div className="pt-3 border-t border-slate-50 space-y-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                  <DollarSign
                                    size={12}
                                    className={
                                      isCompleted
                                        ? "text-emerald-600"
                                        : "text-blue-500"
                                    }
                                  />
                                  <span className="font-normal">
                                    {isCompleted
                                      ? `Execução: ${formatBRL(item.cost)}`
                                      : `Estimado: ${formatBRL(item.estimatedCost)}`}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div
                                    className={`flex items-center gap-1.5 text-[10px] font-semibold transition-all ${
                                      isOverdue
                                        ? "text-red-600"
                                        : "bg-slate-50 text-slate-500 px-2 py-1 rounded-lg"
                                    }`}
                                  >
                                    <Calendar
                                      size={12}
                                      className={
                                        isOverdue
                                          ? "text-red-500"
                                          : "text-slate-300"
                                      }
                                    />
                                    <span>
                                      {isCompleted
                                        ? "Concl: " +
                                          safeFormatDate(item.lastExecutionDate)
                                        : "Venc: " +
                                          safeFormatDate(
                                            item.nextExecutionDate,
                                          )}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {item.attachments &&
                                      item.attachments.length > 0 && (
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
                          <p className="text-[10px] font-semibold uppercase tracking-widest">
                            Sem itens
                          </p>
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
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Custos
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Datas
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const s3 = getStatus3(item, new Date());
                  const isOverdue = s3 === "OVERDUE";
                  const isCompleted = s3 === "COMPLETED";

                  const dotClass =
                    s3 === "OVERDUE"
                      ? "bg-red-500"
                      : s3 === "COMPLETED"
                        ? "bg-emerald-500"
                        : "bg-blue-500";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div
                            className={`w-3 h-3 rounded-full shadow-sm ${dotClass}`}
                            title={STATUS3_LABEL[s3]}
                          />
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-slate-800 text-sm">
                            {item.title}
                          </div>

                          {item.attachments && item.attachments.length > 0 && (
                            <div
                              className="flex items-center gap-0.5 text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100"
                              title={`${item.attachments.length} arquivo(s) anexado(s)`}
                            >
                              <Paperclip size={10} />
                              {item.attachments.length}
                            </div>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1">
                          <Building size={10} />
                          {condos.find((c) => c.id === item.condoId)?.name}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${getTypeClasses(item.type)}`}
                        >
                          {item.type}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[11px] font-normal text-slate-600">
                          <p>Est: {formatBRL(item.estimatedCost)}</p>
                          {isCompleted && (
                            <p className="text-emerald-600 font-medium">
                              Exec: {formatBRL(item.cost)}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[11px] font-normal">
                          <p
                            className={
                              isOverdue ? "text-red-600" : "text-slate-500"
                            }
                          >
                            Venc: {safeFormatDate(item.nextExecutionDate)}
                          </p>
                          {item.lastExecutionDate && (
                            <p className="text-emerald-600 font-medium">
                              Concl: {safeFormatDate(item.lastExecutionDate)}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenViewModal(item)}
                            className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shadow-sm"
                            title="Visualizar"
                          >
                            <Eye size={16} />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => upsert.openEdit(item)}
                              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all shadow-sm"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}

                          {canEdit && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleOpenCompleteModal(item)}
                              className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all shadow-sm"
                              title="Concluir"
                            >
                              <Check size={16} />
                            </button>
                          )}

                          {canEdit && isCompleted && (
                            <button
                              type="button"
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
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
                          )}

                          {canDelete && (
                            <button
                              onClick={() => setItemToDelete(item)}
                              className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all shadow-sm"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
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
      {/* MODAL VIEW (extraído) */}
      <MaintenanceViewModal
        open={!!showViewModal && !!itemToView}
        item={itemToView}
        condos={condos}
        canEdit={canEdit}
        onClose={() => setShowViewModal(false)}
        onEdit={(it) => {
          setShowViewModal(false);
          upsert.openEdit(it);
        }}
        getStatus3={getStatus3}
        STATUS3_LABEL={STATUS3_LABEL}
        getTypeClasses={getTypeClasses}
        safeFormatDate={safeFormatDate}
        AttachmentTag={AttachmentTag}
      />
      <MaintenanceUpsertModal
        open={!!showModal}
        editingId={upsert.editingId}
        formData={formData}
        setFormData={setFormData}
        condos={condos}
        categories={categories}
        providers={providers}
        frequencyPreset={frequencyPreset}
        setFrequencyPreset={setFrequencyPreset}
        isCorrective={isCorrective}
        formatBRL={formatBRL}
        handleCurrencyInputChange={handleCurrencyInputChange}
        handleProviderChange={handleProviderChange}
        selectedFileType={selectedFileTypeUpsert}
        setSelectedFileType={setSelectedFileTypeUpsert}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        removeAttachment={removeAttachment}
        AttachmentTag={AttachmentTag}
        onClose={() => upsert.close()}
        onSubmit={handleSave}
      />
      {showCompleteModal && itemToComplete && (
        <MaintenanceCompleteModal
          open={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          itemToComplete={itemToComplete}
          isCompleting={isCompleting}
          onSubmit={handleCompleteSubmit}
          completeData={completeData}
          setCompleteData={setCompleteData}
          formatBRL={formatBRL}
          handleCurrencyInputChange={handleCurrencyInputChange}
          selectedFileType={selectedFileTypeComplete}
          setSelectedFileType={setSelectedFileTypeComplete}
          completeFileInputRef={completeFileInputRef}
          handleFileUpload={handleFileUpload}
          removeAttachment={removeAttachment}
          AttachmentTag={AttachmentTag}
        />
      )}
      {showUndoModal && (
        <MaintenanceUndoModal
          open={showUndoModal && !!itemToUndo}
          onClose={() => {
            if (isUndoing) return;
            setShowUndoModal(false);
            setItemToUndo(null);
          }}
          itemToUndo={itemToUndo}
          isUndoingId={isUndoing}
          onConfirm={handleConfirmUndo}
        />
      )}

      <MaintenanceDeleteModal
        open={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        itemToDelete={itemToDelete}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default MaintenanceList;
