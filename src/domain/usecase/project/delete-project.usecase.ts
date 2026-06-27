import { IProjectRepository } from '../../repositories/project.repository';
import { NotFoundError } from '../../errors';

export async function deleteProjectUseCase(
  id: number,
  repo: IProjectRepository
): Promise<boolean> {
  const existing = await repo.findById(id);
  if (!existing) {
    throw new NotFoundError('Proyek');
  }

  return repo.delete(id);
}
