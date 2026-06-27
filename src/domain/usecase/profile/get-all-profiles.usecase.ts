import { IProfileRepository } from '../../repositories/profile.repository';
import { ProfileEntity } from '../../entities/profile.entity';

export async function getAllProfilesUseCase(
  repo: IProfileRepository
): Promise<ProfileEntity[]> {
  return repo.findAll();
}
