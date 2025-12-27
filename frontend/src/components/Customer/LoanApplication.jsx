import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCar, FaMoneyBillWave, FaCalendar, FaCalculator } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Navbar from '../Shared/Navbar';
import vehicleService from '../../services/vehicles';
import loanService from '../../services/loans';
import { calculateLoanDetails, formatCurrency } from '../../utils/emiCalculator';
import { EMPLOYMENT_TYPES } from '../../utils/constants';
import getErrorMessage from '../../utils/errorHelper';

const LoanApplication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emiPreview, setEmiPreview] = useState(null);

  const [formData, setFormData] = useState({
    vehicle: '',
    loan_amount: '',
    down_payment: '',
    interest_rate: 12.0,
    tenure_months: 60,
    monthly_income: '',
    employment_type: '',
    employer_name: '',
    customer_remarks: '',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (formData.loan_amount && formData.interest_rate && formData.tenure_months) {
      const details = calculateLoanDetails(
        formData.loan_amount,
        formData.interest_rate,
        formData.tenure_months
      );
      setEmiPreview(details);
    }
  }, [formData.loan_amount, formData.interest_rate, formData.tenure_months]);

  const loadVehicles = async () => {
    try {
      const data = await vehicleService.getAll();
      setVehicles(data.results || data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // Handle pre-selection from Vehicle Browser
  useEffect(() => {
    if (location.state?.selectedVehicle && vehicles.length > 0 && !formData.vehicle) {
      const v = location.state.selectedVehicle;
      // Find matching vehicle in loaded list to ensure valid ID
      const matchingVehicle = vehicles.find(veh => veh.id === v.id);

      if (matchingVehicle) {
        const maxLoan = matchingVehicle.price * ((matchingVehicle.max_loan_percentage || 80) / 100);
        const minDown = matchingVehicle.price - maxLoan;

        setFormData(prev => ({
          ...prev,
          vehicle: matchingVehicle.id,
          loan_amount: maxLoan, // Default to max loan
          down_payment: minDown // Default to min down
        }));
      }
    }
  }, [vehicles, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-calculate down payment (20% minimum)
    if (name === 'vehicle') {
      const selectedVehicle = vehicles.find(v => v.id === value);
      if (selectedVehicle) {
        const minDownPayment = selectedVehicle.price * 0.2;
        const maxLoanAmount = selectedVehicle.price * 0.8;
        setFormData(prev => ({
          ...prev,
          down_payment: minDownPayment,
          loan_amount: maxLoanAmount,
        }));
      }
    }
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (step === 1) {
      // Basic field validation
      if (!formData.vehicle || !formData.loan_amount || !formData.down_payment || !formData.tenure_months || !formData.interest_rate) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Numeric validation
      const loanAmount = parseFloat(formData.loan_amount);
      const downPayment = parseFloat(formData.down_payment);

      if (loanAmount <= 0 || downPayment <= 0) {
        toast.error('Loan amount and down payment must be positive values');
        return;
      }

      // Logic validation against Vehicle
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicle);
      if (selectedVehicle) {
        const price = parseFloat(selectedVehicle.price);
        const maxLoanPercent = selectedVehicle.max_loan_percentage || 80;
        const maxLoan = (price * maxLoanPercent) / 100;
        const minDown = price - maxLoan;

        if (loanAmount > maxLoan) {
          toast.error(`Loan amount cannot exceed ${maxLoanPercent}% of vehicle price (Max: NPR ${maxLoan.toLocaleString()})`);
          return;
        }

        if (downPayment < minDown) {
          toast.error(`Down payment must be at least NPR ${minDown.toLocaleString()} (${100 - maxLoanPercent}% of price)`);
          return;
        }

        // Optional: Integrity check (Loan + Down should roughly cover Price)
        // Ideally Loan + Down == Price. But sometimes user might pay more down payment.
        // So: Loan + Down >= Price
        if (loanAmount + downPayment < price) {
          toast.error(`Total financing (Loan + Down Payment) is less than vehicle price. Missing: NPR ${(price - (loanAmount + downPayment)).toLocaleString()}`);
          return;
        }
      }
    }

    if (step === 2) {
      if (!formData.monthly_income || !formData.employment_type || !formData.employer_name) {
        toast.error('Please fill in all required fields including Employer Name');
        return;
      }

      const income = parseFloat(formData.monthly_income);
      if (income <= 0) {
        toast.error('Monthly income must be a valid positive number');
        return;
      }

      // EMI Affordability Check (Warning)
      if (emiPreview && emiPreview.emi > (income * 0.6)) {
        toast('Warning: Estimated EMI is more than 60% of your monthly income. Approval chance may be low.', {
          icon: '⚠️',
          duration: 5000
        });
      }
    }

    setStep(step + 1);
  };

  const handleBack = (e) => {
    e.preventDefault(); // Prevent form submission
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loanService.create(formData);
      toast.success('Loan application created! Please upload required documents.');

      // Navigate to document upload page
      navigate(`/customer/documents/${response.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicle);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-32 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
              Vehicle & Loan
            </span>
            <span className={step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
              Financial Info
            </span>
            <span className={step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
              Review
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Vehicle Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  <FaCar className="inline mr-2" />
                  Select Vehicle & Loan Details
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Vehicle *
                  </label>
                  <select
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a vehicle...</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} - NPR {vehicle.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedVehicle && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Vehicle Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Brand:</p>
                        <p className="font-medium">{selectedVehicle.brand}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Model:</p>
                        <p className="font-medium">{selectedVehicle.model}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Price:</p>
                        <p className="font-medium">NPR {selectedVehicle.price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Max Loan:</p>
                        <p className="font-medium">{selectedVehicle.max_loan_percentage}%</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Amount (NPR) *
                    </label>
                    <input
                      type="number"
                      name="loan_amount"
                      value={formData.loan_amount}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 1000000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Down Payment (NPR) *
                    </label>
                    <input
                      type="number"
                      name="down_payment"
                      value={formData.down_payment}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 200000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interest Rate (% per annum) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="interest_rate"
                      value={formData.interest_rate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Tenure (months) *
                    </label>
                    <select
                      name="tenure_months"
                      value={formData.tenure_months}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="12">1 Year (12 months)</option>
                      <option value="24">2 Years (24 months)</option>
                      <option value="36">3 Years (36 months)</option>
                      <option value="48">4 Years (48 months)</option>
                      <option value="60">5 Years (60 months)</option>
                      <option value="72">6 Years (72 months)</option>
                      <option value="84">7 Years (84 months)</option>
                    </select>
                  </div>
                </div>

                {/* EMI Preview */}
                {emiPreview && (
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                      <FaCalculator className="mr-2" />
                      EMI Preview
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Monthly EMI</p>
                        <p className="text-xl font-bold text-green-700">
                          {formatCurrency(emiPreview.emi)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Interest</p>
                        <p className="text-lg font-semibold text-gray-700">
                          {formatCurrency(emiPreview.totalInterest)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Payment</p>
                        <p className="text-lg font-semibold text-gray-700">
                          {formatCurrency(emiPreview.totalPayment)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tenure</p>
                        <p className="text-lg font-semibold text-gray-700">
                          {emiPreview.tenure} months
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Financial Information */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  <FaMoneyBillWave className="inline mr-2" />
                  Financial Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Income (NPR) *
                    </label>
                    <input
                      type="number"
                      name="monthly_income"
                      value={formData.monthly_income}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 80000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type *
                    </label>
                    <select
                      name="employment_type"
                      value={formData.employment_type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select employment type...</option>
                      {EMPLOYMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employer/Business Name
                    </label>
                    <input
                      type="text"
                      name="employer_name"
                      value={formData.employer_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Company or business name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Remarks (Optional)
                    </label>
                    <textarea
                      name="customer_remarks"
                      value={formData.customer_remarks}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional information..."
                    />
                  </div>
                </div>

                {/* Income Analysis */}
                {formData.monthly_income && emiPreview && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">
                      Affordability Analysis
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monthly Income:</span>
                        <span className="font-semibold">
                          NPR {parseInt(formData.monthly_income).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly EMI:</span>
                        <span className="font-semibold">
                          {formatCurrency(emiPreview.emi)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>EMI to Income Ratio:</span>
                        <span className={`font-semibold ${(emiPreview.emi / formData.monthly_income) * 100 > 50
                          ? 'text-red-600'
                          : 'text-green-600'
                          }`}>
                          {((emiPreview.emi / formData.monthly_income) * 100).toFixed(1)}%
                        </span>
                      </div>
                      {(emiPreview.emi / formData.monthly_income) * 100 > 50 && (
                        <p className="text-red-600 text-xs mt-2">
                          ⚠️ Warning: EMI exceeds 50% of monthly income. Consider reducing loan amount.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Review Your Application
                </h2>

                <div className="space-y-4">
                  {/* Vehicle Details */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-2">Vehicle Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Vehicle:</p>
                        <p className="font-medium">{selectedVehicle?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Price:</p>
                        <p className="font-medium">
                          NPR {selectedVehicle?.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-2">Loan Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Loan Amount:</p>
                        <p className="font-medium">NPR {parseInt(formData.loan_amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Down Payment:</p>
                        <p className="font-medium">NPR {parseInt(formData.down_payment).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Interest Rate:</p>
                        <p className="font-medium">{formData.interest_rate}% p.a.</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tenure:</p>
                        <p className="font-medium">{formData.tenure_months} months</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-2">Financial Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Monthly Income:</p>
                        <p className="font-medium">NPR {parseInt(formData.monthly_income).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Employment:</p>
                        <p className="font-medium">{formData.employment_type}</p>
                      </div>
                      {formData.employer_name && (
                        <div className="col-span-2">
                          <p className="text-gray-600">Employer:</p>
                          <p className="font-medium">{formData.employer_name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* EMI Summary */}
                  {emiPreview && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">EMI Summary</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Monthly EMI:</p>
                          <p className="text-lg font-bold text-blue-700">
                            {formatCurrency(emiPreview.emi)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Interest:</p>
                          <p className="font-medium">{formatCurrency(emiPreview.totalInterest)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600">Total Amount Payable:</p>
                          <p className="font-medium">{formatCurrency(emiPreview.totalPayment)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg text-sm">
                  <p className="text-yellow-800">
                    <strong>Next Step:</strong> After submitting, you'll be redirected to upload required documents (Citizenship, License, Bank Statement, etc.)
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
              )}

              <div className="ml-auto">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;