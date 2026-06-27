export interface DashboardStats {
  totalActiveProjects: number;
  totalActiveCrew: number;
  totalAttendancesToday: number;
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
