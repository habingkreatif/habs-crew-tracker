import { IProfileRepository } from '../../repositories/profile.repository';
import { ProfileEntity } from '../../entities/profile.entity';
import { UpdateProfileInput, UpdateProfileSchema } from '@/lib/schemas/profile.schema';
import { NotFoundError, ValidationError } from '../../errors';

export async function updateProfileUseCase(
  id: string,
  input: UpdateProfileInput,
  repo: IProfileRepository
): Promise<ProfileEntity> {
  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }

  const existing = await repo.findById(id);
  if (!existing) {
    throw new NotFoundError('Karyawan');
  }

  // Jika update NIK, cek apakah dipakai orang lain
  if (parsed.data.nik && parsed.data.nik !== existing.nik) {
    const otherProfile = await repo.findByNik(parsed.data.nik);
    if (otherProfile && otherProfile.id !== id) {
      throw new ValidationError('NIK sudah terdaftar pada karyawan lain.');
    }
  }

  return repo.update(id, parsed.data);
}
