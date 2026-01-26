
import React, { useState } from 'react';
import { Crown, Check, X, Loader2, Star, Zap, Building } from 'lucide-react';
import { initiatePagBankCheckout } from '../services/paymentService';
import { PLAN_LIMITS, PlanType } from '../types';
import { getUser, upgradePlan } from '../services/storageService';

interface UpgradeModalProps {
  onClose: () => void;
  reason: 'condo' | 'maintenance' | 'team' | 'general';
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, reason }) => {
  const [loading, setLoading] = useState<string | null>(null); 
  const user = getUser();
  const currentPlan = user?.plan || 'free';

  const handleUpgrade = async (plan: PlanType) => {
    setLoading(plan);
    try {
        await upgradePlan(plan);
        alert(`Plano ${plan.toUpperCase()} ativado com sucesso (Modo Demo)!`);
        onClose();
    } catch (e) {
        console.error(e);
        alert("Erro ao simular upgrade.");
    } finally {
        setLoading(null);
    }
  };

  const getReasonText = () => {
    switch(reason) {
      case 'condo': return 'Você atingiu o limite de condomínios do seu plano atual.';
      case 'maintenance': return 'Você atingiu o limite de manutenções do seu plano atual.';
      case 'team': return 'Faça upgrade para adicionar mais usuários na sua equipe.';
      default: return 'Desbloqueie mais recursos com nossos planos premium.';
    }
  };

  const plans = [
    {
      id: 'basic' as PlanType,
      name: 'Basic',
      price: PLAN_LIMITS.basic.price,
      color: 'blue',
      icon: Zap,
      features: [
        `${PLAN_LIMITS.basic.condos} Condomínios`,
        'Manutenções Ilimitadas',
        `${PLAN_LIMITS.basic.users} Usuários`,
        'Relatórios Básicos'
      ]
    },
    {
      id: 'pro' as PlanType,
      name: 'Pro',
      price: PLAN_LIMITS.pro.price,
      color: 'amber',
      icon: Crown,
      popular: true,
      features: [
        `${PLAN_LIMITS.pro.condos} Condomínios`,
        'Manutenções Ilimitadas',
        `${PLAN_LIMITS.pro.users} Usuários`,
        'Relatórios Avançados',
        'Suporte Prioritário'
      ]
    },
    {
      id: 'enterprise' as PlanType,
      name: 'Enterprise',
      price: PLAN_LIMITS.enterprise.price,
      color: 'purple',
      icon: Building,
      features: [
        'Condomínios Ilimitados',
        'Manutenções Ilimitadas',
        'Usuários Ilimitados',
        'Gestor de Conta Dedicado',
        'API de Integração'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto font-sans">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-6xl overflow-hidden relative my-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10 p-2 hover:bg-slate-50 rounded-xl transition-all">
          <X size={24} />
        </button>

        <div className="bg-slate-900 p-10 text-white text-center">
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Escolha o plano ideal para sua gestão</h2>
          <p className="text-slate-400 text-sm font-medium">{getReasonText()}</p>
          <p className="mt-3 text-[10px] text-blue-400 font-bold uppercase tracking-widest">Acesso de Desenvolvedor: Upgrade Instantâneo Liberado</p>
        </div>

        <div className="p-8 md:p-12 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              
              const colorClasses = {
                // @ts-ignore
                blue: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50' },
                // @ts-ignore
                amber: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' },
                // @ts-ignore
                purple: { bg: 'bg-purple-900', text: 'text-purple-700', light: 'bg-purple-50' }
              }[plan.color];

              return (
                <div 
                  key={plan.id} 
                  className={`bg-white rounded-[32px] p-8 relative flex flex-col border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${plan.popular ? 'border-amber-400 shadow-xl scale-105 z-10' : 'border-slate-200'}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                      Mais Popular
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${colorClasses?.light} ${colorClasses?.text} shadow-inner`}>
                      <plan.icon size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline justify-center gap-1">
                      <span className="text-sm font-semibold text-slate-400">R$</span>
                      <span className="text-4xl font-bold text-slate-900 tracking-tighter">{plan.price.toFixed(2).replace('.', ',')}</span>
                      <span className="text-sm font-semibold text-slate-400">/mês</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-10 flex-1">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                        <div className={`p-1 rounded-lg ${colorClasses?.light} ${colorClasses?.text}`}>
                          <Check size={14} />
                        </div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading !== null || isCurrent}
                    className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95
                      ${isCurrent 
                        ? 'bg-slate-100 text-slate-400 cursor-default' 
                        : `${colorClasses?.bg} text-white hover:opacity-95 shadow-blue-100`
                      }`}
                  >
                    {loading === plan.id ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isCurrent ? 'Plano Atual' : 'Contratar Plano')}
                  </button>
                </div>
              );
            })}

          </div>

          <div className="mt-10 text-center text-xs text-slate-500">
            <p className="bg-blue-50 text-blue-700 p-4 rounded-2xl border border-blue-100 mb-6 font-medium">
              <strong>Simulação de Vendas:</strong> No modo editor, o sistema ativa o plano imediatamente para você testar as funcionalidades.
            </p>
            <p className="font-semibold uppercase tracking-widest text-[10px]">Seu plano atual é: <span className="text-blue-600 font-bold">{currentPlan}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
