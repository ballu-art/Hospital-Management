// Fictional, deterministic demo data. Dates are generated relative to "today" at load time,
// so the dashboard always looks current; names, counts and relationships never change.
import { isoDaysFromToday as d } from '../../shared/utils/date';
import { Appointment, Department, Doctor } from '../models/appointment';
import { ClinicalRecord } from '../models/clinical';
import { Patient } from '../models/patient';

export const pad4 = (n: number): string => String(n).padStart(4, '0');
export const pid = (n: number): string => `pat-${pad4(n)}`;
export const did = (n: number): string => `doc-${pad4(n)}`;
export const depId = (n: number): string => `dep-${pad4(n)}`;

export const MOCK_DEPARTMENTS: readonly Department[] = [
  ['General Medicine', 'Block A, Floor 1', '555-0101'],
  ['Cardiology', 'Block B, Floor 2', '555-0102'],
  ['Orthopedics', 'Block B, Floor 1', '555-0103'],
  ['Pediatrics', 'Block C, Floor 1', '555-0104'],
  ['Obstetrics & Gynecology', 'Block C, Floor 2', '555-0105'],
  ['Emergency', 'Block A, Ground', '555-0106'],
  ['Neurology', 'Block B, Floor 3', '555-0107'],
].map(([name, location, phone], i) => ({
  id: depId(i + 1),
  name,
  location,
  phone,
  status: 'Active' as const,
}));

// first, last, department#, specialization, status, fee
const DOCTOR_ROWS: [string, string, number, string, Doctor['status'], number][] = [
  ['Priya', 'Nair', 1, 'Internal Medicine', 'Available', 60],
  ['Rohan', 'Kapoor', 2, 'Interventional Cardiology', 'Available', 120],
  ['Meera', 'Iyer', 3, 'Joint Replacement', 'In surgery', 110],
  ['Samuel', 'Okoye', 4, 'Pediatric Medicine', 'Available', 70],
  ['Anika', 'Rao', 5, 'Maternal Health', 'Available', 90],
  ['Daniel', 'Fischer', 6, 'Emergency Medicine', 'Available', 80],
  ['Leila', 'Haddad', 7, 'Clinical Neurology', 'On leave', 130],
  ['Vikram', 'Shah', 2, 'Cardiac Electrophysiology', 'Available', 125],
];
export const MOCK_DOCTORS: readonly Doctor[] = DOCTOR_ROWS.map(
  ([firstName, lastName, dep, specialization, status, consultationFee], i) => ({
    id: did(i + 1),
    firstName,
    lastName,
    departmentId: depId(dep),
    specialization,
    phone: `555-02${String(i + 10)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.test`,
    consultationFee,
    status,
  }),
);

// first, last, dob, gender, status, registered N days ago, emergency contact [name, relationship]
const PATIENT_ROWS: [
  string,
  string,
  string,
  Patient['gender'],
  Patient['status'],
  number,
  string,
  string,
][] = [
  ['Aarav', 'Desai', '1984-03-12', 'Male', 'Active', 400, 'Nisha Desai', 'Spouse'],
  ['Maya', 'Lindqvist', '2016-07-04', 'Female', 'Active', 120, 'Erik Lindqvist', 'Father'],
  ['Kabir', 'Malhotra', '1971-11-23', 'Male', 'Active', 90, 'Anita Malhotra', 'Spouse'],
  ['Sofia', 'Almeida', '1963-05-30', 'Female', 'Active', 75, 'Rui Almeida', 'Son'],
  ['Noah', 'Bennett', '1992-09-17', 'Male', 'Active', 60, 'Grace Bennett', 'Mother'],
  ['Isha', 'Banerjee', '1990-01-08', 'Female', 'Active', 45, 'Raj Banerjee', 'Brother'],
  ['Hana', 'Yamada', '1995-06-21', 'Female', 'Active', 30, 'Kenji Yamada', 'Husband'],
  ['Omar', 'Khalil', '1958-12-02', 'Male', 'Active', 21, 'Layla Khalil', 'Daughter'],
  ['Elena', 'Petrova', '1979-04-14', 'Female', 'Inactive', 300, 'Ivan Petrov', 'Husband'],
  ['Tobias', 'Richter', '2012-02-27', 'Male', 'Active', 14, 'Klara Richter', 'Mother'],
  ['Zara', 'Mitchell', '1987-08-09', 'Female', 'Active', 9, 'Liam Mitchell', 'Spouse'],
  ['Arjun', 'Reddy', '1968-10-19', 'Male', 'Active', 5, 'Sunita Reddy', 'Spouse'],
  ['Chloe', 'Dubois', '2001-03-03', 'Female', 'Active', 2, 'Marc Dubois', 'Father'],
  ['Liam', "O'Connor", '1999-07-25', 'Male', 'Active', 1, 'Aoife O’Connor', 'Sister'],
];
export const MOCK_PATIENTS: readonly Patient[] = PATIENT_ROWS.map(
  ([firstName, lastName, dateOfBirth, gender, status, ago, ecName, ecRel], i) => ({
    id: pid(i + 1),
    medicalRecordNumber: `MRN-${String(i + 1).padStart(6, '0')}`,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phone: `+1 555-01${String(i + 20)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}@example.test`,
    address: `${10 + i} Sample Street, Demo City`,
    emergencyContact: { name: ecName, phone: `+1 555-03${String(i + 20)}`, relationship: ecRel },
    registrationDate: d(-ago),
    status,
  }),
);

// patient#, doctor#, day offset, time, reason, status
const APPT_ROWS: [number, number, number, string, string, Appointment['status']][] = [
  [1, 2, 0, '09:00', 'Chest pain follow-up', 'Completed'],
  [2, 4, 0, '09:30', 'Child fever', 'Completed'],
  [3, 3, 0, '10:30', 'Knee pain', 'Confirmed'],
  [4, 8, 0, '11:00', 'Routine cardiac check', 'Confirmed'],
  [5, 7, 0, '14:00', 'Headache assessment', 'Scheduled'],
  [6, 3, 0, '15:30', 'Fracture review', 'Scheduled'],
  [7, 5, -1, '10:00', 'Prenatal visit', 'Completed'],
  [8, 1, -1, '11:30', 'General check-up', 'Completed'],
  [9, 6, -1, '09:00', 'Emergency review', 'Cancelled'],
  [10, 4, -2, '10:00', 'Vaccination', 'Completed'],
  [11, 8, -2, '13:00', 'ECG review', 'Completed'],
  [12, 3, -3, '11:00', 'Joint pain', 'Completed'],
  [13, 1, -3, '15:00', 'Blood pressure check', 'Completed'],
  [14, 5, -5, '10:30', 'Prenatal visit', 'Completed'],
  [1, 2, 1, '09:30', 'Follow-up visit', 'Confirmed'],
  [3, 3, 1, '11:00', 'X-ray review', 'Scheduled'],
  [5, 7, 1, '12:00', 'Neurology consultation', 'Scheduled'],
  [2, 1, 2, '10:00', 'Lab results discussion', 'Scheduled'],
  [8, 5, 2, '14:30', 'Antenatal check', 'Confirmed'],
  [10, 8, 3, '09:00', 'Cardiac consult', 'Scheduled'],
  [12, 4, 5, '11:30', 'Immunization', 'Scheduled'],
  [7, 1, 5, '16:00', 'General check-up', 'Scheduled'],
];
export const MOCK_APPOINTMENTS: readonly Appointment[] = APPT_ROWS.map(
  ([p, doc, offset, time, reason, status], i) => ({
    id: `apt-${pad4(i + 1)}`,
    patientId: pid(p),
    doctorId: did(doc),
    departmentId: MOCK_DOCTORS[doc - 1].departmentId,
    date: d(offset),
    time,
    reason,
    status,
  }),
);

// patient#, doctor#, type, title, details, offset
const CLINICAL_ROWS: [number, number, ClinicalRecord['type'], string, string, number][] = [
  [
    1,
    2,
    'Diagnosis',
    'Stable angina',
    'Exertional chest discomfort; ECG reviewed. Lifestyle changes advised.',
    -30,
  ],
  [1, 2, 'Prescription', 'Aspirin 75 mg', 'One tablet daily after food for 30 days.', -30],
  [1, 2, 'Medical note', 'Follow-up plan', 'Review in four weeks with repeat ECG.', -28],
  [
    2,
    4,
    'Diagnosis',
    'Viral fever',
    'Fever for two days, no red-flag symptoms. Hydration advised.',
    -1,
  ],
  [
    3,
    3,
    'Diagnosis',
    'Osteoarthritis (left knee)',
    'Mild joint-space narrowing noted on imaging.',
    -20,
  ],
  [3, 3, 'Prescription', 'Paracetamol 500 mg', 'As needed, maximum four tablets per day.', -20],
  [
    4,
    8,
    'Medical note',
    'Cardiac screening',
    'Blood pressure within target range. Continue current plan.',
    -14,
  ],
  [6, 3, 'Diagnosis', 'Distal radius fracture', 'Cast applied; review after two weeks.', -10],
  [8, 1, 'Medical note', 'Annual check-up', 'No concerns reported. Routine labs requested.', -1],
  [
    11,
    8,
    'Diagnosis',
    'Premature atrial contractions',
    'Holter monitoring completed; benign pattern.',
    -7,
  ],
];
export const MOCK_CLINICAL_RECORDS: readonly ClinicalRecord[] = CLINICAL_ROWS.map(
  ([p, doc, type, title, details, offset], i) => ({
    id: `rec-${pad4(i + 1)}`,
    patientId: pid(p),
    doctorId: did(doc),
    type,
    title,
    details,
    recordedOn: d(offset),
  }),
);
