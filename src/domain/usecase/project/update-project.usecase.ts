import { IProjectRepository } from '../../repositories/project.repository';
import { ProjectEntity } from '../../entities/project.entity';
import { UpdateProjectInput, UpdateProjectSchema } from '@/lib/schemas/project.schema';
import { NotFoundError, ValidationError } from '../../errors';

export async function updateProjectUseCase(
  id: number,
  input: UpdateProjectInput,
  repo: IProjectRepository
): Promise<ProjectEntity> {
  const parsed = UpdateProjectSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }

  const existing = await repo.findById(id);
  if (!existing) {
    throw new NotFoundError('Proyek');
  }

  return repo.update(id, parsed.data);
}
