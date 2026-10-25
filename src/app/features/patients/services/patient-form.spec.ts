import { createPatientForm, toPatientInput } from './patient-form';

function fill(form: ReturnType<typeof createPatientForm>) {
  form.setValue({
    firstName: '  Mina ',
    lastName: 'Okafor',
    dateOfBirth: new Date(1990, 2, 15),
    gender: 'Female',
    phone: '+1 555-0100',
    email: 'MINA@Example.TEST',
    address: '2 Demo Lane',
    status: 'Active',
    emergencyContact: { name: 'Ade Okafor', phone: '555-0101', relationship: 'Brother' },
  });
}

describe('patient form validation', () => {
  it('is invalid when empty and marks required fields', () => {
    const form = createPatientForm();
    expect(form.invalid).toBe(true);
    expect(form.controls.firstName.hasError('required')).toBe(true);
    expect(form.controls.dateOfBirth.hasError('required')).toBe(true);
    expect(form.controls.emergencyContact.controls.name.hasError('required')).toBe(true);
  });

  it('rejects blank, malformed and future values', () => {
    const form = createPatientForm();
    fill(form);
    expect(form.valid).toBe(true);
    form.controls.firstName.setValue('   ');
    expect(form.controls.firstName.hasError('notBlank')).toBe(true);
    form.controls.firstName.setValue('R2D2');
    expect(form.controls.firstName.hasError('personName')).toBe(true);
    form.controls.phone.setValue('call me');
    expect(form.controls.phone.hasError('phone')).toBe(true);
    form.controls.email.setValue('not-an-email');
    expect(form.controls.email.hasError('email')).toBe(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    form.controls.dateOfBirth.setValue(tomorrow);
    expect(form.controls.dateOfBirth.hasError('futureDate')).toBe(true);
    form.controls.dateOfBirth.setValue(new Date(1800, 0, 1));
    expect(form.controls.dateOfBirth.hasError('tooOld')).toBe(true);
  });

  it('normalises text and dates when converting to the domain input', () => {
    const form = createPatientForm();
    fill(form);
    const result = toPatientInput(form);
    expect(result.firstName).toBe('Mina');
    expect(result.email).toBe('mina@example.test');
    expect(result.dateOfBirth).toBe('1990-03-15');
  });

  it('refuses to convert an invalid form', () => {
    expect(() => toPatientInput(createPatientForm())).toThrow();
  });
});
