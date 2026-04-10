import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardRefreshService {
  private readonly refreshRequestedSubject = new Subject<void>();

  readonly refreshRequested$ = this.refreshRequestedSubject.asObservable();

  requestRefresh(): void {
    this.refreshRequestedSubject.next();
  }
}
