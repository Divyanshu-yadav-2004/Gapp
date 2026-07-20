// src/components/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Shield, Download, FileText, Check, X, Search, Filter, MessageCircle, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import api from '../api';

export default function StaffDashboard() {
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Operator actions form states
  const [operatorStatus, setOperatorStatus] = useState('PROCESSING');
  const [operatorComment, setOperatorComment] = useState('');
  const [operatorCertificate, setOperatorCertificate] = useState('');

  const loadData = async () => {
    try {
      const statsRes = await api.getAdminStats();
      const appsRes = await api.listApplications();
      setStats(statsRes);
      setApplications(appsRes);
      setFilteredApps(appsRes);
      if (appsRes.length > 0 && !selectedAppId) {
        setSelectedAppId(appsRes[0].id);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = [...applications];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(app => 
        app.id.toLowerCase().includes(q) ||
        app.customerName.toLowerCase().includes(q) ||
        app.customerPhone.includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(app => app.status === statusFilter);
    }

    setFilteredApps(result);
  }, [searchQuery, statusFilter, applications]);

  const selectedApp = applications.find(a => a.id === selectedAppId);

  // Status mapping for visual styles
  const statusColors = {
    'PENDING_VERIFICATION': 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40',
    'PROCESSING': 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40',
    'APPROVED': 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40',
    'REJECTED': 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40'
  };

  const handleOperatorActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppId) return;

    if (operatorStatus === 'APPROVED' && !operatorCertificate.trim()) {
      alert('Please provide a Certificate/Ref Number for Approved status.');
      return;
    }
    if (operatorStatus === 'REJECTED' && !operatorComment.trim()) {
      alert('Please specify a rejection reason comment for the client.');
      return;
    }

    try {
      await api.updateApplicationStatus(selectedAppId, {
        status: operatorStatus,
        statusComment: operatorComment,
        certificateNumber: operatorCertificate
      });
      alert('Application updated successfully!');
      // Reload details
      loadData();
      setOperatorComment('');
      setOperatorCertificate('');
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  const handleManualPaymentConfirm = async (appId) => {
    if (!window.confirm('Are you sure you want to verify the payment receipt for this application?')) return;
    try {
      await api.confirmPaymentManually(appId, 'MANUAL-' + Date.now());
      alert('Payment confirmed successfully!');
      loadData();
    } catch (err) {
      alert('Confirmation failed: ' + err.message);
    }
  };

  const exportCSV = () => {
    const headers = ['Application ID', 'Customer Name', 'Phone', 'Email', 'Service Name', 'Amount Paid', 'Payment Status', 'Filing Status', 'Certificate Number', 'Created At'];
    const rows = applications.map(app => [
      app.id,
      app.customerName,
      app.customerPhone,
      app.customerEmail,
      app.serviceName,
      app.amountPaid,
      app.paymentStatus,
      app.status,
      app.certificateNumber || '',
      app.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EasyCafe_Filing_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc'];

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Dashboard Title & Actions Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <Shield className="h-4 w-4 text-brand-500" />
              Role: verified_admin_operator · EasyCafe Systems
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Employee Operation Center
            </h2>
          </div>
          <button
            onClick={exportCSV}
            className="self-start md:self-center inline-flex items-center rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs px-4 py-2.5 shadow-md shadow-slate-950/10 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export Registry (.CSV)
          </button>
        </div>

        {/* Stats Summary Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Filings</span>
                <div className="text-2xl font-black text-slate-950 dark:text-white">{stats.total}</div>
                <span className="text-[10px] text-emerald-500 flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> +12.3% this week</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</span>
                <div className="text-2xl font-black text-slate-950 dark:text-white">₹{stats.totalRevenue.toLocaleString()}</div>
                <span className="text-[10px] text-emerald-500 flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> +8.4% auto-PG</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved / Finished</span>
                <div className="text-2xl font-black text-slate-950 dark:text-white">{stats.approved}</div>
                <span className="text-[10px] text-slate-400">Success Rate: {stats.total ? ((stats.approved / stats.total) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Check className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Deliveries</span>
                <div className="text-2xl font-black text-slate-950 dark:text-white">{stats.whatsappDeliveryRate}%</div>
                <span className="text-[10px] text-emerald-500">🟢 Service online & active</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 flex items-center justify-center shrink-0">
                <MessageCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}

        {/* Charts & Analytics Visuals */}
        {stats && stats.revenueByDay && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Revenue Trend Area Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-brand-500" />
                Revenue Analytics Trend (Weekly)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Employee Performance Bar Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <Users className="h-4.5 w-4.5 text-brand-500" />
                Operator Performance Review
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.employeePerformance} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Bar dataKey="processed" fill="#0284c7" radius={[0, 4, 4, 0]}>
                      {stats.employeePerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* List and Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Applications list (Left) */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors flex flex-col h-[600px]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-brand-500" />
              Filing registry
            </h3>
            
            {/* Search inputs */}
            <div className="space-y-2 mb-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search client name/ID..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div className="flex gap-1.5">
                {['ALL', 'PENDING_VERIFICATION', 'PROCESSING', 'APPROVED', 'REJECTED'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${
                      statusFilter === filter
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {filter === 'ALL' ? 'ALL' : filter === 'PENDING_VERIFICATION' ? 'PENDING' : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedAppId === app.id
                      ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/10'
                      : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/50 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">{app.id}</span>
                    <span className={`text-[8.5px] font-bold uppercase border px-1.5 py-0.5 rounded-full ${statusColors[app.status] || ''}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1">{app.customerName}</h4>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                    <span>{app.serviceName}</span>
                    <span>₹{app.amountPaid}</span>
                  </div>
                </div>
              ))}
              {filteredApps.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-10">No applications match criteria.</div>
              )}
            </div>
          </div>

          {/* Details & Operator action pane (Right) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors flex flex-col h-[600px] overflow-y-auto">
            {selectedApp ? (
              <div className="space-y-6">
                
                {/* Details Header */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {selectedApp.customerName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      ID: {selectedApp.id} · Applied: {new Date(selectedApp.createdAt).toLocaleString()} · Service: {selectedApp.serviceName}
                    </p>
                  </div>
                  
                  {/* Manual Payment verification overlay button */}
                  {selectedApp.paymentStatus !== 'Paid' && (
                    <button
                      onClick={() => handleManualPaymentConfirm(selectedApp.id)}
                      className="self-start sm:self-center inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3 py-2 shadow-sm transition-colors"
                    >
                      <Check className="h-4 w-4" /> Confirm UPI Payment
                    </button>
                  )}
                </div>

                {/* Form Fields Details Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Form Data Fields</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-900">
                    {Object.entries(selectedApp.details || {}).map(([key, val]) => (
                      <div key={key} className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wide capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {/* Mask Aadhaar and PAN cards fields for security */}
                          {key.toLowerCase().includes('aadhaar') || key.toLowerCase().includes('pan') 
                            ? (val ? val.replace(/^.{6}/, '******') : 'N/A') 
                            : String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents Upload Download Panel */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Client Uploaded Documents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(selectedApp.documents || {}).map(([docId, docUrl]) => (
                      <div key={docId} className="flex items-center justify-between rounded-lg border border-slate-150 dark:border-slate-800 p-2.5 text-xs bg-white dark:bg-slate-900">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 capitalize">
                          {docId.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                        >
                          <Download className="h-3.5 w-3.5" /> View File
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operator Actions Form */}
                <div className="border-t border-slate-150 dark:border-slate-800 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Operator Actions Portal</h4>
                  <form onSubmit={handleOperatorActionSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Action Filing Status</label>
                        <select
                          value={operatorStatus}
                          onChange={(e) => setOperatorStatus(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2 text-xs text-slate-800 dark:text-slate-150 focus:outline-none"
                        >
                          <option value="PROCESSING">Processing</option>
                          <option value="APPROVED">Approved (Finished)</option>
                          <option value="REJECTED">Rejected (Send back to client)</option>
                        </select>
                      </div>

                      {operatorStatus === 'APPROVED' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Acknowledgement / Certificate Number</label>
                          <input
                            type="text"
                            value={operatorCertificate}
                            onChange={(e) => setOperatorCertificate(e.target.value)}
                            placeholder="e.g. UDYAM-MH-12-0098765"
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1.5">
                        {operatorStatus === 'APPROVED' ? 'Success Remarks' : operatorStatus === 'REJECTED' ? 'Reason for Rejection (Requires detail)' : 'Filing Remarks/Notes'}
                      </label>
                      <textarea
                        value={operatorComment}
                        onChange={(e) => setOperatorComment(e.target.value)}
                        placeholder={operatorStatus === 'APPROVED' ? 'Your certificate has been successfully filed and approved by the department.' : operatorStatus === 'REJECTED' ? 'Please upload a clear copy of Aadhaar. The signature is blurry.' : 'Verification started...'}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none h-20"
                        required={operatorStatus === 'REJECTED'}
                      />
                    </div>

                    <button
                      type="submit"
                      className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-5 py-2.5 shadow-md shadow-brand-500/10 transition-all flex items-center gap-1.5"
                    >
                      <Check className="h-4 w-4" /> Save Operator Status Update
                    </button>
                  </form>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <FileText className="h-10 w-10 text-slate-350 dark:text-slate-700" />
                Select an application from the registry list to verify details and take operator actions.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
