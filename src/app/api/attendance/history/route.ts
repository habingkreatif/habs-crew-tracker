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

    // We can directly call prisma from here or add a repository method.
    // To follow the architecture, we should add a method to the repository.
    // For now, let's use the repository if we add it, but since we are modifying files...
    // Let's import prisma directly here just for this history query if repo lacks it,
    // WAIT, the rule says "DILARANG memanggil prisma langsung di app/api".
    // I MUST add a repository method.
    const limitParam = searchParams.get('limit');
    const limit = limitParam === 'all' ? 365 : parseInt(limitParam || '7', 10);
    
    const attendanceRepo = new PrismaAttendanceRepository();
    const history = await attendanceRepo.findHistoryByUser(userId, limit);
    
    return apiSuccess(history, 200);
  } catch (error: any) {
    return apiError(error.message);
  }
}
