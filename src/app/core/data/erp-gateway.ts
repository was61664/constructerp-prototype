import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import type {
  EquipmentDto,
  EquipmentTypeDto,
  ProjectDto,
  SaveEquipmentRequest,
  SaveProjectRequest,
} from './api-contracts';

/**
 * The seam between the app and its persistence.
 *
 * Projects and Equipment are served by the real API. Everything else still
 * comes from localStorage, because those endpoints do not exist yet — the
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
