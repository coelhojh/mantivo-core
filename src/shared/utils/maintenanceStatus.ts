import { differenceInDays, isValid } from 'date-fns';
import { Maintenance, MaintenanceStatus } from '../../ai/types';

export type MantivoStatus3 = 'OVERDUE' | 'ON_TIME' | 'COMPLETED';

export const parseDateYMD = (dateStr?: string | null): Date => {
  if (!dateStr) return new Date(NaN);
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Status padronizado (3 estados):
 * - COMPLETED: se marcado como concluído no dado
 * - OVERDUE: nextExecutionDate válida no passado
 * - ON_TIME: qualquer coisa que ainda não venceu (inclui o antigo "WARNING")
 */
export const getStatus3 = (m: Maintenance, now: Date = new Date()): MantivoStatus3 => {
  if (m.status === MaintenanceStatus.COMPLETED) return 'COMPLETED';

  const nextStr = m.nextExecutionDate;
  if (!nextStr) return 'ON_TIME';

  const next = parseDateYMD(nextStr);
  if (!isValid(next)) return 'ON_TIME';

  const diff = differenceInDays(next, now);
  return diff < 0 ? 'OVERDUE' : 'ON_TIME';
};

export const STATUS3_LABEL: Record<MantivoStatus3, string> = {
  OVERDUE: 'Vencidas',
  ON_TIME: 'Em dia',
  COMPLETED: 'Concluídas',
};

export const STATUS3_COLOR_TOKEN: Record<MantivoStatus3, string> = {
  OVERDUE: 'rgb(var(--danger))',   // vermelho
  ON_TIME: 'rgb(var(--primary))',  // azul
  COMPLETED: 'rgb(var(--success))' // verde
};
