import { IAttendanceRepository } from '../../repositories/attendance.repository';
import { AttendanceEntity } from '../../entities/attendance.entity';

export async function getAttendancesUseCase(
  userId: string,
  date: Date,
  repo: IAttendanceRepository
): Promise<AttendanceEntity[]> {
  return repo.findByUserAndDate(userId, date);
}
