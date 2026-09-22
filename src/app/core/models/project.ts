export type ProjectStatus = 'Active' | 'At Risk' | 'Closing';

/**
 * View model for one project, already resolved to the active language.
 *
 * `id` is the database key; `code` (PRJ-1001) is the business identifier shown
 * on screen. Spend figures are summed from cost entries by the API, so they
 * cannot disagree with the records behind them — the prototype stored them as
 * manual numbers that could.
 */
export interface ProjectRecord {
  /** Database key (GUID). Not shown to users. */
  id: string;
  /** Business identifier, e.g. PRJ-1001. Shown to users, editable. */
  code: string;
  name: string;
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
