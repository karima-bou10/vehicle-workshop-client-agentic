import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-workflow-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workflow-stepper.html',
  styleUrls: ['./workflow-stepper.scss']
})
export class WorkflowStepper {
  readonly steps = input<string[]>([]);
  readonly activeIndex = input(0);

  readonly normalizedActiveIndex = computed(() => this.activeIndex());
}
