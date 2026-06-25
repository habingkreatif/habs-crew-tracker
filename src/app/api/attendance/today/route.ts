import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { PrismaAttendanceRepository } from '@/data/repositories/attendance.repository';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return apiError('userId wajib diisi.', 'VALIDATION_ERROR', 400);
    }

    const attendanceRepo = new PrismaAttendanceRepository();
    const today = new Date();
    const existingAbsen = await attendanceRepo.findByUserAndDate(userId, today);

    if (existingAbsen.length > 0) {
      return apiSuccess(existingAbsen[0], 200);
    } else {
      return apiSuccess(null, 200);
    }
  } catch (error: any) {
    return apiError(error.message);
  }
}
