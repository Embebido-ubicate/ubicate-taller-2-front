import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '../../../../core/service/http-client.service';
import { Bus, BusesStats } from '../../models/buses.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BusService {
  private httpClient = inject(HttpClientService);

  createBus(busData: any): Observable<Bus> {
    return this.httpClient.post<Bus>('buses', busData);
  }

  getBusStats(): Observable<BusesStats> {
    return this.httpClient.get<BusesStats>('buses/stats');
  }

  getBuses(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.httpClient.get<any>('buses', params);
  }

  updateBus(busId: number, busData: any): Observable<Bus> {
    return this.httpClient.put<Bus>(`buses/${busId}`, busData);
  }

  updateBusStatus(busId: number, estado: string): Observable<Bus> {
    const params = new HttpParams().set('estado', estado);
    return this.httpClient.patch<Bus>(`buses/${busId}`, null, params);
  }

  deleteBus(busId: number): Observable<void> {
    return this.httpClient.delete<void>(`buses/${busId}`);
  }
}
