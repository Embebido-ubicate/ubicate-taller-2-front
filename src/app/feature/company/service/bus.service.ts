import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '../../../core/service/http-client.service';
import { BusesStats } from '../models/buses.model';

@Injectable({
  providedIn: 'root',
})
export class BusService {
  private httpClient = inject(HttpClientService);

  getBusStats(): Observable<BusesStats> {
    return this.httpClient.get<BusesStats>('buses/stats');
  }
}
