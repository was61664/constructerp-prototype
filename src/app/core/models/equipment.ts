export type Ownership = 'Owned' | 'External Rental';

export type EquipmentStatus =
  'Working' | 'Idle' | 'In Transit' | 'Inspection Due' | 'Return Scheduled';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  ownership: Ownership;
  project: string;
  status: EquipmentStatus;
  /** Percentage, 0-100. */
  utilization: number;
  /** KWD per day. */
  dailyCost: number;
  nextAction: string;
}
