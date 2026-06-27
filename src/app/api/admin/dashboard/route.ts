import { NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getDashboardStatsUseCase } from '@/domain/usecase/admin/get-dashboard-stats.usecase';
import { PrismaDashboardRepository } from '@/data/repositories/dashboard.repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const repo = new PrismaDashboardRepository();
    const data = await getDashboardStatsUseCase(repo);
    return apiSuccess(data);
  } catch (error: any) {
    return apiError(error.message || 'Terjadi kesalahan saat memuat dashboard');
  }
}
