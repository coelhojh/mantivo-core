
import { getSupabase } from './supabaseClient';
import { getUser } from './storageService';
import { PlanType } from '../types';

/**
 * SERVICE DE PAGAMENTOS (Integração PagBank via Supabase Edge Functions)
 */

export const initiatePagBankCheckout = async (plan: PlanType): Promise<void> => {
  const user = getUser();
  if (!user) {
    alert("Usuário não autenticado.");
    return;
  }

  if (plan === 'free') return;

  const planNames: Record<string, string> = {
    basic: 'Plano Basic - Mantivo',
    pro: 'Plano Pro - Mantivo',
    enterprise: 'Plano Enterprise - Mantivo'
  };

  const planPrices: Record<string, number> = {
    basic: 8990, 
    pro: 14990,
    enterprise: 39990
  };

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Banco de dados não configurado.");

    // Em produção, esta função deve criar a ordem no PagBank e retornar a URL de checkout
    const { data, error } = await supabase.functions.invoke('create-pagbank-checkout', {
      body: { 
        description: planNames[plan],
        amount: planPrices[plan],
        planType: plan,
        userId: user.id,
        email: user.email,
        returnUrl: window.location.origin + '/dashboard?payment=pending'
      },
    });

    if (error) {
        console.error("Erro na Edge Function:", error);
        alert("Ocorreu um erro ao conectar com o processador de pagamentos. Entre em contato com o suporte.");
        return;
    }
    
    if (data?.redirect_url) {
        window.location.href = data.redirect_url;
    } else {
        // Fallback apenas para demonstração - EM PRODUÇÃO ISSO DEVE SER REMOVIDO
        console.warn("Ambiente de Demo: Redirecionamento não retornado.");
        alert("Simulação: O checkout do PagBank seria aberto agora. Após o pagamento, seu plano será atualizado via Webhook.");
    }

  } catch (err: any) {
    console.error("Erro no checkout:", err);
    alert("Erro ao processar pagamento: " + err.message);
  }
};
