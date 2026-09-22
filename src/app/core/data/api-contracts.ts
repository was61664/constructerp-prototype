import type { EquipmentStatus, Ownership } from '../models/equipment';
import type { ProjectStatus } from '../models/project';

/**
 * The wire format served by ConstructErp.Api.
 *
 * These mirror the backend DTOs exactly and are NOT the shapes the components
 * use. The store maps them into view models, resolving each bilingual name to
 * the active language — see ErpStore. Keeping the two apart means a change to
 * the API contract lands in one mapping function rather than across every
 * template.
 */
export interface LocalizedTextDto {
  en: string;
  ar: string | null;
}

export interface ProjectDto {
  id: string;
  code: string;
  name: LocalizedTextDto;
  client: LocalizedTextDto;
  manager: string;
  location: LocalizedTextDto;
  status: ProjectStatus;
  budget: number;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  /** Summed from cost entries by the API; never stored on the project. */
  equipmentSpend: number;
  transportSpend: number;
  extraSpend: number;
  equipmentCount: number;
}

export interface SaveProjectRequest {
  code: string;
  name: LocalizedTextDto;
  client: LocalizedTextDto;
  manager: string;
  location: LocalizedTextDto;
  status: ProjectStatus;
  budget: number;
  progress: number;
  startDate: string | null;
  endDate: string | null;
}

export interface EquipmentDto {
  id: string;
  code: string;
  name: LocalizedTextDto;
  equipmentTypeId: string;
  equipmentType: LocalizedTextDto;
  ownership: Ownership;
  projectId: string | null;
  projectCode: string | null;
  projectName: LocalizedTextDto | null;
  status: EquipmentStatus;
  utilization: number;
  dailyCost: number;
  nextAction: LocalizedTextDto;
}

export interface SaveEquipmentRequest {
  code: string;
  name: LocalizedTextDto;
  equipmentTypeId: string;
  ownership: Ownership;
  projectId: string | null;
  status: EquipmentStatus;
  utilization: number;
  dailyCost: number;
  nextAction: LocalizedTextDto;
}

export interface EquipmentTypeDto {
  id: string;
  code: string;
  name: LocalizedTextDto;
}
