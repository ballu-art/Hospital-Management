import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Bill, BILL_STATUSES, billStatusOf } from '../../../data-access/models/operations';
import { patientFullName } from '../../../data-access/models/patient';
import { BILL_REPOSITORY } from '../../../data-access/repositories/bill.repository';
import { PATIENT_REPOSITORY } from '../../../data-access/repositories/patient.repository';
import { ResourceConfig } from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';
import { AppError } from '../../../shared/models/app-error';
import { formatMoney } from '../../../shared/utils/format';
import { createLookup } from '../../../shared/utils/lookup';

@Component({
  selector: 'app-billing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class BillingPage {
  private readonly repo = inject(BILL_REPOSITORY);
  private readonly patients = createLookup(inject(PATIENT_REPOSITORY), patientFullName);

  protected readonly config: ResourceConfig<Bill> = {
    title: 'Billing & payments',
    singular: 'Invoice',
    subtitle: 'Invoices, balances and payment status',
    icon: 'receipt_long',
    searchLabel: 'Search by invoice number or description',
    repository: this.repo,
    writePermission: 'billing:write',
    itemLabel: (b) => b.invoiceNumber,
    defaultSort: { active: 'issuedOn', direction: 'desc' },
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: BILL_STATUSES.map((s) => ({ value: s, label: s })),
      },
    ],
    columns: [
      { key: 'invoiceNumber', header: 'Invoice', value: (b) => b.invoiceNumber, sortable: true },
      {
        key: 'patientId',
        header: 'Patient',
        value: (b) => this.patients.label(b.patientId),
        hideBelow: 'sm',
      },
      {
        key: 'issuedOn',
        header: 'Issued',
        value: (b) => b.issuedOn,
        sortable: true,
        hideBelow: 'md',
      },
      {
        key: 'amount',
        header: 'Amount',
        value: (b) => formatMoney(b.amount),
        sortable: true,
        align: 'end',
      },
      {
        key: 'balance',
        header: 'Balance',
        value: (b) => formatMoney(b.amount - b.paidAmount),
        align: 'end',
        hideBelow: 'sm',
      },
      { key: 'status', header: 'Status', value: (b) => b.status, chip: true, sortable: true },
    ],
    fields: [
      {
        key: 'patientId',
        label: 'Patient',
        type: 'select',
        required: true,
        options: () => this.patients.options$,
      },
      { key: 'description', label: 'Description', type: 'text', required: true, maxLength: 120 },
      {
        key: 'issuedOn',
        label: 'Issued on',
        type: 'date',
        required: true,
        defaultValue: new Date(),
      },
      { key: 'dueOn', label: 'Due on', type: 'date', required: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true, min: 0.01 },
      {
        key: 'paidAmount',
        label: 'Paid so far',
        type: 'number',
        required: true,
        min: 0,
        defaultValue: 0,
      },
    ],
    normalize: (v, prev) => {
      const amount = Number(v['amount']);
      const paid = Number(v['paidAmount']);
      if (paid > amount)
        throw new AppError('validation', 'Paid amount cannot exceed the invoice amount.');
      return {
        ...v,
        invoiceNumber:
          prev?.invoiceNumber ??
          `INV-${String(new Date().getFullYear())}-${String(Date.now()).slice(-6)}`,
        status: billStatusOf(amount, paid),
      };
    },
    rowActions: [
      {
        id: 'pay',
        label: 'Record full payment',
        icon: 'paid',
        visible: (b) => b.status !== 'Paid',
        confirm: {
          title: 'Record full payment?',
          message: 'The invoice will be marked as paid in the demo data.',
          confirmLabel: 'Mark as paid',
        },
        run: (b) => this.repo.update(b.id, { paidAmount: b.amount, status: 'Paid' }),
        successMessage: (b) => `${b.invoiceNumber} marked as paid.`,
      },
    ],
  };
}
