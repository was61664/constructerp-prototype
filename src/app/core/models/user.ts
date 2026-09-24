/**
 * What a user may DO.
 *
 * Distinct from their organization, which is whose data they may SEE. The API
 * enforces both — this type exists so the UI can hide what would be refused,
 * never as the thing that decides it.
 */
export type UserRole = 'Admin' | 'TruckingCompany' | 'Driver';

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** Null for an Admin, who is not scoped to anyone's data. */
  organizationId: string | null;
  organizationName: string;
}

/**
 * Which modules each role may reach.
 *
 * This is a CONVENIENCE, not a security boundary. The API refuses these routes
 * on its own and scopes every row it returns; hiding a link the server would
 * reject just avoids showing someone a door that opens onto a 403.
 *
 * Kept beside the role type so adding a role forces a decision here.
 */
export const ROLE_MODULES: Readonly<Record<UserRole, readonly string[]>> = {
  // Everything. The request and inspection workflows have no dedicated roles
  // yet, so an administrator operates them.
  Admin: [
    'dashboard',
    'projects',
    'equipment',
    'requests',
    'rentals',
    'transport',
    'inspections',
    'costs',
    'reports',
  ],
  TruckingCompany: ['transport'],
  Driver: ['transport'],
};

export function canReach(role: UserRole | null, path: string): boolean {
  return role ? ROLE_MODULES[role].includes(path) : false;
}
