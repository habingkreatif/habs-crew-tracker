// Force recompile
import { prisma } from '../prismaClient';

export interface DashboardStatsRaw {
  totalActiveProjects: number;
  totalActiveCrew: number;
  totalAttendancesToday: number;
  payrollForecastThisWeek: number;
  activeProjectsList: any[];
  leaderboard: any[];
  alerts: any[];
  mapAttendances: any[];
}

export const getDashboardStatsQuery = async (): Promise<DashboardStatsRaw> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const startOfWeek = new Date();
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    projects,
    activeCrew,
    todayAttendances,
    weekAttendances,
    yesterdayAttendances
  ] = await Promise.all([
    prisma.project.findMany({
      where: { status: { not: 'COMPLETED' } },
      include: {
        attendances: {
          where: { clockIn: { gte: startOfDay, lte: endOfDay } }
        }
      }
    }),
    prisma.profile.count({
      where: {
        status: 'ACTIVE',
        role: { notIn: ['SUPERADMIN', 'ADMIN'] }
      }
    }),
    prisma.attendance.findMany({
      where: { clockIn: { gte: startOfDay, lte: endOfDay } },
      include: { user: true }
    }),
    prisma.attendance.findMany({
      where: { clockIn: { gte: startOfWeek } },
      include: { user: true }
    }),
    prisma.attendance.findMany({
      where: { 
        clockIn: { 
          gte: new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000), 
          lte: new Date(endOfDay.getTime() - 24 * 60 * 60 * 1000) 
        } 
      },
      include: { user: true }
    })
  ]);

  // 1. Calculate stats
  const totalActiveProjects = projects.length;
  const uniqueUsersToday = new Set(todayAttendances.map(a => a.userId)).size;

  // 2. Map Attendances & Project Lists
  const activeProjectsList = projects.map(p => ({
    id: p.id,
    namaProyek: p.namaProyek,
    status: p.status,
    latitude: p.latitude,
    longitude: p.longitude,
    radiusMeter: p.radiusMeter,
    jumlahKruHariIni: p.attendances.length
  }));

  const mapAttendances = todayAttendances.map(a => ({
    userId: a.userId,
    nama: a.user.nama,
    latitude: a.latitudeAbsen,
    longitude: a.longitudeAbsen,
    waktu: a.clockIn
  }));

  // 3. Payroll Forecast (This week)
  let payrollForecastThisWeek = 0;
  const userHours: Record<string, { nama: string, role: string, totalJam: number }> = {};

  for (const a of weekAttendances) {
    let jam = 4; // Default 4 jam kalau belum clock out
    if (a.clockOut) {
      jam = (a.clockOut.getTime() - a.clockIn.getTime()) / (1000 * 60 * 60);
    }
    payrollForecastThisWeek += jam * (a.user.upahPerJam || 0);

    if (!userHours[a.userId]) {
      userHours[a.userId] = { nama: a.user.nama, role: a.user.role, totalJam: 0 };
    }
    userHours[a.userId].totalJam += jam;
  }

  // 4. Leaderboard
  const leaderboard = Object.entries(userHours)
    .map(([userId, data]) => ({
      userId,
      nama: data.nama,
      role: data.role,
      totalJamKerja: Number(data.totalJam.toFixed(1))
    }))
    .sort((a, b) => b.totalJamKerja - a.totalJamKerja)
    .slice(0, 5); // Top 5

  // 5. Alerts (Peringatan)
  const alerts: any[] = [];
  
  // Alert: Lupa absen pulang kemarin
  const lupaAbsenPulang = yesterdayAttendances.filter(a => !a.clockOut);
  if (lupaAbsenPulang.length > 0) {
    alerts.push({
      id: `alert-lupa-pulang-${Date.now()}`,
      type: 'WARNING',
      message: `${lupaAbsenPulang.length} kru lupa absen pulang kemarin. Jam kerja dihitung default 4 jam.`,
      createdAt: new Date()
    });
  }

  // Alert: Proyek aktif tanpa kru hari ini (hanya jika ini sudah lewat jam 9 pagi)
  if (new Date().getHours() >= 9) {
    const emptyProjects = activeProjectsList.filter(p => p.jumlahKruHariIni === 0);
    if (emptyProjects.length > 0) {
      alerts.push({
        id: `alert-empty-proj-${Date.now()}`,
        type: 'DANGER',
        message: `${emptyProjects.length} proyek aktif belum ada kru yang absen masuk hari ini.`,
        createdAt: new Date()
      });
    }
  }

  return {
    totalActiveProjects,
    totalActiveCrew: activeCrew,
    totalAttendancesToday: uniqueUsersToday,
    payrollForecastThisWeek: Math.round(payrollForecastThisWeek),
    activeProjectsList,
    leaderboard,
    alerts,
    mapAttendances
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
