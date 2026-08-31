import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../core/models/page.model';
import { environment } from '../../../environments/environment.development';
import {
  Mecanicien,
  MecanicienCreateRequest,
  MecanicienDisponibiliteRequest,
  MecanicienUpdateRequest,
  Specialite,
} from '../models/mecanicien-view.model';

@Injectable({ providedIn: 'root' })
export class MecaniciensService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/mecaniciens`;

  list(page = 0, size = 20, sort = 'nom,ASC'): Observable<Page<Mecanicien>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    return this.http.get<Page<Mecanicien>>(this.baseUrl, { params });
  }

  exportCsv(): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/export`, {
      observe: 'response' as const,
      responseType: 'blob' as const,
    });
  }

  listDisponibles(page = 0, size = 20, sort = 'nom,ASC'): Observable<Page<Mecanicien>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    return this.http.get<Page<Mecanicien>>(`${this.baseUrl}/disponibles`, { params });
  }

  listIndisponibles(page = 0, size = 20, sort = 'nom,ASC'): Observable<Page<Mecanicien>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    return this.http.get<Page<Mecanicien>>(`${this.baseUrl}/indisponibles`, { params });
  }

  search(
    nom: string | null,
    specialite: Specialite | null,
    page = 0,
    size = 20,
    sort = 'nom,ASC'
  ): Observable<Page<Mecanicien>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    if (nom) {
      params = params.set('nom', nom);
    }
    if (specialite) {
      params = params.set('specialite', specialite);
    }
    return this.http.get<Page<Mecanicien>>(`${this.baseUrl}/recherche`, { params });
  }

  getById(id: number): Observable<Mecanicien> {
    return this.http.get<Mecanicien>(`${this.baseUrl}/${id}`);
  }

  create(request: MecanicienCreateRequest): Observable<Mecanicien> {
    return this.http.post<Mecanicien>(this.baseUrl, request);
  }

  update(id: number, request: MecanicienUpdateRequest): Observable<Mecanicien> {
    return this.http.put<Mecanicien>(`${this.baseUrl}/${id}`, request);
  }

  updateDisponibilite(id: number, request: MecanicienDisponibiliteRequest): Observable<Mecanicien> {
    return this.http.patch<Mecanicien>(`${this.baseUrl}/${id}/disponibilite`, request);
  }

  desactiver(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
