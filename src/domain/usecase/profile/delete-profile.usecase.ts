import { IProfileRepository } from '../../repositories/profile.repository';
import { NotFoundError } from '../../errors';

export async function deleteProfileUseCase(
  id: string,
  repo: IProfileRepository
): Promise<boolean> {
  const existing = await repo.findById(id);
  if (!existing) {
    throw new NotFoundError('Karyawan');
  }

  return repo.delete(id);
}
