/**
 * Derived by the API from the rental's dates — never typed by anyone.
 *
 * "Overdue" used to be a value somebody set by hand, which meant a hire that
 * ran past its return date stayed "Active" until a person noticed. The API now
 * works it out from the dates on every read, so this is a display value only:
 * nothing in the app writes it back.
 */
export type RentalStatus = 'Active' | 'Return Scheduled' | 'Overdue' | 'Returned';

export interface Rental {
  id: string;
  code: string;
  vendorId: string;
  vendor: string;
  equipmentId: string;
  assetCode: string;
  asset: string;
  projectId: string | null;
  project: string;
  /** ISO dates. */
  startedOn: string;
  returnDate: string;
  returnBookedOn: string | null;
  returnedOn: string | null;
  /** Committed rental value in KWD. */
  amount: number;
  status: RentalStatus;
  /** Days past the return date; 0 unless overdue. */
  daysOverdue: number;
  notes: string;
}

/**
 * Mirrors the API's RentalSchedule, for the offline build only.
 *
 * The API is authoritative and every rental it serves already carries a status
 * derived from its dates — nothing in the running app calls this. It exists so
 * the no-API build (GitHub Pages) can generate seed rows whose status still
 * follows from their dates rather than being frozen into the file, which is the
 * exact staleness the backend change removed. Kept next to RentalStatus so the
 * two are read together if the rules ever move.
 */
export function deriveRentalStatus(
  expectedReturnOn: string,
  returnBookedOn: string | null,
  returnedOn: string | null,
  today: string,
): RentalStatus {
  if (returnedOn) {
    return 'Returned';
  }

  if (expectedReturnOn < today) {
    return 'Overdue';
  }

  return returnBookedOn ? 'Return Scheduled' : 'Active';
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  rentalCount: number;
  openRentalCount: number;
  /** Summed from the vendor's hires, never stored. */
  totalSpend: number;
}
