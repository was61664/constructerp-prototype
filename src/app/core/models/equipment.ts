export type Ownership = 'Owned' | 'External Rental';

export type EquipmentStatus =
  'Working' | 'Idle' | 'In Transit' | 'Inspection Due' | 'Return Scheduled';

/**
 * View model for one asset, already resolved to the active language.
 *
 * Note the split between `id` and `code`: `id` is the database key used for
 * every API call and every link, while `code` (EQ-104) is the human-readable
 * business identifier shown on screen. The prototype conflated the two and
 * linked records by display string, which broke on rename.
 */
export interface Equipment {
  /** Database key (GUID). Not shown to users. */
  id: string;
  /** Business identifier, e.g. EQ-104. Shown to users, editable. */
  code: string;
  name: string;
  equipmentTypeId: string;
  type: string;
  ownership: Ownership;
  /** Database key of the assigned project, or null when unassigned. */
  projectId: string | null;
  /** Display name of the assigned project, for rendering rows. */
  project: string;
  status: EquipmentStatus;
  /** Percentage, 0-100. */
  utilization: number;
  /** KWD per day. */
  dailyCost: number;
  nextAction: string;
}

export interface EquipmentTypeOption {
  id: string;
  code: string;
  name: string;
}
