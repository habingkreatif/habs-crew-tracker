import { z } from 'zod';

export const CreateProjectSchema = z.object({
  namaProyek: z.string().min(3),
  alamat: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMeter: z.coerce.number().min(10).default(50),
  estimasiDurasiHari: z.coerce.number().min(1),
  status: z.string().default('on-track'),
  jamKerjaMulai: z.string().default('08:00'),
  jamKerjaSelesai: z.string().default('17:00'),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
