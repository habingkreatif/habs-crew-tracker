import { IProfileRepository } from '../../repositories/profile.repository';
import { ProfileEntity } from '../../entities/profile.entity';
import { NotFoundError } from '../../errors';

export async function getProfileByIdUseCase(
  id: string,
  repo: IProfileRepository
): Promise<ProfileEntity> {
  const profile = await repo.findById(id);
  if (!profile) {
    throw new NotFoundError('Karyawan');
  }
  return profile;
}
