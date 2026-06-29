import { IDailyTaskRepository } from '../../repositories/daily-task.repository';
import { DailyTaskEntity } from '../../entities/daily-task.entity';

export async function getAllDailyTasksUseCase(
  userId: string,
  repo: IDailyTaskRepository,
  projectId?: number
): Promise<any[]> {
  if (projectId) {
    return repo.findAllByUserAndProject(userId, projectId);
  }
  return repo.findAllByUser(userId);
}
