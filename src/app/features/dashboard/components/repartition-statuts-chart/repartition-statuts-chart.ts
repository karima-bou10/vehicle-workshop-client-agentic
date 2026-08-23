import { Component, computed, effect, inject, input, viewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { LanguageService } from '../../../../core/services/language-service';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { ChartThemeService } from '../../services/chart-theme-service';
import { StatutRepartitionItem } from '../../models/dashboard-view.model';

@Component({
  selector: 'app-repartition-statuts-chart',
  standalone: true,
  imports: [BaseChartDirective, LoadingSpinner],
  templateUrl: './repartition-statuts-chart.html',
  styleUrls: ['./repartition-statuts-chart.scss']
})
export class RepartitionStatutsChart {
  private readonly languageService = inject(LanguageService);
  private readonly chartTheme = inject(ChartThemeService);
  private readonly chartDirective = viewChild(BaseChartDirective);

  readonly items = input<StatutRepartitionItem[] | null>(null);
  readonly loading = input(false);

  readonly chartType = 'doughnut' as const;

  readonly chartData = computed<ChartData<'doughnut'>>(() => {
    const items = this.items() ?? [];
    const palette = this.chartTheme.palette();
    const colors = [
      palette.action,
      palette.wait,
      palette.done,
      palette.danger,
      palette.textMuted,
      palette.borderSoft,
      palette.surfaceCard,
    ];
    return {
      labels: items.map((item) => this.t('statut.' + item.statut)),
      datasets: [
        {
          data: items.map((item) => item.total),
          backgroundColor: items.map((_, i) => colors[i % colors.length]),
          borderColor: palette.surfaceCard,
        },
      ],
    };
  });

  readonly chartOptions = computed<ChartConfiguration<'doughnut'>['options']>(() => {
    const palette = this.chartTheme.palette();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: palette.textMuted } },
      },
    };
  });

  constructor() {
    effect(() => {
      this.chartData();
      this.chartOptions();
      this.chartDirective()?.chart?.update();
    });
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
