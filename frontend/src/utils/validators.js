export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[0-9]{10}$/;
  return re.test(phone);
};

export const validateCitizenship = (citizenship) => {
  // Basic validation for Nepal citizenship number format
  const re = /^\d{2}-\d{2}-\d{2}-\d{5}$/;
  return re.test(citizenship);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8;
};

export const validateLoanAmount = (amount, vehiclePrice) => {
  const minAmount = 50000;
  const maxAmount = vehiclePrice * 0.8; // Maximum 80% of vehicle price
  
  return amount >= minAmount && amount <= maxAmount;
};

export const validateDownPayment = (downPayment, vehiclePrice) => {
  const minDownPayment = vehiclePrice * 0.2; // Minimum 20%
  return downPayment >= minDownPayment;
};
