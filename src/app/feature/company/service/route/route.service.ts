import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpClientService } from '../../../../core/service/http-client.service';
import {
  CreateRouteRequest,
  RouteResponse,
  UpdateRouteRequest,
} from '../../models/route.model';

export type EstadoRuta = 'ACTIVA' | 'INACTIVA';

@Injectable({ providedIn: 'root' })
export class RouteService {
  private http = inject(HttpClientService);

  createRoute(body: CreateRouteRequest): Observable<RouteResponse> {
    return this.http.post<RouteResponse>('rutas', body);
  }

  getRoutes(estado?: EstadoRuta): Observable<RouteResponse[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<RouteResponse[]>('rutas', params);
  }

  getRouteById(routeId: number): Observable<RouteResponse> {
    return this.http.get<RouteResponse>(`rutas/${routeId}`);
  }

  updateRoute(
    routeId: number,
    body: UpdateRouteRequest
  ): Observable<RouteResponse> {
    return this.http.put<RouteResponse>(`rutas/${routeId}`, body);
  }

  deleteRoute(
    routeId: number
  ): Observable<{ message?: string; success?: boolean }> {
    return this.http.delete<{ message?: string; success?: boolean }>(
      `rutas/${routeId}`
    );
  }
}
