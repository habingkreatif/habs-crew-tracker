import { IProjectRepository } from '../../repositories/project.repository';
import { ProjectEntity } from '../../entities/project.entity';
import { CreateProjectInput, CreateProjectSchema } from '@/lib/schemas/project.schema';
import { ValidationError } from '../../errors';

export async function createProjectUseCase(
  input: CreateProjectInput,
  repo: IProjectRepository
): Promise<ProjectEntity> {
  const parsed = CreateProjectSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }

  return repo.create(parsed.data);
}
