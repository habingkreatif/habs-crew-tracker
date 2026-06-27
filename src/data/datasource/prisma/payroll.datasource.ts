import { prisma } from '../prismaClient';
import { Prisma } from '@prisma/client';

export const findPayrolls = async (periodeMulai?: Date, periodeSelesai?: Date) => {
  const where: Prisma.PayrollWhereInput = {};
  if (periodeMulai && periodeSelesai) {
    where.periodeMulai = { gte: periodeMulai };
    where.periodeSelesai = { lte: periodeSelesai };
  }
  return prisma.payroll.findMany({
    where,
    include: {
      user: { select: { nama: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const findPayrollById = async (id: number) => {
  return prisma.payroll.findUnique({
    where: { id },
    include: {
      user: { select: { nama: true, role: true } },
    },
  });
};

export const createPayroll = async (data: Prisma.PayrollUncheckedCreateInput) => {
  return prisma.payroll.create({
    data,
    include: {
      user: { select: { nama: true, role: true } },
    },
  });
};

export const updatePayroll = async (id: number, data: Prisma.PayrollUncheckedUpdateInput) => {
  return prisma.payroll.update({
    where: { id },
    data,
    include: {
      user: { select: { nama: true, role: true } },
    },
  });
};

export const deletePayroll = async (id: number) => {
  return prisma.payroll.delete({
    where: { id },
  });
};

export const getAttendancesForPayroll = async (userId: string, start: Date, end: Date) => {
  return prisma.attendance.findMany({
    where: {
      userId,
      clockIn: {
        gte: start,
        lte: end,
      },
    },
  });
};
