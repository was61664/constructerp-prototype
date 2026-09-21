export type InspectionStatus = 'Passed' | 'Attention' | 'Pending Signature';

export interface Inspection {
  asset: string;
  project: string;
  status: InspectionStatus;
  /** Prototype placeholder: real media upload is not implemented yet. */
  media: string;
  inspector: string;
}
