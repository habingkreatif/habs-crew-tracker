import { IDashboardRepository, DashboardStats, DashboardActivity } from '@/domain/repositories/dashboard.repository';
import { getDashboardStatsQuery, getRecentActivitiesQuery } from '../datasource/prisma/dashboard.datasource';

export class PrismaDashboardRepository implements IDashboardRepository {
  async getStats(): Promise<DashboardStats> {
    const raw = await getDashboardStatsQuery();
    return {
      totalActiveProjects: raw.totalActiveProjects,
      totalActiveCrew: raw.totalActiveCrew,
      totalAttendancesToday: raw.totalAttendancesToday,
      payrollForecastThisWeek: raw.payrollForecastThisWeek,
      activeProjectsList: raw.activeProjectsList,
      leaderboard: raw.leaderboard,
      alerts: raw.alerts,
      mapAttendances: raw.mapAttendances,
    };
  }

  async getRecentActivities(limit: number = 10): Promise<DashboardActivity[]> {
    const { recentAttendances, recentTasks } = await getRecentActivitiesQuery(limit);

    // Merge and sort
    const activities: DashboardActivity[] = [];

    for (const a of recentAttendances) {
      activities.push({
        id: `att-${a.id}`,
        type: 'CLOCK_IN',
        userName: a.user.nama,
        userRole: a.user.role,
        projectName: a.project.namaProyek,
        timestamp: a.clockIn,
        description: `Absen masuk di proyek ${a.project.namaProyek}`,
      });
    }

    for (const t of recentTasks) {
      activities.push({
        id: `task-${t.id}`,
        type: 'DAILY_TASK',
        userName: t.user.nama,
        userRole: t.user.role,
        projectName: t.project.namaProyek,
        timestamp: t.updatedAt,
        description: `Melaporkan progres ${t.progressPercentage}%: ${t.namaPekerjaan}`,
      });
    }

    // Sort descending by timestamp
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activities.slice(0, limit);
  }
}
