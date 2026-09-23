/**
 * Derived by the API from the move's event timestamps — never typed by anyone.
 *
 * "In Transit" used to be a value someone set, so a lorry that had left the
 * yard stayed "Scheduled" until a person updated the row. The API now works it
 * out from what was actually recorded, so this is a display value only:
 * nothing in the app writes it back.
 */
export type TransportStatus =
  'Awaiting Approval' | 'Scheduled' | 'In Transit' | 'Completed' | 'Cancelled';

export type TransportKind = 'Delivery' | 'Return move' | 'Inspection transfer';

/** What the workflow will currently permit, as the API reports it. */
export type TransportAction = 'approve' | 'depart' | 'arrive' | 'cancel';

export interface TransportMove {
  id: string;
  code: string;
  equipmentId: string;
  assetCode: string;
  asset: string;
  projectId: string | null;
  project: string;
  origin: string;
  destination: string;
  kind: TransportKind;
  /** ISO timestamp — a real date, not the prototype's "ETA 16:30" label. */
  schedule: string;
  approvedAt: string | null;
  departedAt: string | null;
  arrivedAt: string | null;
  cancelledAt: string | null;
  /** Move cost in KWD. */
  cost: number;
  status: TransportStatus;
  /** Booked to leave in the past and still has not departed. */
  isLate: boolean;
  availableActions: readonly TransportAction[];
  notes: string;
}

/**
 * Mirrors the API's TransportSchedule, for the offline build only.
 *
 * The API is authoritative and every move it serves already carries a derived
 * status — nothing in the running app calls this. It exists so the no-API
 * build can generate seed rows whose status follows from their timestamps
 * rather than being frozen into the file.
 */
export function deriveTransportStatus(
  approvedAt: string | null,
  departedAt: string | null,
  arrivedAt: string | null,
  cancelledAt: string | null,
): TransportStatus {
  if (cancelledAt) {
    return 'Cancelled';
  }

  if (arrivedAt) {
    return 'Completed';
  }

  if (departedAt) {
    return 'In Transit';
  }

  return approvedAt ? 'Scheduled' : 'Awaiting Approval';
}
