import { IProfileRepository } from '@/domain/repositories/profile.repository';
import { ProfileEntity, Role, Status } from '@/domain/entities/profile.entity';
import { CreateProfileInput, UpdateProfileInput } from '@/lib/schemas/profile.schema';
import * as profileDatasource from '../datasource/prisma/profile.datasource';
import * as authDatasource from '../datasource/supabase/auth.datasource';
import { Profile as PrismaProfile } from '@prisma/client';

function toDomainEntity(model: PrismaProfile): ProfileEntity {
  return new ProfileEntity(
    model.id,
    model.nama,
    model.role as Role,
    model.status as Status,
    model.upahHarian,
    model.createdAt,
    model.updatedAt,
    model.nik,
    model.noHp,
    model.alamat,
    model.spesialisasi
  );
}

export class PrismaProfileRepository implements IProfileRepository {
  async findById(id: string): Promise<ProfileEntity | null> {
    const model = await profileDatasource.findProfileById(id);
    return model ? toDomainEntity(model) : null;
  }

  async findByNik(nik: string): Promise<ProfileEntity | null> {
    const model = await profileDatasource.findProfileByNik(nik);
    return model ? toDomainEntity(model) : null;
  }

  async findAll(): Promise<ProfileEntity[]> {
    const models = await profileDatasource.findAllProfiles();
    return models.map(toDomainEntity);
  }

  async create(data: CreateProfileInput): Promise<ProfileEntity> {
    // 1. Create User di Supabase Auth terlebih dahulu
    const userId = await authDatasource.createUser(data.email, data.password);
    
    // 2. Simpan Profile di Prisma menggunakan UUID dari Supabase
    const model = await profileDatasource.insertProfile({
      id: userId,
      nama: data.nama,
      nik: data.nik,
      noHp: data.noHp,
      alamat: data.alamat,
      spesialisasi: data.spesialisasi,
      upahHarian: data.upahHarian,
      role: data.role,
      status: data.status,
    });
    return toDomainEntity(model);
  }

  async update(id: string, data: UpdateProfileInput): Promise<ProfileEntity> {
    const model = await profileDatasource.updateProfile(id, {
      ...data,
    });
    return toDomainEntity(model);
  }

  async delete(id: string): Promise<boolean> {
    // 1. Hapus profile dari database lokal
    await profileDatasource.deleteProfile(id);
    
    // 2. Hapus akun login dari Supabase Auth
    try {
      await authDatasource.deleteUser(id);
    } catch (err) {
      console.warn('Gagal menghapus user di Supabase (mungkin sudah terhapus):', err);
    }
    
    return true;
  }
}
