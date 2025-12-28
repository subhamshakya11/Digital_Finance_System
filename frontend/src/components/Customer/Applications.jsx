import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaFileAlt, FaClock, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaEye, FaSearch } from 'react-icons/fa';
import Navbar from '../Shared/Navbar';
import loanService from '../../services/loans';
import toast from 'react-hot-toast';
import getErrorMessage from '../../utils/errorHelper';

const Applications = () => {
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            const data = await loanService.getAll();
            setLoans(data.results || data);
        } catch (error) {
            toast.error(getErrorMessage(error));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            approved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200',
            submitted: 'bg-blue-100 text-blue-800 border-blue-200',
            under_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            draft: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <FaCheckCircle className="mr-2" />;
            case 'rejected': return <FaTimesCircle className="mr-2" />;
            case 'under_review':
            case 'submitted': return <FaClock className="mr-2" />;
            default: return <FaFileAlt className="mr-2" />;
        }
    };

    const filteredLoans = loans.filter(loan =>
        loan.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.vehicle_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100-64px)]">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <button
                            onClick={() => navigate('/customer/dashboard')}
                            className="flex items-center text-gray-600 hover:text-primary-600 mb-2 transition-colors"
                        >
                            <FaArrowLeft className="mr-2" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">My Loan Applications</h1>
                        <p className="text-gray-600 mt-1">Track and manage all your vehicle financing requests</p>
                    </div>

                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search applications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 w-full md:w-64 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Applications Grid */}
                {filteredLoans.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaFileAlt className="text-4xl text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No applications found</h3>
                        <p className="text-gray-600">You haven't made any loan applications yet or none match your search.</p>
                        <Link to="/customer/apply-loan" className="inline-flex items-center mt-6 px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all">
                            Apply for a Loan
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredLoans.map((loan) => (
                            <div key={loan.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center ${getStatusColor(loan.status)}`}>
                                                    {getStatusIcon(loan.status)}
                                                    {loan.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className="text-sm font-medium text-gray-400"># {loan.application_number}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">{loan.vehicle_name}</h3>
                                            <p className="text-gray-500 text-sm">Applied on {new Date(loan.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 lg:border-l lg:pl-8 border-gray-100">
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Loan Amount</p>
                                                <p className="text-lg font-bold text-gray-900">NPR {loan.loan_amount?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Monthly EMI</p>
                                                <p className="text-lg font-bold text-primary-600">NPR {loan.monthly_emi?.toLocaleString()}</p>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Tenure</p>
                                                <p className="text-lg font-bold text-gray-900">{loan.tenure_months} Months</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            {loan.status === 'draft' ? (
                                                <Link
                                                    to={`/customer/documents/${loan.id}`}
                                                    className="flex-1 lg:flex-none text-center px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors"
                                                >
                                                    Complete Application
                                                </Link>
                                            ) : (
                                                <button
                                                    className="flex-1 lg:flex-none flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                                >
                                                    <FaEye className="mr-2" /> View Details
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {loan.status === 'rejected' && loan.rejection_reason && (
                                        <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                                            <p className="text-sm text-red-800">
                                                <span className="font-bold">Rejection Reason:</span> {loan.rejection_reason}
                                            </p>
                                        </div>
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

export default Applications;
