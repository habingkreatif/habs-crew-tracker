import { IDailyTaskRepository } from '../../repositories/daily-task.repository';
import { DailyTaskEntity } from '../../entities/daily-task.entity';
import { UpdateProgressInput, UpdateProgressSchema } from '@/lib/schemas/daily-task.schema';
import { NotFoundError, ValidationError } from '../../errors';

export async function updateProgressUseCase(
  input: UpdateProgressInput,
  photoFile: File | null,
  repo: IDailyTaskRepository,
  uploadService: (file: File, path: string) => Promise<string>
): Promise<DailyTaskEntity> {
  const parsed = UpdateProgressSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }

  const { taskId, progressPercentage, catatanTambahan } = parsed.data;

  const existing = await repo.findById(taskId);
  if (!existing) {
    throw new NotFoundError('Target Pekerjaan');
  }

  // if (!existing.isLockedPagi) {
  //   throw new ValidationError('Target pekerjaan belum dikunci pagi ini. Kunci target terlebih dahulu sebelum melapor progres.');
  // }

  let photoUrl = undefined;
  if (photoFile) {
    const ext = photoFile.name.split('.').pop() || 'jpg';
    const fileName = `progress/${existing.projectId}/${taskId}_${Date.now()}.${ext}`;
    photoUrl = await uploadService(photoFile, fileName);
  }

  return repo.updateProgress(taskId, {
    progressPercentage,
    catatanTambahan,
    photoProgresUrl: photoUrl,
  });
}
