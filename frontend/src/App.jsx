import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Auth Pages
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Customer Pages
import CustomerDashboard from './components/Customer/Dashboard';
import LoanApplication from './components/Customer/LoanApplication';
import DocumentUpload from './components/Customer/DocumentUpload';
import EMITracker from './components/Customer/EMITracker';
import VehicleBrowser from './components/Customer/VehicleBrowser';
import Profile from './components/Customer/Profile'; // Profile page
import Settings from './components/Customer/Settings'; // Settings page

// Sales Rep Pages
import SalesRepDashboard from './components/SalesRep/Dashboard';
import DocumentVerification from './components/SalesRep/DocumentVerification';

// Finance Pages
import FinanceDashboard from './components/Finance/Dashboard';
import LoanApproval from './components/Finance/LoanApproval';

// Admin Pages
import AdminDashboard from './components/Admin/Dashboard';

// Shared Components
import ChatWidget from './components/Chatbot/ChatWidget';
import ProtectedRoute from './components/Shared/ProtectedRoute';
import NotFound from './components/Shared/NotFound';

import authService from './services/auth';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer Routes */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/profile"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/settings"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/apply-loan"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <LoanApplication />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/documents/:id"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <DocumentUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/emi-tracker"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <EMITracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/vehicles"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <VehicleBrowser />
            </ProtectedRoute>
          }
        />

        {/* Sales Rep Routes */}
        <Route
          path="/sales/dashboard"
          element={
            <ProtectedRoute allowedRoles={['sales_rep', 'admin']}>
              <SalesRepDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/verify/:id"
          element={
            <ProtectedRoute allowedRoles={['sales_rep', 'admin']}>
              <DocumentVerification />
            </ProtectedRoute>
          }
        />

        {/* Finance Routes */}
        <Route
          path="/finance/dashboard"
          element={
            <ProtectedRoute allowedRoles={['finance_manager', 'admin']}>
              <FinanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/approve/:id"
          element={
            <ProtectedRoute allowedRoles={['finance_manager', 'admin']}>
              <LoanApproval />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Chatbot Widget - Available on all pages when logged in */}
      {authService.isAuthenticated() && <ChatWidget />}
    </Router>
  );
}

export default App;
