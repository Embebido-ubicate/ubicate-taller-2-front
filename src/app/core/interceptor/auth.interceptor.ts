import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

let activeRequests = 0;

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  activeRequests++;

  let modifiedRequest = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const token = getAuthToken();
  if (token) {
    modifiedRequest = modifiedRequest.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  if (!isProduction()) {
    console.log('🚀 HTTP Request:', {
      method: modifiedRequest.method,
      url: modifiedRequest.url,
      headers: modifiedRequest.headers,
      body: modifiedRequest.body,
    });
  }

  return next(modifiedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      handleError(error);
      return throwError(() => error);
    }),
    finalize(() => {
      activeRequests--;
    })
  );
};

function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

function isProduction(): boolean {
  return false;
}

function handleError(error: HttpErrorResponse): void {
  let errorMessage = 'Error desconocido';

  if (error.error instanceof ErrorEvent) {
    errorMessage = `Error: ${error.error.message}`;
  } else {
    switch (error.status) {
      case 400:
        errorMessage = 'Solicitud incorrecta';
        break;
      case 401:
        errorMessage = 'No autorizado - Inicia sesión nuevamente';
        handleUnauthorized();
        break;
      case 403:
        errorMessage = 'Acceso prohibido';
        break;
      case 404:
        errorMessage = 'Recurso no encontrado';
        break;
      case 500:
        errorMessage = 'Error interno del servidor';
        break;
      case 503:
        errorMessage = 'Servicio no disponible';
        break;
      default:
        errorMessage = `Error ${error.status}: ${error.message}`;
    }
  }

  console.error('❌ HTTP Error:', {
    status: error.status,
    message: errorMessage,
    url: error.url,
    error: error.error,
  });

  showErrorNotification(errorMessage);
}

function handleUnauthorized(): void {
  localStorage.removeItem('auth_token');
}

function showErrorNotification(message: string): void {}

export function hasActiveRequests(): boolean {
  return activeRequests > 0;
}
