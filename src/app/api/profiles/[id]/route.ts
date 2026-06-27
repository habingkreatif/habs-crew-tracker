import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { DomainError, NotFoundError } from '@/domain/errors';
import { getProfileByIdUseCase } from '@/domain/usecase/profile/get-profile-by-id.usecase';
import { updateProfileUseCase } from '@/domain/usecase/profile/update-profile.usecase';
import { deleteProfileUseCase } from '@/domain/usecase/profile/delete-profile.usecase';
import { PrismaProfileRepository } from '@/data/repositories/profile.repository';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const repo = new PrismaProfileRepository();
    const profile = await getProfileByIdUseCase(id, repo);
    return apiSuccess(profile);
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
    const body = await req.json();
    const repo = new PrismaProfileRepository();
    const profile = await updateProfileUseCase(id, body, repo);
    return apiSuccess(profile);
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
    const repo = new PrismaProfileRepository();
    await deleteProfileUseCase(id, repo);
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
