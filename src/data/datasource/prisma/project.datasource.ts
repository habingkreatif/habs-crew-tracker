import { Prisma } from '@prisma/client';
import { prisma } from '../prismaClient';

export const findProjectById = (id: number) => 
  prisma.project.findUnique({ where: { id } });

export const findAllProjects = () =>
  prisma.project.findMany({ orderBy: { createdAt: 'desc' } });

export const insertProject = (data: Prisma.ProjectCreateInput) =>
  prisma.project.create({ data });

export const updateProject = (id: number, data: Prisma.ProjectUpdateInput) =>
  prisma.project.update({ where: { id }, data });

export const deleteProject = (id: number) =>
  prisma.project.delete({ where: { id } });
