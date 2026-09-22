export type TransportStatus = 'In Transit' | 'Scheduled' | 'Awaiting Approval';

export type TransportKind = 'Delivery' | 'Return move' | 'Inspection transfer';

/**
 * Transport was previously hard-coded in the template with no backing type.
 * Modelling it here is what lets the Transport screen render from data and
 * lets transport cost roll into project spend later.
 */
export interface TransportMove {
  id: string;
  origin: string;
  destination: string;
  kind: TransportKind;
  asset: string;
  project: string;
  /** Move cost in KWD. */
  cost: number;
  status: TransportStatus;
  /** Display label for arrival or scheduled date. */
  schedule: string;
}
