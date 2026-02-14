import React, { useState, useEffect } from 'react';
import { useSidebarState } from '../shared/hooks/useSidebarState';
import {
  LayoutDashboard,
  Calendar,
  Wrench,
  FileText,
  Menu,
  X,
  Building,
  LogOut,
  Tags,
  Loader2,
  Users,
  ShieldAlert,
  Truck,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { User, PlanType } from './types';
import { getUser, logout } from './services/storageService';
import { getSupabase } from './services/supabaseClient';
import Dashboard from './components/Dashboard';
import MaintenanceList from './components/MaintenanceList';
import CalendarView from './components/CalendarView';
import Reports from './components/Reports';
import CondoList from './components/CondoList';
import CategoryList from './components/CategoryList';
import AuthScreen from './components/AuthScreen';
import TeamList from './components/TeamList';
import Settings from './components/Settings';
import ProviderList from './components/ProviderList';
import SetupDatabase from './components/SetupDatabase';
import SuperAdminPanel from './components/SuperAdminPanel';
import Logo from './components/Logo';
import { useTenant } from "./tenant/TenantContext";

import { logger } from "../shared/observability/logger";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const { tenantId, setTenantId } = useTenant();

    const [tenantVersion, setTenantVersion] = useState<number>(() => {
    return Number(localStorage.getItem("tenant_version") || "0");
  });

  useEffect(() => {
    const sync = () => {
      const v = Number(localStorage.getItem("tenant_version") || "0");
      setTenantVersion(v);

      try {
        const cached = JSON.parse(localStorage.getItem("cg_user_cache") || "null");
        if (cached?.id) setUser(cached);
      } catch {}
    };

    const onTenantChanged = () => { void Promise.resolve(sync()); };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "tenant_version") {
        void Promise.resolve(sync());
      }
    };

    window.addEventListener("mantivo:tenant-changed", onTenantChanged);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("mantivo:tenant-changed", onTenantChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);


  // Desktop: colapsado/expandido (persistido por usuário)
  const {
    collapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
    toggle: toggleSidebarCollapsed,
  } = useSidebarState(user?.id ?? null);

  // Mobile: drawer aberto/fechado
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('setup=true')) {
      setShowSetup(true);
    }

    const initAuth = async () => {
      const timeout = setTimeout(() => {
        if (!authChecked) setAuthChecked(true);
      }, 5000);

      try {
        const cached = getUser();
        if (cached) setUser(cached);
        if (cached?.activeTenantId && cached.activeTenantId !== tenantId) {
  setTenantId(cached.activeTenantId, { reason: "restore" });
}

        const supabase = getSupabase();

          // DEBUG (temporário): diagnóstico da config do Supabase no Preview
          import("./services/supabaseClient")
            .then((mod) => {
              const cfg = (mod as any).getActiveConfig?.();
              void cfg;
            })
            .catch(() => {});

        if (!supabase) {
          clearTimeout(timeout);
          setAuthChecked(true);
          return;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (!sessionError && data?.session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (profile) {
  const isSuperAdmin =
    cached?.role === 'super_admin' || profile.role === 'super_admin';

  const userData: User = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    companyName: isSuperAdmin ? 'MANTIVO ADMIN' : profile.company_name,
    role: isSuperAdmin ? 'super_admin' : profile.role,
    plan: isSuperAdmin ? 'enterprise' : (profile.plan as PlanType),
    activeTenantId: (profile as any).active_tenant_id || null,
    preferences: profile.preferences,
    permissions: isSuperAdmin
      ? { canEdit: true, canDelete: true }
      : profile.permissions || { canEdit: false, canDelete: false },
    allowedCondos: profile.allowed_condos || [],
  };

  // ✅ Fase B (passo 2): espelha tenant do profile no TenantContext
  const nextTenant = userData.activeTenantId ?? null;
  if (nextTenant && nextTenant !== tenantId) {
    setTenantId(nextTenant, { reason: "restore" });
  }

  localStorage.setItem('cg_user_cache', JSON.stringify(userData));
  setUser(userData);
}

        }
      } catch (e) {
        logger.error('Critical Auth Error:', e);
      } finally {
        clearTimeout(timeout);
        setAuthChecked(true);
      }
    };

    initAuth();

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setMobileSidebarOpen(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoginSuccess = () => {
    setUser(getUser());
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'condos', label: 'Condomínios', icon: Building },
    { id: 'categories', label: 'Categorias', icon: Tags },
    { id: 'providers', label: 'Prestadores de Serviço', icon: Truck },
    { id: 'maintenance', label: 'Manutenções', icon: Wrench },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'team', label: 'Usuários', icon: Users },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
  ];

  const handleNavClick = (viewId: string) => {
    setCurrentView(viewId);
    if (isMobile) setMobileSidebarOpen(false);
  };

  const renderView = () => {
    try {
      switch (currentView) {
        case 'dashboard':
          return <Dashboard />;
        case 'condos':
          return <CondoList />;
        case 'maintenance':
          return <MaintenanceList />;
        case 'categories':
          return <CategoryList />;
        case 'providers':
          return <ProviderList />;
        case 'calendar':
          return <CalendarView />;
        case 'reports':
          return <Reports />;
        case 'team':
          return <TeamList />;
        case 'settings':
          return <Settings />;
        case 'superadmin':
          return <SuperAdminPanel />;
        default:
          return <Dashboard />;
      }
    } catch (e) {
      logger.error('Render View Error:', e);
      return (
        <div className="p-8">
          Erro ao carregar componente. Verifique o console.
        </div>
      );
    }
  };

  if (!authChecked) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[rgb(var(--bg))] gap-4">
        <Loader2
          className="animate-spin text-[rgb(var(--primary))]"
          size={48}
        />
        <p className="text-[rgb(var(--muted))] font-medium animate-pulse">
          Sincronizando dados...
        </p>
      </div>
    );
  }

  if (showSetup) return <SetupDatabase onBack={() => setShowSetup(false)} />;
  if (!user)
    return (
      <AuthScreen
        onLoginSuccess={handleLoginSuccess}
        onOpenSetup={() => setShowSetup(true)}
      />
    );

  const isSuperAdmin = user.role === 'super_admin';

  // Classes reutilizáveis (mantém o JSX limpo e consistente)
  const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2';
  const focusRingDark = `${focusRing} focus-visible:ring-offset-slate-900`;
  const focusRingLight = `${focusRing} focus-visible:ring-offset-[rgb(var(--bg))]`;

  return (
    <div className="flex h-screen supports-[height:100dvh]:h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--text))] overflow-hidden relative print:overflow-visible print:h-auto print:block">
      {isMobile && mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity print:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-slate-950 text-white transition-[width,transform] duration-300 flex flex-col print:hidden
        ${
          isMobile
            ? mobileSidebarOpen
              ? 'translate-x-0 w-72 shadow-2xl shadow-black/30'
              : '-translate-x-full w-72'
            : sidebarCollapsed
            ? 'w-20 translate-x-0'
            : 'w-72 translate-x-0'
        }`}
      >
        <div className="px-6 py-5 flex items-center justify-between h-20 shrink-0 border-b border-white/5">
          <div
            className={`flex items-center gap-3 ${
              !isMobile && sidebarCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <Logo size={38} />
            {(isMobile || !sidebarCollapsed) && (
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-lg tracking-tight whitespace-nowrap">
                  Mantivo
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Gestão de Manutenção
                </span>
              </div>
            )}
          </div>

          {!isMobile && (
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className={`text-slate-300 hover:text-white p-2 hover:bg-white/10 rounded-xl ${focusRingDark}`}
              aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
              aria-expanded={!sidebarCollapsed}
              title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {sidebarCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
            </button>
          )}

          {isMobile && (
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className={`text-slate-300 hover:text-white p-2 hover:bg-white/10 rounded-xl ${focusRingDark}`}
              aria-label="Fechar menu"
            >
              <X size={22} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={!isMobile && sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 whitespace-nowrap group ${focusRingDark}
                  ${!isMobile && sidebarCollapsed ? 'justify-center' : ''}
                  ${
                    active
                      ? 'bg-[rgb(var(--primary))] text-white shadow-[0_10px_30px_rgba(96,37,129,.25)]'
                      : 'text-slate-300/80 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <item.icon
                  size={20}
                  className={`shrink-0 transition-transform ${
                    !active ? 'group-hover:scale-110' : ''
                  }`}
                />
                <span
                  className={`font-semibold text-sm tracking-tight overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-200 ${
                    isMobile || !sidebarCollapsed
                      ? 'opacity-100 max-w-[220px]'
                      : 'opacity-0 max-w-0 pointer-events-none'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {isSuperAdmin && (
            <button
              onClick={() => handleNavClick('superadmin')}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 whitespace-nowrap mt-8 border border-red-900/30 ${focusRingDark}
                ${!isMobile && sidebarCollapsed ? 'justify-center' : ''}
                ${
                  currentView === 'superadmin'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                }`}
            >
              <ShieldAlert size={20} className="shrink-0" />
              {(isMobile || !sidebarCollapsed) && (
                <span className="font-bold text-sm">Painel Master</span>
              )}
            </button>
          )}
        </nav>

        <div className="p-6 border-t border-white/5 bg-slate-950/60 shrink-0">
          {(isMobile || !sidebarCollapsed) ? (
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary))] flex items-center justify-center text-white font-extrabold shrink-0 shadow-lg">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate font-medium">
                  {user.companyName}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className={`p-2 text-slate-300 hover:text-red-300 transition-colors rounded-xl hover:bg-red-400/10 ${focusRingDark}`}
                title="Sair"
                aria-label="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary))] flex items-center justify-center text-white text-sm font-extrabold shadow-lg">
                {user.name.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                className={`text-slate-300 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-xl transition-colors ${focusRingDark}`}
                aria-label="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden w-full print:h-auto relative">
        <header className="h-20 bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))] flex items-center justify-between px-6 lg:px-10 shrink-0 print:hidden z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen((v) => !v)}
              className={`p-2 text-slate-700 lg:hidden hover:bg-slate-100 rounded-xl ${focusRingLight}`}
              aria-label={mobileSidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              <Menu size={22} />
            </button>

            <div className="flex flex-col">
              <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight capitalize text-slate-900">
                {currentView === 'superadmin'
                  ? 'Painel Master'
                  : navItems.find((n) => n.id === currentView)?.label}
              </h1>

              {/* DEBUG tenant (temporário) */}
              <div className="text-[10px] text-slate-400 mt-1 select-all">
                tenant: {user?.activeTenantId || "null"}
              </div>

              <p className="text-xs font-medium text-[rgb(var(--muted))] tracking-wide">
                Visão geral operacional
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-[rgb(var(--surface))] border border-[rgb(var(--border))] px-4 py-2 rounded-2xl shadow-sm">
              <Building size={14} className="text-[rgb(var(--primary))]" />
              <span className="text-slate-700">{user.companyName}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-5 lg:p-8 print:overflow-visible print:h-auto">
          <div className="max-w-[1600px] mx-auto">
            <div className="rounded-[var(--radius)] bg-[rgb(var(--surface))] border border-[rgb(var(--border))] shadow-[var(--shadow)]">
              <div className="p-5 lg:p-7" key={"tenant-" + tenantVersion}>
  {renderView()}
</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
