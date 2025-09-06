import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

export function handleHttpError(error: HttpErrorResponse) {
  if (error.error instanceof ErrorEvent) {
    console.error('Client-side error:', error.error.message);
  } else {
    console.error(`Server error (${error.status}):`, error.message);
  }

  return throwError(() => new Error('Algo salió mal. Intenta nuevamente.'));
}
