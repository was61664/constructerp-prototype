import type { EquipmentStatus, Ownership } from '../models/equipment';
import type { ProjectStatus } from '../models/project';
import type { RequestStage, RequestStatus } from '../models/equipment-request';

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

// --- Requests ---------------------------------------------------------------

export type RequestCheckKind = 'PreRequest' | 'PreReceiving';

export interface RequestCheckDto {
  id: string;
  kind: RequestCheckKind;
  /** Stable key (RECEIVER_SIGNED). Survives relabelling. */
  code: string;
  label: LocalizedTextDto;
  passed: boolean;
  sequence: number;
}

export interface RequestDto {
  id: string;
  code: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: LocalizedTextDto;
  projectId: string | null;
  projectCode: string | null;
  projectName: LocalizedTextDto | null;
  ownership: Ownership;
  requestedBy: string;
  requiredDate: string | null;
  returnDate: string | null;
  location: LocalizedTextDto;
  purpose: LocalizedTextDto;
  estimatedCost: number;
  status: RequestStatus;
  /** Derived by the API from status; never sent back. */
  stage: RequestStage;
  rejectionReason: LocalizedTextDto | null;
  checks: RequestCheckDto[];
  /** What the workflow will currently permit. Drives which buttons show. */
  availableActions: RequestAction[];
}

export type RequestAction = 'submit' | 'approve' | 'reject' | 'receive' | 'inspect';

/**
 * Note the absence of status and stage: the API refuses to take them. Status
 * changes only through the transition endpoints, each of which enforces its
 * own precondition.
 */
export interface SaveRequestRequest {
  code: string;
  equipmentId: string;
  projectId: string | null;
  ownership: Ownership;
  requestedBy: string;
  requiredDate: string | null;
  returnDate: string | null;
  location: LocalizedTextDto;
  purpose: LocalizedTextDto;
  estimatedCost: number;
}
