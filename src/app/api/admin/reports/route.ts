import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { findAttendancesByProjectAndDateRange } from '@/data/datasource/prisma/attendance.datasource';
import { findDailyTasksByProjectAndDateRange } from '@/data/datasource/prisma/daily-task.datasource';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const projectIdStr = searchParams.get('projectId');
    const dateStr = searchParams.get('date');

    if (!projectIdStr) {
      return apiError('projectId wajib diisi.', 'VALIDATION_ERROR', 400);
    }

    const projectId = parseInt(projectIdStr, 10);
    
    // Parse date or use today
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    
    // Construct start and end of day in local time/UTC depending on how it's stored.
    // For simplicity, we create start and end bounds
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch both attendances and tasks concurrently
    const [attendances, tasks] = await Promise.all([
      findAttendancesByProjectAndDateRange(projectId, startOfDay, endOfDay),
      findDailyTasksByProjectAndDateRange(projectId, startOfDay, endOfDay)
    ]);

    // Merge them by userId
    const reportsMap = new Map<string, any>();

    // 1. Map attendances
    attendances.forEach(att => {
      reportsMap.set(att.userId, {
        userId: att.userId,
        nama: att.user.nama,
        role: att.user.role,
        attendance: {
          id: att.id,
          clockIn: att.clockIn,
          clockOut: att.clockOut,
          photoSelfieUrl: att.photoSelfieUrl,
          isVerified: att.isVerified
        },
        tasks: []
      });
    });

    // 2. Map tasks
    tasks.forEach(task => {
      let report = reportsMap.get(task.userId);
      if (!report) {
        // Edge case: Submitted task without attendance (should be rare based on our rules, but possible)
        report = {
          userId: task.userId,
          nama: task.user.nama,
          role: task.user.role,
          attendance: null,
          tasks: []
        };
        reportsMap.set(task.userId, report);
      }
      report.tasks.push({
        id: task.id,
        namaPekerjaan: task.namaPekerjaan,
        progressPercentage: task.progressPercentage,
        photoProgresUrl: task.photoProgresUrl,
        catatanTambahan: task.catatanTambahan,
        updatedAt: task.updatedAt
      });
    });

    // Convert map to array
    const result = Array.from(reportsMap.values());

    return apiSuccess(result, 200);
  } catch (error: any) {
    return apiError(error.message);
  }
}
