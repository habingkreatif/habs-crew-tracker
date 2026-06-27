import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { DomainError } from '@/domain/errors';
import { clockOutUseCase } from '@/domain/usecase/attendance/clock-out.usecase';
import { PrismaAttendanceRepository } from '@/data/repositories/attendance.repository';
import { PrismaDailyTaskRepository } from '@/data/repositories/daily-task.repository';
import { ClockOutSchema } from '@/lib/schemas/attendance.schema';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const { userId } = ClockOutSchema.parse(rawBody);

    const attendanceRepo = new PrismaAttendanceRepository();
    const dailyTaskRepo = new PrismaDailyTaskRepository();

    const attendance = await clockOutUseCase(
      userId,
      attendanceRepo,
      dailyTaskRepo
    );

    return apiSuccess(attendance, 200);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiError(error.issues[0].message, 'VALIDATION_ERROR', 400);
    }
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}
