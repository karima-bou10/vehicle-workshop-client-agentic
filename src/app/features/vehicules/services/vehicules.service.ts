import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../core/models/page.model';
import { environment } from '../../../environments/environment.development';
import { VehiculeIntervention, VehiculeListItem, VehiculeRequest } from '../models/vehicule.model';

@Injectable({ providedIn: 'root' })
export class VehiculesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vehicules`;

  list(pageOrSearch: number | string = 0, sizeOrPage: number = 10, sortOrSize: string | number = 'marque,asc', sort = 'marque,asc'): Observable<Page<VehiculeListItem>> {
    const isSearchRequest = typeof pageOrSearch === 'string';
    const search = isSearchRequest ? pageOrSearch : '';
    const page = isSearchRequest ? sizeOrPage : pageOrSearch as number;
    const size = isSearchRequest ? sortOrSize as number : sizeOrPage;
    const ordering = isSearchRequest ? sort : sortOrSize as string;
    let params = new HttpParams().set('page', page).set('size', size).set('sort', ordering);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<Page<VehiculeListItem>>(`${this.baseUrl}/getVehicules`, { params });
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
