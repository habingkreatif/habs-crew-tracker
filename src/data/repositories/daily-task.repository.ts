import { IDailyTaskRepository, UpdateProgressData } from '@/domain/repositories/daily-task.repository';
import { DailyTaskEntity } from '@/domain/entities/daily-task.entity';
import { CreateDailyTaskInput } from '@/lib/schemas/daily-task.schema';
import * as dailyTaskDatasource from '../datasource/prisma/daily-task.datasource';
import { DailyTask as PrismaDailyTask } from '@prisma/client';

function toDomainEntity(model: PrismaDailyTask): DailyTaskEntity {
  return new DailyTaskEntity(
    model.id,
    model.projectId,
    model.namaPekerjaan,
    model.tanggal,
    model.isLockedPagi,
    model.progressPercentage,
    model.updatedAt,
    model.photoProgresUrl,
    model.catatanTambahan
  );
}

export class PrismaDailyTaskRepository implements IDailyTaskRepository {
  async findById(id: number): Promise<DailyTaskEntity | null> {
    const model = await dailyTaskDatasource.findDailyTaskById(id);
    return model ? toDomainEntity(model) : null;
  }

  async findByUserProjectAndDate(userId: string, projectId: number, date: Date): Promise<DailyTaskEntity[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const models = await dailyTaskDatasource.findDailyTaskByUserProjectAndDate(userId, projectId, startOfDay, endOfDay);
    return models.map(toDomainEntity);
  }

  async create(data: { userId: string, projectId: number, namaPekerjaan: string, tanggal: Date }): Promise<DailyTaskEntity> {
    const model = await dailyTaskDatasource.insertDailyTask({
      userId: data.userId,
      projectId: data.projectId,
      namaPekerjaan: data.namaPekerjaan,
      tanggal: data.tanggal,
    });
    return toDomainEntity(model);
  }

  async lock(id: number): Promise<DailyTaskEntity> {
    const model = await dailyTaskDatasource.lockDailyTask(id);
    return toDomainEntity(model);
  }

  async updateProgress(id: number, data: UpdateProgressData): Promise<DailyTaskEntity> {
    const updateData: any = {
      progressPercentage: data.progressPercentage,
      catatanTambahan: data.catatanTambahan,
    };

    if (data.photoProgresUrl !== undefined) {
      updateData.photoProgresUrl = data.photoProgresUrl;
    }

    const model = await dailyTaskDatasource.updateProgress(id, updateData);
    return toDomainEntity(model);
  }
}
