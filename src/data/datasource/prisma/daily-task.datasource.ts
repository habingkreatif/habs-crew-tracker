import { Prisma } from '@prisma/client';
import { prisma } from '../prismaClient';

export const findDailyTaskById = (id: number) =>
  prisma.dailyTask.findUnique({ where: { id } });

export const findDailyTaskByUserProjectAndDate = (userId: string, projectId: number, startOfDay: Date, endOfDay: Date) =>
  prisma.dailyTask.findMany({
    where: {
      userId,
      projectId,
    },
    orderBy: { id: 'desc' },
    take: 50
  });

export const insertDailyTask = (data: Prisma.DailyTaskUncheckedCreateInput) =>
  prisma.dailyTask.create({ data: { ...data, isLockedPagi: true } });

export const lockDailyTask = (id: number) =>
  prisma.dailyTask.update({
    where: { id },
    data: { isLockedPagi: true },
  });

export const updateProgress = (id: number, data: Prisma.DailyTaskUpdateInput) =>
  prisma.dailyTask.update({
    where: { id },
    data,
  });
