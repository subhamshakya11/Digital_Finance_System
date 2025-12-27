export const USER_TYPES = {
  CUSTOMER: 'customer',
  SALES_REP: 'sales_rep',
  FINANCE_MANAGER: 'finance_manager',
  ADMIN: 'admin',
};

export const LOAN_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  DOCUMENTS_VERIFIED: 'documents_verified',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DISBURSED: 'disbursed',
};

export const DOCUMENT_TYPES = [
  { value: 'citizenship', label: 'Citizenship Certificate', mandatory: true },
  { value: 'license', label: 'Driving License', mandatory: true },
  { value: 'bank_statement', label: 'Bank Statement', mandatory: true },
  { value: 'salary_slip', label: 'Salary Slip', mandatory: true },
  { value: 'pan', label: 'PAN Card', mandatory: false },
  { value: 'passport_photo', label: 'Passport Size Photos', mandatory: false },
  { value: 'tax_clearance', label: 'Tax Clearance Certificate', mandatory: false },
  { value: 'passport', label: 'Passport', mandatory: false },
  { value: 'other', label: 'Other', mandatory: false },
];

export const VEHICLE_TYPES = [
  { value: 'two_wheeler', label: 'Two Wheeler (Bike/Scooter)' },
  { value: 'three_wheeler', label: 'Three Wheeler (Auto/Rickshaw)' },
  { value: 'car', label: 'Car (Sedan/Hatchback)' },
  { value: 'suv', label: 'SUV/Jeep' },
  { value: 'van', label: 'Van/Microbus' },
  { value: 'truck', label: 'Truck' },
  { value: 'bus', label: 'Bus' },
];

export const EMPLOYMENT_TYPES = [
  'Government Employee',
  'Private Company',
  'Business Owner',
  'Self Employed',
  'Freelancer',
  'Other',
];

export const FUEL_TYPES = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const PAYMENT_METHODS = [
  { value: 'esewa', label: 'eSewa' },
  { value: 'khalti', label: 'Khalti' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
];

export const STATUS_COLORS = {
  [LOAN_STATUS.DRAFT]: 'gray',
  [LOAN_STATUS.SUBMITTED]: 'blue',
  [LOAN_STATUS.UNDER_REVIEW]: 'yellow',
  [LOAN_STATUS.DOCUMENTS_VERIFIED]: 'purple',
  [LOAN_STATUS.APPROVED]: 'green',
  [LOAN_STATUS.REJECTED]: 'red',
  [LOAN_STATUS.DISBURSED]: 'green',
};