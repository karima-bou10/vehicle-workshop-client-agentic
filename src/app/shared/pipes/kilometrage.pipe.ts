import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'kilometrage'
})
export class KilometragePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) {
      return '-';
    }

    return `${new Intl.NumberFormat('fr-FR').format(value)} km`;
  }
}
