import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../core/models/page.model';
import { environment } from '../../../environments/environment.development';
import { VehiculeListItem } from '../models/vehicule.model';

@Injectable({ providedIn: 'root' })
export class VehiculesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vehicules`;

  list(page = 0, size = 100, sort = 'marque,asc'): Observable<Page<VehiculeListItem>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<VehiculeListItem>>(`${this.baseUrl}/getVehicules`, { params });
  }
}
