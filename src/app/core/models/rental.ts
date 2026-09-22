export type RentalStatus = 'Active' | 'Return Scheduled' | 'Overdue';

export interface Rental {
  vendor: string;
  asset: string;
  project: string;
  returnDate: string;
  /** Committed rental value in KWD. */
  amount: number;
  status: RentalStatus;
}
