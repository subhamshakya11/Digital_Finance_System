import React, { useState, useEffect } from 'react';
import { FaUsers, FaCar, FaFileAlt, FaChartLine, FaUserPlus, FaTrash, FaEye, FaIdCard, FaCheck, FaBan, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Navbar from '../Shared/Navbar';
import dashboardService from '../../services/dashboard';
import loanService from '../../services/loans';
import vehicleService from '../../services/vehicles';
import userService from '../../services/users';
import kycService from '../../services/kyc';
import getErrorMessage from '../../utils/errorHelper';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [loans, setLoans] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [kycProfiles, setKycProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState(null);

  // New User Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'sales_rep',
    phone: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, loansData, vehiclesData, usersData, kycData] = await Promise.all([
        dashboardService.getStats(),
        loanService.getAll(),
        vehicleService.getAll(),
        userService.getAll(),
        kycService.getAllKYC().catch(() => ({ results: [] }))
      ]);
      setStats(statsData);
      setLoans(loansData.results || loansData);
      setVehicles(vehiclesData.results || vehiclesData);
      setUsers(usersData.results || usersData);
      setKycProfiles((kycData.results || kycData || []).filter(k => k.status === 'pending'));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await userService.create(newUser);
      toast.success('User created successfully');
      setShowAddModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        user_type: 'sales_rep',
        phone: ''
      });
      // Refresh user list
      const usersData = await userService.getAll();
      setUsers(usersData.results || usersData);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.delete(id);
      toast.success('User deleted');
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleViewKYC = (kyc) => {
    setSelectedKYC(kyc);
    setShowKYCModal(true);
  };

  const handleVerifyKYC = async (kycId, action, reason = '') => {
    try {
      await kycService.verifyKYC(kycId, action, reason);
      toast.success(`KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowKYCModal(false);
      setSelectedKYC(null);
      loadDashboardData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // Calculate monthly data for chart
  const getMonthlyData = () => {
    const monthlyData = {};
    loans.forEach(loan => {
      const month = new Date(loan.created_at).toLocaleString('default', { month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { name: month, applications: 0, approved: 0 };
      }
      monthlyData[month].applications += 1;
      if (loan.status === 'approved') {
        monthlyData[month].approved += 1;
      }
    });
    return Object.values(monthlyData);
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Complete system overview and management</p>
          </div>
          <div className="flex bg-white rounded-lg p-1 shadow">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-4 py-2 rounded-md ${activeTab === 'vehicles' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Vehicles
            </button>
            <button
              onClick={() => setActiveTab('kyc')}
              className={`px-4 py-2 rounded-md ${activeTab === 'kyc' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              KYC Verification
              {kycProfiles.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                  {kycProfiles.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-md ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Users
            </button>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Customers</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {stats.total_customers || 0}
                    </p>
                  </div>
                  <FaUsers className="text-4xl text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Vehicles</p>
                    <p className="text-3xl font-bold text-green-600">
                      {vehicles.length}
                    </p>
                  </div>
                  <FaCar className="text-4xl text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Applications</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {stats.total_applications || loans.length}
                    </p>
                  </div>
                  <FaFileAlt className="text-4xl text-purple-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Users with Loans</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {stats.users_with_loans || 0}
                    </p>
                  </div>
                  <FaFileAlt className="text-4xl text-yellow-500 opacity-20" />
                </div>
              </div>
            </div>

            {/* KYC Breakdown Cards */}
            <h3 className="text-lg font-bold text-gray-700 mb-4">KYC Status Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-4 border-b-2 border-green-500">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Verified</p>
                <p className="text-2xl font-black text-green-600">{stats.kyc_breakdown?.verified || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-b-2 border-orange-500">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Pending</p>
                <p className="text-2xl font-black text-orange-600">{stats.kyc_breakdown?.pending || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-b-2 border-red-500">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Rejected</p>
                <p className="text-2xl font-black text-red-600">{stats.kyc_breakdown?.rejected || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-b-2 border-gray-400">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Incomplete</p>
                <p className="text-2xl font-black text-gray-600">{stats.kyc_breakdown?.incomplete || 0}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Monthly Applications</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getMonthlyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Application Status</h2>
                <div className="space-y-4">
                  {['submitted', 'under_review', 'documents_verified', 'approved', 'rejected'].map(status => {
                    const count = loans.filter(l => l.status === status).length;
                    const percentage = loans.length > 0 ? (count / loans.length) * 100 : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                          <span className="text-sm font-medium">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${status === 'approved' ? 'bg-green-600' :
                              status === 'rejected' ? 'bg-red-600' :
                                'bg-blue-600'
                              }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Applications Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Recent Applications</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">App No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer & KYC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EMI / Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loans.slice(0, 5).map((loan) => (
                      <tr key={loan.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loan.application_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{loan.customer_name}</div>
                          <div className={`text-xs font-semibold ${loan.customer_kyc_status === 'verified' ? 'text-green-600' :
                            loan.customer_kyc_status === 'rejected' ? 'text-red-600' :
                              'text-orange-500'
                            }`}>
                            KYC: {loan.customer_kyc_status?.toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loan.vehicle_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">NPR {loan.monthly_emi?.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{loan.interest_rate}% p.a. / {loan.tenure_months}m</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                            loan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                            {loan.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(loan.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === 'vehicles' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Vehicle Fleet & Specs</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type / Fuel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tech Specs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{vehicle.name}</div>
                        <div className="text-xs text-gray-500">{vehicle.brand} {vehicle.model} ({vehicle.year})</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{vehicle.vehicle_type}</div>
                        <div className="text-xs text-gray-500 capitalize">{vehicle.fuel_type} ({vehicle.fuel_system})</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Engine:</span> {vehicle.engine_capacity}cc / {vehicle.horsepower} bhp
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Mileage:</span> {vehicle.mileage} km/l | <span className="font-medium">Top:</span> {vehicle.top_speed} km/h
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        NPR {vehicle.price?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${vehicle.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {vehicle.is_available ? 'Available' : 'Sold/Unavailable'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'kyc' ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">KYC Profiles Pending Verification</h2>
            </div>
            <div className="p-6">
              {kycProfiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaIdCard className="text-6xl mx-auto mb-4 opacity-50" />
                  <p>No KYC profiles pending verification</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Citizenship</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {kycProfiles.map((kyc) => (
                        <tr key={kyc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{kyc.full_name}</div>
                            <div className="text-xs text-gray-500">{kyc.user_name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{kyc.citizenship_number}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(kyc.submitted_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewKYC(kyc)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1 font-medium"
                            >
                              <FaEye /> Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
              >
                <FaUserPlus className="mr-2" />
                Add New User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.user_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.user_type === 'finance_manager' ? 'bg-blue-100 text-blue-800' :
                            user.user_type === 'sales_rep' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {user.user_type.toUpperCase().replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.kyc_status === 'verified' ? 'bg-green-100 text-green-800' :
                          user.kyc_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                          {user.kyc_status?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-xl font-bold mb-4">Create Staff User</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Username"
                    className="w-full p-2 border rounded"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-2 border rounded"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-2 border rounded"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    className="w-full p-2 border rounded"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="First Name"
                    className="w-full p-2 border rounded"
                    required
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="w-full p-2 border rounded"
                    required
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  />
                  <select
                    className="w-full p-2 border rounded"
                    value={newUser.user_type}
                    onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value })}
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="finance_manager">Finance Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* KYC Review Modal */}
        {showKYCModal && selectedKYC && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                onClick={() => setShowKYCModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={24} />
              </button>

              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FaIdCard className="mr-3 text-blue-600" />
                KYC Verification: {selectedKYC.full_name}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700 border-b pb-2 uppercase text-xs tracking-wider">Personal Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 italic">Father's Name</p>
                      <p className="font-medium">{selectedKYC.father_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 italic">Mother's Name</p>
                      <p className="font-medium">{selectedKYC.mother_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 italic">Date of Birth</p>
                      <p className="font-medium">{selectedKYC.date_of_birth}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 italic">Gender</p>
                      <p className="font-medium capitalize">{selectedKYC.gender}</p>
                    </div>
                  </div>
                </div>

                {/* Identification */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700 border-b pb-2 uppercase text-xs tracking-wider">Identification</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 italic">Citizenship No.</p>
                      <p className="font-medium">{selectedKYC.citizenship_number}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 italic">Issue Date</p>
                      <p className="font-medium">{selectedKYC.citizenship_issue_date}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 italic">Issue District</p>
                      <p className="font-medium">{selectedKYC.citizenship_issue_district}</p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-bold text-gray-700 border-b pb-2 uppercase text-xs tracking-wider">Address & Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <p className="text-gray-500 italic">Permanent Address</p>
                      <p className="font-medium">{selectedKYC.permanent_address}, {selectedKYC.permanent_district}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 italic">Phone</p>
                      <p className="font-medium">{selectedKYC.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 italic">Email</p>
                      <p className="font-medium">{selectedKYC.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-700 border-b pb-2 uppercase text-xs tracking-wider mb-4">Verification Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedKYC.documents?.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-gray-50">
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase truncate">{doc.document_type.replace(/_/g, ' ')}</p>
                      <a
                        href={doc.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center p-4 bg-white border border-dashed rounded h-32 text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <FaEye className="mr-2" /> View Document
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col md:flex-row gap-4 border-t pt-6">
                <button
                  onClick={() => handleVerifyKYC(selectedKYC.id, 'approve')}
                  className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <FaCheck /> Approve KYC
                </button>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Reason for rejection..."
                    id="rejection_reason"
                    className="flex-1 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={() => {
                      const reason = document.getElementById('rejection_reason').value;
                      if (!reason) return toast.error('Please provide a rejection reason');
                      handleVerifyKYC(selectedKYC.id, 'reject', reason);
                    }}
                    className="bg-red-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                    <FaBan /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;