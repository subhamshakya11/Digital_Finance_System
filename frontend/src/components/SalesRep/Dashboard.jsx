import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../Shared/Navbar';
import loanService from '../../services/loans';
import dashboardService from '../../services/dashboard';
import vehicleService from '../../services/vehicles';
import { FaFileAlt, FaCheckCircle, FaClock, FaEye, FaTrash, FaTimes, FaEdit } from 'react-icons/fa';
import getErrorMessage from '../../utils/errorHelper';

const SalesRepDashboard = () => {
  const [stats, setStats] = useState({});
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications');
  const [vehicles, setVehicles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    vehicle_type: 'car',
    fuel_type: 'petrol',
    price: '',
    max_loan_percentage: 80,
    description: '',
    is_available: true
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, loansData, vehiclesData] = await Promise.all([
        dashboardService.getStats(),
        loanService.getAll(),
        vehicleService.getAll()
      ]);
      setStats(statsData);
      setVehicles(vehiclesData.results || vehiclesData);

      const pendingVerification = (loansData.results || loansData).filter(
        loan => loan.status === 'submitted' || loan.status === 'under_review'
      );
      setApplications(pendingVerification);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(newVehicle).forEach(key => {
        formData.append(key, newVehicle[key]);
      });

      await vehicleService.create(formData);
      toast.success('Vehicle added successfully');
      setShowAddModal(false);
      setNewVehicle({
        name: '', brand: '', model: '', year: new Date().getFullYear(),
        vehicle_type: 'car', fuel_type: 'petrol', price: '',
        max_loan_percentage: 80, description: ''
      });
      loadDashboardData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(editingVehicle).forEach(key => {
        // Only append if value exists and isn't the image (unless new image uploaded)
        if (key === 'image' && !(editingVehicle[key] instanceof File)) {
          return;
        }
        formData.append(key, editingVehicle[key]);
      });

      await vehicleService.update(editingVehicle.id, formData);
      toast.success('Vehicle updated successfully');
      setShowEditModal(false);
      setEditingVehicle(null);
      loadDashboardData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEditClick = (vehicle) => {
    setEditingVehicle({ ...vehicle });
    setShowEditModal(true);
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      await vehicleService.delete(id);
      toast.success('Vehicle deleted');
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (error) {
      toast.error('Failed to delete vehicle');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      documents_verified: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
            <h1 className="text-3xl font-bold text-gray-800">
              Sales Representative Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Verify documents and manage vehicles</p>
          </div>
          <div className="flex bg-white rounded-lg p-1 shadow">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'applications' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'vehicles' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Vehicles
            </button>
          </div>
        </div>

        {activeTab === 'applications' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Pending Verification</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {stats.pending_tasks || applications.length}
                    </p>
                  </div>
                  <FaClock className="text-4xl text-yellow-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Verified Today</p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.verified_today || 0}
                    </p>
                  </div>
                  <FaCheckCircle className="text-4xl text-green-600" />
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
                  <FaFileAlt className="text-4xl text-blue-600" />
                </div>
              </div>
            </div>

            {/* Pending Verifications */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">
                  Applications Pending Verification
                </h2>
              </div>

              <div className="p-6">
                {applications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaCheckCircle className="text-6xl mx-auto mb-4 opacity-50" />
                    <p>No applications pending verification</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((loan) => (
                      <div
                        key={loan.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="font-semibold text-lg text-gray-800">
                              {loan.application_number}
                            </h3>
                            <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                              {loan.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Customer</p>
                              <p className="font-medium">{loan.customer_name}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Vehicle</p>
                              <p className="font-medium">{loan.vehicle_name}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Loan Amount</p>
                              <p className="font-medium">NPR {loan.loan_amount?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Documents</p>
                              <p className="font-medium">{loan.documents?.length || 0} uploaded</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Submitted: {new Date(loan.submitted_at || loan.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Link
                          to={`/sales/verify/${loan.id}`}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <FaEye className="mr-2" />
                          Verify
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Vehicle Inventory</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add New Vehicle
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 font-semibold">Vehicle</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Price</th>
                      <th className="pb-3 font-semibold">Max Loan</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {vehicles.map(vehicle => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="py-4">
                          <div className="font-medium">{vehicle.name}</div>
                          <div className="text-sm text-gray-500">{vehicle.brand} {vehicle.model} ({vehicle.year})</div>
                        </td>
                        <td className="py-4 capitalize">{vehicle.vehicle_type.replace('_', ' ')}</td>
                        <td className="py-4">NPR {parseFloat(vehicle.price).toLocaleString()}</td>
                        <td className="py-4">{vehicle.max_loan_percentage}%</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicle.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {vehicle.is_available ? 'Available' : 'Sold Out'}
                          </span>
                        </td>
                        <td className="py-4 space-x-3">
                          <button
                            onClick={() => handleEditClick(vehicle)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Vehicle"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Vehicle"
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
          </div>
        )}

        {/* Add Vehicle Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
                title="Close"
              >
                <FaTimes size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-4">Add New Vehicle</h2>
              <form onSubmit={handleCreateVehicle} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded"
                      value={newVehicle.name}
                      onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded"
                      value={newVehicle.brand}
                      onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded"
                      value={newVehicle.model}
                      onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="number"
                      required
                      className="w-full p-2 border rounded"
                      value={newVehicle.year}
                      onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newVehicle.vehicle_type}
                      onChange={e => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })}
                    >
                      <option value="two_wheeler">Two Wheeler</option>
                      <option value="car">Car (Sedan/Hatchback)</option>
                      <option value="suv">SUV/Jeep</option>
                      <option value="truck">Truck</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newVehicle.fuel_type}
                      onChange={e => setNewVehicle({ ...newVehicle, fuel_type: e.target.value })}
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR)</label>
                    <input
                      type="number"
                      required
                      className="w-full p-2 border rounded"
                      value={newVehicle.price}
                      onChange={e => setNewVehicle({ ...newVehicle, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Loan %</label>
                    <input
                      type="number"
                      required
                      max="100"
                      className="w-full p-2 border rounded"
                      value={newVehicle.max_loan_percentage}
                      onChange={e => setNewVehicle({ ...newVehicle, max_loan_percentage: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded h-24"
                    value={newVehicle.description}
                    onChange={e => setNewVehicle({ ...newVehicle, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setNewVehicle({ ...newVehicle, image: e.target.files[0] })}
                    className="w-full p-2 border rounded"
                  />
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
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Vehicle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Vehicle Modal */}
        {showEditModal && editingVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVehicle(null);
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
                title="Close"
              >
                <FaTimes size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-4">Edit Vehicle</h2>
              <form onSubmit={handleUpdateVehicle} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded"
                      value={editingVehicle.name}
                      onChange={e => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded"
                      value={editingVehicle.brand}
                      onChange={e => setEditingVehicle({ ...editingVehicle, brand: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded"
                      value={editingVehicle.model}
                      onChange={e => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="number"
                      required
                      className="w-full p-2 border rounded"
                      value={editingVehicle.year}
                      onChange={e => setEditingVehicle({ ...editingVehicle, year: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={editingVehicle.vehicle_type}
                      onChange={e => setEditingVehicle({ ...editingVehicle, vehicle_type: e.target.value })}
                    >
                      <option value="two_wheeler">Two Wheeler</option>
                      <option value="car">Car (Sedan/Hatchback)</option>
                      <option value="suv">SUV/Jeep</option>
                      <option value="truck">Truck</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={editingVehicle.fuel_type}
                      onChange={e => setEditingVehicle({ ...editingVehicle, fuel_type: e.target.value })}
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR)</label>
                    <input
                      type="number"
                      required
                      className="w-full p-2 border rounded"
                      value={editingVehicle.price}
                      onChange={e => setEditingVehicle({ ...editingVehicle, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Loan %</label>
                    <input
                      type="number"
                      required
                      max="100"
                      className="w-full p-2 border rounded"
                      value={editingVehicle.max_loan_percentage}
                      onChange={e => setEditingVehicle({ ...editingVehicle, max_loan_percentage: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    <input
                      type="checkbox"
                      id="edit_is_available"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={editingVehicle.is_available}
                      onChange={e => setEditingVehicle({ ...editingVehicle, is_available: e.target.checked })}
                    />
                    <label htmlFor="edit_is_available" className="text-sm font-medium text-gray-700">Available for Loan</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded h-24"
                    value={editingVehicle.description}
                    onChange={e => setEditingVehicle({ ...editingVehicle, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Update Vehicle Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setEditingVehicle({ ...editingVehicle, image: e.target.files[0] })}
                    className="w-full p-2 border rounded"
                  />
                  {editingVehicle.image && !(editingVehicle.image instanceof File) && (
                    <p className="text-xs text-gray-500 mt-1 truncate">Current: {editingVehicle.image}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingVehicle(null);
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Update Vehicle
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

export default SalesRepDashboard;