import { AttendanceEntity } from '../entities/attendance.entity';

export interface CreateAttendanceData {
  userId: string;
  projectId: number;
  latitude: number;
  longitude: number;
  photoUrl: string;
}

export interface IAttendanceRepository {
  findById(id: number): Promise<AttendanceEntity | null>;
  findByUserAndDate(userId: string, date: Date): Promise<AttendanceEntity[]>;
  create(data: CreateAttendanceData): Promise<AttendanceEntity>;
  updateClockOut(id: number, time: Date): Promise<AttendanceEntity>;
}
