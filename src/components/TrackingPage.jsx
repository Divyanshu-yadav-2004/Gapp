// src/components/TrackingPage.jsx
import React, { useState } from 'react';
import { Search, Calendar, FileText, CheckCircle, Clock, AlertTriangle, Download, ArrowLeft } from 'lucide-react';
import api from '../api';

export default function TrackingPage({ defaultSearchId = '', onBack }) {
  const [searchQuery, setSearchQuery] = useState(defaultSearchId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setApplication(null);

    try {
      const data = await api.trackApplication(searchQuery.trim());
      setApplication(data);
    } catch (err) {
      setError(err.message || 'No application found with the provided details.');
    } finally {
      setLoading(false);
    }
  };

  // Run search on mount if defaultSearchId is supplied
  React.useEffect(() => {
    if (defaultSearchId) {
      handleSearch();
    }
  }, [defaultSearchId]);

  const getStatusSteps = (status) => {
    const steps = [
      { label: 'Application Submitted', desc: 'Received in our system', active: true },
      { label: 'Documents Verified', desc: 'Checked by operators', active: false },
      { label: 'Processing', desc: 'Filing details aligned', active: false },
      { label: 'Submitted to Department', desc: 'Forwarded to Govt portal', active: false },
      { label: 'Completed', desc: 'Certificate generated', active: false }
    ];

    const s = status ? status.toUpperCase() : '';
    if (s === 'PENDING_VERIFICATION') {
      steps[0].active = true;
    } else if (s === 'PROCESSING') {
      steps[0].active = true;
      steps[1].active = true;
      steps[2].active = true;
    } else if (s === 'APPROVED') {
      steps[0].active = true;
      steps[1].active = true;
      steps[2].active = true;
      steps[3].active = true;
      steps[4].active = true;
    } else if (s === 'REJECTED') {
      steps[0].active = true;
      // Rejection is a termination, we can show first step only and an alert
    }
    return steps;
  };

  const downloadReceipt = () => {
    if (!application) return;
    const printWindow = window.open('', '_blank');
    const appDetailsHtml = Object.entries(application.details || {})
      .map(([key, val]) => `<tr><td style="padding:8px; border-bottom:1px solid #ddd; text-transform:capitalize;"><strong>${key.replace(/([A-Z])/g, ' $1')}</strong></td><td style="padding:8px; border-bottom:1px solid #ddd;">${val}</td></tr>`)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${application.id}</title>
          <style>
            body { font-family: 'Outfit', sans-serif; color: #333; margin: 40px; line-height: 1.5; }
            .receipt-header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .receipt-title { font-size: 24px; font-weight: bold; color: #0c4a6e; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; background: #e0f2fe; color: #0369a1; }
            .badge-success { background: #d1fae5; color: #047857; }
            .details-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .security-disclaimer { margin-top: 30px; font-size: 11px; color: #666; border-top: 1px dashed #ccc; padding-top: 15px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="receipt-header">
            <div>
              <div class="receipt-title">EasyCafe™ Digital Receipt</div>
              <div style="font-size:12px; color:#555;">Smart Cyber Assistant Services</div>
            </div>
            <div class="badge ${application.paymentStatus === 'Paid' ? 'badge-success' : ''}">${application.paymentStatus}</div>
          </div>
          <div>
            <p><strong>Receipt ID:</strong> REC-${application.id}</p>
            <p><strong>Application Ref ID:</strong> ${application.id}</p>
            <p><strong>Date & Time:</strong> ${new Date(application.createdAt).toLocaleString()}</p>
            <p><strong>Service Applied:</strong> ${application.serviceName}</p>
            <p><strong>Customer Name:</strong> ${application.customerName}</p>
            <p><strong>Contact Phone:</strong> ${application.customerPhone}</p>
          </div>
          <h3 style="margin-top: 25px; color: #0c4a6e;">Submitted Forms & Data Details</h3>
          <table class="details-table">
            ${appDetailsHtml}
          </table>
          <div style="margin-top:20px; text-align:right;">
            <p><strong>Application Fee:</strong> ₹${application.amountPaid}</p>
            <p style="font-size:16px; color:#0284c7;"><strong>Net Amount Paid:</strong> ₹${application.amountPaid}</p>
          </div>
          <div class="security-disclaimer">
            <p>🔒 <strong>Data Protection:</strong> All records are end-to-end encrypted. In accordance with our security guidelines, user document attachments will be wiped completely from EasyCafe active servers 30 days after the final completion date.</p>
            <p style="font-style:italic; font-size:10px;">Disclaimer: EasyCafe is an independent cyber consultancy. It is not affiliated with any government department or official authority.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        )}

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Track Application Status
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Check the live progress of your government card filings using your ID or Mobile Number.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-8 transition-colors">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Application ID (e.g. EC-2026-98104) or Registered Mobile..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 pl-11 pr-4 py-3.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-3.5 shadow-md shadow-brand-500/10 flex items-center justify-center transition-all"
            >
              {loading ? (
                <span className="flex h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Fetch Status'
              )}
            </button>
          </form>
          {error && (
            <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3 flex gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Status Layout */}
        {application && (
          <div className="space-y-6">
            {/* Quick Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 px-2 py-0.5 rounded-md">
                  {application.serviceName}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
                  {application.id}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                    application.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : application.status === 'REJECTED'
                      ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
                  }`}>
                    {application.status.replace('_', ' ')}
                  </span>
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 pt-1.5">
                  <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Client: {application.customerName}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Date: {new Date(application.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadReceipt}
                  className="rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Receipt
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm transition-colors">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">
                Application Timeline
              </h4>

              {/* Progress Steps */}
              {application.status === 'REJECTED' ? (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4 flex gap-3 text-red-700 dark:text-red-400 text-xs leading-relaxed">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-sm">Application Rejected by Operator</h5>
                    <p className="mt-1 font-medium">Rejection Reason: "{application.statusComment || 'Please provide clear documents.'}"</p>
                    <p className="mt-1 text-[11px] text-red-500">How to resolve: Please initiate a new application with the correct details, or visit our support chatbot for assistance.</p>
                  </div>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 border-l-2 border-slate-100 dark:border-slate-800/80">
                  {getStatusSteps(application.status).map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Indicator Dot */}
                      <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white dark:bg-slate-900 transition-colors ${
                        step.active
                          ? 'border-brand-500 bg-brand-500 dark:border-brand-400 dark:bg-brand-400 text-white'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}>
                        {step.active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h5 className={`text-sm font-semibold transition-colors ${step.active ? 'text-slate-950 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                            {step.label}
                          </h5>
                          <p className={`text-xs mt-0.5 transition-colors ${step.active ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>
                            {step.desc}
                          </p>
                        </div>
                        {step.active && idx === 4 && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                            <CheckCircle className="h-4.5 w-4.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Timing Estimation Banner */}
              {application.status !== 'APPROVED' && application.status !== 'REJECTED' && (
                <div className="mt-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 p-4 flex gap-3 text-slate-500 dark:text-slate-400 text-xs">
                  <Clock className="h-4.5 w-4.5 text-brand-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Estimated Completion Time:</span> {application.completionTimeline || '3 to 5 working days'}.
                    <p className="mt-0.5 text-[11px] text-slate-400">Timelines are estimated based on departmental approvals and general holidays. You will receive updates via SMS/WhatsApp.</p>
                  </div>
                </div>
              )}

              {/* Generated Document / Certificate details */}
              {application.status === 'APPROVED' && (
                <div className="mt-8 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 text-emerald-800 dark:text-emerald-400 text-xs">
                  <h5 className="font-bold text-sm flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" />
                    Certificate Generated!
                  </h5>
                  <p className="mt-1 font-medium">Your document application was successfully processed and approved by the department.</p>
                  {application.certificateNumber && (
                    <div className="mt-2.5 inline-flex items-center gap-2 rounded-md bg-white border border-emerald-200 px-3 py-1.5 font-mono text-xs dark:bg-slate-900 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                      <strong>Ref No:</strong> {application.certificateNumber}
                    </div>
                  )}
                  {application.statusComment && (
                    <p className="mt-2 text-emerald-600 dark:text-emerald-500 italic">Operator Notes: "{application.statusComment}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
