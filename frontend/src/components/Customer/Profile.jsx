import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaArrowLeft } from 'react-icons/fa';
import authService from '../../services/auth';

const Profile = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">User not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* Go Back Button */}
        <button
          onClick={() => navigate('/customer/dashboard')}
          className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <FaArrowLeft />
          <span className="font-medium">Back to Dashboard</span>
        </button>
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl">
            {user.first_name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-sm text-gray-500">{user.user_type.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3 p-4 bg-gray-100 rounded-lg">
            <FaUser className="text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Username</p>
              <p className="font-medium text-gray-800">{user.username}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-100 rounded-lg">
            <FaEnvelope className="text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-100 rounded-lg">
            <FaPhone className="text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-800">{user.phone}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-100 rounded-lg">
            <FaIdCard className="text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">User Type</p>
              <p className="font-medium text-gray-800">{user.user_type.replace('_', ' ').toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Account Info</h2>
        </div>
      </div>
    </div>
  );
};

export default Profile;
