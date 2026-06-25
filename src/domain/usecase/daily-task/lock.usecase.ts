import { IDailyTaskRepository } from '../../repositories/daily-task.repository';
import { DailyTaskEntity } from '../../entities/daily-task.entity';
import { LockDailyTaskInput, LockDailyTaskSchema } from '@/lib/schemas/daily-task.schema';
import { NotFoundError, TaskAlreadyLockedError, ValidationError } from '../../errors';

export async function lockDailyTaskUseCase(
  input: LockDailyTaskInput,
  repo: IDailyTaskRepository
): Promise<DailyTaskEntity> {
  const parsed = LockDailyTaskSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }

  const { taskId } = parsed.data;

  const existing = await repo.findById(taskId);
  if (!existing) {
    throw new NotFoundError('Target Pekerjaan');
  }

  if (existing.isLockedPagi) {
    throw new TaskAlreadyLockedError();
  }

  return repo.lock(taskId);
}
