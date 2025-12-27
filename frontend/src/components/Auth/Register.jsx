import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaCar, FaArrowRight, FaExclamationCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import authService from '../../services/auth';
import getErrorMessage from '../../utils/errorHelper';

// Animated Background Component
const AnimatedBackground = () => (
  <>
    <div className="fixed top-20 left-10 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
    <div
      className="fixed bottom-20 right-10 w-96 h-96 bg-purple-300 opacity-10 rounded-full blur-3xl animate-pulse pointer-events-none"
      style={{ animationDelay: '1s' }}
    ></div>
  </>
);

// Memoized InputField
const InputField = React.memo(({ label, name, type, icon: Icon, placeholder, value, onChange, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="text-gray-400" />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`${Icon ? 'pl-12' : ''} w-full px-4 py-3 border-2 rounded-xl transition-all ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100'
            : 'border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100'
          }`}
        placeholder={placeholder}
      />
    </div>
    {error && (
      <div className="mt-2 flex items-start space-x-2 text-red-600">
        <FaExclamationCircle className="mt-0.5 flex-shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    )}
  </div>
));

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    user_type: 'customer',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) newErrors.username = 'Username can only contain letters, numbers, and underscores';

    if (!formData.email.trim()) newErrors.email = 'Email is required for notifications';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address';

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required for SMS notifications';
    else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'Please enter a valid 10-digit phone number';

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (!formData.password2) newErrors.password2 = 'Please confirm your password';
    else if (formData.password !== formData.password2) newErrors.password2 = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const { password2, ...registrationData } = formData;
      await authService.register(registrationData);

      toast.success('🎉 Registration successful! Please log in to continue.', {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 'bold',
        },
      });

      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <AnimatedBackground />

      <div className="max-w-4xl w-full z-10">
        <div className="glass rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
              <FaCar className="text-2xl text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Create Your Account</h1>
            <p className="text-gray-600">Join Nepal's #1 vehicle financing platform</p>
          </div>

          {/* Important Notice */}
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <div className="flex items-start space-x-3">
              <FaExclamationCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Email & Phone Required</p>
                <p>We need your email and phone number to send you important notifications about your loan applications, EMI reminders, and approval status.</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="First Name"
                name="first_name"
                type="text"
                placeholder="John"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name}
              />
              <InputField
                label="Last Name"
                name="last_name"
                type="text"
                placeholder="Doe"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
              />
            </div>

            {/* Username */}
            <InputField
              label="Username"
              name="username"
              type="text"
              icon={FaUser}
              placeholder="johndoe123"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
            />

            {/* Email */}
            <InputField
              label="Email Address"
              name="email"
              type="email"
              icon={FaEnvelope}
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            {/* Phone */}
            <InputField
              label="Phone Number"
              name="phone"
              type="tel"
              icon={FaPhone}
              placeholder="98XXXXXXXX (10 digits)"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
            />

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Password"
                name="password"
                type="password"
                icon={FaLock}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
              />
              <InputField
                label="Confirm Password"
                name="password2"
                type="password"
                icon={FaLock}
                placeholder="••••••••"
                value={formData.password2}
                onChange={handleChange}
                error={errors.password2}
              />
            </div>

            {/* Password Requirements */}
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-semibold mb-2">Password must contain:</p>
              <ul className="space-y-1">
                <li className="flex items-center space-x-2">
                  <span className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                    {formData.password.length >= 8 ? '✓' : '○'}
                  </span>
                  <span>At least 8 characters</span>
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full bg-gradient-primary text-white py-4 px-6 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Creating Your Account...' : 'Create Account'}</span>
              {!loading && <FaArrowRight className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <p className="font-semibold text-gray-700 mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              What you get with your account:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <li>✨ Instant loan applications</li>
              <li>🤖 AI-powered approval</li>
              <li>📧 Email notifications</li>
              <li>📱 SMS alerts</li>
              <li>📊 Real-time tracking</li>
              <li>💬 24/7 chatbot support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
