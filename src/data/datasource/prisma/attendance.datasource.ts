import { Prisma } from '@prisma/client';
import { prisma } from '../prismaClient';

export const findAttendanceById = (id: number) =>
  prisma.attendance.findUnique({ where: { id } });

export const findAttendanceByUserAndDate = (userId: string, startOfDay: Date, endOfDay: Date) =>
  prisma.attendance.findMany({
    where: {
      userId,
      clockIn: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    orderBy: { clockIn: 'desc' },
  });

export const insertAttendance = (data: Prisma.AttendanceUncheckedCreateInput) =>
  prisma.attendance.create({ data });

export const updateClockOut = (id: number, clockOut: Date) =>
  prisma.attendance.update({
    where: { id },
    data: { clockOut },
  });
