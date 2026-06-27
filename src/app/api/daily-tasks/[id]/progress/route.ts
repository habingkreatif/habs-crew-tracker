import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { DomainError, NotFoundError } from '@/domain/errors';
import { updateProgressUseCase } from '@/domain/usecase/daily-task/update-progress.usecase';
import { PrismaDailyTaskRepository } from '@/data/repositories/daily-task.repository';
import { uploadFile } from '@/data/datasource/supabase/storage.datasource';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) throw new Error('Invalid ID');

    const formData = await req.formData();
    
    const progressStr = formData.get('progressPercentage');
    const progressPercentage = progressStr ? String(progressStr) : '';
    const catatanTambahan = formData.get('catatanTambahan') as string | null;
    const photoFile = formData.get('photo') as File | null;

    if (!progressPercentage || isNaN(parseInt(progressPercentage, 10))) {
      return apiError(`Field progressPercentage tidak valid (diterima: ${progressStr}).`, 'VALIDATION_ERROR', 400);
    }

    const input = {
      taskId,
      progressPercentage: parseInt(progressPercentage, 10),
      catatanTambahan: catatanTambahan || undefined,
    };

    const repo = new PrismaDailyTaskRepository();
    const uploadService = (file: File, path: string) => uploadFile('progress-photos', path, file);

    const task = await updateProgressUseCase(
      input,
      photoFile,
      repo,
      uploadService
    );

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
