import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '../../../../core/service/http-client.service';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ConductorService {
  private httpClient = inject(HttpClientService);

  createConductor(conductorData: any): Observable<any> {
    return this.httpClient.post<any>('conductores', conductorData);
  }

  getConductorStats(): Observable<any> {
    return this.httpClient.get<any>('conductores/stats');
  }

  getConductores(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'fechaCreacion,desc');
    return this.httpClient.get<any>('conductores', params);
  }

  searchConductores(
    searchTerm: string,
    page: number = 0,
    size: number = 20
  ): Observable<any> {
    const params = new HttpParams()
      .set('q', searchTerm)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.httpClient.get<any>('conductores/search', params);
  }

  updateConductor(conductorId: number, conductorData: any): Observable<any> {
    return this.httpClient.put<any>(
      `conductores/${conductorId}`,
      conductorData
    );
  }

  updateConductorStatus(conductorId: number, estado: string): Observable<any> {
    const params = new HttpParams().set('estado', estado);
    return this.httpClient.patch<any>(
      `conductores/${conductorId}/estado`,
      null,
      params
    );
  }

  asignarBus(conductorId: number, busId: number): Observable<any> {
    const params = new HttpParams().set('busId', busId.toString());
    return this.httpClient.patch<any>(
      `conductores/${conductorId}/asignar-bus`,
      null,
      params
    );
  }

  removerBus(conductorId: number): Observable<any> {
    return this.httpClient.patch<any>(
      `conductores/${conductorId}/remover-bus`,
      null
    );
  }

  getConductoresByEstado(estado: string): Observable<any> {
    return this.httpClient.get<any>(`conductores/estado/${estado}`);
  }

  getConductoresByTurno(turno: string): Observable<any> {
    return this.httpClient.get<any>(`conductores/turno/${turno}`);
  }

  deleteConductor(conductorId: number): Observable<void> {
    return this.httpClient.delete<void>(`conductores/${conductorId}`);
  }
}
