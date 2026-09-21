import type { Ownership } from './equipment';

export type RequestStage = 'Request' | 'Approval' | 'Receiving' | 'Inspection';

export type RequestStatus =
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'Received'
  | 'Inspection Pending'
  | 'Ready to Use';

export interface RequestCheck {
  label: string;
  passed: boolean;
}

export interface EquipmentRequest {
  id: string;
  equipment: string;
  project: string;
  ownership: Ownership;
  requestedBy: string;
  requiredDate: string;
  returnDate: string;
  location: string;
  purpose: string;
  estimatedCost: number;
  stage: RequestStage;
  status: RequestStatus;
  /** Gate before the request may be submitted. */
  checks: RequestCheck[];
  /** Gate before delivery may be accepted on site. */
  receivingChecks: RequestCheck[];
}

/** Ordered stages of the request lifecycle, used to render progress. */
export const REQUEST_STAGES: readonly RequestStage[] = [
  'Request',
  'Approval',
  'Receiving',
  'Inspection',
] as const;
