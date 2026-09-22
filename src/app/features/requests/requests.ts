import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { firstValueFrom, map } from 'rxjs';

import type { EquipmentRequest, RequestAction } from '../../core/models';
import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { BusyIcon } from '../../shared/components/busy-icon/busy-icon';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SectionCard } from '../../shared/components/section-card/section-card';
import { StatusChip } from '../../shared/components/status-chip/status-chip';
import { ConfirmService } from '../../shared/services/confirm';
import { BusyState } from '../../shared/utils/busy-state';
import { RequestChecklist } from './request-checklist/request-checklist';
import { RequestFormDialog, type RequestFormData } from './request-form-dialog/request-form-dialog';
import {
  RequestReasonDialog,
  type RequestReasonData,
  type RequestReasonResult,
} from './request-reason-dialog/request-reason-dialog';
import { RequestStageTracker } from './request-stage-tracker/request-stage-tracker';

@Component({
  selector: 'app-requests',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BusyIcon,
    EmptyState,
    MatButtonModule,
    MatTooltipModule,
    PageHeader,
    RequestChecklist,
    RequestStageTracker,
    SectionCard,
    StatusChip,
    LucidePencil,
    LucidePlus,
    LucideTrash2,
  ],
  templateUrl: './requests.html',
  styleUrl: './requests.scss',
})
export class Requests {
  private readonly dialog = inject(MatDialog);
  private readonly confirmService = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);

  protected readonly busy = new BusyState();

  private readonly selectedId = signal<string>('');

  /** The error returned by the last refused transition, shown inline. */
  protected readonly actionError = signal<string | null>(null);

  protected readonly selectedRequest = computed<EquipmentRequest | undefined>(() => {
    const requests = this.store.requests();

    return requests.find((request) => request.id === this.selectedId()) ?? requests[0];
  });

  /**
   * The toolbar's "New Request" routes here with ?new=1.
   *
   * Read as a signal, not from route.snapshot: the snapshot is not reactive,
   * so an effect over it fired only when the component was first created.
   * Clicking the toolbar button while already on this page did nothing.
   */
  private readonly newParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('new'))),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      if (this.newParam() === '1') {
        void this.clearNewParam().then(() => this.openCreate());
      }
    });
  }

  protected select(request: EquipmentRequest): void {
    this.selectedId.set(request.id);
    this.actionError.set(null);
  }

  /**
   * Whether the server currently permits an action.
   *
   * Read from the request's availableActions rather than inferred from its
   * status — the rules live in one place, on the server, and the UI asks
   * instead of re-implementing them.
   */
  protected can(request: EquipmentRequest, action: RequestAction): boolean {
    return request.availableActions.includes(action);
  }

  /** Editing is only possible before approval; the API enforces the same rule. */
  protected canEdit(request: EquipmentRequest): boolean {
    return request.status === 'Draft' || request.status === 'Rejected';
  }

  // --- Workflow transitions -------------------------------------------------

  protected submit(request: EquipmentRequest): Promise<void> {
    return this.run(request, 'submit', () => this.store.submitRequest(request.id));
  }

  protected approve(request: EquipmentRequest): Promise<void> {
    return this.run(request, 'approve', () => this.store.approveRequest(request.id));
  }

  protected receive(request: EquipmentRequest): Promise<void> {
    return this.run(request, 'receive', () => this.store.receiveRequest(request.id));
  }

  protected async reject(request: EquipmentRequest): Promise<void> {
    const result = await this.askReason({
      titleKey: 'rejectRequest',
      messageKey: 'rejectRequestHint',
      requireReason: true,
    });

    if (!result) {
      return;
    }

    await this.run(request, 'reject', () => this.store.rejectRequest(request.id, result.reason));
  }

  protected async inspect(request: EquipmentRequest, passed: boolean): Promise<void> {
    // A pass needs no explanation; a failure does, so whoever re-inspects
    // knows what to look at.
    const reason = passed
      ? null
      : (
          await this.askReason({
            titleKey: 'inspectionFailed',
            messageKey: 'inspectionFailedHint',
            requireReason: true,
          })
        )?.reason;

    if (!passed && !reason) {
      return;
    }

    await this.run(request, passed ? 'inspect-pass' : 'inspect-fail', () =>
      this.store.inspectRequest(request.id, passed, reason ?? null),
    );
  }

  protected async toggleCheck(
    request: EquipmentRequest,
    checkId: string,
    passed: boolean,
  ): Promise<void> {
    await this.run(request, `check:${checkId}`, () =>
      this.store.setRequestCheck(request.id, checkId, passed),
    );
  }

  // --- CRUD -----------------------------------------------------------------

  protected async openCreate(): Promise<void> {
    const blank: EquipmentRequest = {
      id: '',
      code: this.store.nextRequestCode(),
      equipmentId: this.store.equipment()[0]?.id ?? '',
      equipmentCode: '',
      equipment: '',
      projectId: this.store.projects()[0]?.id ?? null,
      project: '',
      ownership: 'Owned',
      requestedBy: '',
      requiredDate: null,
      returnDate: null,
      location: '',
      purpose: '',
      estimatedCost: 0,
      status: 'Draft',
      stage: 'Request',
      rejectionReason: null,
      checks: [],
      receivingChecks: [],
      availableActions: [],
    };

    const result = await this.openDialog({ mode: 'create', request: blank, ...this.lookups() });

    if (result) {
      await this.run(result, 'create', () => this.store.createRequest(result));
    }
  }

  protected async openEdit(request: EquipmentRequest): Promise<void> {
    const result = await this.openDialog({ mode: 'edit', request, ...this.lookups() });

    if (result) {
      await this.run(request, request.id, () => this.store.updateRequest(request.id, result));
    }
  }

  protected async remove(request: EquipmentRequest): Promise<void> {
    if (await this.confirmService.confirmDelete(request.code)) {
      await this.run(request, `delete:${request.id}`, () => this.store.deleteRequest(request.id));
    }
  }

  // --- Helpers --------------------------------------------------------------

  /**
   * Runs a workflow call and surfaces a refusal instead of swallowing it.
   *
   * The server owns the rules, so a 409 here is information — "you cannot do
   * that yet, and here is why" — not an unexpected failure.
   */
  private async run(
    request: EquipmentRequest,
    key: string,
    work: () => Promise<void>,
  ): Promise<void> {
    this.actionError.set(null);
    this.selectedId.set(request.id);

    try {
      await this.busy.run(key, work);
    } catch (error) {
      this.actionError.set(this.describe(error));
    }
  }

  private describe(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const body = (error as { error?: { error?: string } }).error;

      if (body?.error) {
        return body.error;
      }
    }

    return this.i18n.t('actionFailed');
  }

  private async askReason(
    data: Omit<RequestReasonData, 'reason'>,
  ): Promise<RequestReasonResult | undefined> {
    const dialogRef = this.dialog.open<RequestReasonDialog, RequestReasonData, RequestReasonResult>(
      RequestReasonDialog,
      { data: { ...data }, width: '480px' },
    );

    return firstValueFrom(dialogRef.afterClosed());
  }

  private lookups(): Pick<RequestFormData, 'projects' | 'equipment'> {
    return {
      projects: this.store.projects().map((project) => ({ id: project.id, name: project.name })),
      equipment: this.store.equipment().map((item) => ({ id: item.id, name: item.name })),
    };
  }

  private clearNewParam(): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  private async openDialog(data: RequestFormData): Promise<EquipmentRequest | undefined> {
    const dialogRef = this.dialog.open<RequestFormDialog, RequestFormData, EquipmentRequest>(
      RequestFormDialog,
      { data, width: '720px' },
    );

    return firstValueFrom(dialogRef.afterClosed());
  }
}
