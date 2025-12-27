export const calculateEMI = (principal, ratePercent, tenureMonths) => {
  const P = parseFloat(principal);
  const r = parseFloat(ratePercent) / (12 * 100); // Monthly interest rate
  const n = parseInt(tenureMonths);

  if (r === 0) {
    return P / n;
  }

  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return emi;
};

export const calculateLoanDetails = (principal, ratePercent, tenureMonths) => {
  const emi = calculateEMI(principal, ratePercent, tenureMonths);
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  return {
    emi: Math.round(emi),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    principal: parseFloat(principal),
    interestRate: parseFloat(ratePercent),
    tenure: parseInt(tenureMonths),
  };
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-NP').format(number);
};
