
import React, { useState, useEffect } from 'react';
import { login, register } from '../services/storageService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { 
  Mail as MailIcon, 
  Lock as LockIcon, 
  User as UserIcon, 
  Building as BuildingIcon, 
  ArrowRight as ArrowIcon, 
  AlertCircle as AlertIcon, 
  Check as CheckSmall, 
  Database as DbIcon,
  Settings as SettingsIcon
} from 'lucide-react';
import Logo from './Logo';

interface AuthScreenProps {
  onLoginSuccess: () => void;
  onOpenSetup: () => void; // Nova prop para abrir o setup sem recarregar a página
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, onOpenSetup }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regPass, setRegPass] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false, upper: false, lower: false, number: false
  });

  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'register') {
        setMode('register');
        setRegEmail(params.get('email') || '');
        setInviteCode(params.get('invite'));
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRegPass(val);
    setPasswordCriteria({
      length: val.length >= 8,
      upper: /[A-Z]/.test(val),
      lower: /[a-z]/.test(val),
      number: /[0-9]/.test(val)
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isConfigured) {
        setError('A conexão com o banco de dados não foi detectada. Por favor, realize a configuração técnica abaixo para continuar.');
        return;
    }

    setIsLoading(true);
    try {
      const user = await login(loginEmail, loginPass);
      if (user) onLoginSuccess();
      else setError('Credenciais inválidas ou erro na autenticação.');
    } catch (err: any) {
      setError(err.message || 'Falha ao conectar ao Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isConfigured) {
        setError('Conexão com o banco de dados necessária para registro.');
        return;
    }
    setIsLoading(true);
    try {
      const result = await register({
        name: regName, email: regEmail, pass: regPass, company: regCompany, accountId: inviteCode 
      });
      if (typeof result === 'string') setError(result);
      else {
        setSuccessMsg("Conta criada com sucesso! Verifique seu e-mail.");
        setTimeout(() => setMode('login'), 2000);
      }
    } catch (err) { setError('Erro ao registrar.'); } finally { setIsLoading(false); }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean, text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-slate-400'}`}>
        {met ? <CheckSmall size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
        <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        
        <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
          <div className="flex justify-center mb-4 relative z-10">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Logo size={56} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white relative z-10">Mantivo</h1>
          <p className="text-slate-400 text-sm mt-1 relative z-10">Sistema de Gestão de Manutenção</p>
        </div>

        <div className="p-8 flex-1">
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Acesse sua conta</h2>
              
              {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm text-center font-medium">{successMsg}</div>}

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">E-mail</label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="email" required className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="seu@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Senha</label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="password" required className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
                </div>
              </div>

              {error && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <p className="text-red-600 text-sm flex items-center gap-2">
                        <AlertIcon size={14}/> {error}
                      </p>
                  </div>
              )}

              <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition flex justify-center items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-70">
                  {isLoading ? 'Conectando...' : 'Entrar'}
                  {!isLoading && <ArrowIcon size={18} />}
              </button>

              <div className="text-center mt-6 pt-4 border-t">
                <p className="text-sm text-slate-500">
                  Ainda não tem conta? <button type="button" onClick={() => setMode('register')} className="text-blue-600 font-bold hover:underline">Cadastre sua empresa</button>
                </p>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">Criar conta empresarial</h2>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Seu Nome</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input required className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="João Silva" value={regName} onChange={(e) => setRegName(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Empresa / Administradora</label>
                <div className="relative">
                  <BuildingIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input required className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nome da Empresa" value={regCompany} onChange={(e) => setRegCompany(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">E-mail Corporativo</label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="email" required className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@empresa.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Defina uma Senha</label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="password" required className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" value={regPass} onChange={handlePasswordChange} />
                </div>
                <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 grid grid-cols-2 gap-2">
                    <PasswordRequirement met={passwordCriteria.length} text="8+ caracteres" />
                    <PasswordRequirement met={passwordCriteria.upper} text="Maiúscula" />
                    <PasswordRequirement met={passwordCriteria.lower} text="Minúscula" />
                    <PasswordRequirement met={passwordCriteria.number} text="Número" />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

              <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-lg active:scale-95">
                {isLoading ? 'Registrando...' : 'Criar Conta'}
              </button>

              <div className="text-center mt-2">
                <button type="button" onClick={() => setMode('login')} className="text-sm text-slate-500 hover:text-slate-800">Já sou cliente</button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <DbIcon size={12} className="opacity-50" />
          <button 
            onClick={onOpenSetup}
            className="hover:text-blue-600 transition-colors flex items-center gap-1 uppercase tracking-widest"
          >
             <SettingsIcon size={10} /> Configuração de Banco de Dados
          </button>
      </div>
    </div>
  );
};

export default AuthScreen;
