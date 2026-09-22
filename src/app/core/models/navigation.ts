export type ModuleId =
  | 'dashboard'
  | 'requests'
  | 'projects'
  | 'equipment'
  | 'rentals'
  | 'transport'
  | 'inspections'
  | 'costs'
  | 'reports';

export type NavGroupId = 'overview' | 'mainData' | 'projectOperations' | 'analytics';

export interface NavItem {
  id: ModuleId;
  /** Router path, without a leading slash. */
  route: string;
  /** Key into the icon map in sidebar-nav. */
  icon: string;
}

export interface NavGroup {
  id: NavGroupId;
  items: NavItem[];
}

/** Localised view of a NavItem, produced by the navigation service. */
export interface LocalisedNavItem extends NavItem {
  label: string;
  caption: string;
}

export interface LocalisedNavGroup {
  id: NavGroupId;
  label: string;
  items: LocalisedNavItem[];
}
