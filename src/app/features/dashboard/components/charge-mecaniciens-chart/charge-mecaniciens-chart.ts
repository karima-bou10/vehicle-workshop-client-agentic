import { Component, computed, effect, inject, input, viewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { LanguageService } from '../../../../core/services/language-service';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { ChartThemeService } from '../../services/chart-theme-service';
import { MecanicienChargeItem } from '../../models/dashboard-view.model';

@Component({
  selector: 'app-charge-mecaniciens-chart',
  standalone: true,
  imports: [BaseChartDirective, LoadingSpinner, EmptyState],
  templateUrl: './charge-mecaniciens-chart.html',
  styleUrls: ['./charge-mecaniciens-chart.scss']
})
export class ChargeMecaniciensChart {
  private readonly languageService = inject(LanguageService);
  private readonly chartTheme = inject(ChartThemeService);
  private readonly chartDirective = viewChild(BaseChartDirective);

  readonly items = input<MecanicienChargeItem[] | null>(null);
  readonly loading = input(false);

  readonly chartType = 'bar' as const;

  readonly chartData = computed<ChartData<'bar'>>(() => {
    const items = this.items() ?? [];
    const palette = this.chartTheme.palette();
    return {
      labels: items.map((item) => item.nom),
      datasets: [
        {
          data: items.map((item) => item.chargeActive),
          label: this.t('dashboard.charge.title'),
          backgroundColor: palette.action,
          borderColor: palette.action,
          borderRadius: 4,
        },
      ],
    };
  });

  readonly chartOptions = computed<ChartConfiguration<'bar'>['options']>(() => {
    const palette = this.chartTheme.palette();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { ticks: { color: palette.textMuted }, grid: { color: palette.borderSoft } },
        y: { beginAtZero: true, ticks: { color: palette.textMuted }, grid: { color: palette.borderSoft } },
      },
    };
  });

  constructor() {
    effect(() => {
      // Re-read palette/data and repaint the existing chart instance without a new API call.
      this.chartData();
      this.chartOptions();
      this.chartDirective()?.chart?.update();
    });
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
