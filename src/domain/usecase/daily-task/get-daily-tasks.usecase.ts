import { IDailyTaskRepository } from '../../repositories/daily-task.repository';
import { DailyTaskEntity } from '../../entities/daily-task.entity';

export async function getDailyTasksUseCase(
  userId: string,
  projectId: number,
  date: Date,
  repo: IDailyTaskRepository
): Promise<DailyTaskEntity[]> {
  return repo.findByUserProjectAndDate(userId, projectId, date);
}
