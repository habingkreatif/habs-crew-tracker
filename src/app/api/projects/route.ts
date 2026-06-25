import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { DomainError } from '@/domain/errors';
import { getAllProjectsUseCase } from '@/domain/usecase/project/get-all-projects.usecase';
import { createProjectUseCase } from '@/domain/usecase/project/create-project.usecase';
import { PrismaProjectRepository } from '@/data/repositories/project.repository';

export async function GET() {
  try {
    const repo = new PrismaProjectRepository();
    const projects = await getAllProjectsUseCase(repo);
    return apiSuccess(projects);
  } catch (error: any) {
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repo = new PrismaProjectRepository();
    const project = await createProjectUseCase(body, repo);
    return apiSuccess(project, 201);
  } catch (error: any) {
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}
