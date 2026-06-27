import { z } from 'zod';

export const ClockInSchema = z.object({
  userId: z.string(), // Nanti diambil dari session auth, tapi untuk sekarang boleh dikirim
  projectId: z.coerce.number().positive(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  // file selfie di-handle via FormData karena upload, zod untuk text fields
});

export const ClockOutSchema = z.object({
  userId: z.string().min(1, "userId wajib diisi"),
});

export type ClockInInput = z.infer<typeof ClockInSchema>;
export type ClockOutInput = z.infer<typeof ClockOutSchema>;
