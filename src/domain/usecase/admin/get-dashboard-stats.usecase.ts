import { IDashboardRepository } from '@/domain/repositories/dashboard.repository';

export const getDashboardStatsUseCase = async (repo: IDashboardRepository) => {
  const stats = await repo.getStats();
  const recentActivities = await repo.getRecentActivities(10);

  return {
    stats,
    recentActivities,
  };
};
