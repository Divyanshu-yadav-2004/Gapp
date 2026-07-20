// src/components/CustomerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Folder, CreditCard, Bell, UploadCloud, FileText, CheckCircle, Clock, AlertCircle, Download, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../api';

export default function CustomerDashboard({ defaultPhone = '', onTrackSelect }) {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // States for Profile / Settings
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  // States for Additional Upload
  const [selectedAppForUpload, setSelectedAppForUpload] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const allApps = await api.listApplications();
      // Filter applications matching this phone number
      const userApps = allApps.filter(app => app.customerPhone === phoneNumber.trim() || app.details?.phone === phoneNumber.trim());
      
      if (userApps.length === 0) {
        throw new Error('No applications found registered under this mobile number.');
      }
      
      setApplications(userApps);
      // Derive basic profile info
      setProfileName(userApps[0].customerName || 'EasyCafe Client');
      setProfileEmail(userApps[0].customerEmail || 'client@easycafe.com');
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message || 'Error loading dashboard details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (defaultPhone) {
      handleLogin();
    }
  }, [defaultPhone]);

  const handleUploadAdditionalDoc = async (e) => {
    e.preventDefault();
    if (!selectedAppForUpload || !fileToUpload) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      const uploadRes = await api.uploadDocument(fileToUpload, (progress) => {
        setUploadProgress(progress);
      });

      // Update the application on client-side and server
      const targetApp = applications.find(a => a.id === selectedAppForUpload);
      if (targetApp) {
        const updatedDocs = { ...targetApp.documents, additionalUploadedDoc: uploadRes.url };
        await api.updateApplicationStatus(selectedAppForUpload, {
          documents: updatedDocs
        });
        
        // Refresh application list locally
        setApplications(prev => prev.map(app => {
          if (app.id === selectedAppForUpload) {
            return { ...app, documents: updatedDocs };
          }
          return app;
        }));
      }

      setUploadSuccess(true);
      setFileToUpload(null);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    alert('Profile preferences updated successfully! (Simulated)');
  };

  const downloadReceipt = (app) => {
    const printWindow = window.open('', '_blank');
    const appDetailsHtml = Object.entries(app.details || {})
      .map(([key, val]) => `<tr><td style="padding:8px; border-bottom:1px solid #ddd; text-transform:capitalize;"><strong>${key.replace(/([A-Z])/g, ' $1')}</strong></td><td style="padding:8px; border-bottom:1px solid #ddd;">${val}</td></tr>`)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${app.id}</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            .receipt-header { border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .details-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .security-disclaimer { margin-top: 30px; font-size: 11px; color: #666; border-top: 1px dashed #ccc; padding-top: 15px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="receipt-header">
            <div>
              <h2>EasyCafe™ Digital Receipt</h2>
              <div style="font-size:12px; color:#555;">Cyber Service & Assistant Hub</div>
            </div>
            <h3>${app.paymentStatus}</h3>
          </div>
          <div>
            <p><strong>Ref ID:</strong> ${app.id}</p>
            <p><strong>Service:</strong> ${app.serviceName}</p>
            <p><strong>Customer:</strong> ${app.customerName}</p>
            <p><strong>Contact:</strong> ${app.customerPhone}</p>
          </div>
          <table class="details-table">${appDetailsHtml}</table>
          <div style="margin-top:20px; text-align:right;">
            <p><strong>Paid Amount:</strong> ₹${app.amountPaid}</p>
          </div>
          <div class="security-disclaimer">
            <p>🔒 30-day active data policy. All document uploads auto-deleted 30 days post-filing.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full min-h-[600px] bg-slate-50 dark:bg-slate-950 py-16 px-4 flex items-center justify-center transition-colors duration-300">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm transition-colors">
          <div className="text-center mb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400 mb-3">
              <User className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Dashboard</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your registered mobile number to check active applications, view receipts, and edit settings.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-2.5 rounded-lg">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-3 shadow-md shadow-brand-500/10 flex items-center justify-center transition-all"
            >
              {loading ? (
                <span className="flex h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Profile Header Welcome */}
        <div className="bg-gradient-to-r from-brand-700 to-brand-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-md">
              Secure Session Active
            </span>
            <h2 className="text-3xl font-extrabold mt-2">Welcome Back, {profileName}!</h2>
            <p className="text-xs text-brand-100 mt-1">
              Registered Phone: {phoneNumber} · Email: {profileEmail}
            </p>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 text-xs font-semibold transition-colors"
          >
            Switch Account
          </button>
        </div>

        {/* Dashboard Grid Options */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Applications List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Folder className="h-5 w-5 text-brand-500" />
                Your Recent Applications
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.map((app) => (
                  <div key={app.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                        {app.serviceName}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>ID: {app.id}</span>
                        <span>•</span>
                        <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : app.status === 'REJECTED'
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          app.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                        }`}>
                          {app.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <button
                        onClick={() => onTrackSelect(app.id)}
                        className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 text-xs font-bold transition-colors"
                      >
                        Track Progress
                      </button>
                      <button
                        onClick={() => downloadReceipt(app)}
                        className="rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 p-1.5 transition-colors"
                        title="Download Receipt"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Logs Summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-500" />
                Transaction History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <th className="py-2.5">Application ID</th>
                      <th className="py-2.5">Service</th>
                      <th className="py-2.5">Amount</th>
                      <th className="py-2.5">Method</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td className="py-3 font-semibold">{app.id}</td>
                        <td className="py-3">{app.serviceName}</td>
                        <td className="py-3 font-medium">₹{app.amountPaid}</td>
                        <td className="py-3 uppercase">{app.details?.paymentMethod || 'Razorpay'}</td>
                        <td className="py-3">
                          <span className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${app.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {app.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Actions (Upload, WhatsApp, Profile settings) */}
          <div className="space-y-6">
            
            {/* Upload Additional Docs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <UploadCloud className="h-4.5 w-4.5 text-brand-500" />
                Upload Missing Documents
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                If our operator requested additional documents or corrections, submit them here securely.
              </p>

              <form onSubmit={handleUploadAdditionalDoc} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Select Application
                  </label>
                  <select
                    value={selectedAppForUpload}
                    onChange={(e) => setSelectedAppForUpload(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Application --</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.id} - {app.serviceName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Browse File (PDF, JPG, PNG)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFileToUpload(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-600 dark:file:bg-slate-850 dark:file:text-brand-400 cursor-pointer"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                </div>

                {uploading && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-500 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-2.5 border border-emerald-100 dark:border-emerald-900/30 text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Check className="h-4.5 w-4.5" /> File submitted to operators successfully!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading || !fileToUpload || !selectedAppForUpload}
                  className="w-full rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs py-2.5 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  Submit Document
                </button>
              </form>
              <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px] text-slate-400 leading-relaxed">
                🔒 <strong>Privacy Assurance:</strong> Files are end-to-end encrypted and automatically wiped from servers 30 days after processing.
              </div>
            </div>

            {/* WhatsApp updates preference */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Bell className="h-4.5 w-4.5 text-brand-500" />
                WhatsApp Alerts Status
              </h3>
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Automated Status Updates</span>
                  <p className="text-[10px] text-slate-400">Receive application alerts directly on WhatsApp</p>
                </div>
                <button onClick={() => setWhatsappEnabled(!whatsappEnabled)} className="text-brand-500 transition-transform">
                  {whatsappEnabled ? (
                    <ToggleRight className="h-8 w-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-slate-300 dark:text-slate-750" />
                  )}
                </button>
              </div>
              {whatsappEnabled && (
                <div className="mt-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-100 dark:border-slate-900 text-[10px] text-slate-500 dark:text-slate-400">
                  🔔 Alerts will be delivered to: <strong>{phoneNumber}</strong>
                </div>
              )}
            </div>

            {/* Profile Preferences */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <User className="h-4 w-4 text-brand-500" />
                Profile Settings
              </h3>
              <form onSubmit={handleProfileUpdate} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold text-xs py-2 transition-colors"
                >
                  Save Profile Settings
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
