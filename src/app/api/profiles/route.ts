import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { DomainError } from '@/domain/errors';
import { getAllProfilesUseCase } from '@/domain/usecase/profile/get-all-profiles.usecase';
import { createProfileUseCase } from '@/domain/usecase/profile/create-profile.usecase';
import { PrismaProfileRepository } from '@/data/repositories/profile.repository';

export async function GET() {
  try {
    const repo = new PrismaProfileRepository();
    const profiles = await getAllProfilesUseCase(repo);
    return apiSuccess(profiles);
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
    const repo = new PrismaProfileRepository();
    const profile = await createProfileUseCase(body, repo);
    return apiSuccess(profile, 201);
  } catch (error: any) {
    if (error instanceof DomainError) {
      return apiError(error.message, error.code, 400);
    }
    return apiError(error.message);
  }
}
