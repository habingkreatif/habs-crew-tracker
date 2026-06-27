import { PayrollEntity } from '../entities/payroll.entity';

export interface IPayrollRepository {
  /**
   * Mengambil riwayat payroll
   */
  getPayrolls(periodeMulai?: Date, periodeSelesai?: Date): Promise<PayrollEntity[]>;
  
  /**
   * Menyimpan draft payroll baru ke database
   */
  save(payroll: PayrollEntity): Promise<PayrollEntity>;

  /**
   * Update bonus/potongan atau status payroll
   */
  update(id: number, data: Partial<PayrollEntity>): Promise<PayrollEntity>;
  
  /**
   * Cari berdasarkan ID
   */
  findById(id: number): Promise<PayrollEntity | null>;
  
  /**
   * Hitung total jam kerja (absen masuk & keluar) dalam range tanggal tertentu
   */
  countTotalWorkHours(userId: string, start: Date, end: Date): Promise<number>;

  /**
   * Hapus payroll berdasarkan ID
   */
  delete(id: number): Promise<void>;
}
