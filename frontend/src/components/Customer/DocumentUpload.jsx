import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFileUpload, FaCheckCircle, FaTimesCircle, FaClock, FaCloudUploadAlt, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Navbar from '../Shared/Navbar';
import loanService from '../../services/loans';
import { DOCUMENT_TYPES } from '../../utils/constants';
import getErrorMessage from '../../utils/errorHelper';

const DocumentUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      const data = await loanService.getById(id);
      setApplication(data);
      setDocuments(data.documents || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
      navigate('/customer/dashboard');
    }
  };

  const handleFileUpload = async (documentType, file) => {
    if (!file) return;

    if (file.size > 5242880) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(prev => ({ ...prev, [documentType]: true }));
    try {
      await loanService.uploadDocument(id, {
        document_type: documentType,
        file: file,
      });
      toast.success(`${DOCUMENT_TYPES.find(t => t.value === documentType)?.label} uploaded successfully`);
      loadApplication();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const handleSubmitLoan = async () => {
    setSubmitting(true);
    try {
      await loanService.submitLoan(id);
      toast.success('Loan application submitted successfully!');
      navigate('/customer/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = async (documentId, documentLabel) => {
    if (!window.confirm(`Are you sure you want to delete ${documentLabel}?`)) {
      return;
    }

    try {
      await loanService.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      loadApplication();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const getDocumentStatus = (documentType) => {
    return documents.find(d => d.document_type === documentType);
  };

  const isDocumentUploaded = (documentType) => {
    return documents.some(d => d.document_type === documentType);
  };

  const allMandatoryDocsUploaded = () => {
    const mandatoryTypes = DOCUMENT_TYPES.filter(t => t.mandatory).map(t => t.value);
    return mandatoryTypes.every(type => isDocumentUploaded(type));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <FaCheckCircle className="text-green-500 text-2xl" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500 text-2xl" />;
      default:
        return <FaClock className="text-yellow-500 text-2xl" />;
    }
  };

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const mandatoryDocs = DOCUMENT_TYPES.filter(t => t.mandatory);
  const optionalDocs = DOCUMENT_TYPES.filter(t => !t.mandatory);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Upload Required Documents</h1>
          <p className="text-gray-600 mt-2">
            Application Number: <span className="font-semibold">{application.application_number}</span>
            <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${application.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              application.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
              {application.status.toUpperCase()}
            </span>
          </p>
        </div>

        {/* Mandatory Documents */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Required Documents <span className="text-red-600">*</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mandatoryDocs.map((docType) => {
              const uploadedDoc = getDocumentStatus(docType.value);
              const isUploaded = isDocumentUploaded(docType.value);
              const isUploading = uploading[docType.value];

              return (
                <div
                  key={docType.value}
                  className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all relative ${isUploaded ? 'border-green-500' : 'border-gray-200 hover:border-blue-400'
                    }`}
                >
                  {isUploaded && (
                    <button
                      onClick={() => handleDeleteDocument(uploadedDoc.id, docType.label)}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors shadow-md z-10"
                      title="Delete document"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800">{docType.label}</h3>
                      <p className="text-sm text-red-600 font-medium">Required</p>
                    </div>
                    {uploadedDoc && getStatusIcon(uploadedDoc.status)}
                  </div>

                  {isUploaded ? (
                    <div className="space-y-2">
                      <div className="flex items-center text-green-700">
                        <FaCheckCircle className="mr-2" />
                        <span className="font-medium">Uploaded</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(uploadedDoc.uploaded_at).toLocaleDateString()}
                      </p>
                      {uploadedDoc.verification_notes && (
                        <p className="text-sm text-gray-600 italic">
                          Note: {uploadedDoc.verification_notes}
                        </p>
                      )}
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${uploadedDoc.status === 'verified' ? 'bg-green-100 text-green-800' :
                        uploadedDoc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {uploadedDoc.status.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <label className="cursor-pointer">
                        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }`}>
                          <FaCloudUploadAlt className="text-4xl text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-700">
                            {isUploading ? 'Uploading...' : 'Click to upload'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(docType.value, e.target.files[0])}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Optional Documents */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Optional Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalDocs.map((docType) => {
              const uploadedDoc = getDocumentStatus(docType.value);
              const isUploaded = isDocumentUploaded(docType.value);
              const isUploading = uploading[docType.value];

              return (
                <div
                  key={docType.value}
                  className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all relative ${isUploaded ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300'
                    }`}
                >
                  {isUploaded && (
                    <button
                      onClick={() => handleDeleteDocument(uploadedDoc.id, docType.label)}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors shadow-md z-10"
                      title="Delete document"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800">{docType.label}</h3>
                      <p className="text-sm text-gray-500">Optional</p>
                    </div>
                    {uploadedDoc && getStatusIcon(uploadedDoc.status)}
                  </div>

                  {isUploaded ? (
                    <div className="space-y-2">
                      <div className="flex items-center text-blue-700">
                        <FaCheckCircle className="mr-2" />
                        <span className="font-medium">Uploaded</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(uploadedDoc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="cursor-pointer">
                        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }`}>
                          <FaCloudUploadAlt className="text-4xl text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-700">
                            {isUploading ? 'Uploading...' : 'Click to upload'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(docType.value, e.target.files[0])}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Back to Dashboard
          </button>

          {allMandatoryDocsUploaded() && application.status === 'draft' && (
            <button
              onClick={handleSubmitLoan}
              disabled={submitting}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <FaCheckCircle className="mr-2" />
                  Submit Loan Application
                </>
              )}
            </button>
          )}

          {!allMandatoryDocsUploaded() && (
            <div className="text-orange-600 font-medium flex items-center">
              <FaClock className="mr-2" />
              Upload all required documents to submit
            </div>
          )}

          {application.status === 'submitted' && (
            <div className="text-green-600 font-medium flex items-center">
              <FaCheckCircle className="mr-2" />
              Application submitted successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
