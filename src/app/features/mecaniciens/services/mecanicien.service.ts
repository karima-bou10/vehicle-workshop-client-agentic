import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../core/models/page.model';
import { environment } from '../../../environments/environment.development';
import { MecanicienListItem } from '../models/mecanicien.model';

@Injectable({ providedIn: 'root' })
export class MecaniciensService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/mecaniciens`;

  list(page = 0, size = 100, sort = 'nom,asc'): Observable<Page<MecanicienListItem>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<MecanicienListItem>>(`${this.baseUrl}`, { params });
  }
}
