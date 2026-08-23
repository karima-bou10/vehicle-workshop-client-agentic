import { Component, inject, OnInit, signal } from '@angular/core';
import { LanguageService } from '../../../core/services/language-service';
import { NotificationService } from '../../../core/services/notification.service';
import { Page } from '../../../core/models/page.model';
import { Intervention } from '../../interventions/models/intervention-view.model';
import { DashboardService } from '../services/dashboard-service';
import {
  DashboardKpis,
  MecanicienChargeItem,
  StatutRepartitionItem,
  TypeRepartitionItem,
  VolumeJournalierItem,
} from '../models/dashboard-view.model';
import { KpiCards } from '../components/kpi-cards/kpi-cards';
import { ChargeMecaniciensChart } from '../components/charge-mecaniciens-chart/charge-mecaniciens-chart';
import { RetardsTable } from '../components/retards-table/retards-table';
import { RepartitionStatutsChart } from '../components/repartition-statuts-chart/repartition-statuts-chart';
import { VolumeChart } from '../components/volume-chart/volume-chart';
import { RepartitionTypesChart } from '../components/repartition-types-chart/repartition-types-chart';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [KpiCards, ChargeMecaniciensChart, RetardsTable, RepartitionStatutsChart, VolumeChart, RepartitionTypesChart],
  templateUrl: './dashboard-page.html',
  styleUrls: ['./dashboard-page.scss']
})
export class DashboardPage implements OnInit {
  private readonly languageService = inject(LanguageService);
  private readonly dashboardService = inject(DashboardService);
  private readonly notificationService = inject(NotificationService);

  // US1 - KPI cards
  readonly kpis = signal<DashboardKpis | null>(null);
  readonly kpisLoading = signal(false);

  // US2 - charge par mécanicien
  readonly chargeMecaniciens = signal<MecanicienChargeItem[]>([]);
  readonly chargeMecaniciensLoading = signal(false);

  // US3 - retards paginés
  readonly retards = signal<Page<Intervention> | null>(null);
  readonly retardsLoading = signal(false);

  // US4 - répartition par statut
  readonly repartitionStatuts = signal<StatutRepartitionItem[]>([]);
  readonly repartitionStatutsLoading = signal(false);

  // US5 - volume d'activité
  readonly volume = signal<VolumeJournalierItem[]>([]);
  readonly volumeLoading = signal(false);

  // US6 - répartition par type (P3, optionnel)
  readonly repartitionTypes = signal<TypeRepartitionItem[]>([]);
  readonly repartitionTypesLoading = signal(false);

  ngOnInit(): void {
    this.loadKpis();
    this.loadChargeMecaniciens();
    this.loadRetards(0);
    this.loadRepartitionStatuts();
    this.loadVolume();
    this.loadRepartitionTypes();
  }

  onRetardsPageChange(page: number): void {
    this.loadRetards(page);
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  private loadKpis(): void {
    this.kpisLoading.set(true);
    this.dashboardService.kpis().subscribe({
      next: (data) => {
        this.kpis.set(data);
        this.kpisLoading.set(false);
      },
      error: () => {
        this.kpisLoading.set(false);
        this.notificationService.error('Impossible de charger les indicateurs du dashboard.');
      },
    });
  }

  private loadChargeMecaniciens(): void {
    this.chargeMecaniciensLoading.set(true);
    this.dashboardService.chargeMecaniciens().subscribe({
      next: (data) => {
        this.chargeMecaniciens.set(data);
        this.chargeMecaniciensLoading.set(false);
      },
      error: () => {
        this.chargeMecaniciensLoading.set(false);
        this.notificationService.error('Impossible de charger la charge par mécanicien.');
      },
    });
  }

  private loadRetards(page: number): void {
    this.retardsLoading.set(true);
    this.dashboardService.retards(page).subscribe({
      next: (data) => {
        this.retards.set(data);
        this.retardsLoading.set(false);
      },
      error: () => {
        this.retardsLoading.set(false);
        this.notificationService.error('Impossible de charger les interventions en retard.');
      },
    });
  }

  private loadRepartitionStatuts(): void {
    this.repartitionStatutsLoading.set(true);
    this.dashboardService.repartitionStatuts().subscribe({
      next: (data) => {
        this.repartitionStatuts.set(data);
        this.repartitionStatutsLoading.set(false);
      },
      error: () => {
        this.repartitionStatutsLoading.set(false);
        this.notificationService.error('Impossible de charger la répartition par statut.');
      },
    });
  }

  private loadVolume(): void {
    this.volumeLoading.set(true);
    this.dashboardService.volume(30).subscribe({
      next: (data) => {
        this.volume.set(data);
        this.volumeLoading.set(false);
      },
      error: () => {
        this.volumeLoading.set(false);
        this.notificationService.error("Impossible de charger le volume d'activité.");
      },
    });
  }

  private loadRepartitionTypes(): void {
    this.repartitionTypesLoading.set(true);
    this.dashboardService.repartitionTypes().subscribe({
      next: (data) => {
        this.repartitionTypes.set(data);
        this.repartitionTypesLoading.set(false);
      },
      error: () => {
        // US6 is P3/optional: a failure here must never affect the other 5 sections.
        this.repartitionTypesLoading.set(false);
      },
    });
  }
}

