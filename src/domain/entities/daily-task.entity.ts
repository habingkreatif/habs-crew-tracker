export class DailyTaskEntity {
  constructor(
    public readonly id: number,
    public readonly projectId: number,
    public readonly namaPekerjaan: string,
    public readonly tanggal: Date,
    public readonly isLockedPagi: boolean,
    public readonly progressPercentage: number,
    public readonly updatedAt: Date,
    public readonly photoProgresUrl?: string | null,
    public readonly catatanTambahan?: string | null
  ) {}
}
