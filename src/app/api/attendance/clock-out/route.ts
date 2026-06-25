import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { DomainError } from '@/domain/errors';
import { clockOutUseCase } from '@/domain/usecase/attendance/clock-out.usecase';
import { PrismaAttendanceRepository } from '@/data/repositories/attendance.repository';
import { PrismaDailyTaskRepository } from '@/data/repositories/daily-task.repository';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return apiError('userId wajib diisi.', 'VALIDATION_ERROR', 400);
    }

    const attendanceRepo = new PrismaAttendanceRepository();
    const dailyTaskRepo = new PrismaDailyTaskRepository();

    const attendance = await clockOutUseCase(
      userId,
      attendanceRepo,
      dailyTaskRepo
    );

    return apiSuccess(attendance, 200);
  } catch (error: any) {
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}
