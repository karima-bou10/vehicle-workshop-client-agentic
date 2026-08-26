import { Component, computed, effect, inject, input, viewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { LanguageService } from '../../../../core/services/language-service';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { ChartThemeService } from '../../services/chart-theme-service';
import { VolumeJournalierItem } from '../../models/dashboard-view.model';

@Component({
  selector: 'app-volume-chart',
  standalone: true,
  imports: [BaseChartDirective, LoadingSpinner],
  templateUrl: './volume-chart.html',
  styleUrls: ['./volume-chart.scss']
})
export class VolumeChart {
  private readonly languageService = inject(LanguageService);
  private readonly chartTheme = inject(ChartThemeService);
  private readonly chartDirective = viewChild(BaseChartDirective);

  readonly items = input<VolumeJournalierItem[] | null>(null);
  readonly loading = input(false);

  readonly chartType = 'line' as const;

  readonly chartData = computed<ChartData<'line'>>(() => {
    const items = this.items() ?? [];
    const palette = this.chartTheme.palette();
    return {
      labels: items.map((item) => item.date),
      datasets: [
        {
          data: items.map((item) => item.recues),
          label: this.t('dashboard.volume.serie.recues'),
          borderColor: palette.action,
          backgroundColor: palette.action,
          tension: 0.3,
          pointRadius: 2,
        },
        {
          data: items.map((item) => item.terminees),
          label: this.t('dashboard.volume.serie.terminees'),
          borderColor: palette.done,
          backgroundColor: palette.done,
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    };
  });

  readonly chartOptions = computed<ChartConfiguration<'line'>['options']>(() => {
    const palette = this.chartTheme.palette();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: palette.textMuted } },
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
