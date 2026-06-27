import { ProfileEntity } from '../entities/profile.entity';
import { CreateProfileInput, UpdateProfileInput } from '@/lib/schemas/profile.schema';

export interface IProfileRepository {
  findById(id: string): Promise<ProfileEntity | null>;
  findByNik(nik: string): Promise<ProfileEntity | null>;
  findAll(): Promise<ProfileEntity[]>;
  create(data: CreateProfileInput): Promise<ProfileEntity>;
  update(id: string, data: UpdateProfileInput): Promise<ProfileEntity>;
  delete(id: string): Promise<boolean>;
}
