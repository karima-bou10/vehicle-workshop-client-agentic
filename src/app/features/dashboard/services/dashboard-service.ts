import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../core/models/page.model';
import { environment } from '../../../environments/environment.development';
import { Intervention } from '../../interventions/models/intervention-view.model';
import {
  DashboardKpis,
  MecanicienChargeItem,
  MecanicienSynthese,
  StatutRepartitionItem,
  TypeRepartitionItem,
  VolumeJournalierItem,
} from '../models/dashboard-view.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  kpis(): Observable<DashboardKpis> {
    return this.http.get<DashboardKpis>(`${this.baseUrl}/kpis`);
  }

  retards(page = 0, size = 10, sort = 'dateRestitutionPrevue,ASC'): Observable<Page<Intervention>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    return this.http.get<Page<Intervention>>(`${this.baseUrl}/retards`, { params });
  }

  chargeMecaniciens(): Observable<MecanicienChargeItem[]> {
    return this.http.get<MecanicienChargeItem[]>(`${this.baseUrl}/charge-mecaniciens`);
  }

  syntheseMecaniciens(page = 0, size = 10, sort?: string): Observable<Page<MecanicienSynthese>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sort) params = params.set('sort', sort);
    return this.http.get<Page<MecanicienSynthese>>(`${this.baseUrl}/mecaniciens/synthese`, { params });
  }

  repartitionStatuts(): Observable<StatutRepartitionItem[]> {
    return this.http.get<StatutRepartitionItem[]>(`${this.baseUrl}/repartition-statuts`);
  }

  repartitionTypes(): Observable<TypeRepartitionItem[]> {
    return this.http.get<TypeRepartitionItem[]>(`${this.baseUrl}/repartition-types`);
  }

  volume(jours = 365): Observable<VolumeJournalierItem[]> {
    const params = new HttpParams().set('jours', jours);
    return this.http.get<VolumeJournalierItem[]>(`${this.baseUrl}/volume`, { params });
  }
}
