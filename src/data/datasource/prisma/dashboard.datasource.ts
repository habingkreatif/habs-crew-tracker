// Force recompile
import { prisma } from '../prismaClient';

export interface DashboardStatsRaw {
  totalActiveProjects: number;
  totalActiveCrew: number;
  totalAttendancesToday: number;
}

export const getDashboardStatsQuery = async (): Promise<DashboardStatsRaw> => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [activeProjects, activeCrew, attendancesToday] = await Promise.all([
    prisma.project.count({
      where: {
        status: { not: 'COMPLETED' } // Assuming 'on-track' or other active statuses. Or just any project.
      }
    }),
    prisma.profile.count({
      where: {
        status: 'ACTIVE',
        role: { in: ['MANDOR', 'TUKANG'] }
      }
    }),
    // Count unique user attendances today
    prisma.attendance.groupBy({
      by: ['userId'],
      where: {
        clockIn: {
          gte: start,
          lte: end,
        },
      },
    }).then((res: any[]) => res.length)
  ]);

  return {
    totalActiveProjects: activeProjects,
    totalActiveCrew: activeCrew,
    totalAttendancesToday: attendancesToday,
  };
};

export const getRecentActivitiesQuery = async (limit: number = 10) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  // Fetch recent attendances
  const recentAttendances = await prisma.attendance.findMany({
    where: {
      clockIn: {
        gte: start,
        lte: end,
      },
    },
    include: {
      user: true,
      project: true,
    },
    orderBy: {
      clockIn: 'desc',
    },
    take: limit,
  });

  // Fetch recent tasks updated
  const recentTasks = await prisma.dailyTask.findMany({
    where: {
      updatedAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      user: true,
      project: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: limit,
  });

  return { recentAttendances, recentTasks };
};
