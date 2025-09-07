import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Contador global de requests activos
let activeRequests = 0;

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  // Incrementar contador de requests activos
  activeRequests++;

  // Clonar request para agregar headers
  let modifiedRequest = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Agregar token de autorización si existe
  const token = getAuthToken();
  if (token) {
    modifiedRequest = modifiedRequest.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Log del request (solo en desarrollo)
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
      // Manejo global de errores
      handleError(error);
      return throwError(() => error);
    }),
    finalize(() => {
      // Decrementar contador cuando termine el request
      activeRequests--;
    })
  );
};

function getAuthToken(): string | null {
  // Obtener token desde localStorage, sessionStorage o service
  return localStorage.getItem('auth_token');
}

function isProduction(): boolean {
  // Verificar si estamos en producción
  return false; // Cambiar según tu configuración
}

function handleError(error: HttpErrorResponse): void {
  let errorMessage = 'Error desconocido';

  if (error.error instanceof ErrorEvent) {
    // Error del lado del cliente
    errorMessage = `Error: ${error.error.message}`;
  } else {
    // Error del lado del servidor
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

  // Log del error
  console.error('❌ HTTP Error:', {
    status: error.status,
    message: errorMessage,
    url: error.url,
    error: error.error,
  });

  // Mostrar notificación al usuario (opcional)
  showErrorNotification(errorMessage);
}

function handleUnauthorized(): void {
  // Limpiar token y redirigir al login
  localStorage.removeItem('auth_token');
  // window.location.href = '/login';
}

function showErrorNotification(message: string): void {
  // Implementar notificación toast o alert
  // Ejemplo básico:
  // alert(message);
  // O usar una librería como ngx-toastr:
  // this.toastr.error(message);
}

// Función para verificar si hay requests activos (útil para loading states)
export function hasActiveRequests(): boolean {
  return activeRequests > 0;
}
