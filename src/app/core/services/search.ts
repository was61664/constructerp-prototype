import { Injectable, computed, inject, signal } from '@angular/core';

import type { ModuleId } from '../models';
import { ErpStore } from './erp-store';
import { I18nService } from './i18n';

export interface SearchResult {
  /** Stable key for tracking; unique across modules. */
  key: string;
  module: ModuleId;
  route: string;
  title: string;
  subtitle: string;
  /** Equipment id to select on navigation, where the screen supports it. */
  selectEquipmentId?: string;
}

export interface SearchGroup {
  module: ModuleId;
  label: string;
  results: SearchResult[];
}

/** Keeps the panel usable; nobody scrolls a global search dropdown. */
const MAX_PER_GROUP = 4;

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly store = inject(ErpStore);
  private readonly i18n = inject(I18nService);

  readonly query = signal('');

  readonly hasQuery = computed(() => this.query().trim().length > 0);

  readonly groups = computed<SearchGroup[]>(() => {
    const term = this.normalise(this.query());

    if (!term) {
      return [];
    }

    const groups: SearchGroup[] = [
      { module: 'equipment', label: this.label('equipment'), results: this.equipment(term) },
      { module: 'projects', label: this.label('projects'), results: this.projects(term) },
      { module: 'requests', label: this.label('requests'), results: this.requests(term) },
      { module: 'rentals', label: this.label('rentals'), results: this.rentals(term) },
      { module: 'inspections', label: this.label('inspections'), results: this.inspections(term) },
      { module: 'transport', label: this.label('transport'), results: this.transport(term) },
    ];

    return groups.filter((group) => group.results.length > 0);
  });

  readonly resultCount = computed(() =>
    this.groups().reduce((total, group) => total + group.results.length, 0),
  );

  /** Flat list in display order, so arrow-key navigation can index into it. */
  readonly flatResults = computed(() => this.groups().flatMap((group) => group.results));

  clear(): void {
    this.query.set('');
  }

  private label(module: ModuleId): string {
    return this.i18n.moduleLabel(module).label;
  }

  private equipment(term: string): SearchResult[] {
    return this.store
      .equipment()
      .filter((item) =>
        this.matches(term, [item.id, item.name, item.type, item.project, item.status]),
      )
      .slice(0, MAX_PER_GROUP)
      .map((item) => ({
        key: `equipment:${item.id}`,
        module: 'equipment' as const,
        route: '/equipment',
        title: this.i18n.text(item.name),
        subtitle: `${item.id} · ${this.i18n.text(item.project)}`,
        selectEquipmentId: item.id,
      }));
  }

  private projects(term: string): SearchResult[] {
    return this.store
      .projects()
      .filter((project) =>
        this.matches(term, [
          project.code,
          project.name,
          project.client,
          project.manager,
          project.location,
        ]),
      )
      .slice(0, MAX_PER_GROUP)
      .map((project) => ({
        key: `projects:${project.code}`,
        module: 'projects' as const,
        route: '/projects',
        title: this.i18n.text(project.name),
        subtitle: `${project.code} · ${this.i18n.text(project.client)}`,
      }));
  }

  private requests(term: string): SearchResult[] {
    return this.store
      .requests()
      .filter((request) =>
        this.matches(term, [
          request.id,
          request.equipment,
          request.project,
          request.requestedBy,
          request.status,
        ]),
      )
      .slice(0, MAX_PER_GROUP)
      .map((request) => ({
        key: `requests:${request.id}`,
        module: 'requests' as const,
        route: '/requests',
        title: this.i18n.text(request.equipment),
        subtitle: `${request.id} · ${this.i18n.text(request.status)}`,
      }));
  }

  private rentals(term: string): SearchResult[] {
    return this.store
      .rentals()
      .filter((rental) =>
        this.matches(term, [rental.vendor, rental.asset, rental.project, rental.status]),
      )
      .slice(0, MAX_PER_GROUP)
      .map((rental) => ({
        key: `rentals:${rental.id}`,
        module: 'rentals' as const,
        route: '/rentals',
        title: this.i18n.text(rental.vendor),
        subtitle: `${this.i18n.text(rental.asset)} · ${this.i18n.text(rental.status)}`,
      }));
  }

  private inspections(term: string): SearchResult[] {
    return this.store
      .inspections()
      .filter((inspection) =>
        this.matches(term, [
          inspection.asset,
          inspection.project,
          inspection.inspector,
          inspection.status,
        ]),
      )
      .slice(0, MAX_PER_GROUP)
      .map((inspection) => ({
        key: `inspections:${inspection.asset}:${inspection.inspector}`,
        module: 'inspections' as const,
        route: '/inspections',
        title: this.i18n.text(inspection.asset),
        subtitle: `${this.i18n.text(inspection.inspector)} · ${this.i18n.text(inspection.status)}`,
      }));
  }

  private transport(term: string): SearchResult[] {
    return this.store
      .transportMoves()
      .filter((move) =>
        // `code`, not `id`: the id is a GUID now, and nobody searches for one.
        // TRP-5001 is what is printed on the paperwork.
        this.matches(term, [
          move.code,
          move.origin,
          move.destination,
          move.asset,
          move.project,
          move.status,
        ]),
      )
      .slice(0, MAX_PER_GROUP)
      .map((move) => ({
        key: `transport:${move.id}`,
        module: 'transport' as const,
        route: '/transport',
        title: `${this.i18n.text(move.origin)} → ${this.i18n.text(move.destination)}`,
        subtitle: `${this.i18n.text(move.asset)} · ${this.i18n.text(move.status)}`,
      }));
  }

  /**
   * Matches against every known label for a value, in BOTH languages — not just
   * the active one. So "حفار" finds the record stored as "Excavator 36T", and
   * "excavator" still finds it while the interface is in Arabic. Using
   * `i18n.text()` here instead would silently restrict search to whichever
   * language the UI happened to be in.
   */
  private matches(term: string, fields: readonly string[]): boolean {
    return fields.some((field) =>
      this.i18n.labelVariants(field).some((variant) => this.normalise(variant).includes(term)),
    );
  }

  /**
   * Lowercases, collapses whitespace, and folds Arabic-Indic digits back to
   * Latin so "٨٠" and "80" match the same records. Also strips Arabic
   * diacritics, which users rarely type.
   */
  private normalise(value: string): string {
    return value
      .toLowerCase()
      .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
      .replace(/[ً-ْ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
