export type ProjectStatus = 'Active' | 'At Risk' | 'Closing';

export interface ProjectRecord {
  name: string;
  code: string;
  client: string;
  manager: string;
  location: string;
  status: ProjectStatus;
  budget: number;
  equipmentSpend: number;
  transportSpend: number;
  extraSpend: number;
  /** Percentage, 0-100. */
  progress: number;
}

/** Spend breakdown derived from a project, used by the Costs screen. */
export interface ProjectCostLine {
  project: string;
  equipment: number;
  transport: number;
  extras: number;
  progress: number;
}
