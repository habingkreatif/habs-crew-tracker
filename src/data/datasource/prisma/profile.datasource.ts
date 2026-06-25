import { Prisma } from '@prisma/client';
import { prisma } from '../prismaClient';

export const findProfileById = (id: string) => 
  prisma.profile.findUnique({ where: { id } });

export const findProfileByNik = (nik: string) =>
  prisma.profile.findUnique({ where: { nik } });

export const findAllProfiles = () =>
  prisma.profile.findMany({ orderBy: { createdAt: 'desc' } });

export const insertProfile = (data: Prisma.ProfileCreateInput) =>
  prisma.profile.create({ data });

export const updateProfile = (id: string, data: Prisma.ProfileUpdateInput) =>
  prisma.profile.update({ where: { id }, data });

export const deleteProfile = (id: string) =>
  prisma.profile.delete({ where: { id } });
