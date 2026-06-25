import { z } from 'zod';
import { Role, Status } from '@prisma/client';

export const CreateProfileSchema = z.object({
  id: z.string().uuid().optional(), // Nanti diisi dari Supabase Auth
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  nik: z.string().min(16, 'NIK minimal 16 digit').max(16).optional(),
  nama: z.string().min(3),
  noHp: z.string().min(10).optional(),
  alamat: z.string().optional(),
  spesialisasi: z.string().optional(),
  upahHarian: z.coerce.number().min(0).default(0),
  role: z.nativeEnum(Role).default(Role.TUKANG),
  status: z.nativeEnum(Status).default(Status.ACTIVE),
});

export const UpdateProfileSchema = CreateProfileSchema.partial();

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
