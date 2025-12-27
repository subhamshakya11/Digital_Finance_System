import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaRobot, FaChartLine } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Navbar from '../Shared/Navbar';
import loanService from '../../services/loans';
import getErrorMessage from '../../utils/errorHelper';

const LoanApproval = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [aiScore, setAiScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      const data = await loanService.getById(id);
      setApplication(data);

      // Get AI score if not already calculated
      if (!data.credit_score) {
        const scoreData = await loanService.getAIScore(id);
        setAiScore(scoreData);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      navigate('/finance/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await loanService.approve(id);
      toast.success('Loan approved successfully!');
      navigate('/finance/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await loanService.reject(id, rejectionReason);
      toast.success('Loan rejected');
      navigate('/finance/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessing(false);
      setShowRejectModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const creditScore = application.credit_score || aiScore?.credit_score || 0;
  const riskLevel = application.fraud_risk_level || aiScore?.risk_level || 'medium';

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Loan Approval Review</h1>
          <p className="text-gray-600 mt-2">
            Application: <span className="font-semibold">{application.application_number}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Analysis */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaRobot className="mr-2 text-blue-600" />
                AI Analysis
              </h2>

              <div className="space-y-4">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Credit Score</p>
                  <p className={`text-5xl font-bold ${creditScore >= 750 ? 'text-green-600' :
                      creditScore >= 600 ? 'text-yellow-600' :
                        'text-red-600'}`}>
                    {creditScore}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {creditScore >= 750 ? 'Excellent' :
                      creditScore >= 600 ? 'Good' :
                        'Fair'}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${riskLevel === 'high' ? 'bg-red-50' :
                    riskLevel === 'medium' ? 'bg-yellow-50' :
                      'bg-green-50'
                  }`}>
                  <p className="text-sm text-gray-700 font-medium">Fraud Risk Level</p>
                  <p className={`text-lg font-bold ${riskLevel === 'high' ? 'text-red-600' :
                      riskLevel === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                    }`}>
                    {riskLevel.toUpperCase()}
                  </p>
                </div>

                {application.ai_recommendation && (
                  <div className="p-4 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium text-gray-700 mb-2">AI Recommendation:</p>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {application.ai_recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Decision</h3>
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  <FaCheckCircle className="mr-2" />
                  Approve Loan
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                  className="w-full flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  <FaTimesCircle className="mr-2" />
                  Reject Loan
                </button>
                <button
                  onClick={() => navigate('/finance/dashboard')}
                  className="w-full px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="font-medium">{application.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Monthly Income</p>
                  <p className="font-medium">NPR {application.monthly_income?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Employment Type</p>
                  <p className="font-medium">{application.employment_type}</p>
                </div>
                <div>
                  <p className="text-gray-600">Employer</p>
                  <p className="font-medium">{application.employer_name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Loan Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Vehicle</p>
                  <p className="font-medium">{application.vehicle_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Loan Amount</p>
                  <p className="font-medium">NPR {application.loan_amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Down Payment</p>
                  <p className="font-medium">NPR {application.down_payment?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Interest Rate</p>
                  <p className="font-medium">{application.interest_rate}% p.a.</p>
                </div>
                <div>
                  <p className="text-gray-600">Tenure</p>
                  <p className="font-medium">{application.tenure_months} months</p>
                </div>
                <div>
                  <p className="text-gray-600">Monthly EMI</p>
                  <p className="font-medium text-lg text-blue-600">
                    NPR {application.monthly_emi?.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">EMI to Income Ratio</span>
                  <span className={`font-bold text-lg ${(application.monthly_emi / application.monthly_income) * 100 > 50
                      ? 'text-red-600'
                      : 'text-green-600'
                    }`}>
                    {((application.monthly_emi / application.monthly_income) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>
              <div className="space-y-2">
                {application.documents?.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <span className="text-sm">{doc.document_type}</span>
                    <span className={`text-xs px-2 py-1 rounded ${doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Reject Loan Application</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejection:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Enter rejection reason..."
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanApproval;