import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';
import { provideInstantMocks } from '../../../../testing/test-providers';
import { AuthService } from '../../../core/auth/auth.service';
import { MockControl } from '../../../data-access/mock/mock-control.service';
import { PATIENT_REPOSITORY } from '../../../data-access/repositories/patient.repository';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { MOCK_PATIENTS } from '../../../data-access/mock/mock-data';
import { PatientListPage } from './patient-list.page';

describe('PatientListPage', () => {
  let confirmResult = false;

  async function setup(): Promise<{ fixture: ComponentFixture<PatientListPage>; el: HTMLElement }> {
    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [
        ...provideInstantMocks(),
        { provide: ConfirmDialogService, useValue: { confirm: () => of(confirmResult) } },
      ],
    });
    await new Promise<void>((resolve) =>
      TestBed.inject(AuthService)
        .signIn('usr-0001')
        .subscribe(() => resolve()),
    );
    const fixture = TestBed.createComponent(PatientListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('shows rows with names, status chips and pagination', async () => {
    const { el } = await setup();
    expect(el.querySelectorAll('tr.mat-mdc-row').length).toBe(10);
    expect(el.textContent).toContain('Aarav Desai');
    expect(el.querySelector('app-status-chip')).toBeTruthy();
    expect(el.querySelector('mat-paginator')).toBeTruthy();
  });

  it('shows the empty state with a way to clear when nothing matches', async () => {
    const { fixture, el } = await setup();
    const list = (
      fixture.componentInstance as unknown as { list: { applySearch(v: string): void } }
    ).list;
    list.applySearch('nobody-with-this-name');
    TestBed.tick();
    fixture.detectChanges();
    expect(el.textContent).toContain('No matching patients');
    expect(el.textContent).toContain('Clear search and filters');
  });

  it('shows a recoverable error state when the repository fails', async () => {
    const { fixture, el } = await setup();
    TestBed.inject(MockControl).failureMode.set('next');
    (fixture.componentInstance as unknown as { list: { reload(): void } }).list.reload();
    TestBed.tick();
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Simulated server error');
    (el.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    TestBed.tick();
    fixture.detectChanges();
    expect(el.querySelectorAll('tr.mat-mdc-row').length).toBe(10);
  });

  it('keeps the patient when delete is not confirmed and removes it when confirmed', async () => {
    const { fixture } = await setup();
    const repo = TestBed.inject(PATIENT_REPOSITORY);
    const row = MOCK_PATIENTS[0];
    const component = fixture.componentInstance as unknown as {
      onAction(e: { id: string; row: typeof row }): void;
    };

    confirmResult = false;
    component.onAction({ id: 'delete', row });
    let total = 0;
    repo.list({ pageIndex: 0, pageSize: 1 }).subscribe((p) => (total = p.total));
    expect(total).toBe(MOCK_PATIENTS.length);

    confirmResult = true;
    component.onAction({ id: 'delete', row });
    repo.list({ pageIndex: 0, pageSize: 1 }).subscribe((p) => (total = p.total));
    expect(total).toBe(MOCK_PATIENTS.length - 1);
  });
});
