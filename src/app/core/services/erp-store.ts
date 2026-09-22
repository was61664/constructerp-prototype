import { Injectable, computed, inject, signal } from '@angular/core';

import type {
  EquipmentDto,
  EquipmentTypeDto,
  LocalizedTextDto,
  ProjectDto,
  RequestDto,
  SaveEquipmentRequest,
  SaveProjectRequest,
  SaveRequestRequest,
} from '../data/api-contracts';
import { ErpGateway } from '../data/erp-gateway';
import {
  SEED_EQUIPMENT,
  SEED_INSPECTIONS,
  SEED_PROJECTS,
  SEED_RENTALS,
  SEED_TRANSPORT,
} from '../data/mock-data';
import type {
  Equipment,
  EquipmentRequest,
  EquipmentTypeOption,
  Inspection,
  ProjectCostLine,
  ProjectRecord,
  Rental,
  TransportMove,
} from '../models';
import { I18nService } from './i18n';

/**
 * Application data store.
 *
 * Projects and Equipment come from the API and are held as raw DTOs. The view
 * models components consume are `computed()` from those DTOs plus the active
 * language, which is what makes the language toggle instant: switching to
 * Arabic re-derives the names from data already in memory rather than
 * refetching every list.
 *
 * Requests, rentals, inspections and transport still come from localStorage —
 * those endpoints do not exist yet. The backend is being migrated one module at
 * a time and this class is where the halves meet.
 */
@Injectable({ providedIn: 'root' })
export class ErpStore {
  private readonly gateway = inject(ErpGateway);
  private readonly i18n = inject(I18nService);

  // --- Raw API state --------------------------------------------------------
  private readonly projectDtos = signal<ProjectDto[]>([...SEED_PROJECTS]);
  private readonly equipmentDtos = signal<EquipmentDto[]>([...SEED_EQUIPMENT]);
  private readonly equipmentTypeDtos = signal<EquipmentTypeDto[]>([]);
  private readonly requestDtos = signal<RequestDto[]>([]);

  private readonly loadingSignal = signal(false);
  private readonly loadErrorSignal = signal<string | null>(null);

  readonly loading = this.loadingSignal.asReadonly();
  /** Non-null when the API could not be reached; the app falls back to seeds. */
  readonly loadError = this.loadErrorSignal.asReadonly();

  // --- Localised view models ------------------------------------------------

  readonly projects = computed<ProjectRecord[]>(() =>
    this.projectDtos().map((dto) => ({
      id: dto.id,
      code: dto.code,
      name: this.pick(dto.name),
      client: this.pick(dto.client),
      manager: dto.manager,
      location: this.pick(dto.location),
      status: dto.status,
      budget: dto.budget,
      equipmentSpend: dto.equipmentSpend,
      transportSpend: dto.transportSpend,
      extraSpend: dto.extraSpend,
      progress: dto.progress,
    })),
  );

  readonly equipment = computed<Equipment[]>(() =>
    this.equipmentDtos().map((dto) => ({
      id: dto.id,
      code: dto.code,
      name: this.pick(dto.name),
      equipmentTypeId: dto.equipmentTypeId,
      type: this.pick(dto.equipmentType),
      ownership: dto.ownership,
      projectId: dto.projectId,
      project: dto.projectName ? this.pick(dto.projectName) : '',
      status: dto.status,
      utilization: dto.utilization,
      dailyCost: dto.dailyCost,
      nextAction: this.pick(dto.nextAction),
    })),
  );

  readonly requests = computed<EquipmentRequest[]>(() =>
    this.requestDtos().map((dto) => ({
      id: dto.id,
      code: dto.code,
      equipmentId: dto.equipmentId,
      equipmentCode: dto.equipmentCode,
      equipment: this.pick(dto.equipmentName),
      projectId: dto.projectId,
      project: dto.projectName ? this.pick(dto.projectName) : '',
      ownership: dto.ownership,
      requestedBy: dto.requestedBy,
      requiredDate: dto.requiredDate,
      returnDate: dto.returnDate,
      location: this.pick(dto.location),
      purpose: this.pick(dto.purpose),
      estimatedCost: dto.estimatedCost,
      status: dto.status,
      stage: dto.stage,
      rejectionReason: dto.rejectionReason ? this.pick(dto.rejectionReason) : null,
      checks: dto.checks
        .filter((check) => check.kind === 'PreRequest')
        .map((check) => ({
          id: check.id,
          kind: check.kind,
          code: check.code,
          label: this.pick(check.label),
          passed: check.passed,
        })),
      receivingChecks: dto.checks
        .filter((check) => check.kind === 'PreReceiving')
        .map((check) => ({
          id: check.id,
          kind: check.kind,
          code: check.code,
          label: this.pick(check.label),
          passed: check.passed,
        })),
      availableActions: dto.availableActions,
    })),
  );

  readonly equipmentTypes = computed<EquipmentTypeOption[]>(() =>
    this.equipmentTypeDtos().map((dto) => ({
      id: dto.id,
      code: dto.code,
      name: this.pick(dto.name),
    })),
  );

  // --- Entities still held locally ------------------------------------------
  readonly rentals = signal<Rental[]>([...SEED_RENTALS]).asReadonly();
  readonly inspections = signal<Inspection[]>([...SEED_INSPECTIONS]).asReadonly();
  readonly transportMoves = signal<TransportMove[]>([...SEED_TRANSPORT]).asReadonly();

  // --- Selection ------------------------------------------------------------
  private readonly selectedEquipmentIdSignal = signal<string>('');
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

  readonly attentionAssets = computed(() =>
    this.equipment().filter((item) => item.status === 'Idle' || item.status === 'Inspection Due'),
  );

  // --- Loading --------------------------------------------------------------

  /**
   * Fetches projects and equipment. Safe to call more than once.
   *
   * A failure is recorded and the seeded fallback stays in place rather than
   * leaving the user on an empty screen — the GitHub Pages build has no API at
   * all, and that is a supported configuration, not an error.
   */
  async load(): Promise<void> {
    if (!this.gateway.hasApi) {
      return;
    }

    this.loadingSignal.set(true);
    this.loadErrorSignal.set(null);

    try {
      const [projects, equipment, types, requests] = await Promise.all([
        this.gateway.getProjects(),
        this.gateway.getEquipment(),
        this.gateway.getEquipmentTypes(),
        this.gateway.getRequests(),
      ]);

      this.projectDtos.set(projects);
      this.equipmentDtos.set(equipment);
      this.equipmentTypeDtos.set(types);
      this.requestDtos.set(requests);

      if (!this.selectedEquipmentIdSignal() && equipment.length) {
        this.selectedEquipmentIdSignal.set(equipment[0].id);
      }
    } catch (error) {
      this.loadErrorSignal.set(error instanceof Error ? error.message : 'Failed to load data.');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // --- Projects -------------------------------------------------------------

  async createProject(project: ProjectRecord): Promise<void> {
    const created = await this.gateway.createProject(this.toProjectRequest(project));

    this.projectDtos.update((projects) => [created, ...projects]);
  }

  async updateProject(id: string, project: ProjectRecord): Promise<void> {
    const updated = await this.gateway.updateProject(id, this.toProjectRequest(project));

    this.projectDtos.update((projects) =>
      projects.map((item) => (item.id === id ? updated : item)),
    );
  }

  async deleteProject(id: string): Promise<void> {
    await this.gateway.deleteProject(id);

    this.projectDtos.update((projects) => projects.filter((item) => item.id !== id));
    // Equipment assigned to it is now unassigned server-side; refetch rather
    // than guess which rows changed.
    this.equipmentDtos.set(await this.gateway.getEquipment());
  }

  nextProjectCode(): string {
    return `PRJ-${this.nextSequence(
      this.projects().map((project) => project.code),
      'PRJ-',
    )}`;
  }

  // --- Equipment ------------------------------------------------------------

  async createEquipment(item: Equipment): Promise<void> {
    const created = await this.gateway.createEquipment(this.toEquipmentRequest(item));

    this.equipmentDtos.update((fleet) => [created, ...fleet]);
    this.selectEquipment(created.id);
  }

  async updateEquipment(id: string, item: Equipment): Promise<void> {
    const updated = await this.gateway.updateEquipment(id, this.toEquipmentRequest(item));

    this.equipmentDtos.update((fleet) => fleet.map((asset) => (asset.id === id ? updated : asset)));
    this.selectEquipment(updated.id);
  }

  async deleteEquipment(id: string): Promise<void> {
    await this.gateway.deleteEquipment(id);

    this.equipmentDtos.update((fleet) => fleet.filter((asset) => asset.id !== id));

    if (this.selectedEquipmentId() === id) {
      this.selectEquipment(this.equipment()[0]?.id ?? '');
    }
  }

  selectEquipment(id: string): void {
    this.selectedEquipmentIdSignal.set(id);
  }

  nextEquipmentCode(): string {
    return `EQ-${this.nextSequence(
      this.equipment().map((item) => item.code),
      'EQ-',
    )}`;
  }

  // --- Requests -------------------------------------------------------------

  async createRequest(request: EquipmentRequest): Promise<void> {
    this.upsert(await this.gateway.createRequest(this.toRequestRequest(request)));
  }

  async updateRequest(id: string, request: EquipmentRequest): Promise<void> {
    this.upsert(await this.gateway.updateRequest(id, this.toRequestRequest(request)));
  }

  async deleteRequest(id: string): Promise<void> {
    await this.gateway.deleteRequest(id);

    this.requestDtos.update((requests) => requests.filter((item) => item.id !== id));
  }

  async setRequestCheck(id: string, checkId: string, passed: boolean): Promise<void> {
    this.upsert(await this.gateway.setRequestCheck(id, checkId, passed));
  }

  /**
   * Workflow transitions.
   *
   * Each returns the request as the server now sees it, including its new
   * availableActions, so the UI never has to guess what is allowed next. There
   * is deliberately no "set status" method here: the API has no such endpoint.
   */
  async submitRequest(id: string): Promise<void> {
    this.upsert(await this.gateway.submitRequest(id));
  }

  async approveRequest(id: string): Promise<void> {
    this.upsert(await this.gateway.approveRequest(id));
  }

  async receiveRequest(id: string): Promise<void> {
    this.upsert(await this.gateway.receiveRequest(id));
  }

  async rejectRequest(id: string, reason: string): Promise<void> {
    this.upsert(await this.gateway.rejectRequest(id, this.toLocalized(reason, null)));
  }

  async inspectRequest(id: string, passed: boolean, reason: string | null): Promise<void> {
    this.upsert(
      await this.gateway.inspectRequest(id, passed, reason ? this.toLocalized(reason, null) : null),
    );
  }

  nextRequestCode(): string {
    return `REQ-${this.nextSequence(
      this.requests().map((request) => request.code),
      'REQ-',
    )}`;
  }

  private upsert(request: RequestDto): void {
    this.requestDtos.update((requests) =>
      requests.some((item) => item.id === request.id)
        ? requests.map((item) => (item.id === request.id ? request : item))
        : [request, ...requests],
    );
  }

  // --- Cross-entity lookups -------------------------------------------------

  /** Equipment now links by project ID, so a rename can no longer break this. */
  equipmentCountForProject(projectId: string): number {
    return this.equipment().filter((item) => item.projectId === projectId).length;
  }

  /** Requests link by project id now, like equipment. */
  requestCountForProject(projectId: string): number {
    return this.requests().filter((request) => request.projectId === projectId).length;
  }

  inspectionCountForProject(projectName: string): number {
    return this.inspections().filter((inspection) => inspection.project === projectName).length;
  }

  // --- Mapping --------------------------------------------------------------

  private pick(text: LocalizedTextDto): string {
    return this.i18n.isArabic() && text.ar ? text.ar : text.en;
  }

  /**
   * Writes the edited value into the active language and preserves the other.
   *
   * Editing in Arabic must not overwrite the English name, and vice versa —
   * that would quietly destroy half the record on every save.
   */
  private toLocalized(
    value: string,
    existing: LocalizedTextDto | null | undefined,
  ): LocalizedTextDto {
    if (this.i18n.isArabic()) {
      return { en: existing?.en ?? value, ar: value };
    }

    return { en: value, ar: existing?.ar ?? null };
  }

  private toProjectRequest(project: ProjectRecord): SaveProjectRequest {
    const existing = this.projectDtos().find((dto) => dto.id === project.id);

    return {
      code: project.code,
      name: this.toLocalized(project.name, existing?.name),
      client: this.toLocalized(project.client, existing?.client),
      manager: project.manager,
      location: this.toLocalized(project.location, existing?.location),
      status: project.status,
      budget: project.budget,
      progress: project.progress,
      startDate: existing?.startDate ?? null,
      endDate: existing?.endDate ?? null,
    };
  }

  private toRequestRequest(request: EquipmentRequest): SaveRequestRequest {
    const existing = this.requestDtos().find((dto) => dto.id === request.id);

    return {
      code: request.code,
      equipmentId: request.equipmentId,
      projectId: request.projectId,
      ownership: request.ownership,
      requestedBy: request.requestedBy,
      requiredDate: request.requiredDate,
      returnDate: request.returnDate,
      location: this.toLocalized(request.location, existing?.location),
      purpose: this.toLocalized(request.purpose, existing?.purpose),
      estimatedCost: request.estimatedCost,
    };
  }

  private toEquipmentRequest(item: Equipment): SaveEquipmentRequest {
    const existing = this.equipmentDtos().find((dto) => dto.id === item.id);

    return {
      code: item.code,
      name: this.toLocalized(item.name, existing?.name),
      equipmentTypeId: item.equipmentTypeId,
      ownership: item.ownership,
      projectId: item.projectId,
      status: item.status,
      utilization: item.utilization,
      dailyCost: item.dailyCost,
      nextAction: this.toLocalized(item.nextAction, existing?.nextAction),
    };
  }

  private nextSequence(values: readonly string[], prefix: string): string {
    const highest = values
      .map((value) => Number(value.replace(prefix, '')))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0);

    return String(highest + 1).padStart(4, '0');
  }
}
