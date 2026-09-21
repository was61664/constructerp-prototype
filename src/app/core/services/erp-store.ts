import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

import {
  SEED_EQUIPMENT,
  SEED_INSPECTIONS,
  SEED_PROJECTS,
  SEED_RENTALS,
  SEED_REQUESTS,
  SEED_TRANSPORT,
} from '../data/mock-data';
import type {
  Equipment,
  EquipmentRequest,
  Inspection,
  ProjectCostLine,
  ProjectRecord,
  Rental,
  TransportMove,
} from '../models';

const STORAGE_KEYS = {
  projects: 'constructerp.projects',
  equipment: 'constructerp.equipment',
  requests: 'constructerp.equipmentRequests',
} as const;

/**
 * Prototype data store.
 *
 * Everything is held in signals, so `computed()` derivations update on their
 * own. This replaces the old `dataVersion` counter, which existed only because
 * the data lived in plain arrays that could not notify anything.
 *
 * Persistence is localStorage. Swapping in a real API means changing the
 * mutation methods here and nothing in the feature components.
 */
@Injectable({ providedIn: 'root' })
export class ErpStore {
  private readonly document = inject(DOCUMENT);

  // --- Editable entities ----------------------------------------------------
  private readonly projectsSignal = signal<ProjectRecord[]>(
    this.restore(STORAGE_KEYS.projects, SEED_PROJECTS),
  );
  private readonly equipmentSignal = signal<Equipment[]>(
    this.restore(STORAGE_KEYS.equipment, SEED_EQUIPMENT),
  );
  private readonly requestsSignal = signal<EquipmentRequest[]>(
    this.restore(STORAGE_KEYS.requests, SEED_REQUESTS),
  );

  readonly projects = this.projectsSignal.asReadonly();
  readonly equipment = this.equipmentSignal.asReadonly();
  readonly requests = this.requestsSignal.asReadonly();

  // --- Read-only entities (no CRUD in this phase) ---------------------------
  readonly rentals = signal<Rental[]>([...SEED_RENTALS]).asReadonly();
  readonly inspections = signal<Inspection[]>([...SEED_INSPECTIONS]).asReadonly();
  readonly transportMoves = signal<TransportMove[]>([...SEED_TRANSPORT]).asReadonly();

  // --- Selection ------------------------------------------------------------
  private readonly selectedEquipmentIdSignal = signal<string>(SEED_EQUIPMENT[0]?.id ?? '');
  readonly selectedEquipmentId = this.selectedEquipmentIdSignal.asReadonly();

  readonly selectedEquipment = computed<Equipment | undefined>(() => {
    const fleet = this.equipment();

    return fleet.find((item) => item.id === this.selectedEquipmentId()) ?? fleet[0];
  });

  // --- Derived --------------------------------------------------------------
  readonly totals = computed(() => {
    const fleet = this.equipment();
    const rented = fleet.filter((item) => item.ownership === 'External Rental').length;
    const idle = fleet.filter((item) => item.status === 'Idle').length;
    const dailySpend = fleet.reduce((sum, item) => sum + item.dailyCost, 0);
    const avgUtilization = fleet.length
      ? Math.round(fleet.reduce((sum, item) => sum + item.utilization, 0) / fleet.length)
      : 0;

    return { total: fleet.length, rented, idle, dailySpend, avgUtilization };
  });

  readonly projectCosts = computed<ProjectCostLine[]>(() =>
    this.projects().map((project) => ({
      project: project.name,
      equipment: project.equipmentSpend,
      transport: project.transportSpend,
      extras: project.extraSpend,
      progress: project.progress,
    })),
  );

  /** Share of equipment-related spend that goes on transport. */
  readonly transportSharePercent = computed(() => {
    const totals = this.projects().reduce(
      (sum, project) => ({
        transport: sum.transport + project.transportSpend,
        all: sum.all + project.equipmentSpend + project.transportSpend + project.extraSpend,
      }),
      { transport: 0, all: 0 },
    );

    return totals.all ? Math.round((totals.transport / totals.all) * 100) : 0;
  });

  /** Assets that are neither working nor already in transit. */
  readonly attentionAssets = computed(() =>
    this.equipment().filter((item) => item.status === 'Idle' || item.status === 'Inspection Due'),
  );

  constructor() {
    effect(() => this.persist(STORAGE_KEYS.projects, this.projects()));
    effect(() => this.persist(STORAGE_KEYS.equipment, this.equipment()));
    effect(() => this.persist(STORAGE_KEYS.requests, this.requests()));
  }

  // --- Projects -------------------------------------------------------------

  createProject(project: ProjectRecord): void {
    this.projectsSignal.update((projects) => [
      project,
      ...projects.filter((item) => item.code !== project.code),
    ]);
  }

  updateProject(originalCode: string, project: ProjectRecord): void {
    this.projectsSignal.update((projects) =>
      projects.map((item) => (item.code === originalCode ? project : item)),
    );
  }

  deleteProject(code: string): void {
    this.projectsSignal.update((projects) => projects.filter((item) => item.code !== code));
  }

  nextProjectCode(): string {
    return `PRJ-${this.nextSequence(this.projects().map((project) => project.code), 'PRJ-')}`;
  }

  // --- Equipment ------------------------------------------------------------

  createEquipment(item: Equipment): void {
    this.equipmentSignal.update((fleet) => [item, ...fleet.filter((asset) => asset.id !== item.id)]);
    this.selectEquipment(item.id);
  }

  updateEquipment(originalId: string, item: Equipment): void {
    this.equipmentSignal.update((fleet) =>
      fleet.map((asset) => (asset.id === originalId ? item : asset)),
    );
    this.selectEquipment(item.id);
  }

  deleteEquipment(id: string): void {
    this.equipmentSignal.update((fleet) => fleet.filter((asset) => asset.id !== id));

    if (this.selectedEquipmentId() === id) {
      this.selectEquipment(this.equipment()[0]?.id ?? '');
    }
  }

  selectEquipment(id: string): void {
    this.selectedEquipmentIdSignal.set(id);
  }

  nextEquipmentId(): string {
    return `EQ-${this.nextSequence(this.equipment().map((item) => item.id), 'EQ-')}`;
  }

  // --- Requests -------------------------------------------------------------

  createRequest(request: EquipmentRequest): void {
    this.requestsSignal.update((requests) => [
      request,
      ...requests.filter((item) => item.id !== request.id),
    ]);
  }

  updateRequest(originalId: string, request: EquipmentRequest): void {
    this.requestsSignal.update((requests) =>
      requests.map((item) => (item.id === originalId ? request : item)),
    );
  }

  deleteRequest(id: string): void {
    this.requestsSignal.update((requests) => requests.filter((item) => item.id !== id));
  }

  nextRequestId(): string {
    return `REQ-${this.nextSequence(this.requests().map((request) => request.id), 'REQ-')}`;
  }

  // --- Cross-entity lookups -------------------------------------------------
  // These match on project NAME because the prototype has no project ids.
  // Renaming a project silently breaks the link — fix when the API lands
  // (PROJECT_GUIDE.md §6.7).

  equipmentCountForProject(projectName: string): number {
    return this.equipment().filter((item) => item.project === projectName).length;
  }

  requestCountForProject(projectName: string): number {
    return this.requests().filter((request) => request.project === projectName).length;
  }

  inspectionCountForProject(projectName: string): number {
    return this.inspections().filter((inspection) => inspection.project === projectName).length;
  }

  // --- Persistence ----------------------------------------------------------

  private restore<T>(key: string, fallback: readonly T[]): T[] {
    const stored = this.safeStorage()?.getItem(key);

    if (!stored) {
      return [...fallback];
    }

    try {
      const parsed: unknown = JSON.parse(stored);

      return Array.isArray(parsed) ? (parsed as T[]) : [...fallback];
    } catch {
      return [...fallback];
    }
  }

  private persist<T>(key: string, value: readonly T[]): void {
    // Quota errors and disabled storage must not take the app down.
    try {
      this.safeStorage()?.setItem(key, JSON.stringify(value));
    } catch {
      // Ignored by design: this is prototype persistence, not a system of record.
    }
  }

  private safeStorage(): Storage | undefined {
    try {
      return this.document.defaultView?.localStorage ?? undefined;
    } catch {
      return undefined;
    }
  }

  private nextSequence(values: readonly string[], prefix: string): string {
    const highest = values
      .map((value) => Number(value.replace(prefix, '')))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0);

    return String(highest + 1).padStart(4, '0');
  }
}
