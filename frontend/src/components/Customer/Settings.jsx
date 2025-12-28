import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaBell, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';
import authService from '../../services/auth';
import getErrorMessage from '../../utils/errorHelper';

const Settings = ({ onUserUpdate }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('account');
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    password: '',
    notifications: true,
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    setUser(authService.getCurrentUser());
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      password: '',
      notifications: true,
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
      };
      if (formData.password) updatedData.password = formData.password;

      const updatedUser = await authService.updateProfile(updatedData);

      // Update local state
      setUser(updatedUser);

      // Trigger Navbar update
      if (onUserUpdate) onUserUpdate(updatedUser);

      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Go Back Button */}
      <button
        onClick={() => navigate('/customer/dashboard')}
        className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <FaArrowLeft />
        <span className="font-medium">Back to Dashboard</span>
      </button>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-1/4 bg-white rounded-xl shadow p-4 sticky top-6">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <ul className="space-y-2">
            <li
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${activeTab === 'account' ? 'bg-gradient-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              onClick={() => setActiveTab('account')}
            >
              <FaUser /> Account
            </li>
            <li
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${activeTab === 'security' ? 'bg-gradient-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              onClick={() => setActiveTab('security')}
            >
              <FaLock /> Security
            </li>
            <li
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${activeTab === 'notifications' ? 'bg-gradient-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              onClick={() => setActiveTab('notifications')}
            >
              <FaBell /> Notifications
            </li>
          </ul>
        </div>

        {/* Content */}
        <div className="w-full md:w-3/4 bg-white rounded-xl shadow p-6">
          {message && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-green-100 text-green-800 rounded">
              <FaCheckCircle /> {message}
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-xl font-semibold mb-2">Account Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-lg transition"
              >
                Save Changes
              </button>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-xl font-semibold mb-2">Change Password</h3>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-lg transition"
              >
                Update Password
              </button>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-xl font-semibold mb-2">Notification Settings</h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={formData.notifications}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <label>Enable email notifications</label>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-lg transition"
              >
                Save Notifications
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
