import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import type {
  CostEntryDto,
  EquipmentDto,
  EquipmentTypeDto,
  LocalizedTextDto,
  ProjectDto,
  RentalDto,
  RequestDto,
  SaveEquipmentRequest,
  SaveCostEntryRequest,
  SaveProjectRequest,
  SaveRentalRequest,
  SaveRequestRequest,
  SaveTransportMoveRequest,
  SaveVendorRequest,
  TransportMoveDto,
  VendorDto,
} from './api-contracts';

/**
 * The seam between the app and its persistence.
 *
 * Everything except Inspections is served by the real API. Inspections still
 * come from localStorage, because that endpoint does not exist yet — the
 * backend is being migrated one module at a time, and this class is where the
 * two halves meet. When the remaining endpoints land, the localStorage helpers
 * below go with them.
 *
 * `hasApi` is false when no API base URL is configured — which is the case for
 * the GitHub Pages build. There, the app keeps working entirely on mock data
 * rather than showing a broken screen.
 */
@Injectable({ providedIn: 'root' })
export class ErpGateway {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  readonly hasApi = environment.apiBaseUrl.length > 0;

  private readonly baseUrl = environment.apiBaseUrl;

  // --- Projects -------------------------------------------------------------

  getProjects(): Promise<ProjectDto[]> {
    return firstValueFrom(this.http.get<ProjectDto[]>(`${this.baseUrl}/api/projects`));
  }

  createProject(request: SaveProjectRequest): Promise<ProjectDto> {
    return firstValueFrom(this.http.post<ProjectDto>(`${this.baseUrl}/api/projects`, request));
  }

  updateProject(id: string, request: SaveProjectRequest): Promise<ProjectDto> {
    return firstValueFrom(this.http.put<ProjectDto>(`${this.baseUrl}/api/projects/${id}`, request));
  }

  deleteProject(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/api/projects/${id}`));
  }

  // --- Costs ----------------------------------------------------------------

  /**
   * The entries behind each project's spend totals.
   *
   * The totals arrive on the project DTO already summed by the API; these are
   * the rows they are summed FROM, so the Costs screen can show the detail and
   * let someone add to it.
   */
  getCostEntries(): Promise<CostEntryDto[]> {
    return firstValueFrom(this.http.get<CostEntryDto[]>(`${this.baseUrl}/api/costs`));
  }

  createCostEntry(request: SaveCostEntryRequest): Promise<CostEntryDto> {
    return firstValueFrom(this.http.post<CostEntryDto>(`${this.baseUrl}/api/costs`, request));
  }

  updateCostEntry(id: string, request: SaveCostEntryRequest): Promise<CostEntryDto> {
    return firstValueFrom(this.http.put<CostEntryDto>(`${this.baseUrl}/api/costs/${id}`, request));
  }

  deleteCostEntry(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/api/costs/${id}`));
  }

  // --- Equipment ------------------------------------------------------------

  getEquipment(): Promise<EquipmentDto[]> {
    return firstValueFrom(this.http.get<EquipmentDto[]>(`${this.baseUrl}/api/equipment`));
  }

  getEquipmentTypes(): Promise<EquipmentTypeDto[]> {
    return firstValueFrom(this.http.get<EquipmentTypeDto[]>(`${this.baseUrl}/api/equipment/types`));
  }

  createEquipment(request: SaveEquipmentRequest): Promise<EquipmentDto> {
    return firstValueFrom(this.http.post<EquipmentDto>(`${this.baseUrl}/api/equipment`, request));
  }

  updateEquipment(id: string, request: SaveEquipmentRequest): Promise<EquipmentDto> {
    return firstValueFrom(
      this.http.put<EquipmentDto>(`${this.baseUrl}/api/equipment/${id}`, request),
    );
  }

  deleteEquipment(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/api/equipment/${id}`));
  }

  // --- Requests -------------------------------------------------------------

  getRequests(): Promise<RequestDto[]> {
    return firstValueFrom(this.http.get<RequestDto[]>(`${this.baseUrl}/api/requests`));
  }

  createRequest(request: SaveRequestRequest): Promise<RequestDto> {
    return firstValueFrom(this.http.post<RequestDto>(`${this.baseUrl}/api/requests`, request));
  }

  updateRequest(id: string, request: SaveRequestRequest): Promise<RequestDto> {
    return firstValueFrom(this.http.put<RequestDto>(`${this.baseUrl}/api/requests/${id}`, request));
  }

  deleteRequest(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/api/requests/${id}`));
  }

  setRequestCheck(id: string, checkId: string, passed: boolean): Promise<RequestDto> {
    return firstValueFrom(
      this.http.put<RequestDto>(`${this.baseUrl}/api/requests/${id}/checks/${checkId}`, { passed }),
    );
  }

  /**
   * Workflow transitions. Each is a separate endpoint because each enforces its
   * own precondition server-side; there is no "set status" call to make.
   */
  submitRequest(id: string): Promise<RequestDto> {
    return this.transition(id, 'submit');
  }

  approveRequest(id: string): Promise<RequestDto> {
    return this.transition(id, 'approve');
  }

  receiveRequest(id: string): Promise<RequestDto> {
    return this.transition(id, 'receive');
  }

  rejectRequest(id: string, reason: LocalizedTextDto): Promise<RequestDto> {
    return firstValueFrom(
      this.http.post<RequestDto>(`${this.baseUrl}/api/requests/${id}/reject`, { reason }),
    );
  }

  inspectRequest(
    id: string,
    passed: boolean,
    reason: LocalizedTextDto | null,
  ): Promise<RequestDto> {
    return firstValueFrom(
      this.http.post<RequestDto>(`${this.baseUrl}/api/requests/${id}/inspect`, { passed, reason }),
    );
  }

  private transition(id: string, action: string): Promise<RequestDto> {
    return firstValueFrom(
      this.http.post<RequestDto>(`${this.baseUrl}/api/requests/${id}/${action}`, null),
    );
  }

  // --- Vendors --------------------------------------------------------------

  getVendors(): Promise<VendorDto[]> {
    return firstValueFrom(this.http.get<VendorDto[]>(`${this.baseUrl}/api/vendors`));
  }

  createVendor(request: SaveVendorRequest): Promise<VendorDto> {
    return firstValueFrom(this.http.post<VendorDto>(`${this.baseUrl}/api/vendors`, request));
  }

  updateVendor(id: string, request: SaveVendorRequest): Promise<VendorDto> {
    return firstValueFrom(this.http.put<VendorDto>(`${this.baseUrl}/api/vendors/${id}`, request));
  }

  deleteVendor(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/api/vendors/${id}`));
  }

  // --- Rentals --------------------------------------------------------------

  getRentals(): Promise<RentalDto[]> {
    return firstValueFrom(this.http.get<RentalDto[]>(`${this.baseUrl}/api/rentals`));
  }

  createRental(request: SaveRentalRequest): Promise<RentalDto> {
    return firstValueFrom(this.http.post<RentalDto>(`${this.baseUrl}/api/rentals`, request));
  }

  updateRental(id: string, request: SaveRentalRequest): Promise<RentalDto> {
    return firstValueFrom(this.http.put<RentalDto>(`${this.baseUrl}/api/rentals/${id}`, request));
  }

  deleteRental(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/api/rentals/${id}`));
  }

  /**
   * Books a collection, and records one actually happening. Two endpoints
   * rather than a status field, for the same reason the request workflow has
   * them: each is a distinct event with its own preconditions, and neither can
   * be faked by writing a status.
   */
  bookRentalReturn(id: string, bookedOn: string | null): Promise<RentalDto> {
    return firstValueFrom(
      this.http.post<RentalDto>(`${this.baseUrl}/api/rentals/${id}/book-return`, { bookedOn }),
    );
  }

  returnRental(id: string, returnedOn: string | null): Promise<RentalDto> {
    return firstValueFrom(
      this.http.post<RentalDto>(`${this.baseUrl}/api/rentals/${id}/return`, { returnedOn }),
    );
  }

  // --- Transport ------------------------------------------------------------

  getTransportMoves(): Promise<TransportMoveDto[]> {
    return firstValueFrom(this.http.get<TransportMoveDto[]>(`${this.baseUrl}/api/transport`));
  }

  createTransportMove(request: SaveTransportMoveRequest): Promise<TransportMoveDto> {
    return firstValueFrom(
      this.http.post<TransportMoveDto>(`${this.baseUrl}/api/transport`, request),
    );
  }

  updateTransportMove(id: string, request: SaveTransportMoveRequest): Promise<TransportMoveDto> {
    return firstValueFrom(
      this.http.put<TransportMoveDto>(`${this.baseUrl}/api/transport/${id}`, request),
    );
  }

  deleteTransportMove(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/api/transport/${id}`));
  }

  /**
   * Each transition is its own endpoint because each enforces its own
   * precondition server-side — there is no "set status" call to make.
   */
  transitionTransportMove(id: string, action: string): Promise<TransportMoveDto> {
    return firstValueFrom(
      this.http.post<TransportMoveDto>(`${this.baseUrl}/api/transport/${id}/${action}`, {
        occurredAt: null,
      }),
    );
  }

  // --- Local persistence (entities with no API yet) -------------------------

  /** Startup read. Synchronous by design: the app cannot render without it. */
  readLocal<T>(key: string, fallback: readonly T[]): T[] {
    const stored = this.storage()?.getItem(key);

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

  async commitLocal<T>(key: string, value: readonly T[]): Promise<void> {
    // Quota errors and disabled storage must not take the app down.
    try {
      this.storage()?.setItem(key, JSON.stringify(value));
    } catch {
      // Ignored by design: this is prototype persistence, not a system of record.
    }

    await Promise.resolve();
  }

  private storage(): Storage | undefined {
    try {
      return this.document.defaultView?.localStorage ?? undefined;
    } catch {
      return undefined;
    }
  }
}
