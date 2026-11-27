export type NavPage =
  | 'dashboard'
  | 'pemasukan'
  | 'pengeluaran'
  | 'sumber-pemasukan'
  | 'rincian-pengeluaran'
  | 'laporan'
  | 'google-sheets'
  | 'pengaturan';

export type TransactionType = 'pemasukan' | 'pengeluaran';

export type IncomeSource =
  | 'Kotak Infak'
  | 'Infak Online'
  | 'Sewa Hall'
  | 'Donatur';

export type ExpenseCategory =
  | 'Kegiatan Masjid'
  | 'Operasional'
  | 'Sosial & Dakwah';

export type UserRole = 'Takmir' | 'Bendahara' | 'Jamaah';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: TransactionType;
  category: IncomeSource | ExpenseCategory;
  amount: number;
  pic?: string; // Penanggung jawab
  notes?: string;
}

export interface MonthlyTarget {
  monthKey: string; // YYYY-MM
  label: string; // Jun, Jul, Agu, Sep, Okt, Nov
  fullLabel: string; // Juni 2026, etc.
  dateRangeLabel: string; // 01 – 30 Nov 2026
  targetAmount: number;
}

export interface MosqueSettings {
  mosqueName: string;
  institutionName: string;
  motto: string;
  tagline: string;
  announcementText: string;
  takmirLead: string;
  treasurerName: string;
}
