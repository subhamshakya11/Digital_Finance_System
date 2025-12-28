import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCar, FaFileAlt, FaMoneyBillWave, FaBell, FaPlus, FaChartLine, FaClock, FaCheckCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import authService from '../../services/auth';
import loanService from '../../services/loans';
import dashboardService from '../../services/dashboard';
import kycService from '../../services/kyc';
import Navbar from '../Shared/Navbar';
import ChatWidget from '../Chatbot/ChatWidget'; // Chat integration

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [kycDetails, setKycDetails] = useState(null);
  const user = authService.getCurrentUser();

  useEffect(() => {
    loadDashboardData();
    checkKYCStatus();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, loansData] = await Promise.all([
        dashboardService.getStats(),
        loanService.getAll()
      ]);
      setStats(statsData);
      setLoans(loansData.results || loansData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkKYCStatus = async () => {
    try {
      const status = await kycService.checkStatus();
      setKycStatus(status);

      // Show modal if KYC is not verified
      if (status.kyc_status !== 'verified') {
        setShowKycModal(true);
      }

      // Load details if under review or verified
      if (status.kyc_status !== 'incomplete') {
        const details = await kycService.getMyKYC();
        setKycDetails(details);
      }
    } catch (error) {
      console.error('Error checking KYC status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: 'from-green-500 to-emerald-500',
      rejected: 'from-red-500 to-rose-500',
      submitted: 'from-blue-500 to-indigo-500',
      under_review: 'from-yellow-500 to-orange-500',
    };
    return colors[status] || 'from-gray-500 to-gray-600';
  };

  const getStatusIcon = (status) => {
    const icons = {
      approved: <FaCheckCircle className="text-green-500" />,
      rejected: <FaCheckCircle className="text-red-500" />,
      submitted: <FaClock className="text-blue-500" />,
      under_review: <FaClock className="text-yellow-500" />,
    };
    return icons[status] || <FaClock className="text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-primary rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-white/80">Welcome back</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Hello, {user.first_name || user.username}! 👋
            </h1>
            <p className="text-white/90 mb-4">
              Manage your vehicle loans and track your applications
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/customer/apply-loan"
                className="inline-flex items-center px-6 py-3 bg-white text-primary-600 rounded-xl font-semibold hover:shadow-glow-lg transition-all"
              >
                <FaPlus className="mr-2" />
                Apply New Loan
              </Link>
              <Link
                to="/customer/vehicles"
                className="inline-flex items-center px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-all backdrop-blur-sm"
              >
                <FaCar className="mr-2" />
                Browse Vehicles
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="stat-card group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaFileAlt className="text-white text-xl" />
              </div>
              <FaChartLine className="text-gray-300 text-2xl" />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Applications</p>
            <p className="text-3xl font-bold text-gray-800 mb-2">{stats.total_applications || 0}</p>
            <div className="flex items-center text-xs text-green-600">
              <span className="mr-1">↗</span>
              <span>All time</span>
            </div>
          </div>

          <div className="stat-card group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-success rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaCar className="text-white text-xl" />
              </div>
              <FaCheckCircle className="text-gray-300 text-2xl" />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Approved Loans</p>
            <p className="text-3xl font-bold text-gray-800 mb-2">{stats.approved_loans || 0}</p>
            <div className="flex items-center text-xs text-green-600">
              <span className="mr-1">✓</span>
              <span>Active</span>
            </div>
          </div>

          <div className="stat-card group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-warning rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaClock className="text-white text-xl" />
              </div>
              <FaBell className="text-gray-300 text-2xl" />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Pending</p>
            <p className="text-3xl font-bold text-gray-800 mb-2">{stats.pending_applications || 0}</p>
            <div className="flex items-center text-xs text-yellow-600">
              <span className="mr-1">⏳</span>
              <span>In review</span>
            </div>
          </div>

          <div className="stat-card group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaMoneyBillWave className="text-white text-xl" />
              </div>
              <FaMoneyBillWave className="text-gray-300 text-2xl" />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">EMI Paid</p>
            <p className="text-3xl font-bold text-gray-800 mb-2">{stats.total_emi_paid || 0}</p>
            <div className="flex items-center text-xs text-purple-600">
              <span className="mr-1">💰</span>
              <span>Payments</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="w-1 h-6 bg-gradient-primary rounded-full mr-3"></span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/customer/apply-loan"
              className="group p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FaPlus className="text-white text-xl" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Apply for Loan</h3>
              <p className="text-sm text-gray-600">Start your vehicle financing journey</p>
            </Link>

            <Link
              to="/customer/vehicles"
              className="group p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-gradient-success rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FaCar className="text-white text-xl" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Browse Vehicles</h3>
              <p className="text-sm text-gray-600">Explore available vehicles</p>
            </Link>

            <Link
              to="/customer/emi-tracker"
              className="group p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FaMoneyBillWave className="text-white text-xl" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Track EMI</h3>
              <p className="text-sm text-gray-600">View payment schedule</p>
            </Link>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="glass rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="w-1 h-6 bg-gradient-primary rounded-full mr-3"></span>
              Recent Applications
            </h2>
            {loans.length > 0 && (
              <Link to="/customer/applications" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                View All →
              </Link>
            )}
          </div>

          {loans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaFileAlt className="text-4xl text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No applications yet</h3>
              <p className="text-gray-600 mb-4">Start your journey by applying for your first vehicle loan</p>
              <Link
                to="/customer/apply-loan"
                className="inline-flex items-center px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-glow transition-all"
              >
                <FaPlus className="mr-2" />
                Apply Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.slice(0, 5).map((loan) => (
                <div
                  key={loan.id}
                  className="group p-4 border border-gray-200 rounded-xl hover:shadow-lg hover:border-primary-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(loan.status)}
                        <div>
                          <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                            {loan.application_number}
                          </h3>
                          <p className="text-sm text-gray-600">{loan.vehicle_name}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm mt-3">
                        <div>
                          <span className="text-gray-500">Loan Amount:</span>
                          <span className="font-semibold text-gray-800 ml-1">
                            NPR {loan.loan_amount?.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Monthly EMI:</span>
                          <span className="font-semibold text-gray-800 ml-1">
                            NPR {loan.monthly_emi?.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Applied:</span>
                          <span className="font-semibold text-gray-800 ml-1">
                            {new Date(loan.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-4 py-2 bg-gradient-to-r ${getStatusColor(loan.status)} text-white rounded-xl text-sm font-semibold shadow-md`}>
                      {loan.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KYC Verification Modal */}
      {showKycModal && kycStatus && kycStatus.kyc_status !== 'verified' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
            <button
              onClick={() => setShowKycModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="text-3xl text-yellow-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                KYC Verification Required
              </h2>

              <p className="text-gray-600 mb-6">
                {kycStatus.kyc_status === 'incomplete' &&
                  'Please complete your KYC verification to apply for loans and access all features.'}
                {kycStatus.kyc_status === 'pending' &&
                  'Your KYC is under review. You will be notified once it is verified.'}
                {kycStatus.kyc_status === 'rejected' && (
                  <div className="space-y-2">
                    <p className="text-gray-600 font-medium italic">" {kycStatus.rejection_reason || 'No reason provided.'} "</p>
                    <p className="text-gray-600">Please update your information and resubmit.</p>
                  </div>
                )}
              </p>

              <div className="space-y-3">
                {(kycStatus.kyc_status === 'incomplete' || kycStatus.kyc_status === 'rejected') && (
                  <button
                    onClick={() => navigate('/customer/kyc')}
                    className="w-full px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-glow transition-all"
                  >
                    Complete KYC Now
                  </button>
                )}

                <button
                  onClick={() => setShowKycModal(false)}
                  className="w-full px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  {kycStatus.kyc_status === 'pending' ? 'Close' : 'Maybe Later'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Details Modal */}
      {showDetailsModal && kycDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative animate-scale-in">
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full"
            >
              <FaTimes size={18} />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Submitted KYC Details</h2>
              <p className="text-sm text-gray-500">Provided for verification on {new Date(kycDetails.updated_at).toLocaleDateString()}</p>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Full Name</p>
                    <p className="font-medium text-gray-800">{kycDetails.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Gender</p>
                    <p className="font-medium text-gray-800 capitalize">{kycDetails.gender}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Citizenship No.</p>
                    <p className="font-medium text-gray-800">{kycDetails.citizenship_number}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Occupation</p>
                    <p className="font-medium text-gray-800">{kycDetails.occupation}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Permanent Address</h3>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="font-medium text-gray-800">{kycDetails.permanent_address}</p>
                  <p className="text-sm text-gray-500">{kycDetails.permanent_district}, {kycDetails.permanent_province}</p>
                </div>
              </section>

              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex items-start">
                <FaClock className="text-yellow-600 mt-1 mr-3 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  This information is currently <strong>Under Review</strong>. You cannot edit these details until the review is complete or rejected.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="w-full mt-8 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Chat widget appears after login */}
      <ChatWidget />
    </div>
  );
};

export default CustomerDashboard;
