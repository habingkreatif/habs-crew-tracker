import { IPayrollRepository } from '@/domain/repositories/payroll.repository';
import { PayrollEntity, PayrollStatus } from '@/domain/entities/payroll.entity';
import * as ds from '../datasource/prisma/payroll.datasource';

const toDomainEntity = (raw: any): PayrollEntity => ({
  id: raw.id,
  userId: raw.userId,
  userName: raw.user?.nama,
  userRole: raw.user?.role,
  periodeMulai: raw.periodeMulai,
  periodeSelesai: raw.periodeSelesai,
  totalHadir: raw.totalHadir,
  upahHarian: raw.upahHarian,
  totalGajiPokok: raw.totalGajiPokok,
  bonusLembur: raw.bonusLembur,
  potongan: raw.potongan,
  totalBersih: raw.totalBersih,
  status: raw.status as PayrollStatus,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export class PrismaPayrollRepository implements IPayrollRepository {
  async getPayrolls(periodeMulai?: Date, periodeSelesai?: Date): Promise<PayrollEntity[]> {
    const raw = await ds.findPayrolls(periodeMulai, periodeSelesai);
    return raw.map(toDomainEntity);
  }

  async findById(id: number): Promise<PayrollEntity | null> {
    const raw = await ds.findPayrollById(id);
    return raw ? toDomainEntity(raw) : null;
  }

  async save(entity: PayrollEntity): Promise<PayrollEntity> {
    const raw = await ds.createPayroll({
      userId: entity.userId,
      periodeMulai: entity.periodeMulai,
      periodeSelesai: entity.periodeSelesai,
      totalHadir: entity.totalHadir,
      upahHarian: entity.upahHarian,
      totalGajiPokok: entity.totalGajiPokok,
      bonusLembur: entity.bonusLembur,
      potongan: entity.potongan,
      totalBersih: entity.totalBersih,
      status: entity.status,
    });
    return toDomainEntity(raw);
  }

  async update(id: number, data: Partial<PayrollEntity>): Promise<PayrollEntity> {
    const updateData: any = {};
    if (data.bonusLembur !== undefined) updateData.bonusLembur = data.bonusLembur;
    if (data.potongan !== undefined) updateData.potongan = data.potongan;
    if (data.totalBersih !== undefined) updateData.totalBersih = data.totalBersih;
    if (data.status !== undefined) updateData.status = data.status;

    const raw = await ds.updatePayroll(id, updateData);
    return toDomainEntity(raw);
  }

  async countValidAttendanceDays(userId: string, start: Date, end: Date): Promise<number> {
    const attendances = await ds.getAttendancesForPayroll(userId, start, end);
    let total = 0;
    
    // Half day rule: if clockIn exists but no clockOut, we count it as 0.5.
    // Full day rule: if clockIn and clockOut both exist, we count it as 1.
    for (const record of attendances) {
      if (record.clockIn && record.clockOut) {
        total += 1;
      } else if (record.clockIn && !record.clockOut) {
        total += 0.5;
      }
    }
    
    return total;
  }

  async delete(id: number): Promise<void> {
    await ds.deletePayroll(id);
  }
}
