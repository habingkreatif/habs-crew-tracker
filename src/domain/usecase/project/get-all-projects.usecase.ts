import { IProjectRepository } from '../../repositories/project.repository';
import { ProjectEntity } from '../../entities/project.entity';

export async function getAllProjectsUseCase(
  repo: IProjectRepository
): Promise<ProjectEntity[]> {
  return repo.findAll();
}
