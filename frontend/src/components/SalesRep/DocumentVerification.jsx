import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaFile } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Navbar from '../Shared/Navbar';
import loanService from '../../services/loans';
import { DOCUMENT_TYPES } from '../../utils/constants';
import getErrorMessage from '../../utils/errorHelper';

const DocumentVerification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      const data = await loanService.getById(id);
      setApplication(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
      navigate('/sales/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentStatus = async (docId, status) => {
    try {
      await loanService.verifyDocument(docId, status);
      toast.success(`Document ${status}`);
      loadApplication();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleVerify = async () => {
    if (!application.documents || application.documents.length === 0) {
      toast.error('No documents to verify');
      return;
    }

    const unverifiedDocs = application.documents.filter(d => d.status === 'pending');
    if (unverifiedDocs.length > 0) {
      toast.error(`${unverifiedDocs.length} document(s) still pending. Please verify all documents.`);
      return;
    }

    setVerifying(true);
    try {
      await loanService.verifyDocuments(id);
      toast.success('Documents verified & forwarded to Finance');
      navigate('/sales/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Document Verification</h1>
          <p className="text-gray-600 mt-2">
            Application: <span className="font-semibold">{application.application_number}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Application Details</h2>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-600">Customer</p>
                  <p className="font-medium">{application.customer_name}</p>
                </div>

                <div>
                  <p className="text-gray-600">Vehicle</p>
                  <p className="font-medium">{application.vehicle_name}</p>
                </div>

                <div>
                  <p className="text-gray-600">Loan Amount</p>
                  <p className="font-medium">NPR {application.loan_amount?.toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-gray-600">Down Payment</p>
                  <p className="font-medium">NPR {application.down_payment?.toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-gray-600">Tenure</p>
                  <p className="font-medium">{application.tenure_months} months</p>
                </div>

                <div>
                  <p className="text-gray-600">Monthly EMI</p>
                  <p className="font-medium text-lg text-blue-600">
                    NPR {application.monthly_emi?.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">Monthly Income</p>
                  <p className="font-medium">NPR {application.monthly_income?.toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-gray-600">Employment</p>
                  <p className="font-medium">{application.employment_type}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {verifying ? 'Verifying & Forwarding...' : 'Verify & Forward to Finance Manager'}
                </button>
                <button
                  onClick={() => navigate('/sales/dashboard')}
                  className="w-full mt-2 border border-gray-300 py-3 rounded-lg hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>

              {!application.documents || application.documents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FaFile className="text-6xl mx-auto mb-4 opacity-50" />
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {application.documents.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-800">
                            {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                          doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {doc.status.toUpperCase()}
                        </span>
                      </div>

                      {doc.file && (
                        <div className="mb-3">
                          <a
                            href={doc.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Document →
                          </a>
                        </div>
                      )}

                      {doc.status === 'pending' && (
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => handleDocumentStatus(doc.id, 'verified')}
                            className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            <FaCheckCircle className="mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleDocumentStatus(doc.id, 'rejected')}
                            className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            <FaTimesCircle className="mr-2" />
                            Reject
                          </button>
                        </div>
                      )}

                      {doc.verification_notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <p className="text-gray-600 font-medium">Verification Notes:</p>
                          <p className="text-gray-700">{doc.verification_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Required Documents Checklist */}
            <div className="bg-blue-50 rounded-lg p-6 mt-6">
              <h3 className="font-semibold text-blue-900 mb-3">Required Documents Checklist</h3>
              <ul className="space-y-2 text-sm">
                {['Citizenship Certificate', 'Driving License', 'Bank Statement', 'Salary Slip / Income Proof'].map((doc) => {
                  const hasDoc = application.documents?.some(d =>
                    DOCUMENT_TYPES.find(t => t.value === d.document_type)?.label === doc
                  );
                  return (
                    <li key={doc} className="flex items-center">
                      {hasDoc ? (
                        <FaCheckCircle className="text-green-600 mr-2" />
                      ) : (
                        <FaTimesCircle className="text-red-600 mr-2" />
                      )}
                      <span className={hasDoc ? 'text-gray-700' : 'text-red-600'}>
                        {doc} {!hasDoc && '(Missing)'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentVerification;