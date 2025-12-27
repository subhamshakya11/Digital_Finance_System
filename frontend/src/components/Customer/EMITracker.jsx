import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCheckCircle, FaClock, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Navbar from '../Shared/Navbar';
import loanService from '../../services/loans';
import paymentService from '../../services/payments';
import { formatCurrency } from '../../utils/emiCalculator';
import getErrorMessage from '../../utils/errorHelper';

const EMITracker = () => {
  const [emiSchedules, setEmiSchedules] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEMI, setSelectedEMI] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'cash',
    transaction_id: '',
    amount: '',
    remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    if (selectedLoan) {
      loadEMISchedules();
    }
  }, [selectedLoan]);

  const loadLoans = async () => {
    try {
      const data = await loanService.getAll();
      const approvedLoans = (data.results || data).filter(
        loan => loan.status === 'approved' || loan.status === 'disbursed'
      );
      setLoans(approvedLoans);
      if (approvedLoans.length > 0) {
        setSelectedLoan(approvedLoans[0].id);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadEMISchedules = async () => {
    try {
      const data = await loanService.getEMISchedules(selectedLoan);
      const schedules = data.results || data;
      setEmiSchedules(schedules);

      // Calculate stats using the extracted array, not the raw data object
      const total = schedules.length;
      const paid = schedules.filter(e => e.status === 'paid').length;
      const overdue = schedules.filter(e => e.status === 'overdue').length;
      const pending = schedules.filter(e => e.status === 'pending').length;

      setStats({ total, paid, pending, overdue });
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <FaCheckCircle className="text-green-500" />;
      case 'overdue':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaClock className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'paid') return false;
    return new Date(dueDate) < new Date();
  };

  const handlePaymentClick = (emi) => {
    setSelectedEMI(emi);
    setPaymentForm({
      payment_method: 'cash',
      transaction_id: `TXN${Date.now()}`,
      amount: emi.emi_amount,
      remarks: '',
    });
    setShowPaymentModal(true);
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm({ ...paymentForm, [name]: value });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const paymentData = {
        emi_schedule: selectedEMI.id,
        payment_method: paymentForm.payment_method,
        transaction_id: paymentForm.transaction_id,
        amount: paymentForm.amount,
        remarks: paymentForm.remarks,
      };

      await paymentService.createPayment(paymentData);
      toast.success('Payment recorded successfully!');
      setShowPaymentModal(false);
      setSelectedEMI(null);
      loadEMISchedules(); // Refresh the EMI schedules
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <FaMoneyBillWave className="text-6xl text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Approved Loans</h2>
            <p className="text-gray-600">You don't have any approved loans yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedLoanData = loans.find(l => l.id === selectedLoan);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">EMI Tracker</h1>
          <p className="text-gray-600 mt-2">Track your monthly installments and payment history</p>
        </div>

        {/* Loan Selector */}
        {loans.length > 1 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Loan Application
            </label>
            <select
              value={selectedLoan}
              onChange={(e) => setSelectedLoan(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {loans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.application_number} - {loan.vehicle_name} (NPR {loan.loan_amount?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total EMIs</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <FaMoneyBillWave className="text-4xl text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Paid</p>
                <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <FaCheckCircle className="text-4xl text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <FaClock className="text-4xl text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <FaExclamationTriangle className="text-4xl text-red-600" />
            </div>
          </div>
        </div>

        {/* Loan Summary */}
        {selectedLoanData && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Loan Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Application No.</p>
                <p className="font-medium">{selectedLoanData.application_number}</p>
              </div>
              <div>
                <p className="text-gray-600">Loan Amount</p>
                <p className="font-medium">NPR {selectedLoanData.loan_amount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Monthly EMI</p>
                <p className="font-medium">NPR {selectedLoanData.monthly_emi?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Tenure</p>
                <p className="font-medium">{selectedLoanData.tenure_months} months</p>
              </div>
            </div>
          </div>
        )}

        {/* EMI Schedule Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">EMI Schedule</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EMI No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EMI Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emiSchedules.map((emi) => (
                  <tr key={emi.id} className={isOverdue(emi.due_date, emi.status) ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(emi.status)}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          #{emi.emi_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(emi.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(emi.emi_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(emi.principal_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(emi.interest_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(emi.remaining_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(emi.status)}`}>
                        {emi.status.toUpperCase()}
                      </span>
                      {emi.paid_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Paid: {new Date(emi.paid_date).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {emi.status !== 'paid' && (
                        <button
                          onClick={() => handlePaymentClick(emi)}
                          className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg transition font-medium"
                        >
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
          <p className="font-semibold mb-2">Payment Methods:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Online: eSewa, Khalti (Coming Soon)</li>
            <li>Bank Transfer: Contact support for bank details</li>
            <li>Cash: Visit nearest branch</li>
          </ul>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedEMI && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Make Payment</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">EMI #{selectedEMI.emi_number}</p>
                <p className="text-lg font-semibold text-gray-800">
                  Amount: {formatCurrency(selectedEMI.emi_amount)}
                </p>
                <p className="text-sm text-gray-600">
                  Due Date: {new Date(selectedEMI.due_date).toLocaleDateString()}
                </p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="payment_method"
                    value={paymentForm.payment_method}
                    onChange={handlePaymentFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="esewa">eSewa</option>
                    <option value="khalti">Khalti</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    name="transaction_id"
                    value={paymentForm.transaction_id}
                    onChange={handlePaymentFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Enter transaction ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (NPR)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={paymentForm.amount}
                    onChange={handlePaymentFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <textarea
                    name="remarks"
                    value={paymentForm.remarks}
                    onChange={handlePaymentFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Add any notes about this payment"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : 'Submit Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EMITracker;