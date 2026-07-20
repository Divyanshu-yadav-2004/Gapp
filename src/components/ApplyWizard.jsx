// src/components/ApplyWizard.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Check, Shield, FileText, UploadCloud, AlertCircle, ArrowLeft, ArrowRight, Smartphone, CreditCard, ChevronRight, Lock } from 'lucide-react';
import { SERVICES, SAMAGRA_SERVICES, GUMASTA_SERVICES, LOAN_SERVICES, getPANDocuments, getGumastaDocuments } from '../servicesData';
import api from '../api';

// Simple helper to get service definition
function getServiceDetails(serviceId) {
  return SERVICES[serviceId] || 
         SAMAGRA_SERVICES[serviceId] || 
         GUMASTA_SERVICES[serviceId] || 
         LOAN_SERVICES[serviceId];
}

export default function ApplyWizard({ serviceId, onBack, onComplete }) {
  const service = getServiceDetails(serviceId);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [whatsappConfirm, setWhatsappConfirm] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('gateway');
  const [manualUpiTxn, setManualUpiTxn] = useState('');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Zod Validation Schema Setup
  const buildZodSchema = () => {
    const shape = {};
    const fields = service?.fields || [];
    
    fields.forEach(field => {
      let validator = zod.string();
      
      if (field.required) {
        validator = validator.min(1, `${field.label} is required`);
      } else {
        validator = validator.optional().or(zod.literal(''));
      }

      if (field.type === 'email') {
        validator = zod.string().email('Invalid email address');
      }

      if (field.id === 'phone' || field.id === 'aadhaarRegisteredMobile') {
        validator = zod.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits');
      }

      if (field.id === 'aadhaarNo') {
        validator = zod.string().regex(/^[0-9]{12}$/, 'Aadhaar number must be exactly 12 digits');
      }

      if (field.id === 'existingPanNumber' || field.id === 'businessPan') {
        validator = zod.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Card Number format');
      }

      shape[field.id] = validator;
    });

    return zod.object(shape);
  };

  const schema = buildZodSchema();
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: formData
  });

  const watchedPanType = watch('applicationType');
  const watchedPartnerCount = watch('partnerCount');

  // Load payment config
  useEffect(() => {
    api.getPaymentConfig().then(setPaymentConfig);
  }, []);

  // Compute dynamic documents list
  const getRequiredDocs = () => {
    if (serviceId === 'pan') {
      return getPANDocuments(watchedPanType || 'New PAN Card');
    }
    if (serviceId === 'gumasta') {
      const type = formData.businessCategory ? 'Partnership Firm' : 'Individual Proprietorship';
      return getGumastaDocuments(type, watchedPartnerCount || 2);
    }
    return service?.documents || [];
  };

  const requiredDocs = getRequiredDocs();

  const handleStep1Submit = (data) => {
    setFormData(data);
    setStep(2);
    toast.success('Form details saved successfully.');
  };

  const handleFileSelect = async (fieldId, file) => {
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    setUploadProgress(prev => ({ ...prev, [fieldId]: 0 }));
    try {
      const uploadRes = await api.uploadDocument(file, (progress) => {
        setUploadProgress(prev => ({ ...prev, [fieldId]: progress }));
      });
      setUploadedFiles(prev => ({ ...prev, [fieldId]: uploadRes.url }));
      toast.success(`${file.name} uploaded safely.`);
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    }
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    // Validate that all required files have been uploaded
    const missing = requiredDocs.filter(doc => doc.required && !uploadedFiles[doc.id]);
    if (missing.length > 0) {
      toast.error(`Please upload all required files: ${missing.map(m => m.label).join(', ')}`);
      return;
    }
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Assemble full payload
      const payload = {
        service: serviceId,
        serviceName: service.name,
        customerName: formData.fullName || formData.ownerName || formData.familyHead || 'Client',
        customerPhone: formData.phone || formData.aadhaarRegisteredMobile || '',
        customerEmail: formData.email || '',
        details: {
          ...formData,
          paymentMethod,
          manualUpiTxn: paymentMethod === 'upi_qr' ? manualUpiTxn : ''
        },
        documents: uploadedFiles,
        amountPaid: service.fee,
        paymentStatus: service.fee === 0 ? 'Inquiry' : (paymentMethod === 'gateway' ? 'Paid' : 'Pending Verification'),
        whatsappUpdates: whatsappConfirm,
        whatsappNumber: whatsappConfirm ? whatsappPhone : ''
      };

      const result = await api.submitApplication(payload);
      
      toast.success('Application filed successfully!');
      onComplete(result);
    } catch (err) {
      toast.error('Submission failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formFields = service?.fields || [];

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl transition-colors">
        
        {/* Wizard Header bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 mb-8">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{service.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Filing Assistant Wizard</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span className={step >= 1 ? 'text-brand-600 dark:text-brand-400 font-bold' : ''}>1. Info</span>
            <ChevronRight className="h-3 w-3" />
            <span className={step >= 2 ? 'text-brand-600 dark:text-brand-400 font-bold' : ''}>2. Uploads</span>
            <ChevronRight className="h-3 w-3" />
            <span className={step >= 3 ? 'text-brand-600 dark:text-brand-400 font-bold' : ''}>3. Review</span>
            <ChevronRight className="h-3 w-3" />
            <span className={step >= 4 ? 'text-brand-600 dark:text-brand-400 font-bold' : ''}>4. Payment</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Form Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSubmit(handleStep1Submit)} className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    Enter Required Application Details
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Please ensure details match your official documents.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {formFields.map((field) => (
                    <div key={field.id} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      
                      {field.type === 'select' ? (
                        <select
                          {...register(field.id)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-3 text-sm text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                        >
                          <option value="">-- Select Option --</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          {...register(field.id)}
                          placeholder={field.placeholder || `Enter ${field.label}...`}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors h-24"
                        />
                      ) : (
                        <input
                          type={field.type}
                          {...register(field.id)}
                          placeholder={field.placeholder || `Enter ${field.label}...`}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                        />
                      )}

                      {errors[field.id] && (
                        <span className="text-xs text-red-500 font-medium mt-1.5 block">
                          ⚠️ {errors[field.id].message}
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {formFields.length === 0 && (
                    <div className="sm:col-span-2 text-center text-xs text-slate-400 py-6">
                      No text inputs needed. Proceed directly to the document uploads step.
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={onBack}
                    className="rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-semibold text-sm px-5 py-3 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-3 shadow-md shadow-brand-500/10 flex items-center gap-1.5 transition-all"
                  >
                    Save & Continue
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 2: Upload Documents */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleStep2Submit} className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UploadCloud className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    Upload Documents (Identity & Verification)
                  </h3>
                  <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 p-4 border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-700 dark:text-emerald-400 flex gap-2.5 mt-3 leading-relaxed">
                    <Lock className="h-5 w-5 shrink-0" />
                    <span>
                      <strong>🔒 Document Privacy:</strong> Your files are protected using end-to-end industry encryption. Uploaded documents are automatically and permanently deleted from our active processing servers 30 days after filing.
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {requiredDocs.map((doc) => (
                    <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-150 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-950/20">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {doc.label} {doc.required && <span className="text-red-500">*</span>}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Format: PDF, JPG, PNG (Max 5MB) · {doc.note || 'Required for filing'}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        {uploadedFiles[doc.id] ? (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="h-4.5 w-4.5" /> Uploaded
                          </span>
                        ) : uploadProgress[doc.id] !== undefined ? (
                          <div className="w-24 text-right">
                            <span className="text-[10px] text-slate-405 font-bold mr-1">{uploadProgress[doc.id]}%</span>
                            <span className="inline-block h-2 w-12 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <span className="block h-full bg-brand-500" style={{ width: `${uploadProgress[doc.id]}%` }} />
                            </span>
                          </div>
                        ) : null}

                        <label className="rounded-lg bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 cursor-pointer shadow-sm">
                          Browse
                          <input
                            type="file"
                            onChange={(e) => handleFileSelect(doc.id, e.target.files[0])}
                            className="hidden"
                            accept={doc.accept || '.pdf,.jpg,.jpeg,.png'}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-semibold text-sm px-5 py-3 transition-colors"
                  >
                    Back to Info
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-3 shadow-md shadow-brand-500/10 flex items-center gap-1.5 transition-all"
                  >
                    Continue to Review
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 3: Review Details & WhatsApp Updates */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    Review Details & WhatsApp Notifications
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Review your entries before making simulated payment.</p>
                </div>

                {/* Data Summary Grid */}
                <div className="rounded-2xl border border-slate-150 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-950/20 p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/50 dark:border-slate-800 pb-2">Form Data Summary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
                    {Object.entries(formData).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-[10px] font-bold text-slate-405 dark:text-slate-550 uppercase tracking-wide capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{String(val)}</p>
                      </div>
                    ))}
                  </div>

                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/50 dark:border-slate-800 pb-2 pt-2">Uploaded Attachments</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.keys(uploadedFiles).map((fileId) => (
                      <div key={fileId} className="flex items-center gap-1.5 text-slate-650 dark:text-slate-350">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="capitalize">{fileId.replace(/([A-Z])/g, ' $1')} file uploaded</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp Subscription */}
                <div className="p-5 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="whatsapp-cb"
                      checked={whatsappConfirm}
                      onChange={(e) => {
                        setWhatsappConfirm(e.target.checked);
                        if (e.target.checked) {
                          setWhatsappPhone(formData.phone || '');
                        }
                      }}
                      className="mt-1 h-4 w-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="whatsapp-cb" className="text-xs font-bold text-slate-850 dark:text-slate-200 cursor-pointer select-none">
                        💬 Receive automated status updates directly via WhatsApp
                      </label>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Get instant alerts (e.g. "Your PAN application has been verified by operators and submitted to the department").
                      </p>
                    </div>
                  </div>

                  {whatsappConfirm && (
                    <div className="pl-7 space-y-2 animate-fadeIn">
                      <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                        Confirm WhatsApp Phone Number
                      </label>
                      <div className="relative max-w-sm">
                        <Smartphone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                        <input
                          type="tel"
                          value={whatsappPhone}
                          onChange={(e) => setWhatsappPhone(e.target.value)}
                          placeholder="10-digit number"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 pl-10 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-semibold text-sm px-5 py-3 transition-colors"
                  >
                    Back to Uploads
                  </button>
                  <button
                    onClick={() => {
                      if (service.fee === 0) {
                        // Loan services are free - submit directly!
                        handleFinalSubmit();
                      } else {
                        setStep(4);
                      }
                    }}
                    className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-3 shadow-md shadow-brand-500/10 flex items-center gap-1.5 transition-all"
                  >
                    {service.fee === 0 ? 'Submit Inquiry' : 'Proceed to Checkout'}
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Payment Simulation */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    Payment Checkout (Simulation)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Complete your service checkout fee to begin manual filing.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-850 p-6 flex flex-col sm:flex-row justify-between items-center bg-slate-50 dark:bg-slate-950/20 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Fee due</span>
                    <h4 className="text-2xl font-black text-slate-955 dark:text-white mt-1">₹{service.fee}</h4>
                  </div>
                  <div className="text-xs text-slate-400 text-right">
                    Includes GST and cyber cafe filing charges.
                  </div>
                </div>

                {/* Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('gateway')}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'gateway'
                        ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/10'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <Smartphone className="h-6 w-6 text-brand-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-355">Instant Razorpay Gateway</span>
                    <span className="text-[9px] text-slate-400">Card, Netbanking, Auto-UPI</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('upi_qr')}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'upi_qr'
                        ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/10'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <CreditCard className="h-6 w-6 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-355">Manual QR Scan Code</span>
                    <span className="text-[9px] text-slate-400">Scan & paste Reference Txn ID</span>
                  </button>
                </div>

                {/* Gateway Simulation */}
                {paymentMethod === 'gateway' && (
                  <div className="rounded-xl border border-slate-150 p-4 bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800 text-center space-y-3">
                    <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                      We simulate a secure gateway payment. Clicking **Verify Payment** below will instantly authorize the payment and send the application to the operator verification queue.
                    </p>
                  </div>
                )}

                {/* Manual UPI QR code scan */}
                {paymentMethod === 'upi_qr' && paymentConfig && (
                  <div className="rounded-xl border border-slate-150 p-5 bg-white dark:bg-slate-900 dark:border-slate-800 space-y-4 animate-fadeIn">
                    <div className="text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">UPI PAYEE DETAILS</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-205">{paymentConfig.payeeName}</p>
                      <p className="font-mono text-xs text-brand-650 dark:text-brand-400 font-bold">{paymentConfig.upiId}</p>
                    </div>

                    <div className="flex justify-center py-2">
                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1.5">
                        <img 
                          src="/assets/paytm_qr.jpg" 
                          alt="Paytm QR Code" 
                          className="h-32 w-32 object-contain"
                          onError={(e) => {
                            // Fallback if image doesn't load or isn't copied yet
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="hidden text-xs text-slate-500 text-center font-semibold">
                          [QR Image Placeholder]<br/>Scan: {paymentConfig.upiId}
                        </div>
                        <span className="text-[9px] text-slate-400">Pay using any UPI App (GPay/PhonePe)</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                        Enter UPI Transaction Reference Number (12 Digits)
                      </label>
                      <input
                        type="text"
                        value={manualUpiTxn}
                        onChange={(e) => setManualUpiTxn(e.target.value)}
                        placeholder="e.g. 192837465092"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        maxLength={12}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-semibold text-sm px-5 py-3 transition-colors"
                  >
                    Back to Review
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting || (paymentMethod === 'upi_qr' && manualUpiTxn.length !== 12)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-3 shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Verify Payment & Submit'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
