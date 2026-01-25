
export enum FrequencyType {
  DAILY = 'Diária',
  WEEKLY = 'Semanal',
  MONTHLY = 'Mensal',
  BIMONTHLY = 'Bimestral',
  QUARTERLY = 'Trimestral',
  SEMIANNUAL = 'Semestral',
  YEARLY = 'Anual',
  CUSTOM = 'Personalizado'
}

export enum MaintenanceType {
  PREVENTIVE = 'Preventiva',
  CORRECTIVE = 'Corretiva'
}

export enum AttachmentType {
  BUDGET = 'Orçamento',
  TECHNICAL_REPORT = 'Laudo Técnico',
  ART_RRT = 'ART / RRT',
  MAINTENANCE_REPORT = 'Relatório',
  SERVICE_ORDER = 'Ordem de Serviço',
  PHOTOS = 'Fotos',
  INVOICE = 'Nota Fiscal',
  CERTIFICATE = 'Certificado',
  OTHER = 'Outros'
}

export enum MaintenanceStatus {
  ON_TIME = 'Em dia',
  WARNING = 'Próximo',
  OVERDUE = 'Vencida',
  COMPLETED = 'Concluída'
}

export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

export interface NotificationPreferences {
  email?: boolean;
  warningDays?: number[];
  overdueFrequency?: number;
  [key: string]: any;
}

export interface UserPermissions {
  canEdit: boolean;
  canDelete: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  companyName: string;
  role: 'admin' | 'guest' | 'super_admin'; 
  plan: PlanType;
  accountId: string;
  preferences?: NotificationPreferences;
  permissions?: UserPermissions;
  allowedCondos?: string[];
}

export interface Category {
  id: string;
  name: string;
  isSystem: boolean;
  ownerId?: string;
}

export interface Condo {
  id: string;
  ownerId: string;
  name: string;
  cnpj?: string;
  address: string; // Endereço completo (concatenado)
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  contactPhone?: string;
  managerEmail: string;
  additionalEmails?: string;
}

export interface Provider {
  id: string;
  ownerId: string;
  name: string;
  cnpj?: string;
  categories: string[];
  contactName: string;
  phone: string;
  whatsapp?: string;
  email: string;
  notes?: string;
}

export interface MaintenanceAttachment {
  fileName: string;
  type: AttachmentType | string;
  url?: string;
  // Fix: Added optional uploadDate property to MaintenanceAttachment to support sorting and metadata display
  uploadDate?: string;
}

export interface Maintenance {
  id: string;
  condoId: string;
  category: string;
  type: MaintenanceType;
  title: string;
  description?: string;
  providerId?: string;
  providerName?: string;
  providerContact?: string;
  providerEmail?: string;
  providerPhone?: string;
  estimatedCost?: number;
  cost: number;
  frequencyType: FrequencyType;
  frequencyDays?: number;
  lastExecutionDate: string;
  nextExecutionDate: string;
  status: MaintenanceStatus;
  attachments: MaintenanceAttachment[];
}

export const PLAN_LIMITS = {
  free: {
    condos: 1,
    maintenances: 3,
    users: 1,
    label: 'Free',
    price: 0
  },
  basic: {
    condos: 5,
    maintenances: Infinity,
    users: 3,
    label: 'Basic',
    price: 89.90
  },
  pro: {
    condos: 15,
    maintenances: Infinity,
    users: 5,
    label: 'Pro',
    price: 149.90
  },
  enterprise: {
    condos: Infinity,
    maintenances: Infinity,
    users: Infinity,
    label: 'Enterprise',
    price: 399.90
  }
};
