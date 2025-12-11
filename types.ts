
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  vin: string;
  fuel: string;
  engine: string;
  power: string;
  tires: string;
  color: string;
  image: string;
  km: number;
  type?: string;
  status: 'active' | 'maintenance' | 'inactive';
  nextInspectionDate: string;
  nextInspectionStatus: 'ok' | 'warning' | 'expired';
  nextIucDate: string;
  nextIucStatus: 'ok' | 'warning' | 'expired';
  nextServiceKm: number;
  nextServiceDate: string;
  // New fields for Annual Review
  lastAnnualReviewDate?: string;
  nextAnnualReviewDate?: string;
  
  history?: MaintenanceRecord[];
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'Revisão' | 'Peças' | 'IPO' | 'Reparação' | 'Imposto' | 'Manutenção';
  service: string;
  garage: string;
  km: number;
  cost?: number;
}

export type ViewState = 'dashboard' | 'fleet' | 'details' | 'schedule';
