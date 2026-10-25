# Hospital ERP – Angular 22 frontend template

A feature-first, lazy-loaded hospital administration portal built with **Angular 22**, **Angular Material 22** and strict TypeScript. It runs entirely on **fictional, in-memory mock data**, with a clear data-access boundary so an ASP.NET Core Web API (SQL Server) can replace the mocks later.

> ## ⚠️ Not for production
>
> - All patient, employee and financial data is **fictional demo data**.
> - The sign-in screen is a **role picker, not authentication**. There are no passwords, tokens or sessions. Route guards and role checks only shape the UI and are **not a security boundary**.
> - Real authentication, authorization, auditing, encryption and privacy controls (HIPAA/GDPR or local equivalents) must be built and enforced by a trusted backend before any real hospital use.
> - Changes are held in memory only and **reset on browser reload**. Nothing is persisted.

## Prerequisites

- Node.js **≥ 22.22.3** (Angular 22 CLI requirement) and npm 10+

## Commands

| Task                        | Command                                          |
| --------------------------- | ------------------------------------------------ |
| Install                     | `npm install`                                    |
| Run (http://localhost:4200) | `npm start`                                      |
| Production build            | `npm run build:prod`                             |
| Unit tests (Vitest)         | `npm run test:ci` (or `npm test` for watch mode) |
| Lint                        | `npm run lint`                                   |
| Format / check              | `npm run format` / `npm run format:check`        |

## What is covered (from the requirements document)

| Requirement area                                                                                                                                   | Where                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Dashboard: employees, active patients, pending leave, low stock, expiring medicines, attendance summary (+ revenue, beds, charts, recent activity) | `features/dashboard`                                         |
| Patient registration, medical history (diagnosis, prescriptions, notes), patient detail                                                            | `features/patients`                                          |
| OPD/IPD visits, discharge, bed allocation                                                                                                          | `features/admissions`                                        |
| Appointments (book, reschedule, edit, cancel, daily schedule)                                                                                      | `features/appointments`                                      |
| Employee management, attendance, leave approval, payroll (incl. generate-month action)                                                             | `features/staff`                                             |
| Inventory, stock, vendors/suppliers, purchase orders, pharmacy stock and expiry                                                                    | `features/inventory`, `features/pharmacy`                    |
| Billing and payments                                                                                                                               | `features/billing`                                           |
| Reports (+ CSV export)                                                                                                                             | `features/reports`                                           |
| User permissions: Super Admin, HR Manager, Doctor, Inventory Manager                                                                               | `core/auth/permissions.ts`, `features/settings`              |
| Doctors, departments, laboratory, radiology                                                                                                        | `features/doctors`, `departments`, `laboratory`, `radiology` |

**Maturity:** Dashboard, Patients and Appointments are fully built with dedicated typed forms, validation and tests. The other modules are _starter_ CRUD workflows generated from a declarative config (`ResourceConfig`); they are useful scaffolding, not production-ready.

### Demo roles (pick one on the sign-in screen)

| Role              | Can                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------ |
| Super Admin       | Everything, including users, settings, patient registration                          |
| HR Manager        | Employees, attendance, leave approval, payroll, reports                              |
| Doctor            | View patients, add diagnoses/prescriptions/notes, appointments, lab/radiology orders |
| Inventory Manager | Purchases, stock, suppliers, pharmacy                                                |

## Architecture

```
src/app/
  core/            auth (demo), layout (shell, sidebar, topbar, breadcrumb), error handling, app-wide services
  shared/          reusable components (data-table, charts, dialogs, states, resource-crud), validators, pipes, utils
  data-access/     models, repository contracts (+ DI tokens), mock implementations, reference HTTP repository
  features/        one folder per feature: pages/, components/, services/, <feature>.routes.ts
src/styles/        _tokens.scss (design tokens), _breakpoints.scss, _theme.scss (Material), _utilities.scss
src/environments/  environment.ts / environment.production.ts
```

Key ideas:

- **Layering:** pages/components → feature services (business rules) → repository _contracts_ (DI tokens) → mock or HTTP implementation. Components never touch data stores directly.
- **State:** Signals for UI state; RxJS for async. `ListController` (signals + RxJS) drives search/filter/sort/paging and loading/empty/error states.
- **Design system:** colours, spacing, radii, elevation, type and breakpoints are centralised in `src/styles`; Material is themed via `mat.theme` + overrides.
- **Accessibility:** skip link, focus management on route change, labelled controls, `aria-live` states, accessible chart summaries with hidden data tables, reduced-motion support.

## Mock repository design

- `Repository<T, TCreate>` (`data-access/repositories/repository.ts`) defines `list(query)`, `all()`, `get`, `create`, `update`, `delete` with an API-like `ListQuery`/`Page<T>` shape.
- `InMemoryRepository` implements it immutably (arrays are replaced, never mutated), with search, filters, sort and paging; domain rules (e.g. duplicate patient) throw `AppError`.
- Seed data lives in `data-access/mock/mock-data*.ts`. Names and counts are deterministic; **dates are generated relative to today** so the dashboard always looks current.
- **Settings → Demo data controls** lets you add latency or simulate failures to see loading and error states.
- Appointment scheduling rules (`appointment-rules.ts`) are **demo validation** in the browser/mock layer. They do not provide real concurrency guarantees; a backend must enforce scheduling transactionally.

## Adding a new feature

1. Add a model in `data-access/models/`.
2. Add a token in `data-access/repositories/repository-tokens.ts` and register a mock in `provide-mock-repositories.ts` (seed data in a `mock-data*.ts` file).
3. Create `features/<name>/pages/<name>.page.ts`. For a quick CRUD module, build a `ResourceConfig` and render `<app-resource-page [config]="config" />` (see `features/doctors`). For custom UIs, use `ListController` + `app-data-table`.
4. Add `<name>.routes.ts`, then a lazy route in `app.routes.ts` using the `feature(...)` helper.
5. Add a permission in `core/auth/permissions.ts` and a sidebar entry in `core/layout/nav.config.ts`.
6. Add tests next to the code.

## Replacing a mock repository with an ASP.NET Core API

1. Implement the contract. A reference is provided: `data-access/repositories/http-patient.repository.ts` (uses `HttpClient`; endpoints and query names are assumptions to align with your API).
2. In `app.config.ts`, after `provideMockRepositories()`, override the token (later providers win):
   ```ts
   { provide: PATIENT_REPOSITORY, useClass: HttpPatientRepository }
   ```
   When every repository has an HTTP implementation, remove `provideMockRepositories()`.
3. Set `environment.apiBaseUrl`, and add an `HttpInterceptor` for real auth (e.g. cookies or bearer tokens issued by your identity provider).
4. Replace the demo `AuthService` with a real implementation; keep `can(permission)` for UI hints only and enforce authorization on the server.
5. Move rules such as MRN generation, duplicate detection and scheduling conflicts to the API; keep the client rules as UX hints.

## Known limitations

- No persistence; reload resets all data. No real authentication, authorization or audit logging.
- Starter modules have basic validation only. Search on records that reference patients/doctors matches stored fields (e.g. test name), not the related person's name.
- Receiving a purchase order does not change stock; deleting records does not cascade to related records (except guards for open inpatient visits and occupied beds).
- Payroll figures are simplified (flat allowance/deduction percentages), not statutory calculations.
- Appointment calendar is a daily agenda, not a full calendar grid.
- `dashboard` and report figures are computed client-side from full lists, which a real API should aggregate server-side.
- No i18n, dark mode or end-to-end browser tests; the UI was verified through unit/component tests and builds, not manual cross-browser testing.
