import type { Ownership } from './equipment';

export type RequestStage = 'Request' | 'Approval' | 'Receiving' | 'Inspection';

export type RequestStatus =
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'Received'
  | 'Inspection Pending'
  | 'Ready to Use'
  | 'Rejected';

export type RequestAction = 'submit' | 'approve' | 'reject' | 'receive' | 'inspect';

export interface RequestCheck {
  id: string;
  kind: 'PreRequest' | 'PreReceiving';
  /** Stable key; the label is display text and may be reworded. */
  code: string;
  label: string;
  passed: boolean;
}

/**
 * View model for one request, already resolved to the active language.
 *
 * `status` and `stage` are read-only here by design. The API refuses to accept
 * either: status changes only through the workflow endpoints, and stage is
 * derived from status. The prototype let the form write both directly, which
 * made the approval flow decorative.
 */
export interface EquipmentRequest {
  id: string;
  code: string;
  equipmentId: string;
  equipmentCode: string;
  equipment: string;
  projectId: string | null;
  project: string;
  ownership: Ownership;
  requestedBy: string;
  /** ISO date (YYYY-MM-DD) or null. Real dates now, not "Jul 20". */
  requiredDate: string | null;
  returnDate: string | null;
  location: string;
  purpose: string;
  estimatedCost: number;
  status: RequestStatus;
  stage: RequestStage;
  rejectionReason: string | null;
  checks: RequestCheck[];
  receivingChecks: RequestCheck[];
  /** What the workflow currently permits; drives which buttons are shown. */
  availableActions: RequestAction[];
}

/** Ordered stages of the request lifecycle, used to render progress. */
export const REQUEST_STAGES: readonly RequestStage[] = [
  'Request',
  'Approval',
  'Receiving',
  'Inspection',
] as const;
