import { Component, computed, effect, inject, input, viewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { LanguageService } from '../../../../core/services/language-service';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { ChartThemeService } from '../../services/chart-theme-service';
import { TypeRepartitionItem } from '../../models/dashboard-view.model';

@Component({
  selector: 'app-repartition-types-chart',
  standalone: true,
  imports: [BaseChartDirective, LoadingSpinner, EmptyState],
  templateUrl: './repartition-types-chart.html',
  styleUrls: ['./repartition-types-chart.scss']
})
export class RepartitionTypesChart {
  private readonly languageService = inject(LanguageService);
  private readonly chartTheme = inject(ChartThemeService);
  private readonly chartDirective = viewChild(BaseChartDirective);

  readonly items = input<TypeRepartitionItem[] | null>(null);
  readonly loading = input(false);

  readonly chartType = 'bar' as const;

  readonly chartData = computed<ChartData<'bar'>>(() => {
    const items = this.items() ?? [];
    const palette = this.chartTheme.palette();
    return {
      labels: items.map((item) => this.t('type.' + item.type)),
      datasets: [
        {
          data: items.map((item) => item.total),
          label: this.t('dashboard.types.title'),
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
      this.chartData();
      this.chartOptions();
      this.chartDirective()?.chart?.update();
    });
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
