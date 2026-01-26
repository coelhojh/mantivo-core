
import React, { useState, useEffect } from 'react';
import { getUser, updateUserPreferences } from '../services/storageService';
import { generateEmailTemplate } from '../services/notificationService';
import { Settings as SettingsIcon, Save, Bell, Clock, AlertTriangle, CheckCircle, Loader2, Eye, X, Database } from 'lucide-react';
import { NotificationPreferences } from '../types';

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [warningDaysStr, setWarningDaysStr] = useState('30, 20, 10, 1');
  const [overdueFreq, setOverdueFreq] = useState<number>(7);

  const user = getUser();

  useEffect(() => {
    if (user && user.preferences) {
      if (user.preferences.warningDays) setWarningDaysStr(user.preferences.warningDays.join(', '));
      if (user.preferences.overdueFrequency) setOverdueFreq(user.preferences.overdueFrequency);
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const daysArray = warningDaysStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)).sort((a, b) => b - a);
    await updateUserPreferences({ warningDays: daysArray, overdueFrequency: overdueFreq, email: true });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <SettingsIcon className="text-blue-600" />
            Configurações
          </h2>
          <p className="text-sm text-slate-500">Personalização de alertas, prazos e parâmetros do sistema.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-8">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Alertas de Antecedência</label>
            <input className="w-full border p-3 rounded-2xl bg-slate-50 focus:border-blue-500 outline-none text-sm font-medium" value={warningDaysStr} onChange={e => setWarningDaysStr(e.target.value)} placeholder="30, 15, 7, 1" />
            <p className="text-[10px] text-slate-400 mt-2">Dias antes do vencimento para envio de e-mails.</p>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar Configurações
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
