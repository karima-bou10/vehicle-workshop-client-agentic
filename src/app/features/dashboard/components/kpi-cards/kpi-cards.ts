import { Component, inject, input } from '@angular/core';
import { LanguageService } from '../../../../core/services/language-service';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { DashboardKpis } from '../../models/dashboard-view.model';

interface KpiCardDef {
  key: keyof DashboardKpis;
  labelKey: string;
  variant: 'action' | 'wait' | 'done' | 'danger';
}

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [LoadingSpinner],
  templateUrl: './kpi-cards.html',
  styleUrls: ['./kpi-cards.scss']
})
export class KpiCards {
  private readonly languageService = inject(LanguageService);

  readonly kpis = input<DashboardKpis | null>(null);
  readonly loading = input(false);

  readonly cardDefs: KpiCardDef[] = [
    { key: 'recuesAujourdHui', labelKey: 'dashboard.kpi.recuesAujourdHui', variant: 'action' },
    { key: 'enDiagnosticEnCours', labelKey: 'dashboard.kpi.enDiagnosticEnCours', variant: 'wait' },
    { key: 'enReparation', labelKey: 'dashboard.kpi.enReparation', variant: 'wait' },
    { key: 'terminees', labelKey: 'dashboard.kpi.terminees', variant: 'done' },
    { key: 'retardsRestitution', labelKey: 'dashboard.kpi.retardsRestitution', variant: 'danger' },
  ];

  t(key: string): string {
    return this.languageService.t(key);
  }

  value(def: KpiCardDef): number | null {
    const kpis = this.kpis();
    return kpis ? kpis[def.key] : null;
  }
}
