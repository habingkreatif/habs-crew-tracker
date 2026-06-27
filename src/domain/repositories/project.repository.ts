import { ProjectEntity } from '../entities/project.entity';
import { CreateProjectInput, UpdateProjectInput } from '@/lib/schemas/project.schema';

export interface IProjectRepository {
  findById(id: number): Promise<ProjectEntity | null>;
  findAll(): Promise<ProjectEntity[]>;
  create(data: CreateProjectInput): Promise<ProjectEntity>;
  update(id: number, data: UpdateProjectInput): Promise<ProjectEntity>;
  delete(id: number): Promise<boolean>;
}
