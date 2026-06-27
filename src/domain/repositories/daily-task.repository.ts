import { DailyTaskEntity } from '../entities/daily-task.entity';

export interface UpdateProgressData {
  progressPercentage: number;
  photoProgresUrl?: string;
  catatanTambahan?: string;
}

export interface IDailyTaskRepository {
  findById(id: number): Promise<DailyTaskEntity | null>;
  findByUserProjectAndDate(userId: string, projectId: number, date: Date): Promise<DailyTaskEntity[]>;
  findAllByUserAndProject(userId: string, projectId: number): Promise<DailyTaskEntity[]>;
  create(data: { userId: string, projectId: number, namaPekerjaan: string, tanggal: Date }): Promise<DailyTaskEntity>;
  lock(id: number): Promise<DailyTaskEntity>;
  updateProgress(id: number, data: UpdateProgressData): Promise<DailyTaskEntity>;
}
