import { IProjectRepository } from '../../repositories/project.repository';
import { ProjectEntity } from '../../entities/project.entity';
import { NotFoundError } from '../../errors';

export async function getProjectByIdUseCase(
  id: number,
  repo: IProjectRepository
): Promise<ProjectEntity> {
  const project = await repo.findById(id);
  if (!project) {
    throw new NotFoundError('Proyek');
  }
  return project;
}
