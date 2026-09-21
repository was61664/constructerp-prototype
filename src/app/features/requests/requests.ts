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
import { ActivatedRoute, Router } from '@angular/router';
import { LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { defaultReceivingChecks, defaultRequestChecks } from '../../core/data/mock-data';
import type { EquipmentRequest } from '../../core/models';
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

  /** Which button is mid-save, so only that one turns its gear. */
  protected readonly busy = new BusyState();

  private readonly selectedId = signal<string>('');

  /**
   * The checklist panel follows the selected request. The previous prototype
   * always displayed `requests[0]` regardless of what the user clicked.
   */
  protected readonly selectedRequest = computed<EquipmentRequest | undefined>(() => {
    const requests = this.store.requests();

    return requests.find((request) => request.id === this.selectedId()) ?? requests[0];
  });

  constructor() {
    // The toolbar's "New Request" button routes here with ?new=1 rather than
    // reaching into this feature's dialog directly.
    effect(() => {
      if (this.route.snapshot.queryParamMap.get('new') === '1') {
        void this.clearNewParam().then(() => this.openCreate());
      }
    });
  }

  protected select(request: EquipmentRequest): void {
    this.selectedId.set(request.id);
  }

  protected async openCreate(): Promise<void> {
    const blank: EquipmentRequest = {
      id: this.store.nextRequestId(),
      equipment: this.store.equipment()[0]?.name ?? '',
      project: this.store.projects()[0]?.name ?? '',
      ownership: 'Owned',
      requestedBy: '',
      requiredDate: '',
      returnDate: '',
      location: '',
      purpose: '',
      estimatedCost: 0,
      stage: 'Request',
      status: 'Draft',
      checks: defaultRequestChecks(),
      receivingChecks: defaultReceivingChecks(),
    };

    const result = await this.openDialog({ mode: 'create', request: blank, ...this.lookups() });

    if (result) {
      await this.busy.run('create', () => this.store.createRequest(result));
      this.selectedId.set(result.id);
    }
  }

  protected async openEdit(request: EquipmentRequest): Promise<void> {
    const result = await this.openDialog({ mode: 'edit', request, ...this.lookups() });

    if (result) {
      await this.busy.run(request.id, () => this.store.updateRequest(request.id, result));
      this.selectedId.set(result.id);
    }
  }

  protected async remove(request: EquipmentRequest): Promise<void> {
    if (await this.confirmService.confirmDelete(request.id)) {
      await this.busy.run(`delete:${request.id}`, () => this.store.deleteRequest(request.id));
    }
  }

  private lookups(): Pick<RequestFormData, 'projectNames' | 'equipmentNames'> {
    return {
      projectNames: this.store.projects().map((project) => project.name),
      equipmentNames: this.store.equipment().map((item) => item.name),
    };
  }

  /** Strips ?new=1 so a refresh or back-navigation does not reopen the dialog. */
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
