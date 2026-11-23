import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LandingStats } from '../../models/landing.model';

@Injectable({
  providedIn: 'root'
})
export class LandingService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/landing/stats`;

  getStats(): Observable<LandingStats> {
    return this.http.get<LandingStats>(this.apiUrl);
  }
}
