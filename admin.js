// admin.js - Employee Dashboard & Operation Controls
let selectedAppId = null;

// Expose admin init function to app.js role switch
window.initAdminDashboard = async function() {
    await renderAdminStats();
    await renderAdminAppList();
    resetDetailPane();

    // Hook up Socket.IO listener for live dashboard refreshes if not already set up
    if (!window.adminSocketSetupDone && window.io) {
        window.socket = window.io('http://localhost:3000');
        
        window.socket.on('admin:application:new', (data) => {
            console.log('Live new application event received:', data);
            renderAdminStats();
            renderAdminAppList();
            
            // Show dynamic micro-notification banner on the dashboard
            showDashboardLiveAlert(`New Application submitted by ${data.customerName} for ${data.serviceName}!`);
        });

        window.socket.on('admin:payment:success', (data) => {
            console.log('Live new payment success event received:', data);
            renderAdminStats();
            renderAdminAppList();
            
            showDashboardLiveAlert(`💰 Payment of ₹${data.amount} received from ${data.customerName}!`);
        });

        window.socket.on('admin:status:updated', (data) => {
            console.log('Live status update received:', data);
            renderAdminStats();
            renderAdminAppList();
            if (selectedAppId === data.id) {
                renderAppDetailsPane(data.id);
            }
        });

        window.adminSocketSetupDone = true;
    }
};

// Helper status mapping
const statusMapToFrontend = {
    'PENDING_VERIFICATION': 'Pending Verification',
    'PROCESSING': 'Processing',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected'
};

const statusMapToBackend = {
    'Pending Verification': 'PENDING_VERIFICATION',
    'Processing': 'PROCESSING',
    'Approved': 'APPROVED',
    'Rejected': 'REJECTED'
};

// Display a live dynamic alert message on dashboard
function showDashboardLiveAlert(message) {
    const alertBox = document.createElement('div');
    alertBox.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1e1b4b;
        color: #ffffff;
        padding: 14px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        border-left: 4px solid #10b981;
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        z-index: 100000;
        animation: slideInUp 0.3s ease-out;
    `;
    alertBox.textContent = message;
    document.body.appendChild(alertBox);
    setTimeout(() => {
        alertBox.remove();
    }, 4500);
}

// Update top statistics row
async function renderAdminStats() {
    const container = document.getElementById('admin-stats-container');
    if (!container) return;
    
    try {
        const statsData = await window.api.getAdminStats();
        const stats = statsData.stats;
        
        container.innerHTML = `
            <div class="stat-card">
                <label>Total Apps</label>
                <span>${stats.total}</span>
            </div>
            <div class="stat-card" style="border-left: 3px solid var(--warning)">
                <label>Pending Review</label>
                <span style="color: var(--warning)">${stats.pending}</span>
            </div>
            <div class="stat-card" style="border-left: 3px solid var(--primary)">
                <label>Processing</label>
                <span style="color: var(--primary)">${stats.processing}</span>
            </div>
            <div class="stat-card" style="border-left: 3px solid var(--success)">
                <label>Approved</label>
                <span style="color: var(--success)">${stats.approved}</span>
            </div>
            <div class="stat-card revenue">
                <label>Total Revenue</label>
                <span>₹${stats.revenue}</span>
            </div>
        `;
    } catch (error) {
        console.error('Failed to render admin stats:', error);
    }
}

// Render the application list in left table
async function renderAdminAppList() {
    const listBody = document.getElementById('admin-app-list');
    if (!listBody) return;
    
    const searchVal = document.getElementById('admin-search-input').value.toLowerCase().trim();
    const filterStatus = document.getElementById('admin-filter-status').value;
    
    try {
        // Map frontend UI filter values to Backend status strings if not 'all'
        const backendStatus = filterStatus !== 'all' ? (statusMapToBackend[filterStatus] || filterStatus) : 'all';
        const apps = await window.api.listApplications({
            search: searchVal,
            status: backendStatus
        });

        listBody.innerHTML = '';
        if (apps.length === 0) {
            listBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">No applications found.</td></tr>`;
            return;
        }

        apps.forEach(app => {
            const tr = document.createElement('tr');
            if (app.id === selectedAppId) {
                tr.className = 'active-row';
            }
            
            // Date formatting
            const dateStr = new Date(app.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
            });

            // Map status for badge
            const uiStatus = statusMapToFrontend[app.status] || app.status;
            let badgeClass = 'pending';
            if (uiStatus === 'Processing') badgeClass = 'processing';
            else if (uiStatus === 'Approved') badgeClass = 'approved';
            else if (uiStatus === 'Rejected') badgeClass = 'rejected';

            tr.innerHTML = `
                <td>
                    <span class="app-row-id">${app.id}</span>
                    <span class="app-row-date">${dateStr}</span>
                </td>
                <td>
                    <strong>${app.customerName}</strong>
                    <div style="font-size: 11px; color: var(--text-muted)">${app.customerPhone}</div>
                </td>
                <td>${app.serviceName}</td>
                <td>
                    <span class="status-badge ${badgeClass}">${uiStatus}</span>
                </td>
            `;
            tr.addEventListener('click', () => {
                selectApplication(app.id);
            });
            listBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Failed to list applications:', error);
        listBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger); padding: 20px;">Error loading data.</td></tr>`;
    }
}

// Select specific application to inspect
async function selectApplication(id) {
    selectedAppId = id;
    
    // Highlight selected row
    document.querySelectorAll('#admin-app-list tr').forEach(row => {
        row.classList.remove('active-row');
    });
    
    // Find row matching ID and highlight
    const rows = document.querySelectorAll('#admin-app-list tr');
    rows.forEach(row => {
        const rowIdEl = row.querySelector('.app-row-id');
        if (rowIdEl && rowIdEl.textContent === id) {
            row.classList.add('active-row');
        }
    });

    await renderAppDetailsPane(id);
}

// Reset right pane on load or role swap
function resetDetailPane() {
    selectedAppId = null;
    const placeholder = document.getElementById('admin-detail-placeholder');
    const content = document.getElementById('admin-detail-content');
    if (placeholder) placeholder.classList.remove('hidden');
    if (content) content.classList.add('hidden');
}

// Render dynamic fields, uploads, and action forms in details pane
async function renderAppDetailsPane(id) {
    try {
        const app = await window.api.trackApplication(id);
        const placeholder = document.getElementById('admin-detail-placeholder');
        const content = document.getElementById('admin-detail-content');
        
        if (placeholder) placeholder.classList.add('hidden');
        if (content) content.classList.remove('hidden');

        // Load Service schema from window.db config to verify descriptions
        const serviceSchema = window.db.getService(app.service);

        // 1. Details list grid
        let detailsHtml = '';
        if (app.details) {
            for (const key in app.details) {
                const fieldDesc = (serviceSchema && serviceSchema.fields) ? serviceSchema.fields.find(f => f.id === key) : null;
                const labelText = fieldDesc ? fieldDesc.label : key;
                detailsHtml += `
                    <div class="detail-item">
                        <label>${labelText}</label>
                        <span>${app.details[key]}</span>
                    </div>
                `;
            }
        }

        // 2. Documents layout grid
        let docsHtml = '';
        if (app.documents) {
            for (const docId in app.documents) {
                if (docId.endsWith('__name')) continue; // Skip metadata
                const docSchema = (serviceSchema && serviceSchema.documents) ? serviceSchema.documents.find(d => d.id === docId) : null;
                const docLabel = docSchema ? docSchema.label : docId;
                const fileUrl = app.documents[docId];
                
                // Prefix relative backend upload path with host server URL
                const absoluteFileUrl = fileUrl.startsWith('/') ? `http://localhost:3000${fileUrl}` : fileUrl;

                docsHtml += `
                    <div class="doc-viewer-card">
                        <label title="${docLabel}">${docLabel}</label>
                        <div class="doc-preview-frame" onclick="openDocumentModal('${absoluteFileUrl}')">
                            <img src="${absoluteFileUrl}" alt="${docLabel}">
                        </div>
                    </div>
                `;
            }
        }
        
        if (docsHtml === '') {
            docsHtml = `<div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); font-style: italic; border: 1.5px dashed var(--border-color); border-radius: var(--radius-md); background: var(--bg-app); font-size: 13px; width: 100%;">No documents uploaded.</div>`;
        }

        // Map status for UI
        const uiStatus = statusMapToFrontend[app.status] || app.status;
        let badgeClass = 'pending';
        if (uiStatus === 'Processing') badgeClass = 'processing';
        else if (uiStatus === 'Approved') badgeClass = 'approved';
        else if (uiStatus === 'Rejected') badgeClass = 'rejected';

        // Payment details box layout definition
        let paymentStatusHtml = '';
        if (app.amountPaid > 0) {
            const payment = app.payments && app.payments[0];
            const pStatus = payment ? payment.status : 'PENDING';
            let pStatusLabel = pStatus;
            let pStatusBadgeClass = 'pending';
            if (pStatus === 'SENT') {
                pStatusLabel = 'Sent (WhatsApp Confirmed)';
                pStatusBadgeClass = 'processing';
            } else if (pStatus === 'VERIFIED' || pStatus === 'SUCCESS') {
                pStatusLabel = 'Verified & Completed';
                pStatusBadgeClass = 'approved';
            } else if (pStatus === 'REJECTED') {
                pStatusLabel = 'Rejected';
                pStatusBadgeClass = 'rejected';
            } else if (pStatus === 'FAILED') {
                pStatusLabel = 'Failed';
                pStatusBadgeClass = 'rejected';
            }

            // If payment is pending or sent, trigger the seen logger in background
            if (pStatus === 'PENDING' || pStatus === 'SENT') {
                window.api.markAsSeen(app.id).catch(err => console.warn('Failed to log payment seen action:', err.message));
            }

            let actionButtonsHtml = '';
            if (pStatus === 'PENDING' || pStatus === 'SENT') {
                actionButtonsHtml = `
                    <div style="display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
                        <button class="btn btn-success" onclick="verifyAdminPayment('${app.id}')" style="background-color: #059669; border-color: #059669; color: #ffffff; padding: 10px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px;">
                            ✓ Confirm & Verify Payment
                        </button>
                        <button class="btn btn-secondary" onclick="rejectAdminPayment('${app.id}')" style="background-color: #dc2626; border-color: #dc2626; color: #ffffff; padding: 10px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px;">
                            ✗ Reject Payment
                        </button>
                    </div>
                `;
            } else {
                actionButtonsHtml = `
                    <div style="font-size: 12.5px; color: var(--text-muted); font-style: italic; margin-top: 8px;">
                        Manual verification complete. No further actions required.
                    </div>
                `;
            }

            paymentStatusHtml = `
                <div class="detail-info-box" style="border-left: 4px solid #10b981; background: var(--bg-app); padding: 18px; border-radius: var(--radius-md); border: 1.5px solid var(--border-color); border-left-width: 4px;">
                    <h4 style="margin-top: 0; color: var(--text-color); font-size: 14px; margin-bottom: 12px; font-weight: 700;">Payment Verification Center</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 13px; color: var(--text-color);">
                        <div>
                            <span style="color: var(--text-muted); display: block; margin-bottom: 2px;">Fee Amount:</span>
                            <strong style="font-size: 15px; color: var(--primary);">₹${payment ? payment.amount : app.amountPaid}.00</strong>
                        </div>
                        <div>
                            <span style="color: var(--text-muted); display: block; margin-bottom: 2px;">Verification Status:</span>
                            <span class="status-badge ${pStatusBadgeClass}" style="display: inline-block; font-size: 11px;">${pStatusLabel}</span>
                        </div>
                        <div>
                            <span style="color: var(--text-muted); display: block; margin-bottom: 2px;">Transaction Reference:</span>
                            <code style="background: var(--border-color); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11.5px;">${(payment && payment.transactionId) ? payment.transactionId : 'N/A'}</code>
                        </div>
                    </div>
                    ${actionButtonsHtml}
                </div>
            `;
        }

        // Rerender Detail HTML structure
        content.innerHTML = `
            <div class="detail-header">
                <div class="detail-title">
                    <h3>${app.customerName}</h3>
                    <span>ID: <strong>${app.id}</strong> | Applied: ${new Date(app.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <span class="status-badge ${badgeClass}">${uiStatus}</span>
            </div>
            <div class="detail-info-box">
                <h4>Application Information (${app.serviceName})</h4>
                <div class="detail-grid">
                    ${detailsHtml}
                </div>
            </div>
            <div class="detail-info-box">
                <h4>Uploaded Documents (Click to Zoom)</h4>
                <div class="detail-docs-list">
                    ${docsHtml}
                </div>
            </div>
            
            ${paymentStatusHtml}
            
            <!-- Employee Status Action Form -->
            <div class="detail-actions-panel">
                <h4>Change Processing Status</h4>
                <div class="action-form-group">
                    <label>Set Status</label>
                    <select id="action-status-select" onchange="toggleActionFields(this.value)">
                        <option value="Pending Verification" ${uiStatus === 'Pending Verification' ? 'selected' : ''}>Pending Verification</option>
                        <option value="Processing" ${uiStatus === 'Processing' ? 'selected' : ''}>Processing (Gov Portal Submit)</option>
                        <option value="Approved" ${uiStatus === 'Approved' ? 'selected' : ''}>Approved & Ready (Certificate Issued)</option>
                        <option value="Rejected" ${uiStatus === 'Rejected' ? 'selected' : ''}>Rejected (Needs Correction)</option>
                    </select>
                </div>
                <!-- Dynamic field for Approval Certificate Number -->
                <div class="action-form-group ${uiStatus !== 'Approved' ? 'hidden' : ''}" id="group-cert-no">
                    <label>Gov Receipt/Acknowledgement/Certificate Number</label>
                    <input type="text" id="action-cert-no" placeholder="e.g. UDYAM-MP-26-00341" value="${app.certificateNumber || ''}">
                </div>
                <!-- Comment box -->
                <div class="action-form-group">
                    <label id="label-action-comment">Remarks / Message to Client</label>
                    <textarea id="action-comment" rows="2" placeholder="e.g. Aadhaar copy is blurry, please re-upload.">${app.statusComment || ''}</textarea>
                </div>
                <div class="action-row-buttons">
                    <button class="btn btn-primary" onclick="submitOperatorAction('${app.id}')">
                        Update Status & Alert Client
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load application detail:', error);
    }
}

// Toggle fields in actions form based on status selections
function toggleActionFields(statusVal) {
    const certGroup = document.getElementById('group-cert-no');
    const commentLabel = document.getElementById('label-action-comment');
    const commentArea = document.getElementById('action-comment');
    
    if (!certGroup || !commentLabel || !commentArea) return;

    if (statusVal === 'Approved') {
        certGroup.classList.remove('hidden');
        commentLabel.textContent = "Success Notes (Will display on client receipt)";
        commentArea.placeholder = "Your document has been submitted and generated. You can download it using the reference ID.";
    } else if (statusVal === 'Rejected') {
        certGroup.classList.add('hidden');
        commentLabel.textContent = "Rejection Reason (Client will see this to fix issues)";
        commentArea.placeholder = "Please re-upload a clear photograph. The current one is cropped.";
    } else {
        certGroup.classList.add('hidden');
        commentLabel.textContent = "Remarks";
        commentArea.placeholder = "Checking status on regional MSME registry.";
    }
}

// Submit operator status action
async function submitOperatorAction(id) {
    const statusSelect = document.getElementById('action-status-select');
    const certInput = document.getElementById('action-cert-no');
    const commentArea = document.getElementById('action-comment');
    
    const uiStatus = statusSelect.value;
    const comment = commentArea.value.trim();
    const certNo = certInput ? certInput.value.trim() : '';
    
    if (uiStatus === 'Approved' && !certNo) {
        alert('Please enter an Acknowledgement or Certificate Number for approved requests.');
        return;
    }
    if (uiStatus === 'Rejected' && !comment) {
        alert('Please enter a rejection reason/comment to guide the applicant.');
        return;
    }

    try {
        const backendStatus = statusMapToBackend[uiStatus] || uiStatus;
        await window.api.updateApplicationStatus(id, {
            status: backendStatus,
            statusComment: comment,
            certificateNumber: certNo
        });

        // Refresh lists
        await renderAdminStats();
        await renderAdminAppList();
        await renderAppDetailsPane(id);
        alert(`Application ${id} updated to "${uiStatus}" successfully!`);
    } catch (err) {
        alert('Failed to update status: ' + err.message);
    }
}

// Export CSV report trigger
function exportAdminReport() {
    if (!window.api.isAdminAuthenticated()) {
        alert('Please sign in first.');
        return;
    }
    window.location.href = window.api.getExportCsvUrl();
}

// Zoom document details view in modal
function openDocumentModal(url) {
    const viewer = window.open();
    viewer.document.write(`
        <html>
            <head>
                <title>Document Preview</title>
                <style>
                    body { margin: 0; background: #0b0f19; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
                    img { max-width: 95%; max-height: 95%; object-fit: contain; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border-radius: 8px; }
                </style>
            </head>
            <body>
                <img src="${url}">
            </body>
        </html>
    `);
}

// Verify manual payment
async function verifyAdminPayment(appId) {
    if (!confirm('Are you sure you want to verify and confirm this payment manually? This will mark the payment as Completed and send the receipt emails.')) {
        return;
    }
    try {
        await window.api.confirmPaymentManually(appId);
        alert('Payment verified and confirmed successfully!');
        await window.initAdminDashboard();
        if (selectedAppId === appId) {
            await renderAppDetailsPane(appId);
        }
    } catch (err) {
        alert('Failed to verify payment: ' + err.message);
    }
}

// Reject manual payment
async function rejectAdminPayment(appId) {
    if (!confirm('Are you sure you want to reject this payment request?')) {
        return;
    }
    try {
        await window.api.rejectPaymentManually(appId);
        alert('Payment request rejected successfully.');
        await window.initAdminDashboard();
        if (selectedAppId === appId) {
            await renderAppDetailsPane(appId);
        }
    } catch (err) {
        alert('Failed to reject payment: ' + err.message);
    }
}