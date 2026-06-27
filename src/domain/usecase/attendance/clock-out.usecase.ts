import { IAttendanceRepository } from '../../repositories/attendance.repository';
import { IDailyTaskRepository } from '../../repositories/daily-task.repository';
import { AttendanceEntity } from '../../entities/attendance.entity';
import { DomainError, NotFoundError } from '../../errors';

export async function clockOutUseCase(
  userId: string,
  attendanceRepo: IAttendanceRepository,
  dailyTaskRepo: IDailyTaskRepository
): Promise<AttendanceEntity> {
  const today = new Date();
  
  // 1. Dapatkan record absen masuk hari ini
  const existingAbsen = await attendanceRepo.findByUserAndDate(userId, today);
  if (existingAbsen.length === 0) {
    throw new DomainError('Kamu belum melakukan absen masuk hari ini.', 'NO_CLOCK_IN');
  }

  const attendance = existingAbsen[0];

  if (attendance.clockOut) {
    throw new DomainError('Kamu sudah melakukan absen pulang hari ini.', 'DUPLICATE_CLOCK_OUT');
  }

  // 2. Cek apakah ada DailyTask hari ini untuk project tersebut
  const tasks = await dailyTaskRepo.findByUserProjectAndDate(userId, attendance.projectId, today);
  
  // 3. Validasi: Tolak jika tidak ada task atau progress masih 0
  if (tasks.length === 0) {
    throw new DomainError('Kamu harus mengisi target/laporan harian terlebih dahulu sebelum bisa absen pulang.', 'REQUIRE_DAILY_TASK');
  }

  const hasProgress = tasks.some(task => task.progressPercentage > 0);
  if (!hasProgress) {
    throw new DomainError('Minimal ada satu laporan pekerjaan dengan progres lebih dari 0% sebelum bisa absen pulang.', 'REQUIRE_PROGRESS');
  }

  // 4. Update jam absen pulang
  return attendanceRepo.updateClockOut(attendance.id, new Date());
}
