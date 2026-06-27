import { IDailyTaskRepository } from '../../repositories/daily-task.repository';
import { DailyTaskEntity } from '../../entities/daily-task.entity';

export async function getAllDailyTasksUseCase(
  userId: string,
  projectId: number,
  repo: IDailyTaskRepository
): Promise<DailyTaskEntity[]> {
  return repo.findAllByUserAndProject(userId, projectId);
}
