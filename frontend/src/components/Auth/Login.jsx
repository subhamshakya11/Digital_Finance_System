import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock, FaCar, FaArrowRight, FaShieldAlt, FaBolt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import authService from '../../services/auth';
import getErrorMessage from '../../utils/errorHelper';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    setLoading(true);

    try {
      const data = await authService.login(formData);
      toast.success('Welcome back! 🎉');

      const userType = data.user.user_type;
      const routes = {
        customer: '/customer/dashboard',
        sales_rep: '/sales/dashboard',
        finance_manager: '/finance/dashboard',
        admin: '/admin/dashboard',
      };
      navigate(routes[userType] || '/');
    } catch (error) {
      toast.error(getErrorMessage(error));
      setLoading(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-pattern flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300 opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-6xl w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="text-white space-y-6 animate-fade-in hidden md:block">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
              <FaCar className="text-4xl" />
            </div>

            <h1 className="text-5xl font-bold leading-tight">
              Digital Vehicle
              <br />
              <span className="text-yellow-300">Finance System</span>
            </h1>

            <p className="text-xl text-white/90">
              Modern financing solution for Nepal's automotive industry
            </p>

            <div className="space-y-4 pt-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <FaBolt className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-semibold">Instant Approval</h3>
                  <p className="text-sm text-white/80">AI-powered credit scoring</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <FaShieldAlt className="text-green-300" />
                </div>
                <div>
                  <h3 className="font-semibold">Secure & Safe</h3>
                  <p className="text-sm text-white/80">Bank-level encryption</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="glass rounded-3xl p-8 md:p-12 shadow-2xl animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                <FaCar className="text-2xl text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate autoComplete="off">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-gradient-primary text-white py-4 px-6 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
                  Create Account
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Demo Credentials
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/60 p-2 rounded-lg">
                  <p className="text-gray-600">Customer</p>
                  <p className="font-mono font-semibold text-gray-800">customer / demo123</p>
                </div>
                <div className="bg-white/60 p-2 rounded-lg">
                  <p className="text-gray-600">Sales</p>
                  <p className="font-mono font-semibold text-gray-800">sales / demo123</p>
                </div>
                <div className="bg-white/60 p-2 rounded-lg">
                  <p className="text-gray-600">Finance</p>
                  <p className="font-mono font-semibold text-gray-800">finance / demo123</p>
                </div>
                <div className="bg-white/60 p-2 rounded-lg">
                  <p className="text-gray-600">Admin</p>
                  <p className="font-mono font-semibold text-gray-800">admin / admin123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;