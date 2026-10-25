import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { provideInstantMocks } from '../../../../testing/test-providers';
import { AuthService } from '../../../core/auth/auth.service';
import { Department } from '../../../data-access/models/appointment';
import { MockControl } from '../../../data-access/mock/mock-control.service';
import { DEPARTMENT_REPOSITORY } from '../../../data-access/repositories/repository-tokens';
import { ResourceConfig } from './resource-config';
import { ResourceFormDialogComponent } from './resource-form-dialog.component';
import { ResourcePageComponent } from './resource-page.component';

function config(): ResourceConfig<Department> {
  return {
    title: 'Departments',
    singular: 'Department',
    subtitle: '',
    icon: 'apartment',
    searchLabel: 'Search',
    repository: TestBed.inject(DEPARTMENT_REPOSITORY),
    writePermission: 'departments:write',
    itemLabel: (d) => d.name,
    columns: [{ key: 'name', header: 'Department', value: (d) => d.name, sortable: true }],
    fields: [{ key: 'name', label: 'Name', type: 'text', required: true, maxLength: 80 }],
  };
}

async function signedIn(): Promise<void> {
  await new Promise<void>((r) =>
    TestBed.inject(AuthService)
      .signIn('usr-0001')
      .subscribe(() => r()),
  );
}

describe('ResourcePageComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: provideInstantMocks(),
    }),
  );

  it('shows a loading state while data is pending, then the rows', async () => {
    await signedIn();
    TestBed.inject(MockControl).latencyMs.set(20);
    const fixture = TestBed.createComponent(ResourcePageComponent<Department>);
    fixture.componentRef.setInput('config', config());
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Loading departments');
    await new Promise((r) => setTimeout(r, 60));
    TestBed.tick();
    fixture.detectChanges();
    expect(el.textContent).toContain('General Medicine');
  });

  it('shows the empty state with an add action when there is no data', async () => {
    await signedIn();
    const repo = TestBed.inject(DEPARTMENT_REPOSITORY);
    await new Promise<void>((r) =>
      repo.list({ pageIndex: 0, pageSize: 50 }).subscribe(async (page) => {
        for (const d of page.items)
          await new Promise<void>((done) => repo.delete(d.id).subscribe(() => done()));
        r();
      }),
    );
    const fixture = TestBed.createComponent(ResourcePageComponent<Department>);
    fixture.componentRef.setInput('config', config());
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No departments yet');
  });

  it('validates the form dialog and prevents saving invalid data', async () => {
    await signedIn();
    const dialog = TestBed.inject(MatDialog);
    const cfg = config();
    const ref = dialog.open(ResourceFormDialogComponent, {
      data: { config: cfg, item: null, mode: 'create' },
    });
    const component = ref.componentInstance as unknown as {
      submit(): void;
      form: {
        controls: Record<string, { setValue(v: string): void; hasError(e: string): boolean }>;
        invalid: boolean;
      };
    };
    component.submit();
    expect(component.form.invalid).toBe(true);
    expect(component.form.controls['name'].hasError('required')).toBe(true);
    component.form.controls['name'].setValue('   ');
    expect(component.form.controls['name'].hasError('notBlank')).toBe(true);

    component.form.controls['name'].setValue('Dermatology');
    const closed = new Promise<Department | undefined>((resolve) =>
      ref.afterClosed().subscribe((d) => resolve(d as Department | undefined)),
    );
    component.submit();
    const saved = await closed;
    expect(saved?.name).toBe('Dermatology');
  });
});
