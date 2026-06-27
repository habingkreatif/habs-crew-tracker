export type PayrollStatus = 'DRAFT' | 'PAID';

export interface PayrollEntity {
  id?: number;
  userId: string;
  userName?: string;
  userRole?: string;
  periodeMulai: Date;
  periodeSelesai: Date;
  totalHadir: number;
  upahHarian: number;
  totalGajiPokok: number;
  bonusLembur: number;
  potongan: number;
  totalBersih: number;
  status: PayrollStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GeneratePayrollInput {
  userId: string;
  periodeMulai: Date;
  periodeSelesai: Date;
}
