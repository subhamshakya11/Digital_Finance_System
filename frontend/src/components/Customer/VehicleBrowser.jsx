import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaSearch, FaFilter, FaHeart } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Navbar from '../Shared/Navbar';
import vehicleService from '../../services/vehicles';
import { VEHICLE_TYPES, FUEL_TYPES } from '../../utils/constants';
import getErrorMessage from '../../utils/errorHelper';

const VehicleBrowser = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    vehicle_type: '',
    fuel_type: '',
    min_price: '',
    max_price: '',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vehicles, searchTerm, filters]);

  const loadVehicles = async () => {
    try {
      const data = await vehicleService.getAll();
      setVehicles(data.results || data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vehicles];

    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.vehicle_type) {
      filtered = filtered.filter(v => v.vehicle_type === filters.vehicle_type);
    }

    if (filters.fuel_type) {
      filtered = filtered.filter(v => v.fuel_type === filters.fuel_type);
    }

    if (filters.min_price) {
      filtered = filtered.filter(v => v.price >= parseFloat(filters.min_price));
    }
    if (filters.max_price) {
      filtered = filtered.filter(v => v.price <= parseFloat(filters.max_price));
    }

    setFilteredVehicles(filtered);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      vehicle_type: '',
      fuel_type: '',
      min_price: '',
      max_price: '',
    });
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading vehicles...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Browse Vehicles</h1>
          <p className="text-gray-600 mt-2">Find your dream vehicle and apply for financing</p>
        </div>

        {/* Improved Search and Filters - Clean & Readable */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Search Bar */}
            <div className="relative group">
              <FaSearch className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by brand, model, or name..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none text-gray-700"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Vehicle Type</label>
                <select
                  value={filters.vehicle_type}
                  onChange={(e) => handleFilterChange('vehicle_type', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm text-gray-700 font-medium"
                >
                  <option value="">All Types</option>
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Fuel Type</label>
                <select
                  value={filters.fuel_type}
                  onChange={(e) => handleFilterChange('fuel_type', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm text-gray-700 font-medium"
                >
                  <option value="">All Fuels</option>
                  {FUEL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Min Price (NPR)</label>
                <input
                  type="number"
                  value={filters.min_price}
                  onChange={(e) => handleFilterChange('min_price', e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Max Price (NPR)</label>
                <input
                  type="number"
                  value={filters.max_price}
                  onChange={(e) => handleFilterChange('max_price', e.target.value)}
                  placeholder="10,000,000"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm"
                />
              </div>
            </div>

            {/* Clear Filters Button - Professional & Centered */}
            <div className="flex justify-center border-t border-gray-100 pt-6">
              <button
                onClick={clearFilters}
                className="flex items-center px-6 py-2 text-sm font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100"
              >
                <FaFilter className="mr-2 text-[10px]" />
                Reset All Filters
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-gray-600">
            Showing <span className="font-bold text-gray-900">{filteredVehicles.length}</span> of {vehicles.length} vehicles
          </p>
        </div>

        {/* Vehicle Grid - Reverted to Original Layout with subtle shadows */}
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <FaCar className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No vehicles found matching your criteria</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-blue-600 hover:underline font-bold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200"
              >
                {vehicle.image ? (
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <FaCar className="text-6xl text-blue-200" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <button className="text-gray-300 hover:text-red-500 transition-colors">
                      <FaHeart />
                    </button>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{vehicle.name}</p>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2 opacity-60">📅</span>
                      <span>{vehicle.year}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2 opacity-60">⛽</span>
                      <span className="capitalize">{vehicle.fuel_type}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 text-sm">Vehicle Price</span>
                      <span className="text-xl font-bold text-gray-800">
                        NPR {vehicle.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-400">Max Loan %</span>
                      <span className="text-green-600 font-bold">
                        {vehicle.max_loan_percentage}%
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/customer/apply-loan"
                    state={{ selectedVehicle: vehicle }}
                    className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold"
                  >
                    Apply for Loan
                  </Link>

                  {vehicle.description && (
                    <p className="text-xs text-gray-500 mt-3 line-clamp-2 italic">
                      {vehicle.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleBrowser;
