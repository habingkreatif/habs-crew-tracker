import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { DomainError, NotFoundError } from '@/domain/errors';
import { lockDailyTaskUseCase } from '@/domain/usecase/daily-task/lock.usecase';
import { PrismaDailyTaskRepository } from '@/data/repositories/daily-task.repository';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) throw new Error('Invalid ID');

    const repo = new PrismaDailyTaskRepository();
    const task = await lockDailyTaskUseCase({ taskId }, repo);
    return apiSuccess(task);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return apiError(error.message, error.code, 404);
    }
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}
