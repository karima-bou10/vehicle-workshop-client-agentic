import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.html',
  styleUrls: ['./confirmation-dialog.scss']
})
export class ConfirmationDialog {
  readonly open = input(false);
  readonly title = input('Confirmation');
  readonly message = input('');
  readonly variant = input<'info' | 'alert'>('info');
  readonly confirmLabel = input('Confirmer');
  readonly cancelLabel = input('Annuler');
  readonly requireReason = input(false);
  readonly reasonPlaceholder = input('Saisissez un motif');

  readonly confirm = output<string>();
  readonly cancel = output<void>();

  readonly reason = signal('');

  readonly trimmedReason = computed(() => this.reason().trim());
  readonly confirmDisabled = computed(() => this.requireReason() && !this.trimmedReason());

  constructor() {
    effect(() => {
      if (this.open()) {
        this.reason.set('');
      }
    });
  }

  onOverlayClick(): void {
    this.cancel.emit();
  }

  onDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onReasonInput(value: string): void {
    this.reason.set(value);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onConfirm(): void {
    this.confirm.emit(this.requireReason() ? this.trimmedReason() : '');
  }
}
