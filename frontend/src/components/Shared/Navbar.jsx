import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCar, FaBell, FaUser, FaSignOutAlt, FaBars, FaTimes, FaChevronDown } from 'react-icons/fa';
import authService from '../../services/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    const routes = {
      customer: '/customer/dashboard',
      sales_rep: '/sales/dashboard',
      finance_manager: '/finance/dashboard',
      admin: '/admin/dashboard',
    };
    return routes[user?.user_type] || '/';
  };

  const navLinks =
    user?.user_type === 'customer'
      ? [
          { to: '/customer/dashboard', label: 'Dashboard' },
          { to: '/customer/vehicles', label: 'Vehicles' },
          { to: '/customer/apply-loan', label: 'Apply Loan' },
          { to: '/customer/emi-tracker', label: 'EMI Tracker' },
        ]
      : [{ to: getDashboardLink(), label: 'Dashboard' }];

  return (
    <nav className="glass sticky top-0 z-50 border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={getDashboardLink()} className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:shadow-glow transition-all">
                <FaCar className="text-xl text-white" />
              </div>
              <div className="hidden md:block">
                <span className="text-xl font-bold gradient-text">Vehicle Finance</span>
                <p className="text-xs text-gray-500">Nepal's #1 Platform</p>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gradient-primary hover:text-white transition-all font-medium"
              >
                {link.label}
              </Link>
            ))}

            {/* Notifications */}
            <button className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
              <FaBell className="text-xl" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative ml-3">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all"
              >
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <FaUser className="text-white text-sm" />
                </div>
                <span className="font-medium text-gray-700">{user?.first_name || user?.username}</span>
                <FaChevronDown className="text-gray-400 text-xs" />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 glass rounded-xl shadow-xl py-2 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gradient-primary text-white text-xs rounded-full">
                      {user?.user_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Corrected Links */}
                  <Link
                    to={user?.user_type === 'customer' ? '/customer/profile' : '/profile'}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-primary hover:text-white transition-all"
                  >
                    My Profile
                  </Link>
                  <Link
                    to={user?.user_type === 'customer' ? '/customer/settings' : '/settings'}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-primary hover:text-white transition-all"
                  >
                    Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all flex items-center space-x-2"
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
            >
              {isMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden glass-dark border-t border-gray-700/50 animate-slide-in">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to={user?.user_type === 'customer' ? '/customer/profile' : '/profile'}
              className="block px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              My Profile
            </Link>
            <Link
              to={user?.user_type === 'customer' ? '/customer/settings' : '/settings'}
              className="block px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/20 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
