import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpClientService } from '../../../core/service/http-client.service';
import { LoginRequest, LoginResponse } from '../models/auth.model';
import { SessionService } from '../../../core/service/session.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private httpClient = inject(HttpClientService);
  private sessionService = inject(SessionService);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.httpClient.post<LoginResponse>('auth/login', credentials).pipe(
      tap((response) => {
        this.sessionService.setSession(response.token, response.user);
      })
    );
  }
}
