import { IAttendanceRepository } from '../../repositories/attendance.repository';
import { IProjectRepository } from '../../repositories/project.repository';
import { AttendanceEntity } from '../../entities/attendance.entity';
import { ClockInInput, ClockInSchema } from '@/lib/schemas/attendance.schema';
import { GeofenceViolationError, NotFoundError, ValidationError, DomainError } from '../../errors';
import { isWithinGeofence } from '@/lib/geofence';

export async function clockInUseCase(
  input: ClockInInput,
  photoFile: File, // Dari FormData
  attendanceRepo: IAttendanceRepository,
  projectRepo: IProjectRepository,
  uploadService: (file: File, path: string) => Promise<string> // Abstraksi upload
): Promise<AttendanceEntity> {
  const parsed = ClockInSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }

  const { userId, projectId, latitude, longitude } = parsed.data;

  // 1. Dapatkan data project untuk cek koordinat & radius
  const project = await projectRepo.findById(projectId);
  if (!project) {
    throw new NotFoundError('Proyek');
  }

  // 1b. Validasi: Jangan boleh absen ganda di hari yang sama
  const today = new Date();
  const existingAbsen = await attendanceRepo.findByUserAndDate(userId, today);
  if (existingAbsen.length > 0) {
    throw new DomainError('Kamu sudah melakukan absen masuk hari ini.', 'DUPLICATE_CLOCK_IN');
  }

  // 2. Validasi Geofence (Server-Side)
  const isValidLocation = isWithinGeofence(
    latitude,
    longitude,
    project.latitude,
    project.longitude,
    project.radiusMeter
  );

  if (!isValidLocation) {
    throw new GeofenceViolationError();
  }

  // 3. Upload foto ke storage
  const ext = photoFile.name.split('.').pop() || 'jpg';
  const fileName = `${projectId}/${userId}_${Date.now()}.${ext}`;
  const photoUrl = await uploadService(photoFile, fileName);

  // 4. Simpan ke database
  return attendanceRepo.create({
    userId,
    projectId,
    latitude,
    longitude,
    photoUrl,
  });
}
