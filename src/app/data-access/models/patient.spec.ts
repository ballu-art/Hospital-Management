import { PatientInput, patientFullName, validatePatientInput } from './patient';

const valid: PatientInput = {
  firstName: 'Test',
  lastName: 'Person',
  dateOfBirth: '1990-01-01',
  gender: 'Female',
  phone: '+1 555-0100',
  email: '',
  address: '1 Test Street',
  status: 'Active',
  emergencyContact: { name: 'Other Person', phone: '555-0101', relationship: 'Sibling' },
};

describe('validatePatientInput', () => {
  it('accepts a valid patient', () => {
    expect(validatePatientInput(valid)).toEqual([]);
  });

  it('reports every missing required field', () => {
    const errors = validatePatientInput({});
    expect(errors).toContain('First name is required.');
    expect(errors).toContain('Last name is required.');
    expect(errors).toContain('Date of birth is required.');
    expect(errors).toContain('Gender is required.');
    expect(errors).toContain('Phone is required.');
  });

  it('rejects future birth dates, bad names and bad phone numbers', () => {
    const now = new Date('2026-01-01');
    expect(validatePatientInput({ ...valid, dateOfBirth: '2030-01-01' }, now)).toContain(
      'Date of birth cannot be in the future.',
    );
    expect(validatePatientInput({ ...valid, firstName: '12345' })).toContain(
      'First name is invalid.',
    );
    expect(validatePatientInput({ ...valid, phone: 'abc' })).toContain('Phone number is invalid.');
  });

  it('builds a full name', () => {
    expect(patientFullName(valid)).toBe('Test Person');
  });
});
