import React, { useState, useEffect } from 'react';
import { getAllTenants, updateTenantPlan, getUser } from '../services/storageService';
import { ShieldAlert, Users, DollarSign, Search, Edit2, Check, X, Loader2, TrendingUp, Building } from 'lucide-react';
import { PLAN_LIMITS } from '../types';
import { format } from 'date-fns';
import { logger } from "../../shared/observability/logger";
import SuperadminTenantSwitcher from "./superadmin/SuperadminTenantSwitcher";
const SuperAdminPanel: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const data = await getAllTenants();
        setTenants(data);
    } catch (e) { logger.error("Unexpected error", e); } finally { setLoading(false); }
  };

  const filteredTenants = tenants.filter(t => 
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mrr = tenants.reduce((acc, curr) => acc + (PLAN_LIMITS[curr.plan as keyof typeof PLAN_LIMITS]?.price || 0), 0);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="text-red-600" />
            Painel Administrativo Master
          </h2>
          <p className="text-sm text-slate-500">Gestão global da plataforma, clientes e métricas financeiras.</p>

        {/* Mantivo — Superadmin Tenant Switcher */}
        <div className="mt-4">
          <SuperadminTenantSwitcher />
        </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Empresas</p>
                <h3 className="text-2xl font-black text-slate-800">{tenants.length}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Faturamento (MRR)</p>
                <h3 className="text-2xl font-black text-green-600">R$ {mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Base de Clientes</h3>
                <input className="border rounded-xl px-4 py-2 text-sm outline-none w-64 bg-slate-50" placeholder="Buscar cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400 text-[10px] uppercase">
                    <tr> <th className="px-6 py-3">Cliente</th> <th className="px-6 py-3">Plano</th> <th className="px-6 py-3 text-right">Ações</th> </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {filteredTenants.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-3"> <p className="font-bold">{t.name}</p> <p className="text-xs text-slate-400">{t.email}</p> </td>
                            <td className="px-6 py-3"> <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-1 rounded-full">{t.plan}</span> </td>
                            <td className="px-6 py-3 text-right"> <button className="text-blue-600 font-bold text-xs">Gerenciar</button> </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default SuperAdminPanel;
18446744073709551615