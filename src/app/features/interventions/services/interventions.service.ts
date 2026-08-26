import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../core/models/page.model';
import { environment } from '../../../environments/environment.development';
import { AiDiagnosticProposition } from '../models/ai-diagnostic-proposition.model';
import {
  HistoriqueInterventionResponse,
  Intervention,
  InterventionCreateRequest,
  InterventionListFilters,
  InterventionUpdateRequest,
  MecanicienAffectationRequest,
  TransitionRequest,
} from '../models/intervention-view.model';

@Injectable({ providedIn: 'root' })
export class InterventionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/interventions`;

  list(filters: InterventionListFilters, page = 0, size = 20, sort = 'dateDepot,DESC'): Observable<Page<Intervention>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);

    params = this.appendFilterParams(params, filters);
    return this.http.get<Page<Intervention>>(this.baseUrl, { params });
  }

  exportCsv(filters: InterventionListFilters) {
    const params = this.appendFilterParams(new HttpParams(), filters);
    return this.http.get(`${this.baseUrl}/export`, {
      params,
      observe: 'response' as const,
      responseType: 'blob' as const,
    });
  }

  getByNumero(numero: string): Observable<Intervention> {
    return this.http.get<Intervention>(`${this.baseUrl}/${numero}`);
  }

  create(request: InterventionCreateRequest): Observable<Intervention> {
    return this.http.post<Intervention>(this.baseUrl, request);
  }

  update(numero: string, request: InterventionUpdateRequest): Observable<Intervention> {
    return this.http.put<Intervention>(`${this.baseUrl}/${numero}`, request);
  }

  transition(numero: string, request: TransitionRequest): Observable<Intervention> {
    return this.http.post<Intervention>(`${this.baseUrl}/${numero}/transitions`, request);
  }

  affecterMecanicien(numero: string, request: MecanicienAffectationRequest): Observable<Intervention> {
    return this.http.patch<Intervention>(`${this.baseUrl}/${numero}/mecanicien`, request);
  }

  archive(numero: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${numero}`);
  }

  historique(
    numero: string,
    page = 0,
    size = 5,
    sort = 'date,desc'
  ): Observable<Page<HistoriqueInterventionResponse>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<HistoriqueInterventionResponse>>(`${this.baseUrl}/${numero}/historique`, { params });
  }

  autresInterventionsVehicule(
    numero: string,
    page = 0,
    size = 5,
    sort = 'dateDepot,desc'
  ): Observable<Page<Intervention>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Intervention>>(`${this.baseUrl}/${numero}/autres-interventions-vehicule`, { params });
  }

  private appendFilterParams(params: HttpParams, filters: InterventionListFilters): HttpParams {
    let next = params;

    if (filters.statut) {
      next = next.set('statut', filters.statut);
    }
    if (filters.mecanicienId) {
      next = next.set('mecanicienId', filters.mecanicienId);
    }
    if (filters.immatriculation?.trim()) {
      next = next.set('immatriculation', filters.immatriculation.trim());
    }
    if (filters.q?.trim()) {
      next = next.set('q', filters.q.trim());
    }
    if (filters.enRetard) {
      next = next.set('enRetard', 'true');
    }

    return next;
  }

  parMecanicien(
    mecanicienId: number,
    page = 0,
    size = 10,
    sort = 'dateDepot,DESC'
  ): Observable<Page<Intervention>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Intervention>>(`${this.baseUrl}/mecanicien/${mecanicienId}`, { params });
  }

  assistantDiagnostic(idOrNumero: string): Observable<AiDiagnosticProposition> {
    return this.http.post<AiDiagnosticProposition>(`${this.baseUrl}/${idOrNumero}/ai-diagnostic`, {});
  }
}