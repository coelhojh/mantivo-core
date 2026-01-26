
import { getSupabase } from './supabaseClient';
import { User, Condo, Maintenance, MaintenanceStatus, FrequencyType, MaintenanceType, Category, PLAN_LIMITS, PlanType, NotificationPreferences, UserPermissions, MaintenanceAttachment, AttachmentType, Provider } from '../types';
import { addDays, addMonths, addYears, differenceInCalendarDays, format, isValid } from 'date-fns';

// --- HELPERS ---

// Fix: Added local parseISO helper as it is not exported by date-fns in this environment
const parseISO = (dateStr: string | undefined | null): Date => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(NaN);
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    let msg = "Erro desconhecido";
    if (typeof error === 'string') msg = error;
    else if (error instanceof Error) msg = error.message;
    else if (typeof error === 'object' && error !== null) {
        msg = (error as any).message || (error as any).error_description || JSON.stringify(error);
    }
    throw new Error(msg);
};

const calculateNextDate = (completionDate: string, frequency: FrequencyType, days?: number): string => {
    const baseDate = parseISO(completionDate);
    if (!isValid(baseDate)) return completionDate;

    let nextDate: Date;
    switch (frequency) {
        case FrequencyType.DAILY:
            nextDate = addDays(baseDate, 1);
            break;
        case FrequencyType.WEEKLY:
            nextDate = addDays(baseDate, 7);
            break;
        case FrequencyType.MONTHLY:
            nextDate = addMonths(baseDate, 1);
            break;
        case FrequencyType.BIMONTHLY:
            nextDate = addMonths(baseDate, 2);
            break;
        case FrequencyType.QUARTERLY:
            nextDate = addMonths(baseDate, 3);
            break;
        case FrequencyType.SEMIANNUAL:
            nextDate = addMonths(baseDate, 6);
            break;
        case FrequencyType.YEARLY:
            nextDate = addYears(baseDate, 1);
            break;
        case FrequencyType.CUSTOM:
            nextDate = addDays(baseDate, days || 30);
            break;
        default:
            nextDate = addMonths(baseDate, 1);
    }
    return format(nextDate, 'yyyy-MM-dd');
};

// --- AUTH ---

export const login = async (email: string, pass: string): Promise<User | null> => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
  if (error) throw new Error("Credenciais inválidas.");
  if (data.user) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    let userProfile = profile;
    if (!userProfile) {
        const newProfile = { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name || 'Usuário', role: 'admin', plan: 'free', account_id: data.user.id };
        await supabase.from('profiles').upsert([newProfile]);
        userProfile = newProfile;
    }
    const user: User = { id: userProfile.id, name: userProfile.name, email: userProfile.email, companyName: userProfile.company_name || 'Minha Empresa', role: userProfile.role, plan: userProfile.plan || 'free', accountId: userProfile.account_id, preferences: userProfile.preferences, permissions: userProfile.permissions || { canEdit: true, canDelete: true }, allowedCondos: userProfile.allowed_condos || [] };
    localStorage.setItem('cg_user_cache', JSON.stringify(user));
    return user;
  }
  return null;
};

export const logout = async (): Promise<void> => {
  const supabase = getSupabase();
  if (supabase) await supabase.auth.signOut();
  localStorage.removeItem('cg_user_cache');
};

export const getUser = (): User | null => {
  try {
    const cache = localStorage.getItem('cg_user_cache');
    return cache ? JSON.parse(cache) : null;
  } catch { return null; }
};

export const updateUserPreferences = async (prefs: NotificationPreferences): Promise<void> => {
  const user = getUser();
  const supabase = getSupabase();
  if (!user || !supabase) return;
  await supabase.from('profiles').update({ preferences: prefs }).eq('id', user.id);
  localStorage.setItem('cg_user_cache', JSON.stringify({ ...user, preferences: prefs }));
};

export const updateUserAccess = async (targetUserId: string, permissions: UserPermissions, allowedCondos: string[]) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.from('profiles').update({ permissions, allowed_condos: allowedCondos }).eq('id', targetUserId);
    if (error) handleError(error, 'updateUserAccess');
};

// --- CRUD ---

export const getProviders = async (): Promise<Provider[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('providers').select('*');
    if (error) return [];
    return (data || []).map((p: any) => ({
        id: p.id, ownerId: p.owner_id, name: p.name, cnpj: p.cnpj, categories: p.categories || [],
        contactName: p.contact_name, phone: p.phone, whatsapp: p.whatsapp, email: p.email, notes: p.notes
    }));
};

export const saveProvider = async (p: Partial<Provider>) => {
    const user = getUser();
    const supabase = getSupabase();
    if (!user || !supabase) return;
    // Fix: Changed p.contact_name to p.contactName as per the Provider type definition
    const payload = { owner_id: user.id, name: p.name, cnpj: p.cnpj, categories: p.categories || [], contact_name: p.contactName, phone: p.phone, whatsapp: p.whatsapp, email: p.email, notes: p.notes };
    const { error } = await supabase.from('providers').insert([payload]);
    if (error) handleError(error, 'saveProvider');
};

export const updateProvider = async (p: Provider) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const payload = { name: p.name, cnpj: p.cnpj, categories: p.categories || [], contact_name: p.contactName, phone: p.phone, whatsapp: p.whatsapp, email: p.email, notes: p.notes };
    const { error } = await supabase.from('providers').update(payload).eq('id', p.id);
    if (error) handleError(error, 'updateProvider');
};

export const deleteProvider = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.from('providers').delete().eq('id', id);
    if (error) handleError(error, 'deleteProvider');
};

export const getTeamMembers = async (): Promise<User[]> => {
    const user = getUser();
    const supabase = getSupabase();
    if (!user || !supabase) return [];
    const query = supabase.from('profiles').select('*');
    if (user.role !== 'super_admin') query.eq('account_id', user.accountId);
    const { data } = await query;
    return (data || []).map((p: any) => ({ id: p.id, name: p.name, email: p.email, companyName: p.company_name, role: p.role, plan: p.plan, accountId: p.account_id, preferences: p.preferences, permissions: p.permissions, allowedCondos: p.allowed_condos }));
};

export const inviteTeamMember = async (email: string, name: string): Promise<{ success: boolean; message: string }> => {
    return { 
        success: true, 
        message: `[SIMULAÇÃO] Convite enviado para ${name} (${email}). Em produção, o usuário receberia um link de acesso.` 
    };
};

export const getCategories = async (): Promise<Category[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('categories').select('*').order('name', { ascending: true });
    return (data || []).map((c: any) => ({ id: c.id, name: c.name, isSystem: c.is_system, ownerId: c.owner_id }));
};

export const saveCategory = async (name: string) => {
    const user = getUser();
    const supabase = getSupabase();
    if (!user || !supabase) return;
    const { error } = await supabase.from('categories').insert([{ name, owner_id: user.id, is_system: false }]);
    if (error) handleError(error, 'saveCategory');
};

export const deleteCategory = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) handleError(error, 'deleteCategory');
};

export const getCondos = async (): Promise<Condo[]> => {
    const user = getUser();
    const supabase = getSupabase();
    if (!user || !supabase) return [];
    const { data } = await supabase.from('condos').select('*');
    const all = (data || []).map((c: any) => ({ id: c.id, ownerId: c.owner_id, name: c.name, cnpj: c.cnpj, address: c.address, contactPhone: c.contact_phone, managerEmail: c.manager_email, additionalEmails: c.additional_emails, cep: c.cep, street: c.street, number: c.number, complement: c.complement, district: c.district, city: c.city, state: c.state }));
    if (user.role === 'guest') return all.filter(c => user.allowedCondos?.includes(c.id));
    return all;
};

export const saveCondo = async (c: Partial<Condo>) => {
    const user = getUser();
    const supabase = getSupabase();
    if (!user || !supabase) return;
    const payload = { owner_id: user.id, name: c.name, cnpj: c.cnpj, address: c.address, contact_phone: c.contactPhone, manager_email: c.managerEmail, additional_emails: c.additionalEmails, cep: c.cep, street: c.street, number: c.number, complement: c.complement, district: c.district, city: c.city, state: c.state };
    const { error } = await supabase.from('condos').insert([payload]);
    if (error) handleError(error, 'saveCondo');
};

export const updateCondo = async (c: Condo) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const payload = { name: c.name, cnpj: c.cnpj, address: c.address, contact_phone: c.contactPhone, manager_email: c.managerEmail, additional_emails: c.additionalEmails, cep: c.cep, street: c.street, number: c.number, complement: c.complement, district: c.district, city: c.city, state: c.state };
    const { error } = await supabase.from('condos').update(payload).eq('id', c.id);
    if (error) handleError(error, 'updateCondo');
};

export const deleteCondo = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.from('condos').delete().eq('id', id);
    if (error) handleError(error, 'deleteCondo');
};

export const getMaintenances = async (): Promise<Maintenance[]> => {
    const user = getUser();
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('maintenances').select('*');
    const all = (data || []).map((m: any) => ({
        id: m.id, condoId: m.condo_id, category: m.category, type: m.maintenance_type, title: m.title, description: m.description, 
        providerId: m.provider_id, providerName: m.provider_name, providerContact: m.provider_contact, providerEmail: m.provider_email, providerPhone: m.provider_phone,
        cost: m.cost, estimatedCost: m.estimated_cost, frequencyType: m.frequency_type, frequencyDays: m.frequency_days,
        lastExecutionDate: m.last_execution_date, nextExecutionDate: m.next_execution_date || format(new Date(), 'yyyy-MM-dd'),
        status: m.status, attachments: m.attachments || []
    }));
    if (user?.role === 'guest') return all.filter(m => user.allowedCondos?.includes(m.condoId));
    return all;
};

export const saveMaintenance = async (m: Partial<Maintenance>) => {
    const user = getUser();
    const supabase = getSupabase();
    if (!user || !supabase) throw new Error("Não logado.");
    // Fix: Using camelCase property names for Partial<Maintenance> object access
    const payload = {
        owner_id: user.id, condo_id: m.condoId, category: m.category, maintenance_type: m.type, title: m.title, description: m.description || "",
        provider_id: m.providerId || null, provider_name: m.providerName || "", provider_contact: m.providerContact || "", provider_email: m.providerEmail || "",
        provider_phone: m.providerPhone || "", cost: m.cost || 0, estimated_cost: m.estimatedCost || 0, frequency_type: m.frequencyType, 
        frequency_days: m.frequencyDays || 0, next_execution_date: m.nextExecutionDate, status: m.status, attachments: m.attachments || []
    };
    const { error } = await supabase.from('maintenances').insert([payload]);
    if (error) handleError(error, 'saveMaintenance');
};

export const updateMaintenance = async (m: Maintenance) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const payload = {
        category: m.category, maintenance_type: m.type, title: m.title, description: m.description,
        provider_id: m.providerId, provider_name: m.providerName, provider_contact: m.providerContact,
        provider_email: m.providerEmail, provider_phone: m.providerPhone, cost: m.cost,
        estimated_cost: m.estimatedCost, frequency_type: m.frequencyType, 
        // Fix: Changed m.frequency_days to m.frequencyDays and m.next_execution_date to m.nextExecutionDate
        frequency_days: m.frequencyDays,
        last_execution_date: m.lastExecutionDate, next_execution_date: m.nextExecutionDate,
        status: m.status, attachments: m.attachments
    };
    const { error } = await supabase.from('maintenances').update(payload).eq('id', m.id);
    if (error) handleError(error, 'updateMaintenance');
};

export const deleteMaintenance = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.from('maintenances').delete().eq('id', id);
    if (error) handleError(error, 'deleteMaintenance');
};

/**
 * CONCLUI UMA MANUTENÇÃO E GERA O PRÓXIMO CICLO SE PREVENTIVA
 */
export const completeMaintenance = async (id: string, date: string, cost: number, attachments: any[], provider: any) => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    // 1. Busca os dados atuais para clonagem
    const { data: item } = await supabase.from('maintenances').select('*').eq('id', id).single();
    if (!item) return;

    // 2. Atualiza o registro atual para CONCLUÍDA
    const { error: updateError } = await supabase.from('maintenances').update({
        status: MaintenanceStatus.COMPLETED,
        last_execution_date: date,
        cost: cost, 
        attachments: attachments, 
        provider_name: provider.name,
        provider_contact: provider.contact, 
        provider_email: provider.email, 
        provider_phone: provider.phone
    }).eq('id', id);

    if (updateError) handleError(updateError, 'completeMaintenance');

    // 3. Se for PREVENTIVA, cria um novo registro para o próximo ciclo
    if (item.maintenance_type === MaintenanceType.PREVENTIVE) {
        const nextDate = calculateNextDate(date, item.frequency_type as FrequencyType, item.frequency_days);
        
        const nextPayload = {
            owner_id: item.owner_id,
            condo_id: item.condo_id,
            category: item.category,
            maintenance_type: item.maintenance_type,
            title: item.title,
            description: item.description,
            provider_id: item.provider_id,
            provider_name: item.provider_name,
            provider_contact: item.provider_contact,
            provider_email: item.provider_email,
            provider_phone: item.provider_phone,
            estimated_cost: item.estimated_cost,
            cost: 0,
            frequency_type: item.frequency_type,
            frequency_days: item.frequency_days,
            last_execution_date: null,
            next_execution_date: nextDate,
            status: MaintenanceStatus.ON_TIME, // Representa "A Vencer" ou "Em dia"
            attachments: [] // O novo ciclo começa sem os anexos da execução passada
        };
        
        const { error: insertError } = await supabase.from('maintenances').insert([nextPayload]);
        if (insertError) handleError(insertError, 'createNextMaintenanceCycle');
    }
};

/**
 * REVERTE A CONCLUSÃO DE UMA MANUTENÇÃO
 */
export const undoCompleteMaintenance = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase.from('maintenances').update({ 
        status: MaintenanceStatus.ON_TIME, 
        last_execution_date: null,
        cost: 0 
    }).eq('id', id);

    if (error) {
        console.error("Erro ao desfazer conclusão:", error);
        throw error;
    }
};

export const checkPlanLimits = async (type: string): Promise<boolean> => {
  return true; 
};

export const getAllTenants = async () => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('profiles').select('*').neq('role', 'guest');
    return data || [];
};

export const updateTenantPlan = async (userId: string, newPlan: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from('profiles').update({ plan: newPlan }).eq('id', userId);
};

export const upgradePlan = async (plan: PlanType) => {
    const user = getUser();
    const supabase = getSupabase();
    if (!user || !supabase) return;
    const { error } = await supabase.from('profiles').update({ plan }).eq('id', user.id);
    if (error) handleError(error, 'upgradePlan');
    localStorage.setItem('cg_user_cache', JSON.stringify({ ...user, plan }));
};

export const register = async (userData: any): Promise<User | string> => {
  const supabase = getSupabase();
  if (!supabase) return "Erro Supabase";
  const { data, error } = await supabase.auth.signUp({ email: userData.email, password: userData.pass, options: { data: { name: userData.name, company: userData.company } } });
  if (error) return error.message;
  return "Conta criada! Verifique seu email.";
};
