
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Calendar, Wrench, FileText, Menu, Crown, X, Building, LogOut, Tags, Loader2, Users, ShieldAlert, Truck, Settings as SettingsIcon 
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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('setup=true')) {
        setShowSetup(true);
    }

    const initAuth = async () => {
      const timeout = setTimeout(() => {
        if (!authChecked) {
            setAuthChecked(true);
        }
      }, 5000);

      try {
        const cached = getUser();
        if (cached) setUser(cached);

        const supabase = getSupabase();
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
              const isSuperAdmin = cached?.role === 'super_admin' || profile.role === 'super_admin';
              
              const userData: User = {
                  id: profile.id,
                  name: profile.name,
                  email: profile.email,
                  companyName: isSuperAdmin ? 'MANTIVO ADMIN' : profile.company_name,
                  role: isSuperAdmin ? 'super_admin' : profile.role,
                  plan: isSuperAdmin ? 'enterprise' : profile.plan as PlanType,
                  accountId: profile.account_id,
                  preferences: profile.preferences,
                  permissions: isSuperAdmin ? { canEdit: true, canDelete: true } : (profile.permissions || { canEdit: false, canDelete: false }),
                  allowedCondos: profile.allowed_condos || []
              };
              localStorage.setItem('cg_user_cache', JSON.stringify(userData));
              setUser(userData);
           }
        }
      } catch (e) {
         console.error("Critical Auth Error:", e);
      } finally {
         clearTimeout(timeout);
         setAuthChecked(true);
      }
    };

    initAuth();

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
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
    if (isMobile) setIsSidebarOpen(false);
  };

  const renderView = () => {
    try {
      switch(currentView) {
        case 'dashboard': return <Dashboard />;
        case 'condos': return <CondoList />;
        case 'maintenance': return <MaintenanceList />;
        case 'categories': return <CategoryList />;
        case 'providers': return <ProviderList />;
        case 'calendar': return <CalendarView />;
        case 'reports': return <Reports />;
        case 'team': return <TeamList />;
        case 'settings': return <Settings />;
        case 'superadmin': return <SuperAdminPanel />;
        default: return <Dashboard />;
      }
    } catch (e) {
      console.error("Render View Error:", e);
      return <div className="p-8">Erro ao carregar componente. Verifique o console.</div>;
    }
  };

  if (!authChecked) {
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="text-slate-500 font-medium animate-pulse">Sincronizando dados...</p>
        </div>
    );
  }

  if (showSetup) return <SetupDatabase onBack={() => setShowSetup(false)} />;
  if (!user) return <AuthScreen onLoginSuccess={handleLoginSuccess} onOpenSetup={() => setShowSetup(true)} />;

  const isSuperAdmin = user.role === 'super_admin';

  return (
    <div className="flex h-screen supports-[height:100dvh]:h-[100dvh] bg-slate-50 overflow-hidden relative print:overflow-visible print:h-auto print:block">
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity print:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-slate-900 text-white transition-all duration-300 flex flex-col print:hidden ${isSidebarOpen ? 'translate-x-0 w-72 shadow-2xl shadow-slate-900/40' : (isMobile ? '-translate-x-full w-72' : 'w-20 translate-x-0')}`}>
        <div className="p-6 flex items-center justify-between h-20 shrink-0">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && !isMobile && 'justify-center w-full'}`}>
            <Logo size={40} />
            {isSidebarOpen && <span className="font-black text-xl tracking-tight whitespace-nowrap">Mantivo</span>}
          </div>
          {isMobile && (<button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-xl"><X size={24} /></button>)}
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => handleNavClick(item.id)} 
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 whitespace-nowrap group ${
                currentView === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              } ${!isSidebarOpen && !isMobile && 'justify-center'}`}
            >
              <item.icon size={20} className={`shrink-0 transition-transform ${currentView !== item.id && 'group-hover:scale-110'}`} />
              {isSidebarOpen && <span className="font-semibold text-sm tracking-tight">{item.label}</span>}
            </button>
          ))}

          {isSuperAdmin && (
              <button onClick={() => handleNavClick('superadmin')} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 whitespace-nowrap mt-8 border border-red-900/30 ${currentView === 'superadmin' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-red-400 hover:bg-red-900/20 hover:text-red-300'} ${!isSidebarOpen && !isMobile && 'justify-center'}`}>
                  <ShieldAlert size={20} className="shrink-0" />
                  {isSidebarOpen && <span className="font-bold text-sm">Painel Master</span>}
              </button>
          )}
        </nav>

        <div className="p-6 border-t border-white/5 bg-slate-900/50 shrink-0">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shrink-0 shadow-lg">{user.name.charAt(0)}</div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate font-semibold uppercase tracking-wider">{user.companyName}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Sair"><LogOut size={18} /></button>
            </div>
          ) : (
            <div className="flex flex-col gap-5 items-center justify-center">
               <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-black shadow-lg">{user.name.charAt(0)}</div>
               <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 p-2 hover:bg-red-400/10 rounded-xl transition-colors"><LogOut size={20} /></button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden w-full print:h-auto relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0 print:hidden z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 lg:hidden hover:bg-slate-100 rounded-xl"><Menu size={24} /></button>
            <div className="flex flex-col">
              <h1 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight capitalize">
                  {currentView === 'superadmin' ? 'Painel Master' : navItems.find(n => n.id === currentView)?.label}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Visão Geral Operacional</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-2 font-black bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm uppercase tracking-wider">
               <Building size={14} className="text-blue-500" />
               {user.companyName}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 lg:p-10 print:overflow-visible print:h-auto">
          <div className="max-w-[1600px] mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
