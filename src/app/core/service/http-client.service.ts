import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../config/environment';
import { handleHttpError } from '../utils/http-error-handler.util';

@Injectable({ providedIn: 'root' })
export class HttpClientService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiCore;

  private getDefaultHeaders(isFormData: boolean = false): HttpHeaders {
    let headers = new HttpHeaders({
      Accept: 'application/json',
    });
    if (!isFormData) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}/${path}`, {
        headers: this.getDefaultHeaders(),
        params,
      })
      .pipe(retry(1), catchError(handleHttpError));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    const isFormData = body instanceof FormData;
    return this.http
      .post<T>(`${this.baseUrl}/${path}`, body, {
        headers: this.getDefaultHeaders(isFormData),
      })
      .pipe(catchError(handleHttpError));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    const isFormData = body instanceof FormData;
    return this.http
      .put<T>(`${this.baseUrl}/${path}`, body, {
        headers: this.getDefaultHeaders(isFormData),
      })
      .pipe(catchError(handleHttpError));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    const isFormData = body instanceof FormData;
    return this.http
      .patch<T>(`${this.baseUrl}/${path}`, body, {
        headers: this.getDefaultHeaders(isFormData),
      })
      .pipe(catchError(handleHttpError));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}/${path}`, {
        headers: this.getDefaultHeaders(),
      })
      .pipe(catchError(handleHttpError));
  }
}
