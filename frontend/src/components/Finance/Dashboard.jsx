import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaClock, FaRobot } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Navbar from '../Shared/Navbar';
import loanService from '../../services/loans';
import dashboardService from '../../services/dashboard';

const FinanceDashboard = () => {
  const [stats, setStats] = useState({});
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, loansData] = await Promise.all([
        dashboardService.getStats(),
        loanService.getAll()
      ]);
      setStats(statsData);
      
      // Filter applications needing approval
      const pendingApproval = (loansData.results || loansData).filter(
        loan => loan.status === 'documents_verified' || loan.status === 'under_review'
      );
      setApplications(pendingApproval);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCreditScoreColor = (score) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 600) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Finance Manager Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Review and approve loan applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {applications.length}
                </p>
              </div>
              <FaClock className="text-4xl text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Approved Today</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.approved_today || 0}
                </p>
              </div>
              <FaCheckCircle className="text-4xl text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Rejected</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.rejected_count || 0}
                </p>
              </div>
              <FaTimesCircle className="text-4xl text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Applications</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.total_applications || 0}
                </p>
              </div>
              <FaRobot className="text-4xl text-blue-600" />
            </div>
          </div>
        </div>

        {/* Applications Pending Approval */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              Applications Pending Approval
            </h2>
          </div>
          
          <div className="p-6">
            {applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaCheckCircle className="text-6xl mx-auto mb-4 opacity-50" />
                <p>No applications pending approval</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((loan) => (
                  <div
                    key={loan.id}
                    className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {loan.application_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {loan.customer_name} • {loan.vehicle_name}
                        </p>
                      </div>
                      {loan.credit_score && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">AI Credit Score</p>
                          <p className={`text-2xl font-bold ${getCreditScoreColor(loan.credit_score)}`}>
                            {loan.credit_score}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600">Loan Amount</p>
                        <p className="font-medium">NPR {loan.loan_amount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Monthly EMI</p>
                        <p className="font-medium">NPR {loan.monthly_emi?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Monthly Income</p>
                        <p className="font-medium">NPR {loan.monthly_income?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">EMI/Income Ratio</p>
                        <p className="font-medium">
                          {((loan.monthly_emi / loan.monthly_income) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {loan.fraud_risk_level && (
                      <div className={`p-3 rounded mb-4 ${
                        loan.fraud_risk_level === 'high' ? 'bg-red-50 text-red-800' :
                        loan.fraud_risk_level === 'medium' ? 'bg-yellow-50 text-yellow-800' :
                        'bg-green-50 text-green-800'
                      }`}>
                        <p className="text-sm font-medium">
                          Fraud Risk: {loan.fraud_risk_level.toUpperCase()}
                        </p>
                      </div>
                    )}

                    <Link
                      to={`/finance/approve/${loan.id}`}
                      className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Review Application →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;