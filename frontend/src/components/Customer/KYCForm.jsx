import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaHome, FaIdCard, FaFileUpload, FaCheckCircle, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Navbar from '../Shared/Navbar';
import kycService from '../../services/kyc';
import authService from '../../services/auth';
import getErrorMessage from '../../utils/errorHelper';

const PROVINCES = [
    'Province 1', 'Madhesh Province', 'Bagmati Province', 'Gandaki Province',
    'Lumbini Province', 'Karnali Province', 'Sudurpashchim Province'
];

const DOCUMENT_TYPES = [
    { type: 'citizenship_front', label: 'Citizenship Certificate (Front)', required: true },
    { type: 'citizenship_back', label: 'Citizenship Certificate (Back)', required: true },
    { type: 'photo', label: 'Passport Size Photo', required: true },
    { type: 'license', label: 'Driving License', required: false },
    { type: 'pan', label: 'PAN Card', required: false },
    { type: 'passport', label: 'Passport', required: false },
];

const KYCForm = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [existingKYC, setExistingKYC] = useState(null);
    const [uploadedDocs, setUploadedDocs] = useState([]);
    const [sameAsPermanent, setSameAsPermanent] = useState(false);
    const [errors, setErrors] = useState({});
    const user = authService.getCurrentUser();

    const [formData, setFormData] = useState({
        // Personal Information
        full_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
        father_name: '',
        mother_name: '',
        grandfather_name: '',
        date_of_birth: '',
        gender: '',

        // Address Information
        permanent_address: '',
        permanent_district: '',
        permanent_province: '',
        temporary_address: '',
        temporary_district: '',
        temporary_province: '',

        // Contact Information
        phone: user?.phone || '',
        alternate_phone: '',
        email: user?.email || '',

        // Identification
        citizenship_number: '',
        citizenship_issue_date: '',
        citizenship_issue_district: '',
        pan_number: '',
        license_number: '',
        passport_number: '',

        // Occupation
        occupation: '',
        employer_name: '',
        annual_income: '',
    });

    const [documents, setDocuments] = useState({
        citizenship_front: null,
        citizenship_back: null,
        photo: null,
        license: null,
        pan: null,
        passport: null,
    });

    useEffect(() => {
        loadExistingKYC();
    }, []);

    const loadExistingKYC = async () => {
        try {
            const kyc = await kycService.getMyKYC();
            setExistingKYC(kyc);

            // Populate form with existing data
            setFormData({
                full_name: kyc.full_name || '',
                father_name: kyc.father_name || '',
                mother_name: kyc.mother_name || '',
                grandfather_name: kyc.grandfather_name || '',
                date_of_birth: kyc.date_of_birth || '',
                gender: kyc.gender || '',
                permanent_address: kyc.permanent_address || '',
                permanent_district: kyc.permanent_district || '',
                permanent_province: kyc.permanent_province || '',
                temporary_address: kyc.temporary_address || '',
                temporary_district: kyc.temporary_district || '',
                temporary_province: kyc.temporary_province || '',
                phone: kyc.phone || user?.phone || '',
                alternate_phone: kyc.alternate_phone || '',
                email: kyc.email || user?.email || '',
                citizenship_number: kyc.citizenship_number || '',
                citizenship_issue_date: kyc.citizenship_issue_date || '',
                citizenship_issue_district: kyc.citizenship_issue_district || '',
                pan_number: kyc.pan_number || '',
                license_number: kyc.license_number || '',
                passport_number: kyc.passport_number || '',
                occupation: kyc.occupation || '',
                employer_name: kyc.employer_name || '',
                annual_income: kyc.annual_income || '',
            });

            // Load existing documents
            const docs = await kycService.getDocuments();
            setUploadedDocs(docs.results || docs || []);
        } catch (error) {
            // No existing KYC, that's fine
            console.log('No existing KYC profile');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSameAsPermanent = (e) => {
        const checked = e.target.checked;
        setSameAsPermanent(checked);

        if (checked) {
            // Copy permanent address to temporary address
            setFormData(prev => ({
                ...prev,
                temporary_address: prev.permanent_address,
                temporary_district: prev.permanent_district,
                temporary_province: prev.permanent_province,
            }));
            // Clear temporary address errors
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.temporary_address;
                delete newErrors.temporary_district;
                delete newErrors.temporary_province;
                return newErrors;
            });
        } else {
            // Clear temporary address fields
            setFormData(prev => ({
                ...prev,
                temporary_address: '',
                temporary_district: '',
                temporary_province: '',
            }));
        }
    };

    const handleFileChange = (docType, file) => {
        setDocuments(prev => ({ ...prev, [docType]: file }));
    };

    const validateStep = () => {
        const newErrors = {};
        if (step === 1) {
            if (!formData.full_name) newErrors.full_name = 'Full name is required';
            if (!formData.father_name) newErrors.father_name = "Father's name is required";
            if (!formData.mother_name) newErrors.mother_name = "Mother's name is required";
            if (!formData.grandfather_name) newErrors.grandfather_name = "Grandfather's name is required";
            if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
            if (!formData.gender) newErrors.gender = 'Gender is required';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                toast.error('Please fill all required personal information fields');
                return false;
            }
        } else if (step === 2) {
            if (!formData.permanent_address) newErrors.permanent_address = 'Permanent address is required';
            if (!formData.permanent_district) newErrors.permanent_district = 'District is required';
            if (!formData.permanent_province) newErrors.permanent_province = 'Province is required';
            if (!formData.phone) newErrors.phone = 'Phone number is required';
            if (!formData.email) newErrors.email = 'Email address is required';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                toast.error('Please fill all required address and contact fields');
                return false;
            }
        } else if (step === 3) {
            if (!formData.citizenship_number) newErrors.citizenship_number = 'Citizenship number is required';
            if (!formData.citizenship_issue_date) newErrors.citizenship_issue_date = 'Issue date is required';
            if (!formData.citizenship_issue_district) newErrors.citizenship_issue_district = 'Issue district is required';
            if (!formData.occupation) newErrors.occupation = 'Occupation is required';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                toast.error('Please fill all required identification fields');
                return false;
            }
        }
        setErrors({});
        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            // Step 1: Create or update KYC profile
            let kycProfile;
            try {
                if (existingKYC) {
                    kycProfile = await kycService.updateKYC(existingKYC.id, formData);
                    toast.success('KYC profile updated');
                } else {
                    kycProfile = await kycService.createKYC(formData);
                    toast.success('KYC profile created');
                    setExistingKYC(kycProfile);
                }
            } catch (err) {
                if (err.response?.status === 400) {
                    const errorDetails = err.response.data.details || err.response.data;
                    setErrors(errorDetails);

                    // Show a helpful toast message
                    toast.error(getErrorMessage(err));

                    // Automatically go back to the step with error
                    const fieldNames = Object.keys(errorDetails);
                    if (fieldNames.some(f => ['full_name', 'father_name', 'mother_name', 'grandfather_name', 'date_of_birth', 'gender'].includes(f))) {
                        setStep(1);
                    } else if (fieldNames.some(f => ['permanent_address', 'permanent_district', 'permanent_province', 'phone', 'email'].includes(f))) {
                        setStep(2);
                    } else if (fieldNames.some(f => ['citizenship_number', 'citizenship_issue_date', 'citizenship_issue_district', 'occupation', 'pan_number', 'license_number', 'passport_number', 'annual_income'].includes(f))) {
                        setStep(3);
                    }
                } else {
                    toast.error(getErrorMessage(err));
                }
                setLoading(false);
                return;
            }

            // Step 2: Upload documents
            const uploadPromises = [];
            for (const [docType, file] of Object.entries(documents)) {
                if (file) {
                    // Check if document already uploaded
                    const docsArray = Array.isArray(uploadedDocs) ? uploadedDocs : (uploadedDocs?.results || []);
                    const alreadyUploaded = docsArray.find(doc => doc.document_type === docType);
                    if (!alreadyUploaded) {
                        uploadPromises.push(kycService.uploadDocument(docType, file));
                    }
                }
            }

            if (uploadPromises.length > 0) {
                try {
                    await Promise.all(uploadPromises);
                    toast.success('Documents uploaded successfully');
                } catch (err) {
                    toast.error('Some documents failed to upload. Please check your connection.');
                    setLoading(false);
                    return;
                }
            }

            // Step 3: Submit KYC for verification
            try {
                await kycService.submitKYC(kycProfile.id);
                toast.success('KYC submitted for verification!');

                // Redirect to dashboard
                setTimeout(() => {
                    navigate('/customer/dashboard');
                }, 2000);
            } catch (err) {
                toast.error(getErrorMessage(err));
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-gradient-primary text-white shadow-glow' : 'bg-gray-300 text-gray-600'
                            }`}>
                            {s}
                        </div>
                        {s < 4 && (
                            <div className={`flex-1 h-1 mx-2 transition-all ${step > s ? 'bg-gradient-primary' : 'bg-gray-300'
                                }`} />
                        )}
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-2 text-sm">
                <span className={step >= 1 ? 'text-primary-600 font-medium' : 'text-gray-500'}>Personal Info</span>
                <span className={step >= 2 ? 'text-primary-600 font-medium' : 'text-gray-500'}>Address</span>
                <span className={step >= 3 ? 'text-primary-600 font-medium' : 'text-gray-500'}>Identification</span>
                <span className={step >= 4 ? 'text-primary-600 font-medium' : 'text-gray-500'}>Documents</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-4xl mx-auto p-4 md:p-6">
                {/* Header */}
                <div className="bg-gradient-primary rounded-2xl p-6 text-white shadow-xl mb-6">
                    <h1 className="text-3xl font-bold mb-2">Complete Your KYC</h1>
                    <p className="text-white/90">
                        Please provide accurate information for verification. This is required before you can apply for loans.
                    </p>
                </div>

                {/* Progress Indicator */}
                {renderStepIndicator()}

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Personal Information */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                    <FaUser className="mr-3 text-primary-600" />
                                    Personal Information
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name (as per citizenship) *
                                        </label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.full_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                }`}
                                            required
                                        />
                                        {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Father's Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="father_name"
                                            value={formData.father_name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.father_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                }`}
                                            required
                                        />
                                        {errors.father_name && <p className="text-red-500 text-xs mt-1">{errors.father_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mother's Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="mother_name"
                                            value={formData.mother_name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.mother_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                }`}
                                            required
                                        />
                                        {errors.mother_name && <p className="text-red-500 text-xs mt-1">{errors.mother_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Grandfather's Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="grandfather_name"
                                            value={formData.grandfather_name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.grandfather_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                }`}
                                            required
                                        />
                                        {errors.grandfather_name && <p className="text-red-500 text-xs mt-1">{errors.grandfather_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date of Birth *
                                        </label>
                                        <input
                                            type="date"
                                            name="date_of_birth"
                                            value={formData.date_of_birth}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.date_of_birth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                }`}
                                            required
                                        />
                                        {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Gender *
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.gender ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                }`}
                                            required
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Address Information */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                    <FaHome className="mr-3 text-primary-600" />
                                    Address Information
                                </h2>

                                <div className="bg-blue-50 p-4 rounded-xl mb-6">
                                    <h3 className="font-semibold text-blue-900 mb-3">Permanent Address *</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Address (Tole, Ward, Municipality/VDC)
                                            </label>
                                            <textarea
                                                name="permanent_address"
                                                value={formData.permanent_address}
                                                onChange={handleChange}
                                                rows="2"
                                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.permanent_address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                required
                                            />
                                            {errors.permanent_address && <p className="text-red-500 text-xs mt-1">{errors.permanent_address}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                District
                                            </label>
                                            <input
                                                type="text"
                                                name="permanent_district"
                                                value={formData.permanent_district}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.permanent_district ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                required
                                            />
                                            {errors.permanent_district && <p className="text-red-500 text-xs mt-1">{errors.permanent_district}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Province
                                            </label>
                                            <select
                                                name="permanent_province"
                                                value={formData.permanent_province}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.permanent_province ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                required
                                            >
                                                <option value="">Select Province</option>
                                                {PROVINCES.map(province => (
                                                    <option key={province} value={province}>{province}</option>
                                                ))}
                                            </select>
                                            {errors.permanent_province && <p className="text-red-500 text-xs mt-1">{errors.permanent_province}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-green-900">Temporary Address (Optional)</h3>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={sameAsPermanent}
                                                onChange={handleSameAsPermanent}
                                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mr-2"
                                            />
                                            <span className="text-sm text-gray-700 font-medium">Same as Permanent</span>
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Address
                                            </label>
                                            <textarea
                                                name="temporary_address"
                                                value={formData.temporary_address}
                                                onChange={handleChange}
                                                rows="2"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                                disabled={sameAsPermanent}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                District
                                            </label>
                                            <input
                                                type="text"
                                                name="temporary_district"
                                                value={formData.temporary_district}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                                disabled={sameAsPermanent}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Province
                                            </label>
                                            <select
                                                name="temporary_province"
                                                value={formData.temporary_province}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                                disabled={sameAsPermanent}
                                            >
                                                <option value="">Select Province</option>
                                                {PROVINCES.map(province => (
                                                    <option key={province} value={province}>{province}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                }`}
                                            required
                                        />
                                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Alternate Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="alternate_phone"
                                            value={formData.alternate_phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                }`}
                                            required
                                        />
                                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Identification */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                    <FaIdCard className="mr-3 text-primary-600" />
                                    Identification Details
                                </h2>

                                <div className="bg-yellow-50 p-4 rounded-xl mb-6">
                                    <h3 className="font-semibold text-yellow-900 mb-3">Citizenship Information *</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Citizenship Number
                                            </label>
                                            <input
                                                type="text"
                                                name="citizenship_number"
                                                value={formData.citizenship_number}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.citizenship_number ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                placeholder="e.g., 12-01-75-12345"
                                                required
                                            />
                                            {errors.citizenship_number && <p className="text-red-500 text-xs mt-1">{errors.citizenship_number}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Issue Date
                                            </label>
                                            <input
                                                type="date"
                                                name="citizenship_issue_date"
                                                value={formData.citizenship_issue_date}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.citizenship_issue_date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                required
                                            />
                                            {errors.citizenship_issue_date && <p className="text-red-500 text-xs mt-1">{errors.citizenship_issue_date}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Issue District
                                            </label>
                                            <input
                                                type="text"
                                                name="citizenship_issue_district"
                                                value={formData.citizenship_issue_district}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.citizenship_issue_district ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                required
                                            />
                                            {errors.citizenship_issue_district && <p className="text-red-500 text-xs mt-1">{errors.citizenship_issue_district}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            PAN Number (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="pan_number"
                                            value={formData.pan_number}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.pan_number ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                }`}
                                            placeholder="e.g., 123456789"
                                        />
                                        {errors.pan_number && <p className="text-red-500 text-xs mt-1">{errors.pan_number}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Driving License Number (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="license_number"
                                            value={formData.license_number}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Passport Number (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="passport_number"
                                            value={formData.passport_number}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Occupation *
                                        </label>
                                        <input
                                            type="text"
                                            name="occupation"
                                            value={formData.occupation}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.occupation ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                }`}
                                            placeholder="e.g., Software Engineer"
                                            required
                                        />
                                        {errors.occupation && <p className="text-red-500 text-xs mt-1">{errors.occupation}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Employer/Business Name
                                        </label>
                                        <input
                                            type="text"
                                            name="employer_name"
                                            value={formData.employer_name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Annual Income (NPR)
                                        </label>
                                        <input
                                            type="number"
                                            name="annual_income"
                                            value={formData.annual_income}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${errors.annual_income ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                }`}
                                            placeholder="e.g., 1200000"
                                        />
                                        {errors.annual_income && <p className="text-red-500 text-xs mt-1">{errors.annual_income}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Document Upload */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                    <FaFileUpload className="mr-3 text-primary-600" />
                                    Upload Documents
                                </h2>

                                <div className="bg-blue-50 p-4 rounded-xl mb-6">
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> Please upload clear, readable copies of your documents.
                                        Accepted formats: JPG, PNG, PDF. Maximum file size: 5MB per document.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {DOCUMENT_TYPES.map(({ type, label, required }) => {
                                        const docsArray = Array.isArray(uploadedDocs) ? uploadedDocs : (uploadedDocs?.results || []);
                                        const alreadyUploaded = docsArray.find(doc => doc.document_type === type);
                                        const currentFile = documents[type];

                                        return (
                                            <div key={type} className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        {label} {required && <span className="text-red-500">*</span>}
                                                    </label>
                                                    {alreadyUploaded && (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
                                                            <FaCheckCircle className="mr-1" /> Uploaded
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => handleFileChange(type, e.target.files[0])}
                                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                                    required={required && !alreadyUploaded}
                                                />
                                                {currentFile && (
                                                    <p className="text-xs text-gray-600 mt-1">Selected: {currentFile.name}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-xl mt-6">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Important:</strong> After submitting, your KYC will be reviewed by our team.
                                        You will be notified once the verification is complete. This usually takes 1-2 business days.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold flex items-center transition-all"
                                >
                                    <FaArrowLeft className="mr-2" />
                                    Back
                                </button>
                            )}

                            <div className="ml-auto">
                                {step < 4 ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="px-6 py-3 bg-gradient-primary text-white rounded-xl hover:shadow-glow font-semibold flex items-center transition-all"
                                    >
                                        Next
                                        <FaArrowRight className="ml-2" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3 bg-gradient-success text-white rounded-xl hover:shadow-glow font-semibold flex items-center transition-all disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle className="mr-2" />
                                                Submit KYC
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default KYCForm;
