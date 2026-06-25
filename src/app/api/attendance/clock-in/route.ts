import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { DomainError } from '@/domain/errors';
import { clockInUseCase } from '@/domain/usecase/attendance/clock-in.usecase';
import { PrismaAttendanceRepository } from '@/data/repositories/attendance.repository';
import { PrismaProjectRepository } from '@/data/repositories/project.repository';
import { uploadFile } from '@/data/datasource/supabase/storage.datasource';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const userId = formData.get('userId') as string;
    const projectId = formData.get('projectId') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const photoFile = formData.get('photo') as File;

    if (!userId || !projectId || !latitude || !longitude || !photoFile) {
      return apiError('Semua field (userId, projectId, latitude, longitude, photo) wajib diisi.', 'VALIDATION_ERROR', 400);
    }

    const input = {
      userId,
      projectId: parseInt(projectId, 10),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };

    const attendanceRepo = new PrismaAttendanceRepository();
    const projectRepo = new PrismaProjectRepository();
    
    const uploadService = (file: File, path: string) => uploadFile('attendance-photos', path, file);

    const attendance = await clockInUseCase(
      input,
      photoFile,
      attendanceRepo,
      projectRepo,
      uploadService
    );

    return apiSuccess(attendance, 201);
  } catch (error: any) {
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}
