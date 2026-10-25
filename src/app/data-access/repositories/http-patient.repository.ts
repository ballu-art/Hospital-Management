import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListQuery, Page } from '../../shared/models/entity';
import { Patient, PatientInput } from '../models/patient';
import { PatientRepository } from './patient.repository';

/**
 * REFERENCE IMPLEMENTATION, not registered by default.
 * Shows how an ASP.NET Core API can replace the mock patient repository. The endpoint paths and
 * query parameter names below are assumptions: align them with your API contract.
 * Register it with: { provide: PATIENT_REPOSITORY, useClass: HttpPatientRepository }
 */
@Injectable()
export class HttpPatientRepository implements PatientRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/patients`;

  list(query: ListQuery): Observable<Page<Patient>> {
    let params = new HttpParams().set('page', query.pageIndex).set('pageSize', query.pageSize);
    if (query.search) params = params.set('search', query.search);
    if (query.sort)
      params = params.set('sort', query.sort.active).set('direction', query.sort.direction);
    for (const [key, value] of Object.entries(query.filters ?? {})) {
      if (value) params = params.set(key, value);
    }
    return this.http.get<Page<Patient>>(this.baseUrl, { params });
  }

  all(): Observable<readonly Patient[]> {
    return this.http.get<readonly Patient[]>(`${this.baseUrl}/lookup`);
  }

  get(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  create(input: PatientInput): Observable<Patient> {
    return this.http.post<Patient>(this.baseUrl, input);
  }

  update(id: string, changes: Partial<PatientInput>): Observable<Patient> {
    return this.http.patch<Patient>(`${this.baseUrl}/${encodeURIComponent(id)}`, changes);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }
}
