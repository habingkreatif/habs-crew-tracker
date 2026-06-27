import { IProfileRepository } from '../../repositories/profile.repository';
import { ProfileEntity } from '../../entities/profile.entity';
import { CreateProfileInput, CreateProfileSchema } from '@/lib/schemas/profile.schema';
import { ValidationError } from '../../errors';

export async function createProfileUseCase(
  input: CreateProfileInput,
  repo: IProfileRepository
): Promise<ProfileEntity> {
  // Validate input (just in case it wasn't validated at the edge)
  const parsed = CreateProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }

  // Cek apakah NIK sudah dipakai
  if (parsed.data.nik) {
    const existing = await repo.findByNik(parsed.data.nik);
    if (existing) {
      throw new ValidationError('NIK sudah terdaftar.');
    }
  }

  return repo.create(parsed.data);
}
