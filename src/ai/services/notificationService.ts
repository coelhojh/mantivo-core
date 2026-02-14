import { getMaintenances, getCondos, getUser } from './storageService';
import { MaintenanceStatus } from '../types';
import { format, differenceInCalendarDays, isValid } from 'date-fns';
import { getSupabase } from './supabaseClient';

import { logger } from "../../shared/observability/logger";
const parseDate = (dateStr: string | undefined | null): Date => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(NaN);
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

/**
 * GERA O HTML DO E-MAIL (Template Profissional)
 */
export const generateEmailTemplate = (condoName: string, warnings: any[], overdues: any[]): string => {
  const totalAlerts = warnings.length + overdues.length;
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mantivo.com.br';
  const logoUrl = "https://cdn-icons-png.flaticon.com/512/9374/9374465.png"; // Fallback URL pública para logo

  const styles = {
    container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;',
    header: 'background-color: #0f172a; color: #ffffff; padding: 30px 20px; text-align: center;',
    body: 'padding: 20px; background-color: #ffffff; color: #334155;',
    h2: 'color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 20px;',
    ul: 'padding-left: 20px;',
    li: 'margin-bottom: 10px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 5px;',
    warningTag: 'color: #d97706; font-weight: bold; font-size: 12px; background: #fffbeb; padding: 2px 6px; border-radius: 4px;',
    overdueTag: 'color: #dc2626; font-weight: bold; font-size: 12px; background: #fef2f2; padding: 2px 6px; border-radius: 4px;',
    button: 'display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;',
    footer: 'background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;',
    logo: 'height: 40px; width: auto; margin-bottom: 15px; display: inline-block;'
  };

  let html = `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <img src="${logoUrl}" alt="Mantivo" style="${styles.logo}" />
        <h1 style="margin:0; font-size: 24px;">Relatório Diário</h1>
      </div>
      
      <div style="${styles.body}">
        <p>Olá, gestor(a) do <strong>${condoName}</strong>.</p>
        <p>Identificamos <strong>${totalAlerts}</strong> manutenções que requerem sua atenção.</p>
  `;

  if (overdues.length > 0) {
    html += `
      <h2 style="${styles.h2}">🚨 Vencidas (Ação Imediata)</h2>
      <ul style="${styles.ul}">
        ${overdues.map(({ item, days }) => {
            let formattedDate = '-';
            try {
                if(item.nextExecutionDate) {
                    formattedDate = format(parseDate(item.nextExecutionDate), 'dd/MM/yyyy');
                }
            } catch (e) {
  logger.error("NotificationService silent catch", e);
}
            return `
              <li style="${styles.li}">
                <span style="${styles.overdueTag}">VENCIDA HÁ ${days} DIAS</span><br/>
                <strong style="font-size: 16px; color: #1e293b;">${item.title}</strong><br/>
                <span style="font-size: 13px; color: #64748b;">${item.category} • Venceu em: ${formattedDate}</span>
              </li>
            `;
        }).join('')}
      </ul>
    `;
  }

  if (warnings.length > 0) {
    html += `
      <h2 style="${styles.h2}">📅 Próximos Vencimentos</h2>
      <ul style="${styles.ul}">
        ${warnings.map(({ item, days }) => {
            let formattedDate = '-';
            try {
                if(item.nextExecutionDate) {
                    formattedDate = format(parseDate(item.nextExecutionDate), 'dd/MM/yyyy');
                }
            } catch (e) {
  logger.error("NotificationService silent catch", e);
}
            return `
              <li style="${styles.li}">
                <span style="${styles.warningTag}">VENCE EM ${days} DIAS</span><br/>
                <strong style="font-size: 16px; color: #1e293b;">${item.title}</strong><br/>
                <span style="font-size: 13px; color: #64748b;">${item.category} • Data: ${formattedDate}</span>
              </li>
            `;
        }).join('')}
      </ul>
    `;
  }

  html += `
        <div style="text-align: center;">
          <a href="${baseUrl}" style="${styles.button}">Acessar Painel do Sistema</a>
        </div>
      </div>
      
      <div style="${styles.footer}">
        <p>Este é um e-mail automático do Mantivo.</p>
      </div>
    </div>
  `;

  return html;
};

export const checkAndSendNotifications = async (): Promise<string[]> => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const lastRun = localStorage.getItem('mantivo_last_notification_run');

  // Evita rodar várias vezes no mesmo dia
  if (lastRun === todayStr) {
    return []; 
  }

  const user = getUser();
  const warningDaysConfig = user?.preferences?.warningDays || [30, 20, 10, 1];
  const overdueFrequency = user?.preferences?.overdueFrequency || 7;

  const maintenances = await getMaintenances();
  const condos = await getCondos();
  const sentLogs: string[] = [];
  const today = new Date();

  const alertsByCondo: Record<string, { warnings: any[], overdues: any[] }> = {};

  maintenances.forEach(item => {
    if (item.status === MaintenanceStatus.COMPLETED) return;
    if (!item.nextExecutionDate) return;

    try {
        const nextDate = parseDate(item.nextExecutionDate);
        if (!isValid(nextDate)) return;

        const daysDiff = differenceInCalendarDays(nextDate, today);

        const isWarningDay = warningDaysConfig.includes(daysDiff);
        let isOverdueWeek = false;
        if (daysDiff < 0) {
            if (overdueFrequency === 1) isOverdueWeek = true;
            else isOverdueWeek = (Math.abs(daysDiff) % overdueFrequency === 0);
        }

        if (isWarningDay || isOverdueWeek) {
            if (!alertsByCondo[item.condoId]) {
                alertsByCondo[item.condoId] = { warnings: [], overdues: [] };
            }
            if (daysDiff >= 0) {
                alertsByCondo[item.condoId].warnings.push({ item, days: daysDiff });
            } else {
                alertsByCondo[item.condoId].overdues.push({ item, days: Math.abs(daysDiff) });
            }
        }
    } catch { return; }
  });

  const condoIds = Object.keys(alertsByCondo);

  if (condoIds.length === 0) {
    localStorage.setItem('mantivo_last_notification_run', todayStr);
    return [];
  }

  const supabase = getSupabase();

  for (const condoId of condoIds) {
    const condo = condos.find(c => c.id === condoId);
    if (!condo || !condo.managerEmail) continue;

    const { warnings, overdues } = alertsByCondo[condoId];
    
    const emailHtml = generateEmailTemplate(condo.name, warnings, overdues);
    const recipients = [condo.managerEmail, ...(condo.additionalEmails ? condo.additionalEmails.split(',') : [])]
      .map(e => e.trim())
      .filter(Boolean);

    // --- CHAMADA COM FALLBACK ---
    try {
        const { error } = await supabase.functions.invoke('send-email', {
            body: {
                to: recipients,
                subject: `⚠️ Alerta de Manutenção - ${condo.name}`,
                html: emailHtml
            }
        });

        if (error) {
            throw error; // Lança para o catch
        } else {
            sentLogs.push(`✅ E-mail enviado para ${condo.name}: ${warnings.length} avisos, ${overdues.length} vencidos.`);
        }
    } catch (err: any) {
        logger.error("Notification backend unavailable", err, { condoId: condo.id, condoName: condo.name });
        
        // Se falhar (ex: função não implantada/CORS), loga como SIMULADO para não quebrar a UX
        if (err.message && (err.message.includes('Failed to send') || err.message.includes('Function not found'))) {
             sentLogs.push(`⚠️ E-mail SIMULADO para ${condo.name} (Backend Offline).`);
        } else {
             sentLogs.push(`❌ Erro no envio para ${condo.name}: ${err.message}`);
        }
    }
  }

  localStorage.setItem('mantivo_last_notification_run', todayStr);
  return sentLogs;
};