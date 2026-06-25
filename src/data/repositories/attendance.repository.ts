import { CreateAttendanceData, IAttendanceRepository } from '@/domain/repositories/attendance.repository';
import { AttendanceEntity } from '@/domain/entities/attendance.entity';
import * as attendanceDatasource from '../datasource/prisma/attendance.datasource';
import { Attendance as PrismaAttendance } from '@prisma/client';

function toDomainEntity(model: PrismaAttendance): AttendanceEntity {
  return new AttendanceEntity(
    model.id,
    model.userId,
    model.projectId,
    model.clockIn,
    model.photoSelfieUrl,
    model.latitudeAbsen,
    model.longitudeAbsen,
    model.isVerified,
    model.clockOut
  );
}

export class PrismaAttendanceRepository implements IAttendanceRepository {
  async findById(id: number): Promise<AttendanceEntity | null> {
    const model = await attendanceDatasource.findAttendanceById(id);
    return model ? toDomainEntity(model) : null;
  }

  async findByUserAndDate(userId: string, date: Date): Promise<AttendanceEntity[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const models = await attendanceDatasource.findAttendanceByUserAndDate(userId, startOfDay, endOfDay);
    return models.map(toDomainEntity);
  }

  async create(data: CreateAttendanceData): Promise<AttendanceEntity> {
    const model = await attendanceDatasource.insertAttendance({
      userId: data.userId,
      projectId: data.projectId,
      latitudeAbsen: data.latitude,
      longitudeAbsen: data.longitude,
      photoSelfieUrl: data.photoUrl,
    });
    return toDomainEntity(model);
  }

  async updateClockOut(id: number, time: Date): Promise<AttendanceEntity> {
    const model = await attendanceDatasource.updateClockOut(id, time);
    return toDomainEntity(model);
  }
}
