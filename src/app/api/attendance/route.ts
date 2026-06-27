import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { DomainError } from '@/domain/errors';
import { getAttendancesUseCase } from '@/domain/usecase/attendance/get-attendances.usecase';
import { PrismaAttendanceRepository } from '@/data/repositories/attendance.repository';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const dateStr = searchParams.get('date');

    if (!userId) {
      return apiError('userId parameter is required', 'VALIDATION_ERROR', 400);
    }

    const date = dateStr ? new Date(dateStr) : new Date();
    
    const repo = new PrismaAttendanceRepository();
    const attendances = await getAttendancesUseCase(userId, date, repo);
    
    return apiSuccess(attendances);
  } catch (error: any) {
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}
