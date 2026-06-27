export interface ActiveProjectStats {
  id: number;
  namaProyek: string;
  status: string;
  jumlahKruHariIni: number;
  latitude: number;
  longitude: number;
  radiusMeter: number;
}

export interface LeaderboardEntry {
  userId: string;
  nama: string;
  role: string;
  totalJamKerja: number;
}

export interface DashboardAlert {
  id: string;
  type: 'WARNING' | 'DANGER' | 'INFO';
  message: string;
  createdAt: Date;
}

export interface MapAttendancePoint {
  userId: string;
  nama: string;
  latitude: number;
  longitude: number;
  waktu: Date;
}

export interface DashboardStats {
  totalActiveProjects: number;
  totalActiveCrew: number;
  totalAttendancesToday: number;
  payrollForecastThisWeek: number;
  activeProjectsList: ActiveProjectStats[];
  leaderboard: LeaderboardEntry[];
  alerts: DashboardAlert[];
  mapAttendances: MapAttendancePoint[];
}

export interface DashboardActivity {
  id: string;
  type: 'CLOCK_IN' | 'DAILY_TASK';
  userName: string;
  userRole: string;
  projectName: string;
  timestamp: Date;
  description: string;
}

export interface IDashboardRepository {
  getStats(): Promise<DashboardStats>;
  getRecentActivities(limit?: number): Promise<DashboardActivity[]>;
}
