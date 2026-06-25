import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { DomainError } from '@/domain/errors';
import { createDailyTaskUseCase } from '@/domain/usecase/daily-task/create.usecase';
import { getDailyTasksUseCase } from '@/domain/usecase/daily-task/get-daily-tasks.usecase';
import { PrismaDailyTaskRepository } from '@/data/repositories/daily-task.repository';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const dateStr = searchParams.get('date');

    if (!projectId || !userId) {
      return apiError('userId dan projectId parameter is required', 'VALIDATION_ERROR', 400);
    }

    const date = dateStr ? new Date(dateStr) : new Date();
    
    const repo = new PrismaDailyTaskRepository();
    const tasks = await getDailyTasksUseCase(userId, parseInt(projectId, 10), date, repo);
    
    return apiSuccess(tasks);
  } catch (error: any) {
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repo = new PrismaDailyTaskRepository();
    const task = await createDailyTaskUseCase(body, repo);
    return apiSuccess(task, 201);
  } catch (error: any) {
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}
