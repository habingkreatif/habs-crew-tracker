import { z } from 'zod';

export const CreateDailyTaskSchema = z.object({
  userId: z.string().uuid().or(z.string()),
  projectId: z.coerce.number().positive(),
  namaPekerjaan: z.string().min(3),
  tanggal: z.coerce.date().default(() => new Date()),
});

export const LockDailyTaskSchema = z.object({
  taskId: z.coerce.number().positive(),
});

export const UpdateProgressSchema = z.object({
  taskId: z.coerce.number().positive(),
  progressPercentage: z.coerce.number().min(0).max(100),
  catatanTambahan: z.string().optional(),
  // foto progres di-handle via FormData
});

export type CreateDailyTaskInput = z.infer<typeof CreateDailyTaskSchema>;
export type LockDailyTaskInput = z.infer<typeof LockDailyTaskSchema>;
export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;
