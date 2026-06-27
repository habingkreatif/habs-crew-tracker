export class AttendanceEntity {
  constructor(
    public readonly id: number,
    public readonly userId: string,
    public readonly projectId: number,
    public readonly clockIn: Date,
    public readonly photoSelfieUrl: string,
    public readonly latitudeAbsen: number,
    public readonly longitudeAbsen: number,
    public readonly isVerified: boolean,
    public readonly clockOut?: Date | null
  ) {}
}
