import { Pipe, PipeTransform } from '@angular/core';
import { ageFromIso } from '../utils/date';

@Pipe({ name: 'age' })
export class AgePipe implements PipeTransform {
  transform(dateOfBirth: string | null | undefined): string {
    return dateOfBirth ? String(ageFromIso(dateOfBirth)) : '';
  }
}
