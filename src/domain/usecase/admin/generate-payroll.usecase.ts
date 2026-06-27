import { IPayrollRepository } from '../../repositories/payroll.repository';
import { GeneratePayrollInput, PayrollEntity } from '../../entities/payroll.entity';

export const generatePayrollUseCase = async (
  input: GeneratePayrollInput,
  payrollRepo: IPayrollRepository,
  upahHarian: number // We pass this from the API route which queries the Profile
): Promise<PayrollEntity> => {
  // Validate dates
  if (input.periodeMulai > input.periodeSelesai) {
    throw new Error('Periode mulai tidak boleh lebih dari periode selesai.');
  }

  // Count valid attendances (where clockIn and clockOut exist)
  // For MVP: let's assume full day (1) if clockOut exists, and half day (0.5) if missing clockOut.
  // Wait, let's keep it simple as requested: countValidAttendanceDays will return the exact decimal days.
  const totalHadir = await payrollRepo.countValidAttendanceDays(input.userId, input.periodeMulai, input.periodeSelesai);

  if (totalHadir === 0) {
    throw new Error('Tidak ada kehadiran valid di periode ini untuk dikalkulasi.');
  }

  const totalGajiPokok = Math.floor(totalHadir * upahHarian);

  const draftPayroll: PayrollEntity = {
    userId: input.userId,
    periodeMulai: input.periodeMulai,
    periodeSelesai: input.periodeSelesai,
    totalHadir,
    upahHarian,
    totalGajiPokok,
    bonusLembur: 0,
    potongan: 0,
    totalBersih: totalGajiPokok,
    status: 'DRAFT',
  };

  return payrollRepo.save(draftPayroll);
};
