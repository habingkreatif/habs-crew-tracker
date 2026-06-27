export class ProjectEntity {
  constructor(
    public readonly id: number,
    public readonly namaProyek: string,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly radiusMeter: number,
    public readonly estimasiDurasiHari: number,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly jamKerjaMulai: string,
    public readonly jamKerjaSelesai: string,
    public readonly alamat?: string | null
  ) {}
}
