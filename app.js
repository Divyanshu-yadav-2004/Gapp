// app.js - Customer Wizard Flow & Client View Routing
let currentService = null;
let currentStep = 1;
let uploadedFiles = {}; // Maps upload field ID to upload URL
let selectedPayMethod = 'gateway';
let selectedSamagraServiceKey = 'kyc';
let selectedPanServiceKey = 'new';
let selectedGumastaServiceKey = 'individual';
let currentOrderId = null;
let currentApplicationId = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    renderServicesGrid();
    setupGlobalSearchListener();
    setupPinInputListener();
    
    // Initialize socket connection for real-time status updates
    if (window.io) {
        window.socket = window.io('http://localhost:3000');
        window.socket.on('status:updated', (data) => {
            console.log('Real-time status update received:', data);
            // If the tracking panel is open and matching this application ID, update the UI live!
            const trackingContainer = document.getElementById('tracking-result-container');
            const searchInput = document.getElementById('track-search-input');
            if (trackingContainer && !trackingContainer.classList.contains('hidden') && searchInput && searchInput.value.trim() === data.id) {
                handleHeaderSearch(); // Reload tracking view live!
            }
        });
    }

    // Auto-login check
    if (window.api.isAdminAuthenticated()) {
        document.body.classList.add('admin-mode-active');
        const labelCust = document.getElementById('label-customer');
        const labelEmp = document.getElementById('label-employee');
        if (labelCust) labelCust.classList.remove('active-role');
        if (labelEmp) labelEmp.classList.add('active-role');
    }
});

// View routing helper
function navigateTo(sectionId) {
    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
    });
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
 
// Role toggle switch triggers authentication check
function toggleRole() {
    const isCurrentlyEmployee = document.body.classList.contains('admin-mode-active');
    const labelCust = document.getElementById('label-customer');
    const labelEmp = document.getElementById('label-employee');
    
    if (isCurrentlyEmployee) {
        window.api.logout();
        document.body.classList.remove('admin-mode-active');
        labelCust.classList.add('active-role');
        labelEmp.classList.remove('active-role');
        navigateTo('customer-landing');
    } else {
        openAuthModal();
    }
}

// Open Owner Lock Modal
function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    const emailInput = document.getElementById('auth-email-input');
    const passInput = document.getElementById('auth-password-input');
    const errMsg = document.getElementById('auth-error-msg');
    
    if(emailInput) emailInput.value = '';
    if(passInput) passInput.value = '';
    if(errMsg) errMsg.classList.add('hidden');
    if(modal) modal.classList.remove('hidden');
    if(emailInput) setTimeout(() => emailInput.focus(), 100);
}

// Close Owner Lock Modal
function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if(modal) modal.classList.add('hidden');
}

// Verify entered credentials
async function verifyOwnerPin() {
    const email    = (document.getElementById('auth-email-input')?.value    || '').trim();
    const password = (document.getElementById('auth-password-input')?.value || '');
    const errMsg   = document.getElementById('auth-error-msg');

    // ── Offline / local fallback credentials ────────────────────────────
    const OFFLINE_EMAIL    = 'admin@easycafe.com';
    const OFFLINE_PASSWORD = 'AdminPassword123!';
    // ─────────────────────────────────────────────────────────────────────

    // Clear previous error
    if (errMsg) errMsg.classList.add('hidden');

    if (!email || !password) {
        if (errMsg) {
            errMsg.textContent = '❌ Please enter email and password.';
            errMsg.classList.remove('hidden');
        }
        return;
    }

    // Helper: grant admin access
    function grantAccess() {
        document.getElementById('auth-modal')?.classList.add('hidden');
        document.body.classList.add('admin-mode-active');
        const labelCust = document.getElementById('label-customer');
        const labelEmp  = document.getElementById('label-employee');
        if (labelCust) labelCust.classList.remove('active-role');
        if (labelEmp)  labelEmp.classList.add('active-role');
        navigateTo('admin-section');
        if (window.initAdminDashboard) window.initAdminDashboard();
    }

    // Helper: show error WITHOUT navigating away
    function showError(msg) {
        if (errMsg) {
            errMsg.textContent = '❌ ' + (msg || 'Invalid email or password.');
            errMsg.classList.remove('hidden');
        }
    }

    // ── Step 1: Try offline credentials first (instant, no network) ──────
    if (email === OFFLINE_EMAIL && password === OFFLINE_PASSWORD) {
        grantAccess();
        return;
    }

    // ── Step 2: Try the live backend API ─────────────────────────────────
    try {
        await window.api.login(email, password);
        grantAccess();
    } catch (error) {
        // If network/server is down and offline creds didn't match → wrong password
        showError(error.message || 'Invalid email or password.');
    }
}

// Listen for enter key in PIN dialog
function setupPinInputListener() {
    const emailInput = document.getElementById('auth-email-input');
    const passInput = document.getElementById('auth-password-input');
    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            verifyOwnerPin();
        }
    };
    if (emailInput) emailInput.addEventListener('keyup', handleEnter);
    if (passInput) passInput.addEventListener('keyup', handleEnter);
}

function setupGlobalSearchListener() {
    console.log("Global search listener initialized.");
}

// Generate the services grid cards on landing page
// Generate the services grid cards on landing page with skeleton loader transition
function renderServicesGrid() {
    const grid = document.getElementById('services-grid-container');
    if (!grid) return;
    
    // Render skeleton placeholders first
    renderSkeletons(grid);
    
    // Delay actual rendering slightly for a premium, smooth transition
    setTimeout(() => {
        renderActualServices(grid);
    }, 450);
}

// Render skeleton card shells during loading state
function renderSkeletons(grid) {
    grid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'service-card skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="skeleton-body">
                <div class="skeleton-subtitle"></div>
                <div class="skeleton-title"></div>
                <div class="skeleton-meta"></div>
                <div class="skeleton-desc"></div>
                <div class="skeleton-docs"></div>
                <div class="skeleton-button"></div>
            </div>
        `;
        grid.appendChild(skeleton);
    }
}

// Render actual service cards
function renderActualServices(grid) {
    grid.innerHTML = '';
    
    if (!window.db || typeof window.db.getServices !== 'function') {
        console.error("Database connection missing from db.js context asset scope!");
        return;
    }
    
    const services = window.db.getServices();
    
    // Exact requested order, adding any extra services dynamically for scalability
    const preferredOrder = ['ayushman', 'itr', 'msme', 'gumasta', 'aadhaarUpdate', 'loan', 'pan', 'samagra'];
    const sortedKeys = [...preferredOrder];
    
    for (const key in services) {
        if (!sortedKeys.includes(key)) {
            sortedKeys.push(key);
        }
    }
    
    sortedKeys.forEach(key => {
        const service = services[key];
        if (!service || !service.id) return;
        
        const card = document.createElement('div');
        card.className = 'service-card fade-in-card';
        
        // Check if group service or direct service
        const isGroupService = (service.id === 'samagra' || service.id === 'loan' || service.id === 'pan' || service.id === 'gumasta');
        const buttonLabel = isGroupService ? 'View Details' : 'Apply Now';
        
        // Open details modal on clicking the card
        card.onclick = () => window.openServiceDetailsModal(service.id);
        
        card.innerHTML = `
            <div class="service-img-wrapper">
                ${service.imageUrl ? `<img src="${service.imageUrl}" alt="${service.name}" loading="lazy" />` : (service.svgMarkup || '')}
                <div class="service-fee-badge">${service.fee === 0 ? 'Inquiry Only' : `₹${service.fee} Only`}</div>
            </div>
            <div class="service-card-body">
                <div class="service-title-container">
                    <h4 class="service-title">${service.name}</h4>
                    ${service.subtitle ? `<span class="service-subtitle">${service.subtitle}</span>` : ''}
                </div>
                
                <div class="service-meta-row">
                    <span class="service-meta-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span>Time: ${service.timeline}</span>
                    </span>
                </div>
                
                <p class="service-desc">${service.desc}</p>
                
                <div class="service-docs-container">
                    <button class="service-docs-toggle" onclick="event.stopPropagation(); window.toggleDocsCollapse(this);">
                        <span>Required Documents: <strong>${service.documents ? service.documents.length : 0}</strong></span>
                        <svg class="chevron-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="service-docs-collapse">
                        <ul class="service-docs-list">
                            ${service.documents ? service.documents.map(doc => `
                                <li>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span>${doc.label}</span>
                                </li>
                            `).join('') : ''}
                        </ul>
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="event.stopPropagation(); window.openServiceDetailsModal('${service.id}');">
                    ${buttonLabel}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Controller logic for opening unified service details modal
window.openServiceDetailsModal = function(serviceId) {
    if (!window.db || typeof window.db.getService !== 'function') return;
    const service = window.db.getService(serviceId);
    if (!service) return;
    
    // Set basic text details
    document.getElementById('modal-service-name').textContent = service.name;
    document.getElementById('modal-service-subtitle').textContent = service.subtitle || '';
    document.getElementById('modal-service-desc').textContent = service.desc;
    document.getElementById('modal-service-time').textContent = service.timeline;
    document.getElementById('modal-service-fee').textContent = service.fee === 0 ? 'Inquiry Only (Free)' : `₹${service.fee} Total Fee`;
    
    // Set SVG image
    const imgContainer = document.getElementById('modal-service-img');
    imgContainer.innerHTML = service.svgMarkup || '';
    
    // Eligibility criteria list
    const eligList = document.getElementById('modal-service-eligibility');
    eligList.innerHTML = '';
    if (service.eligibility && service.eligibility.length > 0) {
        service.eligibility.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>${item}</span>
            `;
            eligList.appendChild(li);
        });
    } else {
        eligList.innerHTML = '<li><span>General eligibility criteria apply. Contact operator for details.</span></li>';
    }
    
    // Key benefits list
    const benefitsList = document.getElementById('modal-service-benefits');
    benefitsList.innerHTML = '';
    if (service.benefits && service.benefits.length > 0) {
        service.benefits.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>${item}</span>
            `;
            benefitsList.appendChild(li);
        });
    } else {
        benefitsList.innerHTML = '<li><span>Assisted execution and swift submission of files.</span></li>';
    }
    
    // Required documents list
    const docsList = document.getElementById('modal-service-docs');
    docsList.innerHTML = '';
    if (service.documents && service.documents.length > 0) {
        service.documents.forEach(doc => {
            const li = document.createElement('li');
            li.innerHTML = `
                <svg class="doc-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"></path><path d="M14 2v5h5"></path><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span>${doc.label} ${doc.required ? '<strong style="color: var(--danger);">*</strong>' : '(Optional)'}</span>
            `;
            docsList.appendChild(li);
        });
    } else {
        docsList.innerHTML = '<li><span>No documents required.</span></li>';
    }
    
    // Frequently Asked Questions
    const faqContainer = document.getElementById('modal-service-faqs');
    faqContainer.innerHTML = '';
    if (service.faqs && service.faqs.length > 0) {
        service.faqs.forEach(faq => {
            const div = document.createElement('div');
            div.className = 'faq-item';
            div.innerHTML = `
                <button class="faq-question" onclick="window.toggleFaqItem(this)">
                    <span>${faq.q}</span>
                    <svg class="faq-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="faq-answer">
                    <p>${faq.a}</p>
                </div>
            `;
            faqContainer.appendChild(div);
        });
    } else {
        faqContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">No FAQs available for this service.</p>';
    }
    
    // Action button config
    const applyBtn = document.getElementById('modal-apply-btn');
    const isGroup = (service.id === 'samagra' || service.id === 'loan' || service.id === 'pan' || service.id === 'gumasta');
    if (isGroup) {
        applyBtn.innerHTML = `
            Choose Sub-Service
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        `;
    } else {
        applyBtn.innerHTML = `
            Proceed to Apply
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        `;
    }
    
    applyBtn.onclick = () => {
        closeServiceDetailsModal();
        if (service.id === 'samagra') openSamagraDetails();
        else if (service.id === 'loan') openLoanDetails();
        else if (service.id === 'pan') openPanDetails();
        else if (service.id === 'gumasta') openGumastaDetails();
        else startApplication(service.id);
    };
    
    // Show modal overlay
    const modal = document.getElementById('service-details-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // prevent background scrolling
}

// Controller logic for closing the unified details modal
window.closeServiceDetailsModal = function() {
    const modal = document.getElementById('service-details-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Accordion toggle logic for inline card document lists
window.toggleDocsCollapse = function(btn) {
    const container = btn.closest('.service-docs-container');
    const drawer = container.querySelector('.service-docs-collapse');
    const isExpanded = container.classList.contains('expanded');
    
    if (isExpanded) {
        container.classList.remove('expanded');
        drawer.style.maxHeight = '0px';
        drawer.style.opacity = '0';
    } else {
        container.classList.add('expanded');
        drawer.style.maxHeight = drawer.scrollHeight + 'px';
        drawer.style.opacity = '1';
    }
}

// Accordion toggle logic for FAQ items inside modal
window.toggleFaqItem = function(btn) {
    const item = btn.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const isExpanded = item.classList.contains('active');
    
    // Accordion behavior: close siblings
    const siblings = item.parentNode.querySelectorAll('.faq-item');
    siblings.forEach(sib => {
        if (sib !== item) {
            sib.classList.remove('active');
            const sibAnswer = sib.querySelector('.faq-answer');
            if (sibAnswer) sibAnswer.style.maxHeight = '0px';
        }
    });
    
    if (isExpanded) {
        item.classList.remove('active');
        answer.style.maxHeight = '0px';
    } else {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
    }
}

function getSamagraServices() {
    if (!window.db || typeof window.db.getSamagraServices !== 'function') return {};
    return window.db.getSamagraServices();
}

window.openSamagraDetails = function() {
    selectedSamagraServiceKey = selectedSamagraServiceKey || 'kyc';
    renderSamagraServiceCards();
    updateSamagraDetailsPreview();
    navigateTo('samagra-details-section');
}

function renderSamagraServiceCards() {
    const container = document.getElementById('samagra-service-options');
    if (!container) return;

    const services = getSamagraServices();
    container.innerHTML = '';

    Object.entries(services).forEach(([key, service]) => {
        const requiredItems = service.requiredSummary.map(item => `<li>${item}</li>`).join('');
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `samagra-option-card ${key === selectedSamagraServiceKey ? 'selected' : ''}`;
        card.onclick = () => selectSamagraService(key);
        card.innerHTML = `
            <span class="samagra-card-check">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <div class="samagra-option-top">
                <div>
                    <h3>${service.shortName}</h3>
                    <p>${service.desc}</p>
                </div>
                <strong class="samagra-price">Price: ₹${service.fee}</strong>
            </div>
            <div class="samagra-required-block">
                <span>Required</span>
                <ul>${requiredItems}</ul>
            </div>
        `;
        container.appendChild(card);
    });
}

window.selectSamagraService = function(serviceKey) {
    selectedSamagraServiceKey = serviceKey;
    renderSamagraServiceCards();
    updateSamagraDetailsPreview();
}

function updateSamagraDetailsPreview() {
    const service = window.db?.getSamagraService?.(selectedSamagraServiceKey);
    if (!service) return;

    const uploads = document.getElementById('samagra-upload-preview');
    const fields = document.getElementById('samagra-fields-preview');
    const selectedName = document.getElementById('samagra-selected-name');

    if (selectedName) selectedName.textContent = `${service.shortName} - Price: ₹${service.fee}`;

    if (uploads) {
        uploads.innerHTML = service.documents.map(doc => `
            <div class="samagra-preview-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <span>${doc.label}</span>
            </div>
        `).join('');
    }

    if (fields) {
        fields.innerHTML = service.fields.map(field => `
            <div class="samagra-preview-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M7 8h10"></path><path d="M7 12h10"></path><path d="M7 16h6"></path></svg>
                <span>${field.label}</span>
            </div>
        `).join('');
    }
}

window.startSamagraApplication = function() {
    const service = window.db?.getSamagraService?.(selectedSamagraServiceKey);
    if (!service) return;
    beginServiceApplication({
        ...service,
        icon: 'users'
    });
}

let selectedLoanServiceKey = 'home';

window.openLoanDetails = function() {
    selectedLoanServiceKey = selectedLoanServiceKey || 'home';
    renderLoanServiceCards();
    updateLoanDetailsPreview();
    navigateTo('loan-details-section');
}

function renderLoanServiceCards() {
    const container = document.getElementById('loan-service-options');
    if (!container) return;

    if (!window.db || typeof window.db.getLoanServices !== 'function') return;
    const services = window.db.getLoanServices();
    container.innerHTML = '';

    Object.entries(services).forEach(([key, service]) => {
        const requiredItems = service.requiredSummary.map(item => `<li>${item}</li>`).join('');
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `samagra-option-card ${key === selectedLoanServiceKey ? 'selected' : ''}`;
        card.onclick = () => selectLoanService(key);
        card.innerHTML = `
            <span class="samagra-card-check">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <div class="samagra-option-top">
                <div>
                    <h3>${service.shortName}</h3>
                    <p>${service.desc}</p>
                </div>
                <strong class="samagra-price">Free (Inquiry)</strong>
            </div>
            <div class="samagra-required-block">
                <span>Key Details Required</span>
                <ul>${requiredItems}</ul>
            </div>
        `;
        container.appendChild(card);
    });
}

window.selectLoanService = function(serviceKey) {
    selectedLoanServiceKey = serviceKey;
    renderLoanServiceCards();
    updateLoanDetailsPreview();
}

function updateLoanDetailsPreview() {
    if (!window.db || typeof window.db.getLoanService !== 'function') return;
    const service = window.db.getLoanService(selectedLoanServiceKey);
    if (!service) return;

    const uploads = document.getElementById('loan-upload-preview');
    const fields = document.getElementById('loan-fields-preview');
    const selectedName = document.getElementById('loan-selected-name');

    if (selectedName) selectedName.textContent = `${service.shortName} - Price: Free (Inquiry)`;

    if (uploads) {
        uploads.innerHTML = `
            <div class="samagra-preview-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>No documents required for loan inquiry</span>
            </div>
        `;
    }

    if (fields) {
        fields.innerHTML = service.fields.map(field => `
            <div class="samagra-preview-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M7 8h10"></path><path d="M7 12h10"></path><path d="M7 16h6"></path></svg>
                <span>${field.label}</span>
            </div>
        `).join('');
    }
}

window.startLoanApplication = function() {
    if (!window.db || typeof window.db.getLoanService !== 'function') return;
    const service = window.db.getLoanService(selectedLoanServiceKey);
    if (!service) return;
    beginServiceApplication({
        ...service,
        icon: 'landmark'
    });
}

function getPANServices() {
    if (!window.db || typeof window.db.getPANServices !== 'function') return {};
    return window.db.getPANServices();
}

window.openPanDetails = function() {
    selectedPanServiceKey = selectedPanServiceKey || 'new';
    renderPanServiceCards();
    updatePanDetailsPreview();
    navigateTo('pan-details-section');
}

function renderPanServiceCards() {
    const container = document.getElementById('pan-service-options');
    if (!container) return;

    const services = getPANServices();
    container.innerHTML = '';

    Object.entries(services).forEach(([key, service]) => {
        const requiredItems = service.requiredSummary.map(item => `<li>${item}</li>`).join('');
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `samagra-option-card ${key === selectedPanServiceKey ? 'selected' : ''}`;
        card.onclick = () => selectPanService(key);
        card.innerHTML = `
            <span class="samagra-card-check">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <div class="samagra-option-top">
                <div>
                    <h3>${service.shortName}</h3>
                    <p>${service.desc}</p>
                </div>
                <strong class="samagra-price">Price: ₹${service.fee}</strong>
            </div>
            <div class="samagra-required-block">
                <span>Required</span>
                <ul>${requiredItems}</ul>
            </div>
        `;
        container.appendChild(card);
    });
}

window.selectPanService = function(serviceKey) {
    selectedPanServiceKey = serviceKey;
    renderPanServiceCards();
    updatePanDetailsPreview();
}

function updatePanDetailsPreview() {
    const service = window.db?.getPANService?.(selectedPanServiceKey);
    if (!service) return;

    const uploads = document.getElementById('pan-upload-preview');
    const fields = document.getElementById('pan-fields-preview');
    const selectedName = document.getElementById('pan-selected-name');

    if (selectedName) selectedName.textContent = `${service.shortName} - Price: ₹${service.fee}`;

    if (uploads) {
        uploads.innerHTML = service.documents.map(doc => `
            <div class="samagra-preview-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <span>${doc.label}</span>
            </div>
        `).join('');
    }

    if (fields) {
        fields.innerHTML = service.fields.map(field => `
            <div class="samagra-preview-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M7 8h10"></path><path d="M7 12h10"></path><path d="M7 16h6"></path></svg>
                <span>${field.label}</span>
            </div>
        `).join('');
    }
}

window.startPanApplication = function() {
    const service = window.db?.getPANService?.(selectedPanServiceKey);
    if (!service) return;
    beginServiceApplication({
        ...service,
        panApplicationType: service.applicationType,
        icon: 'credit-card'
    });
}

function getGumastaServices() {
    if (!window.db || typeof window.db.getGumastaServices !== 'function') return {};
    return window.db.getGumastaServices();
}

window.openGumastaDetails = function() {
    selectedGumastaServiceKey = selectedGumastaServiceKey || 'individual';
    renderGumastaServiceCards();
    updateGumastaDetailsPreview();
    navigateTo('gumasta-details-section');
}

function renderGumastaServiceCards() {
    const container = document.getElementById('gumasta-service-options');
    if (!container) return;

    const services = getGumastaServices();
    container.innerHTML = '';

    Object.entries(services).forEach(([key, service]) => {
        const requiredItems = service.requiredSummary.map(item => `<li>${item}</li>`).join('');
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `samagra-option-card ${key === selectedGumastaServiceKey ? 'selected' : ''}`;
        card.onclick = () => selectGumastaService(key);
        card.innerHTML = `
            <span class="samagra-card-check">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <div class="samagra-option-top">
                <div>
                    <h3>${service.shortName}</h3>
                    <p>${service.desc}</p>
                </div>
                <strong class="samagra-price">Price: ₹${service.fee}</strong>
            </div>
            <div class="samagra-required-block">
                <span>Required</span>
                <ul>${requiredItems}</ul>
            </div>
        `;
        container.appendChild(card);
    });
}

window.selectGumastaService = function(serviceKey) {
    selectedGumastaServiceKey = serviceKey;
    renderGumastaServiceCards();
    updateGumastaDetailsPreview();
}

function updateGumastaDetailsPreview() {
    const service = window.db?.getGumastaService?.(selectedGumastaServiceKey);
    if (!service) return;

    const uploads = document.getElementById('gumasta-upload-preview');
    const fields = document.getElementById('gumasta-fields-preview');
    const selectedName = document.getElementById('gumasta-selected-name');
    const docs = service.gumastaApplicationType === 'Partnership Firm'
        ? [
            { label: 'Partner-wise Aadhaar Front & Back' },
            { label: 'PAN Card of Firm' },
            { label: 'Signature of Any One Partner' },
            { label: 'Samagra ID of Any One Partner' }
        ]
        : service.documents;

    if (selectedName) selectedName.textContent = `${service.shortName} - Price: ₹${service.fee}`;

    if (uploads) {
        uploads.innerHTML = docs.map(doc => `
            <div class="samagra-preview-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <span>${doc.label}</span>
            </div>
        `).join('');
    }

    if (fields) {
        fields.innerHTML = service.fields.map(field => `
            <div class="samagra-preview-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M7 8h10"></path><path d="M7 12h10"></path><path d="M7 16h6"></path></svg>
                <span>${field.label}</span>
            </div>
        `).join('');
    }
}

window.startGumastaApplication = function() {
    const service = window.db?.getGumastaService?.(selectedGumastaServiceKey);
    if (!service) return;
    beginServiceApplication({
        ...service,
        gumastaApplicationType: service.gumastaApplicationType,
        icon: 'store'
    });
}

function beginServiceApplication(service) {
    currentService = service;
    if (!currentService) return;
    currentStep = 1;
    uploadedFiles = {};
    
    const form = document.getElementById('application-form');
    if (form) form.reset();
    
    document.getElementById('wizard-service-title').textContent = currentService.name;
    document.getElementById('wizard-service-desc').textContent = currentService.desc;
    
    renderWizardStep1();
    renderWizardStep2();
    updateWizardProgress();
    
    document.querySelectorAll('.wizard-step-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('step-panel-1').classList.add('active');
    navigateTo('wizard-section');
}

// Start application wizard for a service
window.startApplication = function(serviceId) {
    if (!window.db || typeof window.db.getService !== 'function') return;
    if (serviceId === 'samagra') {
        openSamagraDetails();
        return;
    }
    if (serviceId === 'loan') {
        openLoanDetails();
        return;
    }
    if (serviceId === 'pan') {
        openPanDetails();
        return;
    }
    if (serviceId === 'gumasta') {
        openGumastaDetails();
        return;
    }
    beginServiceApplication(window.db.getService(serviceId));
}

// Render input fields for Step 1 dynamically
function renderWizardStep1() {
    const container = document.getElementById('dynamic-fields-container');
    if (!container || !currentService || !currentService.fields) return;
    container.innerHTML = '';
    
    currentService.fields.forEach(field => {
        const group = document.createElement('div');
        group.className = `form-group field-${field.id}${field.type === 'textarea' ? ' form-group-wide' : ''}`;
        const validationAttrs = [
            field.pattern ? `pattern="${field.pattern}"` : '',
            field.min !== undefined ? `min="${field.min}"` : '',
            field.max !== undefined ? `max="${field.max}"` : ''
        ].filter(Boolean).join(' ');
        if (field.type === 'select') {
            const optionsHtml = field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
            group.innerHTML = `
                <label for="field-${field.id}">${field.label} ${field.required ? '*' : ''}</label>
                <select id="field-${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
                    <option value="">-- Select Option --</option>
                    ${optionsHtml}
                </select>
            `;
        } else if (field.type === 'textarea') {
            group.innerHTML = `
                <label for="field-${field.id}">${field.label} ${field.required ? '*' : ''}</label>
                <textarea id="field-${field.id}" name="${field.id}" rows="3" ${field.required ? 'required' : ''}></textarea>
            `;
        } else {
            group.innerHTML = `
                <label for="field-${field.id}">${field.label} ${field.required ? '*' : ''}</label>
                <input type="${field.type}" id="field-${field.id}" name="${field.id}" ${field.required ? 'required' : ''} ${validationAttrs}>
            `;
        }
        container.appendChild(group);
    });
}

// ─── UPDATED: Render document upload cards for Step 2 ────────────────────────
function renderWizardStep2() {
    const container = document.getElementById('dynamic-uploads-container');
    if (!container || !currentService || !currentService.documents) return;
    container.innerHTML = '';

    // Inject upload card styles if not already present
    if (!document.getElementById('upload-card-styles')) {
        const style = document.createElement('style');
        style.id = 'upload-card-styles';
        style.textContent = `
            .upload-cards-grid {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 14px !important;
                margin-bottom: 8px !important;
                width: 100% !important;
                box-sizing: border-box !important;
                width: 100% !important;
            }
            @media (max-width: 700px) {
                .upload-cards-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                }
            }
            @media (max-width: 480px) {
                .upload-cards-grid {
                    grid-template-columns: 1fr !important;
                }
            }
            .upload-group-title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #6b7280;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 6px;
                margin: 18px 0 10px;
            }
            .upload-field-card-v2 {
                background: #fff !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 12px !important;
                padding: 14px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                transition: border-color 0.15s !important;
                box-sizing: border-box !important;
                width: 100% !important;
                min-width: 0 !important;
            }
            .upload-field-card-v2.has-error {
                border: 1.5px solid #ef4444 !important;
            }
            .ufc-head {
                display: flex !important;
                align-items: flex-start !important;
                gap: 6px !important;
            }
            .ufc-head-text {
                flex: 1 !important;
                min-width: 0 !important;
            }
            .ufc-name {
                font-size: 13px !important;
                font-weight: 600 !important;
                color: #111827 !important;
            }
            .ufc-note {
                font-size: 11px !important;
                color: #7c3aed !important;
                margin-top: 3px !important;
                line-height: 1.4 !important;
                display: flex !important;
                align-items: flex-start !important;
                gap: 3px !important;
            }
            .ufc-badge-req {
                font-size: 10px !important;
                background: #fef2e7 !important;
                color: #b45309 !important;
                border-radius: 4px !important;
                padding: 2px 7px !important;
                font-weight: 600 !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
            }
            .ufc-badge-opt {
                font-size: 10px !important;
                background: #f3f4f6 !important;
                color: #6b7280 !important;
                border-radius: 4px !important;
                padding: 2px 7px !important;
                font-weight: 600 !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
            }
            .ufc-drop-zone {
                border: 1.5px dashed #d1d5db !important;
                border-radius: 8px !important;
                padding: 16px 10px !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 5px !important;
                cursor: pointer !important;
                background: #f9fafb !important;
                min-height: 105px !important;
                transition: border-color 0.15s !important;
                text-align: center !important;
                box-sizing: border-box !important;
                width: 100% !important;
            }
            .ufc-drop-zone:hover {
                border-color: #7c3aed !important;
            }
            .ufc-drop-zone.uploaded {
                border-style: solid !important;
                border-color: #16a34a !important;
                background: #f0fdf4 !important;
            }
            .ufc-drop-zone.upload-error {
                border-color: #ef4444 !important;
                background: #fef2f2 !important;
            }
            .ufc-drop-icon {
                font-size: 22px;
                color: #7c3aed;
            }
            .ufc-drop-zone.uploaded .ufc-drop-icon { color: #16a34a !important; }
            .ufc-drop-zone.upload-error .ufc-drop-icon { color: #ef4444 !important; }
            .ufc-drop-main {
                font-size: 12px !important;
                font-weight: 600 !important;
                color: #374151 !important;
            }
            .ufc-drop-zone.uploaded .ufc-drop-main { color: #14532d !important; font-size: 11px !important; word-break: break-all !important; }
            .ufc-drop-zone.upload-error .ufc-drop-main { color: #991b1b !important; }
            .ufc-drop-hint {
                font-size: 11px !important;
                color: #9ca3af !important;
            }
            .ufc-err-msg {
                font-size: 11px !important;
                color: #b91c1c !important;
                display: flex !important;
                align-items: center !important;
                gap: 4px !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Group documents by their 'group' property if provided, else use a single default group
    let documentList = getCurrentStepDocuments();
    if (currentService && currentService.gumastaApplicationType) {
        const activeDocIds = new Set(documentList.map(doc => doc.id));
        Object.keys(uploadedFiles).forEach(key => {
            const docId = key.endsWith('__name') ? key.replace('__name', '') : key;
            if (!activeDocIds.has(docId)) {
                delete uploadedFiles[key];
            }
        });
    }

    // Create groups
    const groups = [];
    const groupMap = {};

    documentList.forEach(doc => {
        const groupName = doc.group || "";

        if (!groupMap[groupName]) {
            groupMap[groupName] = [];
            groups.push({
                name: groupName,
                docs: groupMap[groupName]
            });
        }

        groupMap[groupName].push(doc);
    });

    groups.forEach(group => {
        if (group.name) {
            const title = document.createElement('div');
            title.className = 'upload-group-title';
            title.textContent = group.name;
            container.appendChild(title);
        }

        const grid = document.createElement('div');
        grid.className = 'upload-cards-grid';

        group.docs.forEach(doc => {
            const isUploaded = !!uploadedFiles[doc.id];
            const card = document.createElement('div');
            card.className = 'upload-field-card-v2';
            card.id = `upload-card-${doc.id}`;

            const noteHtml = doc.note
                ? `<div class="ufc-note">
                     <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                     ${doc.note}
                   </div>`
                : '';

            const acceptAttr = doc.accept ? `accept="${doc.accept}"` : 'accept="image/*,application/pdf"';

            card.innerHTML = `
                <div class="ufc-head">
                    <div class="ufc-head-text">
                        <div class="ufc-name">${doc.label}</div>
                        ${noteHtml}
                    </div>
                    <span class="${doc.required ? 'ufc-badge-req' : 'ufc-badge-opt'}">${doc.required ? 'Required' : 'Optional'}</span>
                </div>
                <input type="file" id="upload-${doc.id}" class="hidden-file-input" ${acceptAttr}
                    onchange="handleFileUploadV2('${doc.id}', this)" style="display:none;">
                <div class="ufc-drop-zone ${isUploaded ? 'uploaded' : ''}"
                    id="zone-v2-${doc.id}"
                    onclick="document.getElementById('upload-${doc.id}').click()"
                    ondragover="event.preventDefault()"
                    ondrop="handleDropV2('${doc.id}', event)">
                    <svg class="ufc-drop-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" id="zone-icon-${doc.id}">
                        ${isUploaded
                            ? '<polyline points="20 6 9 17 4 12"></polyline>'
                            : '<polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>'
                        }
                    </svg>
                    <span class="ufc-drop-main" id="zone-main-${doc.id}">
                        ${isUploaded ? (uploadedFiles[doc.id + '__name'] || 'Uploaded') : 'Click or drag file here'}
                    </span>
                    <span class="ufc-drop-hint" id="zone-hint-${doc.id}">
                        ${isUploaded ? 'Click to replace' : 'JPG, PNG or PDF — max 5MB'}
                    </span>
                </div>
            `;
            grid.appendChild(card);
        });

        container.appendChild(grid);
    });
}

// Handle file upload for the new v2 card UI
async function handleFileUploadV2(docId, inputEl) {
    const file = inputEl.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Maximum size is 5MB.');
        inputEl.value = '';
        return;
    }

    const zone = document.getElementById(`zone-v2-${docId}`);
    const icon = document.getElementById(`zone-icon-${docId}`);
    const main = document.getElementById(`zone-main-${docId}`);
    const hint = document.getElementById(`zone-hint-${docId}`);
    const card = document.getElementById(`upload-card-${docId}`);

    if (main) main.textContent = 'Uploading...';

    try {
        const response = await window.api.uploadDocument(file);
        uploadedFiles[docId] = response.url;
        uploadedFiles[docId + '__name'] = file.name;

        if (zone) {
            zone.classList.remove('upload-error');
            zone.classList.add('uploaded');
        }
        if (icon) icon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
        if (main) main.textContent = file.name;
        if (hint) hint.textContent = 'Click to replace';
        if (card) card.classList.remove('has-error');

        // Clear inline error message if present
        const errEl = document.getElementById(`err-${docId}`);
        if (errEl) errEl.remove();

        // Re-check the any-one-required group this doc belongs to, in case
        // it was previously flagged as missing.
        clearAnyOneGroupErrorIfSatisfied(docId);
    } catch (err) {
        console.error(err);
        alert('Upload failed: ' + err.message);
        if (main) main.textContent = 'Upload failed. Click to retry';
        if (zone) zone.classList.add('upload-error');
    }
}

// Handle drag-and-drop for v2 upload cards
function handleDropV2(docId, event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    // Simulate file input change
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = document.getElementById(`upload-${docId}`);
    if (input) {
        input.files = dt.files;
        handleFileUploadV2(docId, input);
    }
}

// Keep original handleFileUpload for backward compatibility with any other services
function handleFileUpload(docId, inputEl) {
    handleFileUploadV2(docId, inputEl);
}

// ─── Update wizard progress bar indicators ────────────────────────────────────
function updateWizardProgress() {
    const documentList = getCurrentStepDocuments();
    const hasDocs = documentList.length > 0;
    const isFree = currentService && (currentService.fee === 0 || currentService.inquiryOnly);

    const step1 = document.getElementById('step-indicator-1');
    const step2 = document.getElementById('step-indicator-2');
    const step3 = document.getElementById('step-indicator-3');
    const step4 = document.getElementById('step-indicator-4');

    // Reset display and state for all steps
    [step1, step2, step3, step4].forEach(step => {
        if (step) {
            step.style.display = '';
            step.classList.remove('active', 'completed');
        }
    });

    // Hide Step 2 (Uploads) if no documents are required
    if (!hasDocs) {
        if (step2) step2.style.display = 'none';
    }

    // Hide Step 4 (Payment) if the service is free / inquiry only
    if (isFree) {
        if (step4) step4.style.display = 'none';
    }

    // Assign active and completed classes
    if (currentStep === 1) {
        if (step1) step1.classList.add('active');
    } else {
        if (step1) step1.classList.add('completed');
    }

    if (hasDocs) {
        if (currentStep === 2) {
            if (step2) step2.classList.add('active');
        } else if (currentStep > 2) {
            if (step2) step2.classList.add('completed');
        }
    }

    if (currentStep === 3) {
        if (step3) step3.classList.add('active');
    } else if (currentStep > 3) {
        if (step3) step3.classList.add('completed');
    }

    if (!isFree) {
        if (currentStep === 4) {
            if (step4) step4.classList.add('active');
        }
    }

    // Dynamically re-number visible steps
    let visibleIndex = 1;
    [step1, step2, step3, step4].forEach(step => {
        if (step && step.style.display !== 'none') {
            const numEl = step.querySelector('.step-num');
            if (numEl) numEl.textContent = visibleIndex++;
        }
    });
}

// ─── Validate Step 1 required fields ─────────────────────────────────────────
function validateStep1() {
    if (!currentService || !currentService.fields) return true;
    for (const field of currentService.fields) {
        if (!field.required) continue;
        const el = document.getElementById(`field-${field.id}`);
        if (!el) continue;
        if (!el.value || el.value.trim() === '' || el.value === '') {
            el.focus();
            el.style.borderColor = '#ef4444';
            el.addEventListener('input', () => { el.style.borderColor = ''; }, { once: true });
            alert(`Please fill in: ${field.label}`);
            return false;
        }
        if (field.type === 'number' && field.min !== undefined && Number(el.value) < Number(field.min)) {
            el.focus();
            el.style.borderColor = '#ef4444';
            el.addEventListener('input', () => { el.style.borderColor = ''; }, { once: true });
            alert(`${field.label} must be at least ${field.min}`);
            return false;
        }
    }
    return true;
}

// ─── Get the document list currently shown on Step 2 ─────────────────────────
function getCurrentStepDocuments() {
    if (!currentService || !currentService.documents) return [];
    let documentList = currentService.documents;
    if (currentService.id === 'pan') {
        if (currentService.panApplicationType) {
            return currentService.documents;
        }
        const applicationType =
            document.getElementById('field-applicationType')?.value || '';
        documentList = getPANDocuments(applicationType);
    }
    if (currentService.gumastaApplicationType) {
        const partnerCount = document.getElementById('field-partnerCount')?.value || 0;
        documentList = getGumastaDocuments(currentService.gumastaApplicationType, partnerCount);
    }
    return documentList;
}

// ─── Clear an 'any one required' group's error state once it is satisfied ────
function clearAnyOneGroupErrorIfSatisfied(docId) {
    const documentList = getCurrentStepDocuments();
    const doc = documentList.find(d => d.id === docId);
    if (!doc || !doc.note) return;

    const groupDocs = documentList.filter(d => d.note === doc.note && !d.required);
    const groupSatisfied = groupDocs.some(d => !!uploadedFiles[d.id]);
    if (!groupSatisfied) return;

    groupDocs.forEach(d => {
        const card = document.getElementById(`upload-card-${d.id}`);
        const zone = document.getElementById(`zone-v2-${d.id}`);
        const errEl = document.getElementById(`err-${d.id}`);
        if (card) card.classList.remove('has-error');
        if (zone) zone.classList.remove('upload-error');
        if (errEl) errEl.remove();

        // Reset placeholder text on any group sibling that wasn't actually
        // uploaded (so it doesn't keep showing "Document required").
        if (!uploadedFiles[d.id]) {
            const main = document.getElementById(`zone-main-${d.id}`);
            const icon = document.getElementById(`zone-icon-${d.id}`);
            if (main) main.textContent = 'Click or drag file here';
            if (icon) icon.innerHTML = '<polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>';
        }
    });
}

// ─── Validate Step 2 required document uploads with DUPLICATE CHECK ───────────
function validateStep2() {
    const documentList = getCurrentStepDocuments();
    if (!documentList.length) return true;

    let valid = true;
    const handledGroupNotes = new Set();

    // 1. New Check: Verify file uniqueness across all uploaded items
    const activeUploadContents = [];
    const duplicateDocIds = new Set();

    documentList.forEach(doc => {
        const fileData = uploadedFiles[doc.id];
        if (fileData) {
            // If this file data payload already exists elsewhere, flag it as a duplicate
            if (activeUploadContents.includes(fileData)) {
                duplicateDocIds.add(doc.id);
            } else {
                activeUploadContents.push(fileData);
            }
        }
    });

    if (duplicateDocIds.size > 0) {
        duplicateDocIds.forEach(id => {
            flagDocError(id, 'Duplicate file detected across slots');
        });
        alert('Error: You cannot upload the same document image for different categories.');
        valid = false;
    }

    // 2. Standard validation tracking rules
    for (const doc of documentList) {
        // Skip further processing on this item if it's already caught as a duplicate
        if (duplicateDocIds.has(doc.id)) continue;

        // Rule 1: strictly required documents
        if (doc.required) {
            if (!uploadedFiles[doc.id]) {
                flagDocError(doc.id, 'Document required');
                valid = false;
            }
            continue;
        }

        // Rule 2: "any one of" groups, identified by a shared `note` value
        if (doc.note && !handledGroupNotes.has(doc.note)) {
            handledGroupNotes.add(doc.note);
            const groupDocs = documentList.filter(d => d.note === doc.note && !d.required);
            
            // Ensure the uploaded document is not one of the duplicates flagged above
            const groupSatisfied = groupDocs.some(d => !!uploadedFiles[d.id] && !duplicateDocIds.has(d.id));
            if (!groupSatisfied) {
                groupDocs.forEach(d => flagDocError(d.id, 'Upload at least one unique document'));
                valid = false;
            }
        }
    }

    if (!valid) {
        const firstErr = document.querySelector('.upload-field-card-v2.has-error');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
}

// ─── Mark a single upload card as having a validation error ──────────────────
function flagDocError(docId, message) {
    const card = document.getElementById(`upload-card-${docId}`);
    const zone = document.getElementById(`zone-v2-${docId}`);
    const main = document.getElementById(`zone-main-${docId}`);
    const icon = document.getElementById(`zone-icon-${docId}`);

    if (card) card.classList.add('has-error');
    if (zone) zone.classList.add('upload-error');
    if (main) main.textContent = message;
    if (icon) icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';

    if (card && !document.getElementById(`err-${docId}`)) {
        const errEl = document.createElement('div');
        errEl.className = 'ufc-err-msg';
        errEl.id = `err-${docId}`;
        errEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> ${message}.`;
        card.appendChild(errEl);
    }
}

// ─── Render Step 3 review summary (SAFE VERSION) ─────────────────────────────
function renderReview() {
    const fieldsContainer = document.getElementById('review-fields-container');
    if (fieldsContainer && currentService && currentService.fields) {
        fieldsContainer.innerHTML = '';
        if (currentService.panApplicationType) {
            const item = document.createElement('div');
            item.className = 'review-item';
            item.innerHTML = `<span class="review-label">Application Type</span><span class="review-value">${currentService.panApplicationType}</span>`;
            fieldsContainer.appendChild(item);
        }
        if (currentService.gumastaApplicationType) {
            const item = document.createElement('div');
            item.className = 'review-item';
            item.innerHTML = `<span class="review-label">Application Type</span><span class="review-value">${currentService.gumastaApplicationType}</span>`;
            fieldsContainer.appendChild(item);
        }
        currentService.fields.forEach(field => {
            const el = document.getElementById(`field-${field.id}`);
            const value = el ? (el.value || '—') : '—';
            const item = document.createElement('div');
            item.className = 'review-item';
            item.innerHTML = `<span class="review-label">${field.label}</span><span class="review-value">${value}</span>`;
            fieldsContainer.appendChild(item);
        });
    }

    const docsContainer = document.getElementById('review-docs-container');
    if (docsContainer && currentService) {
        const documentList = getCurrentStepDocuments();
        docsContainer.innerHTML = '';
        documentList.forEach(doc => {
            const uploaded = !!uploadedFiles[doc.id];
            const item = document.createElement('div');
            item.className = `review-doc-item ${uploaded ? 'doc-ok' : 'doc-missing'}`;
            item.innerHTML = `
                <span class="doc-status-icon">${uploaded ? '✓' : '✗'}</span>
                <span>${doc.label}</span>
            `;
            docsContainer.appendChild(item);
        });
    }

    // Update Step 3 next button text based on service cost
    const nextBtn = document.querySelector('#step-panel-3 .btn-primary');
    if (nextBtn) {
        if (currentService && (currentService.fee === 0 || currentService.inquiryOnly)) {
            nextBtn.textContent = 'Submit Inquiry';
        } else {
            nextBtn.textContent = 'Go to Payment';
        }
    }

    const payServiceName = document.getElementById('payment-service-name');
    const payFeeAmount = document.getElementById('payment-fee-amount');
    const payFeeTotal = document.getElementById('payment-fee-total');
    const upiPayAmount = document.getElementById('upi-pay-amount');
    
    if (currentService) {
        if (payServiceName) payServiceName.textContent = currentService.name;
        if (payFeeAmount) payFeeAmount.textContent = `₹${currentService.fee}`;
        if (payFeeTotal) payFeeTotal.textContent = `₹${currentService.fee}`;
        if (upiPayAmount) upiPayAmount.textContent = `₹${currentService.fee}`;

        // Dynamic UPI QR Code generation based on service fee
        const upiQrImage = document.getElementById('paytm-qr-dynamic-image');
        if (upiQrImage) {
            const fee = currentService.fee;
            const upiUri = `upi://pay?pa=paytmqr6wi94q@ptys&pn=SUCCESS%20MP%20ONLINE&am=${fee}&cu=INR`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;
            upiQrImage.src = qrUrl;
        }
    }
}

// ─── wizardNext — advances wizard step with validation ────────────────────────
async function wizardNext(fromStep) {
    let nextStep = fromStep + 1;

    if (fromStep === 1) {
        if (!validateStep1()) return;
        
        const docList = getCurrentStepDocuments();
        if (docList.length === 0) {
            renderReview();
            nextStep = 3;
        } else {
            renderWizardStep2();
        }
    }
    if (fromStep === 2) {
        if (!validateStep2()) return;
        renderReview();
    }
    
    if (fromStep === 3) {
        const overlay = document.getElementById('payment-processing');
        if (overlay) {
            const title = document.getElementById('payment-processing-title');
            const desc = document.getElementById('payment-processing-desc');
            if (title) title.textContent = 'Submitting Application...';
            if (desc) desc.textContent = 'Please wait while we record your application details.';
            overlay.classList.remove('hidden');
        }

        try {
            // Save details & files to backend DB
            const details = {};
            if (currentService && currentService.fields) {
                currentService.fields.forEach(field => {
                    const el = document.getElementById(`field-${field.id}`);
                    if (el) details[field.id] = el.value;
                });
            }
            if (currentService && currentService.panApplicationType) details.applicationType = currentService.panApplicationType;
            if (currentService && currentService.gumastaApplicationType) details.applicationType = currentService.gumastaApplicationType;

            const nameField = details.fullName || details.firmName || details.businessName || details.familyHead || details.memberName || details.ownerName || details.enterpriseName || details.shopName || 'Applicant';
            const phoneField = details.phone || '';
            const emailField = details.email || '';

            const application = await window.api.submitApplication({
                service: currentService.id,
                serviceName: currentService.name,
                customerName: nameField,
                customerPhone: phoneField,
                customerEmail: emailField,
                details: details,
                documents: { ...uploadedFiles },
                amountPaid: currentService.fee,
                completionTimeline: currentService.timeline
            });

            currentApplicationId = application.id;

            const isFree = currentService && (currentService.fee === 0 || currentService.inquiryOnly);
            if (isFree) {
                if (overlay) overlay.classList.add('hidden');
                
                document.getElementById('rec-id-val').textContent = application.id;
                document.getElementById('rec-date-val').textContent = new Date(application.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                document.getElementById('rec-service-name').textContent = currentService.name;
                document.getElementById('rec-client-name').textContent = nameField;
                document.getElementById('rec-client-phone').textContent = phoneField;
                document.getElementById('rec-amount-paid').textContent = 'Free (Inquiry)';
                document.getElementById('rec-amount-total').textContent = 'Free (Inquiry)';
                document.getElementById('rec-timeline-val').textContent = currentService.timeline;

                // Socket.io room join
                if (window.socket) {
                    window.socket.emit('joinApplicationRoom', application.id);
                }

                navigateTo('receipt-section');
                return;
            } else {
                // Initiate Order in backend
                const order = await window.api.createPaymentOrder(application.id);
                currentOrderId = order.order_id;

                // Update payment screen info
                const payServiceName = document.getElementById('payment-service-name');
                const payFeeAmount = document.getElementById('payment-fee-amount');
                const payFeeTotal = document.getElementById('payment-fee-total');
                const upiPayAmount = document.getElementById('upi-pay-amount');
                
                if (payServiceName) payServiceName.textContent = currentService.name;
                if (payFeeAmount) payFeeAmount.textContent = `₹${currentService.fee}`;
                if (payFeeTotal) payFeeTotal.textContent = `₹${currentService.fee}`;
                if (upiPayAmount) upiPayAmount.textContent = `₹${currentService.fee}`;

                // Dynamic UPI QR Code generation with order reference
                const upiQrImage = document.getElementById('paytm-qr-dynamic-image');
                if (upiQrImage) {
                    const fee = currentService.fee;
                    const merchantVpa = 'paytmqr6wi94q@ptys';
                    const merchantName = 'SUCCESS%20MP%20ONLINE';
                    const upiUri = `upi://pay?pa=${merchantVpa}&pn=${merchantName}&am=${fee}&tr=${currentOrderId}&cu=INR`;
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;
                    upiQrImage.src = qrUrl;
                }

                // Socket.io room join
                if (window.socket) {
                    window.socket.emit('joinApplicationRoom', application.id);
                }

                if (overlay) overlay.classList.add('hidden');
            }
        } catch (error) {
            if (overlay) overlay.classList.add('hidden');
            alert('Submission failed: ' + (error.message || error));
            return;
        }
    }

    const currentPanel = document.getElementById(`step-panel-${fromStep}`);
    const nextPanel = document.getElementById(`step-panel-${nextStep}`);
    if (currentPanel) currentPanel.classList.remove('active');
    if (nextPanel) nextPanel.classList.add('active');

    currentStep = nextStep;
    updateWizardProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── wizardPrev — goes back one wizard step ───────────────────────────────────
function wizardPrev(fromStep) {
    let prevStep = fromStep - 1;

    if (fromStep === 3) {
        const docList = getCurrentStepDocuments();
        if (docList.length === 0) {
            prevStep = 1;
        }
    }

    const currentPanel = document.getElementById(`step-panel-${fromStep}`);
    const prevPanel = document.getElementById(`step-panel-${prevStep}`);
    if (currentPanel) currentPanel.classList.remove('active');
    if (prevPanel) prevPanel.classList.add('active');

    currentStep = prevStep;
    updateWizardProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Switch payment method tabs ───────────────────────────────────────────────
function switchPayMethod(method) {
    selectedPayMethod = method;
    document.querySelectorAll('.pay-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.pay-panel').forEach(panel => panel.classList.remove('active'));

    const activeTab = document.querySelector(`.pay-tab[onclick="switchPayMethod('${method}')"]`);
    const activePanel = document.getElementById(`pay-panel-${method}`);
    if (activeTab) activeTab.classList.add('active');
    if (activePanel) activePanel.classList.add('active');
}

// ─── Validate UPI ID format ──────────────────────────────────────────────────
function validateUpiId(upiId) {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upiId.trim());
}

// ─── Clear UPI input feedback ────────────────────────────────────────────────
function clearUpiFeedback() {
    const badge = document.getElementById('upi-validation-badge');
    const msg = document.getElementById('upi-feedback-message');
    if (badge) { badge.textContent = ''; badge.className = 'upi-validation-badge'; }
    if (msg) { msg.textContent = ''; msg.className = 'upi-feedback-message'; }
}

// ─── Show UPI feedback (valid/invalid) ──────────────────────────────────────
function showUpiFeedback(isValid, message) {
    const badge = document.getElementById('upi-validation-badge');
    const msg = document.getElementById('upi-feedback-message');
    if (badge) {
        badge.textContent = isValid ? '✓' : '✗';
        badge.className = `upi-validation-badge ${isValid ? 'valid' : 'invalid'}`;
    }
    if (msg) {
        msg.textContent = message;
        msg.className = `upi-feedback-message ${isValid ? 'success' : 'error'}`;
    }
}

// ─── Show payment notification banner ───────────────────────────────────────
function showPaymentNotification(type, message) {
    const existing = document.getElementById('payment-notification');
    if (existing) existing.remove();

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const notif = document.createElement('div');
    notif.id = 'payment-notification';
    notif.className = `payment-notification ${type}`;
    notif.innerHTML = `<span class="notif-icon">${icons[type] || 'ℹ️'}</span><span class="notif-msg">${message}</span><button class="notif-close" onclick="this.parentElement.remove()">×</button>`;

    const panel = document.getElementById('step-panel-4');
    if (panel) panel.prepend(notif);

    setTimeout(() => { if (notif.parentElement) notif.remove(); }, 6000);
}

// ─── Handle main Pay Now button click ────────────────────────────────────────
async function handlePaymentSubmit() {
    // Free / inquiry-only services skip payment
    if (currentService && (currentService.fee === 0 || currentService.inquiryOnly)) {
        await checkPaymentStatus();
        return;
    }

    if (selectedPayMethod === 'gateway') {
        await payViaCashfreeGateway();
        return;
    }

    // If on the UPI ID/Apps tab, validate UPI ID first
    if (selectedPayMethod === 'upi-intent') {
        const upiInput = document.getElementById('upi-id-input');
        const upiId = upiInput ? upiInput.value.trim() : '';

        if (!upiId) {
            showUpiFeedback(false, 'Please enter your UPI ID to proceed.');
            upiInput && upiInput.focus();
            return;
        }

        if (!validateUpiId(upiId)) {
            showUpiFeedback(false, 'Invalid UPI ID format. Example: name@paytm, name@ybl, 9876543210@upi');
            upiInput && upiInput.focus();
            return;
        }

        showUpiFeedback(true, 'UPI ID verified! Initiating payment...');
        setTimeout(() => payViaUpiApp('other', upiId), 600);
        return;
    }

    // UPI QR Scan — pull backend verification status directly
    await checkPaymentStatus();
}

// ─── Pay via Secure Cashfree Gateway ──────────────────────────────────────────
async function payViaCashfreeGateway() {
    if (!currentApplicationId) {
        alert('Application ID is missing. Please restart the submission process.');
        return;
    }

    const overlay = document.getElementById('payment-processing');
    if (overlay) {
        const title = document.getElementById('payment-processing-title');
        const desc = document.getElementById('payment-processing-desc');
        if (title) title.textContent = 'Initiating Secure Checkout...';
        if (desc) desc.textContent = 'Contacting payment gateway session...';
        overlay.classList.remove('hidden');
    }

    try {
        const sessionData = await window.api.createPaymentOrder(currentApplicationId);
        if (overlay) overlay.classList.add('hidden');

        // Check if sandbox simulated session fallback
        if (sessionData.is_simulated) {
            // Show UPI simulation modal instead for easy sandbox dev checks
            showUpiSimulationModal('other', 'Gateway Checkout Sim', 'customer@gateway', sessionData.amount, sessionData.order_id);
        } else {
            // Real Cashfree SDK checkout redirect (sandbox/production)
            if (typeof Cashfree !== 'undefined') {
                const cashfree = Cashfree({
                    mode: "sandbox" // Change to "production" in prod env
                });
                
                cashfree.checkout({
                    paymentSessionId: sessionData.payment_session_id,
                    returnUrl: `http://localhost:5000/index.html?track=${currentApplicationId}`
                });
            } else {
                alert('Cashfree Gateway SDK was not loaded. Simulating checkout flow...');
                showUpiSimulationModal('other', 'Gateway Checkout Fallback', 'customer@gateway', sessionData.amount, sessionData.order_id);
            }
        }
    } catch (error) {
        if (overlay) overlay.classList.add('hidden');
        alert('Gateway initialization failed: ' + error.message);
    }
}

// ─── Pay via UPI App Intent ──────────────────────────────────────────────────
function payViaUpiApp(app, prefilledUpiId) {
    if (!currentService || !currentOrderId) return;

    const upiInput = document.getElementById('upi-id-input');
    const clientUpiId = prefilledUpiId || (upiInput ? upiInput.value.trim() : '') || 'customer@upi';

    // Validate UPI ID if entering from the intent panel
    if (selectedPayMethod === 'upi-intent' && !prefilledUpiId) {
        const upiVal = upiInput ? upiInput.value.trim() : '';
        if (upiVal && !validateUpiId(upiVal)) {
            showUpiFeedback(false, 'Invalid UPI ID format. Please correct it before selecting an app.');
            return;
        }
        if (upiVal) showUpiFeedback(true, 'UPI ID looks good!');
    }

    const fee = currentService.fee;
    const merchantVpa = 'paytmqr6wi94q@ptys';
    const merchantName = 'SUCCESS%20MP%20ONLINE';

    const appPackages = {
        gpay: 'com.google.android.apps.nbu.paisa.user',
        phonepe: 'com.phonepe.app',
        paytm: 'net.one97.paytm',
        bhim: 'in.org.npci.upiapp',
        other: null
    };

    const appNames = {
        gpay: 'Google Pay',
        phonepe: 'PhonePe',
        paytm: 'Paytm',
        bhim: 'BHIM',
        other: 'UPI App'
    };

    const upiUri = `upi://pay?pa=${merchantVpa}&pn=${merchantName}&am=${fee}&tr=${currentOrderId}&cu=INR`;

    // Attempt to open UPI app on mobile
    const isMobile = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
    if (isMobile) {
        window.location.href = upiUri;
        // After a short delay, if user returns, show the simulation modal
        setTimeout(() => showUpiSimulationModal(app, appNames[app], clientUpiId, fee, currentOrderId), 2500);
    } else {
        // Desktop: show simulation modal directly
        showUpiSimulationModal(app, appNames[app], clientUpiId, fee, currentOrderId);
    }
}

// ─── Show UPI Simulation Modal ───────────────────────────────────────────────
function showUpiSimulationModal(app, appName, clientUpiId, amount, txnRef) {
    const modal = document.getElementById('upi-simulation-modal');
    if (!modal) return;

    const logoEl = document.getElementById('upi-sim-app-logo');
    const vpaEl = document.getElementById('upi-sim-client-vpa');
    const amountEl = document.getElementById('upi-sim-amount-val');
    const refEl = document.getElementById('upi-sim-ref-no');

    const appColors = {
        gpay: '#1a73e8',
        phonepe: '#5f259f',
        paytm: '#002970',
        bhim: '#003087',
        other: '#4f46e5'
    };

    if (logoEl) {
        logoEl.textContent = appName;
        logoEl.style.background = appColors[app] || '#4f46e5';
    }
    if (vpaEl) vpaEl.textContent = clientUpiId;
    if (amountEl) amountEl.textContent = `₹${amount}.00`;
    if (refEl) refEl.textContent = txnRef;

    // Store ref for use after simulation
    modal.dataset.txnRef = txnRef;
    modal.dataset.appName = appName;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// ─── Complete UPI Simulation (success / cancel / fail) ───────────────────────
async function completeUpiSimulation(outcome) {
    const modal = document.getElementById('upi-simulation-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    if (outcome === 'success') {
        const overlay = document.getElementById('payment-processing');
        if (overlay) {
            const title = document.getElementById('payment-processing-title');
            const desc = document.getElementById('payment-processing-desc');
            if (title) title.textContent = 'Verifying Transaction...';
            if (desc) desc.textContent = 'Simulating payment approval on sandbox gateway...';
            overlay.classList.remove('hidden');
        }

        try {
            await window.api.simulatePayment(currentOrderId, 'success');
            setTimeout(async () => {
                await checkPaymentStatus();
            }, 1000);
        } catch (err) {
            if (overlay) overlay.classList.add('hidden');
            alert('Simulation failed: ' + err.message);
        }
    } else if (outcome === 'cancel') {
        showPaymentNotification('warning', 'Payment cancelled. You can retry by selecting a UPI app again.');
    } else if (outcome === 'fail') {
        try {
            await window.api.simulatePayment(currentOrderId, 'fail');
            showPaymentNotification('error', 'Payment failed. Simulated transaction marked as FAILED.');
        } catch (err) {
            showPaymentNotification('error', 'Payment failed simulation triggered error: ' + err.message);
        }
    }
}

// ─── Pull Payment Status from Backend ────────────────────────────────────────
async function checkPaymentStatus() {
    const overlay = document.getElementById('payment-processing');
    if (overlay) {
        const overlayTitle = document.getElementById('payment-processing-title');
        const overlayDesc = document.getElementById('payment-processing-desc');
        if (overlayTitle) overlayTitle.textContent = 'Verifying Transaction...';
        if (overlayDesc) overlayDesc.textContent = 'Checking status with payment gateway. Please wait...';
        overlay.classList.remove('hidden');
    }

    try {
        const result = await window.api.verifyPayment(currentOrderId);
        if (result.status === 'SUCCESS') {
            const application = await window.api.trackApplication(currentApplicationId);
            if (overlay) overlay.classList.add('hidden');

            document.getElementById('rec-id-val').textContent = application.id;
            document.getElementById('rec-date-val').textContent = new Date(application.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            document.getElementById('rec-service-name').textContent = currentService.name;
            document.getElementById('rec-client-name').textContent = application.customerName;
            document.getElementById('rec-client-phone').textContent = application.customerPhone;
            document.getElementById('rec-amount-paid').textContent = `₹${application.amountPaid}.00`;
            document.getElementById('rec-amount-total').textContent = `₹${application.amountPaid}.00`;
            document.getElementById('rec-timeline-val').textContent = application.completionTimeline;

            navigateTo('receipt-section');
        } else {
            if (overlay) overlay.classList.add('hidden');
            alert('Payment status is: ' + result.status + '. If you have completed the payment, please retry verifying in a moment.');
        }
    } catch (err) {
        if (overlay) overlay.classList.add('hidden');
        alert('Verification failed: ' + err.message);
    }
}

// ─── Track from receipt page ──────────────────────────────────────────────────
function trackFromReceipt() {
    const appId = document.getElementById('rec-id-val').textContent;
    const searchInput = document.getElementById('track-search-input');
    if (searchInput) searchInput.value = appId;
    navigateTo('customer-landing');
    handleHeaderSearch();
}

// ─── Header search / tracking handler ────────────────────────────────────────
async function handleHeaderSearch() {
    const input = document.getElementById('track-search-input');
    const query = input ? input.value.trim() : '';
    if (!query) return;

    const container = document.getElementById('tracking-result-container');
    const content = document.getElementById('tracking-content');

    if (!container || !content) return;

    try {
        const app = await window.api.trackApplication(query);
        
        const statusColors = {
            'PENDING_VERIFICATION': '#f59e0b',
            'PROCESSING': '#3b82f6',
            'APPROVED': '#16a34a',
            'REJECTED': '#ef4444'
        };
        const color = statusColors[app.status] || '#64748b';

        const statusLabels = {
            'PENDING_VERIFICATION': 'Pending Verification',
            'PROCESSING': 'Processing',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected'
        };
        const statusLabel = statusLabels[app.status] || app.status;

        content.innerHTML = `
            <div class="tracking-info-grid">
                <div class="track-row"><span class="track-key">Application ID</span><span class="track-val">${app.id}</span></div>
                <div class="track-row"><span class="track-key">Service</span><span class="track-val">${app.serviceName}</span></div>
                <div class="track-row"><span class="track-key">Applicant</span><span class="track-val">${app.customerName}</span></div>
                <div class="track-row"><span class="track-key">Submitted On</span><span class="track-val">${new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                <div class="track-row"><span class="track-key">Amount Paid</span><span class="track-val">${app.amountPaid === 0 ? 'Free (Inquiry)' : '₹' + app.amountPaid}</span></div>
                <div class="track-row">
                    <span class="track-key">Current Status</span>
                    <span class="track-val" style="color:${color}; font-weight:700;">${statusLabel}</span>
                </div>
                ${app.statusComment ? `<div class="track-row"><span class="track-key">Staff Note</span><span class="track-val">${app.statusComment}</span></div>` : ''}
                ${app.certificateNumber ? `<div class="track-row"><span class="track-key">Certificate / Ref No.</span><span class="track-val" style="font-weight:700;">${app.certificateNumber}</span></div>` : ''}
            </div>
        `;
        container.classList.remove('hidden');
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (window.socket) {
            window.socket.emit('joinApplicationRoom', app.id);
        }
    } catch (error) {
        content.innerHTML = `<p style="color:#ef4444; padding:12px 0;">No application found with ID <strong>${query}</strong>. Please check and try again.</p>`;
        container.classList.remove('hidden');
    }
}

// Close tracking result card
function closeTracking() {
    const container = document.getElementById('tracking-result-container');
    if (container) container.classList.add('hidden');
    const input = document.getElementById('track-search-input');
    if (input) input.value = '';
}
