import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../core/models/page.model';
import { environment } from '../../../environments/environment.development';
import { VehiculeIntervention, VehiculeListItem, VehiculeRequest } from '../models/vehicule.model';

export interface VehiculeSearchCriteria {
  immatriculation?: string;
  marque?: string;
  modele?: string;
  annee?: number | null;
  clientFictif?: string;
  actif?: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class VehiculesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vehicules`;

  list(criteria: VehiculeSearchCriteria = {}, page = 0, size = 10, sort = 'marque,asc'): Observable<Page<VehiculeListItem>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    for (const [key, value] of Object.entries(criteria)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value);
      }
    }
    return this.http.get<Page<VehiculeListItem>>(`${this.baseUrl}/search`, { params });
  }

  create(request: VehiculeRequest): Observable<VehiculeListItem> {
    return this.http.post<VehiculeListItem>(this.baseUrl, request);
  }

  update(id: number, request: VehiculeRequest): Observable<VehiculeListItem> {
    return this.http.put<VehiculeListItem>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getById(id: number): Observable<VehiculeListItem> {
    return this.http.get<VehiculeListItem>(`${this.baseUrl}/${id}`);
  }

  interventions(vehicleId: number, page = 0, size = 20): Observable<Page<VehiculeIntervention>> {
    const params = new HttpParams()
      .set('vehiculeId', vehicleId)
      .set('page', page)
      .set('size', size)
      .set('sort', 'dateDepot,DESC');
    return this.http.get<Page<VehiculeIntervention>>(`${environment.apiUrl}/interventions`, { params });
  }
}
