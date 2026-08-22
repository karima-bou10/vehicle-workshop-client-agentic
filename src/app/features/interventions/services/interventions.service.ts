import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../core/models/page.model';
import { environment } from '../../../environments/environment.development';
import {
  HistoriqueInterventionResponse,
  Intervention,
  InterventionCreateRequest,
  InterventionUpdateRequest,
  MecanicienAffectationRequest,
  TransitionRequest,
} from '../models/intervention-view.model';

@Injectable({ providedIn: 'root' })
export class InterventionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/interventions`;

  list(page = 0, size = 20, sort = 'dateDepot,DESC'): Observable<Page<Intervention>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    return this.http.get<Page<Intervention>>(this.baseUrl, { params });
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

  parMecanicien(
    mecanicienId: number,
    page = 0,
    size = 10,
    sort = 'dateDepot,DESC'
  ): Observable<Page<Intervention>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Intervention>>(`${this.baseUrl}/mecanicien/${mecanicienId}`, { params });
  }
}

