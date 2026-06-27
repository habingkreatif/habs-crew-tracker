import { IProjectRepository } from '@/domain/repositories/project.repository';
import { ProjectEntity } from '@/domain/entities/project.entity';
import { CreateProjectInput, UpdateProjectInput } from '@/lib/schemas/project.schema';
import * as projectDatasource from '../datasource/prisma/project.datasource';
import { Project as PrismaProject } from '@prisma/client';

function toDomainEntity(model: PrismaProject): ProjectEntity {
  return new ProjectEntity(
    model.id,
    model.namaProyek,
    model.latitude,
    model.longitude,
    model.radiusMeter,
    model.estimasiDurasiHari,
    model.status,
    model.createdAt,
    model.jamKerjaMulai,
    model.jamKerjaSelesai,
    model.alamat
  );
}

export class PrismaProjectRepository implements IProjectRepository {
  async findById(id: number): Promise<ProjectEntity | null> {
    const model = await projectDatasource.findProjectById(id);
    return model ? toDomainEntity(model) : null;
  }

  async findAll(): Promise<ProjectEntity[]> {
    const models = await projectDatasource.findAllProjects();
    return models.map(toDomainEntity);
  }

  async create(data: CreateProjectInput): Promise<ProjectEntity> {
    const model = await projectDatasource.insertProject({
      namaProyek: data.namaProyek,
      latitude: data.latitude,
      longitude: data.longitude,
      radiusMeter: data.radiusMeter,
      estimasiDurasiHari: data.estimasiDurasiHari,
      status: data.status,
      jamKerjaMulai: data.jamKerjaMulai,
      jamKerjaSelesai: data.jamKerjaSelesai,
      alamat: data.alamat,
    });
    return toDomainEntity(model);
  }

  async update(id: number, data: UpdateProjectInput): Promise<ProjectEntity> {
    const model = await projectDatasource.updateProject(id, {
      ...data,
    });
    return toDomainEntity(model);
  }

  async delete(id: number): Promise<boolean> {
    await projectDatasource.deleteProject(id);
    return true;
  }
}
