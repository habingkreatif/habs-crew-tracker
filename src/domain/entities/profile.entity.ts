export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  MANDOR = 'MANDOR',
  TUKANG = 'TUKANG',
}

export enum Status {
  ACTIVE = 'ACTIVE',
  BLACKLISTED = 'BLACKLISTED',
}

export class ProfileEntity {
  constructor(
    public readonly id: string, // UUID from Supabase Auth
    public readonly nama: string,
    public readonly role: Role,
    public readonly status: Status,
    public readonly upahHarian: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly nik?: string | null,
    public readonly noHp?: string | null,
    public readonly alamat?: string | null,
    public readonly spesialisasi?: string | null
  ) {}
}
