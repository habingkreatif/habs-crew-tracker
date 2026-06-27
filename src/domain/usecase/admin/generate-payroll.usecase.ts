import { IPayrollRepository } from '../../repositories/payroll.repository';
import { GeneratePayrollInput, PayrollEntity } from '../../entities/payroll.entity';

export const generatePayrollUseCase = async (
  input: GeneratePayrollInput,
  payrollRepo: IPayrollRepository,
  upahPerJam: number // We pass this from the API route which queries the Profile
): Promise<PayrollEntity> => {
  // Validate dates
  if (input.periodeMulai > input.periodeSelesai) {
    throw new Error('Periode mulai tidak boleh lebih dari periode selesai.');
  }

  // Count total work hours
  const totalJamKerja = await payrollRepo.countTotalWorkHours(input.userId, input.periodeMulai, input.periodeSelesai);

  if (totalJamKerja === 0) {
    throw new Error('Tidak ada kehadiran valid di periode ini untuk dikalkulasi.');
  }

  const totalGajiPokok = Math.floor(totalJamKerja * upahPerJam);

  const draftPayroll: PayrollEntity = {
    userId: input.userId,
    periodeMulai: input.periodeMulai,
    periodeSelesai: input.periodeSelesai,
    totalJamKerja,
    upahPerJam,
    totalGajiPokok,
    bonusLembur: 0,
    potongan: 0,
    totalBersih: totalGajiPokok,
    status: 'DRAFT',
  };

  return payrollRepo.save(draftPayroll);
};
