import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { DomainError, NotFoundError } from '@/domain/errors';
import { getProjectByIdUseCase } from '@/domain/usecase/project/get-project-by-id.usecase';
import { updateProjectUseCase } from '@/domain/usecase/project/update-project.usecase';
import { deleteProjectUseCase } from '@/domain/usecase/project/delete-project.usecase';
import { PrismaProjectRepository } from '@/data/repositories/project.repository';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) throw new Error('Invalid ID');

    const repo = new PrismaProjectRepository();
    const project = await getProjectByIdUseCase(projectId, repo);
    return apiSuccess(project);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return apiError(error.message, error.code, 404);
    }
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) throw new Error('Invalid ID');

    const body = await req.json();
    const repo = new PrismaProjectRepository();
    const project = await updateProjectUseCase(projectId, body, repo);
    return apiSuccess(project);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return apiError(error.message, error.code, 404);
    }
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) throw new Error('Invalid ID');

    const repo = new PrismaProjectRepository();
    await deleteProjectUseCase(projectId, repo);
    return apiSuccess({ deleted: true });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return apiError(error.message, error.code, 404);
    }
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}
