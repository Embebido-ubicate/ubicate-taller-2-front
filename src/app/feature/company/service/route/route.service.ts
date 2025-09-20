import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '../../../../core/service/http-client.service';
import { HttpParams } from '@angular/common/http';

export interface CreateRouteRequest {
  nombre: string;
  codigo: string;
  descripcion?: string;
  origen?: string;
  destino?: string;
  colorHex?: string;
  polyline?: string;
  empresaId: number;
  busIds?: number[];
}

export interface UpdateRouteRequest {
  nombre?: string;
  descripcion?: string;
  origen?: string;
  destino?: string;
  colorHex?: string;
  polyline?: string;
  estado?: string;
  busIds?: number[];
}

export interface RouteResponse {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  origen: string;
  destino: string;
  colorHex: string;
  polyline: string;
  estado: string;
  activo: boolean;
  empresaId: number;
  fechaCreacion: string;
  buses: any[];
}

@Injectable({
  providedIn: 'root',
})
export class RouteService {
  private httpClient = inject(HttpClientService);

  createRoute(routeData: CreateRouteRequest): Observable<RouteResponse> {
    return this.httpClient.post<RouteResponse>('rutas', routeData);
  }

  getRoutes(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.httpClient.get<any>('rutas', params);
  }

  getRouteById(routeId: number): Observable<RouteResponse> {
    return this.httpClient.get<RouteResponse>(`rutas/${routeId}`);
  }

  updateRoute(
    routeId: number,
    routeData: UpdateRouteRequest
  ): Observable<RouteResponse> {
    return this.httpClient.put<RouteResponse>(`rutas/${routeId}`, routeData);
  }

  deleteRoute(routeId: number): Observable<any> {
    return this.httpClient.delete<any>(`rutas/${routeId}`);
  }

  getRoutesByEstado(estado: string): Observable<RouteResponse[]> {
    return this.httpClient.get<RouteResponse[]>(`rutas/estado/${estado}`);
  }
}
