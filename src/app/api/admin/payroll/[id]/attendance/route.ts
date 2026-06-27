import { NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { PrismaPayrollRepository } from '@/data/repositories/payroll.repository';
import { getAttendancesForPayroll } from '@/data/datasource/prisma/payroll.datasource';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return apiError('ID tidak valid', 'BAD_REQUEST', 400);

    const repo = new PrismaPayrollRepository();
    const payroll = await repo.findById(id);
    
    if (!payroll) return apiError('Data gaji tidak ditemukan', 'NOT_FOUND', 404);

    // Fetch the actual attendance records
    const attendances = await getAttendancesForPayroll(payroll.userId, payroll.periodeMulai, payroll.periodeSelesai);
    
    // Map to simple dates and half/full status for calendar
    const dates = attendances.map(a => ({
      date: a.clockIn,
      isHalfDay: a.clockIn && !a.clockOut
    }));

    return apiSuccess(dates);
  } catch (error: any) {
    return apiError(error.message || 'Gagal mengambil riwayat absensi');
  }
}
