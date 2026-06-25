import { IDailyTaskRepository } from '../../repositories/daily-task.repository';
import { DailyTaskEntity } from '../../entities/daily-task.entity';
import { CreateDailyTaskInput, CreateDailyTaskSchema } from '@/lib/schemas/daily-task.schema';
import { ValidationError } from '../../errors';

export async function createDailyTaskUseCase(
  input: CreateDailyTaskInput,
  repo: IDailyTaskRepository
): Promise<DailyTaskEntity> {
  const parsed = CreateDailyTaskSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }

  return repo.create({
    userId: parsed.data.userId,
    projectId: parsed.data.projectId,
    namaPekerjaan: parsed.data.namaPekerjaan,
    tanggal: parsed.data.tanggal
  });
}
