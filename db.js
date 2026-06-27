// db.js - MODIFIED for PAN Conditional Documents & Loan/Ayushman Services
// This shows the changes needed for dynamic PAN documents based on application type

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Update the PAN service to remove static documents array
// and add a method to get documents dynamically
// ─────────────────────────────────────────────────────────────────────────────

const SERVICES = {
    pan: {
        id: 'pan',
        name: 'PAN Card Registration',
        subtitle: 'New & Correction',
        fee: 200,
        timeline: '3 to 5 working days',
        desc: 'Apply for a new PAN card or correct/update details on an existing PAN card.',
        icon: 'credit-card',
        eligibility: [
            'Any Indian Citizen (individual, company, or firm) is eligible.',
            'Minors can apply through their parents or legal guardians.',
            'Foreign nationals who need to execute financial transactions in India.'
        ],
        benefits: [
            'Mandatory for filing Income Tax Returns and tax compliance.',
            'Required to open a bank account, get a credit card, or make investments.',
            'Acts as a globally recognized, lifetime valid identity proof.',
            'Avoid a flat 20% TDS on certain interest income and transaction payments.'
        ],
        faqs: [
            { q: 'Can I hold more than one PAN Card?', a: 'No. Holding multiple PAN cards is illegal under Section 272B of the Income Tax Act and attracts a flat penalty of ₹10,000.' },
            { q: 'Is physical presence required for applying?', a: 'No, our cyber cafe operators handle the entire submission digitally. You only need to verify via Aadhaar OTP or upload physical sign scans.' },
            { q: 'How is the physical PAN card delivered?', a: 'Once approved, the Income Tax Department dispatches the physical card directly to your Aadhaar-registered address via speed post.' }
        ],
        svgMarkup: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
                <defs>
                    <linearGradient id="panGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#0f172a"/>
                        <stop offset="100%" stop-color="#1e293b"/>
                    </linearGradient>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#fbbf24"/>
                        <stop offset="100%" stop-color="#d97706"/>
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" rx="15" fill="url(#panGrad)"/>
                <circle cx="350" cy="50" r="80" fill="rgba(79, 70, 229, 0.08)"/>
                <path d="M 0,150 Q 100,100 200,160 T 400,120" stroke="rgba(255,255,255,0.03)" fill="none" stroke-width="2"/>
                <circle cx="45" cy="40" r="12" fill="rgba(255, 255, 255, 0.15)"/>
                <text x="68" y="44" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold" letter-spacing="1">INCOME TAX DEPT</text>
                <rect x="30" y="70" width="40" height="30" rx="4" fill="url(#goldGrad)"/>
                <line x1="43" y1="70" x2="43" y2="100" stroke="#78350f" stroke-width="1"/>
                <line x1="56" y1="70" x2="56" y2="100" stroke="#78350f" stroke-width="1"/>
                <line x1="30" y1="85" x2="70" y2="85" stroke="#78350f" stroke-width="1"/>
                <rect x="290" y="65" width="80" height="95" rx="6" fill="#1e293b" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
                <circle cx="330" cy="100" r="18" fill="#475569"/>
                <path d="M 305,145 C 305,125 355,125 355,145 Z" fill="#475569"/>
                <text x="30" y="132" fill="#94a3b8" font-family="sans-serif" font-size="9" letter-spacing="0.5">PERMANENT ACCOUNT NUMBER</text>
                <text x="30" y="152" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold" letter-spacing="1.5">ABCDE1234F</text>
                <text x="30" y="178" fill="#cbd5e1" font-family="sans-serif" font-size="11" font-weight="600">NAME: AMIT KUMAR MISHRA</text>
            </svg>
        `,
        fields: [
            { id: 'applicationType', label: 'Application Type', type: 'select', required: true, options: ['New PAN Card', 'Correction / Update Existing PAN Card'] },
            { id: 'existingPanNumber', label: 'Existing PAN Number (fill only if selecting Correction/Update)', type: 'text', required: false, pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}' },
            { id: 'fullName', label: 'Full Name (as in Aadhaar)', type: 'text', required: true },
            { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
            { id: 'fatherName', label: "Father's Name", type: 'text', required: true },
            { id: 'email', label: 'Email Address', type: 'email', required: true },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' }
        ],
        documents: [
            { id: 'aadhaarDoc', label: 'Aadhaar Card (Identity & Address Proof)', required: true },
            { id: 'photoDoc', label: 'Passport Size Photo', required: true, accept: 'image/*' },
            { id: 'signDoc', label: 'Signature Scan', required: true, accept: 'image/*' },
            { id: 'dobProofDoc', label: 'DOB Proof / 10th Marksheet', required: true },
            { id: 'mobileEmailInfo', label: 'Mobile Number & Email ID', required: true }
        ]
    },
    samagra: {
        id: 'samagra',
        name: 'Samagra Portal',
        subtitle: 'KYC & Member Services',
        fee: 40,
        timeline: '5 to 7 working days',
        desc: 'Choose KYC, Member Add, or Other State Samagra Add services from one place.',
        icon: 'users',
        eligibility: [
            'Must be a permanent resident of Madhya Pradesh (MP).',
            'All family members must reside in the state for family profile mapping.',
            'Must hold a valid Aadhaar card linked with active mobile number for eKYC.'
        ],
        benefits: [
            'Access all state government direct benefit transfers (DBT) and welfare funds.',
            'Essential for school/college admissions and state scholarship distribution.',
            'Required to get subsidised food grains under the National Food Security Act (NFSA).'
        ],
        faqs: [
            { q: 'What is the difference between a Family ID and a Member ID?', a: 'A Samagra Family ID is an 8-digit code issued for the entire household, whereas a Member ID is a unique 9-digit code issued to individual family members.' },
            { q: 'Is Aadhaar eKYC mandatory on Samagra?', a: 'Yes, eKYC is mandatory to link your Aadhaar details, which automatically validates your name, date of birth, and gender.' },
            { q: 'How long does member addition take?', a: 'Once submitted by our cafe operator, it goes to municipal/Panchayat level approval, taking 5 to 7 working days.' }
        ],
        svgMarkup: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
                <defs>
                    <linearGradient id="samagraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#059669"/>
                        <stop offset="100%" stop-color="#047857"/>
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" rx="15" fill="url(#samagraGrad)"/>
                <circle cx="50" cy="170" r="90" fill="rgba(255, 255, 255, 0.04)"/>
                <text x="25" y="35" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">SAMAGRA PORTAL</text>
                <text x="25" y="50" fill="#d1fae5" font-family="sans-serif" font-size="9" letter-spacing="0.5">FAMILY &amp; SOCIAL SECURITY REGISTRY</text>
                <g transform="translate(265, 60)" fill="#ffffff" opacity="0.85">
                    <circle cx="30" cy="25" r="9"/>
                    <path d="M15 42 c0-12 30-12 30 0 v25 h-8 v-18 h-14 v18 h-8 z"/>
                    <circle cx="60" cy="30" r="8"/>
                    <path d="M48 46 c0-10 24-10 24 0 v21 h-7 v-14 h-10 v14 h-7 z"/>
                    <circle cx="85" cy="42" r="6"/>
                    <path d="M76 54 c0-7 18-7 18 0 v13 h-4 v-8 h-10 v8 h-4 z"/>
                </g>
                <text x="25" y="90" fill="#d1fae5" font-family="sans-serif" font-size="10">Family Head Name</text>
                <text x="25" y="108" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">Rajesh Kumar Sharma</text>
                <text x="25" y="138" fill="#d1fae5" font-family="sans-serif" font-size="10">Samagra Family ID</text>
                <text x="25" y="158" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold" letter-spacing="1">3988 2094</text>
            </svg>
        `,
        fields: [
            { id: 'familyHead', label: 'Name of Family Head', type: 'text', required: true },
            { id: 'aadhaarNo', label: 'Aadhaar Number of Head', type: 'text', required: true, pattern: '[0-9]{12}' },
            { id: 'memberCount', label: 'Number of Family Members', type: 'number', required: true, min: 1 },
            { id: 'fullAddress', label: 'Complete Home Address', type: 'textarea', required: true },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' }
        ],
        documents: [
            { id: 'aadhaarDoc', label: 'Aadhaar Card', required: true },
            { id: 'mobileDoc', label: 'Mobile Number', required: true },
            { id: 'samagraOrFatherDoc', label: 'Samagra ID / Father\'s Name', required: true },
            { id: 'familyHeadInfo', label: 'Family Head Details', required: true },
            { id: 'addressInfo', label: 'Current Address Details', required: true }
        ]
    },
    msme: {
        id: 'msme',
        name: 'MSME Registration',
        subtitle: 'Udyam Certificate',
        fee: 199,
        timeline: '2 to 3 working days',
        desc: 'Register your micro, small or medium enterprise to obtain MSME Udyam Certificate.',
        icon: 'briefcase',
        eligibility: [
            'All Micro, Small, and Medium sized businesses (MSMEs).',
            'Proprietorships, partnerships, Hindu Undivided Families (HUF), self-help groups, LLPs, and companies.',
            'Must have a commercial operation and active Aadhaar + PAN.'
        ],
        benefits: [
            'Eligible for collateral-free bank loans under Credit Guarantee schemes.',
            'Special interest rate concessions (typically 1% to 1.5% lower) from banks.',
            '50% subsidy on patent, trademark, and copyright registration fee.',
            'Government priority procurement and protection against delayed buyer payments.'
        ],
        faqs: [
            { q: 'Is there any annual renewal for MSME Udyam Registration?', a: 'No, once registered under the Udyam portal, the certificate has lifetime validity unless voluntarily cancelled.' },
            { q: 'What are the micro, small, and medium category limits?', a: 'Micro: Investment < ₹1 Cr, Turnover < ₹5 Cr. Small: Investment < ₹10 Cr, Turnover < ₹50 Cr. Medium: Investment < ₹50 Cr, Turnover < ₹250 Cr.' },
            { q: 'Can a trader apply for MSME registration?', a: 'Yes, wholesale and retail traders are now eligible to register under the Udyam portal for priority sector lending.' }
        ],
        svgMarkup: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
                <defs>
                    <linearGradient id="msmeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#6d28d9"/>
                        <stop offset="100%" stop-color="#4c1d95"/>
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" rx="15" fill="url(#msmeGrad)"/>
                <path d="M 0,20 Q 100,80 200,10 T 400,60" stroke="rgba(255,255,255,0.04)" fill="none" stroke-width="4"/>
                <text x="25" y="35" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">UDYAM REGISTRATION</text>
                <text x="25" y="50" fill="#ddd6fe" font-family="sans-serif" font-size="9" letter-spacing="0.5">MINISTRY OF MSME, GOVT OF INDIA</text>
                <g transform="translate(285, 50)" fill="none" stroke="#ffffff" stroke-width="1.5">
                    <rect x="10" y="10" width="70" height="90" rx="5" opacity="0.2"/>
                    <line x1="20" y1="30" x2="70" y2="30" stroke="rgba(255,255,255,0.4)"/>
                    <line x1="20" y1="50" x2="70" y2="50" stroke="rgba(255,255,255,0.4)"/>
                    <line x1="20" y1="70" x2="50" y2="70" stroke="rgba(255,255,255,0.4)"/>
                    <circle cx="60" cy="80" r="10" fill="#fbbf24" stroke="#fbbf24"/>
                </g>
                <text x="25" y="90" fill="#ddd6fe" font-family="sans-serif" font-size="10">Enterprise / Business Name</text>
                <text x="25" y="108" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">Sharma Tech Services</text>
                <text x="25" y="138" fill="#ddd6fe" font-family="sans-serif" font-size="10">Registration Number (Udyam)</text>
                <text x="25" y="158" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">UDYAM-MH-12-0098765</text>
            </svg>
        `,
        fields: [
            { id: 'enterpriseName', label: 'Name of Enterprise / Business', type: 'text', required: true },
            { id: 'ownerName', label: 'Name of Entrepreneur / Owner', type: 'text', required: true },
            { id: 'aadhaarNo', label: 'Aadhaar Number of Owner', type: 'text', required: true, pattern: '[0-9]{12}' },
            { id: 'businessPan', label: 'Business / Owner PAN Card Number', type: 'text', required: true, pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}' },
            { id: 'businessType', label: 'Type of Business Organization', type: 'select', required: true, options: ['Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'Others'] },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' },
            { id: 'email', label: 'Email ID', type: 'email', required: true },
            { id: 'annualIncome', label: 'Annual Income', type: 'number', required: true, min: 0 },
            { id: 'firmAddress', label: 'Firm Address', type: 'textarea', required: true }
        ],
        documents: [
            { id: 'aadhaarFront', label: 'Aadhaar Card - Front Side', required: true, accept: 'image/*' },
            { id: 'aadhaarBack', label: 'Aadhaar Card - Back Side', required: true, accept: 'image/*' },
            { id: 'panDoc', label: 'PAN Card Copy', required: true },
            { id: 'businessProofDoc', label: 'Business Address Proof (Rent Agreement/Electricity Bill)', required: true },
            { id: 'passbookDoc', label: 'Bank Passbook', required: true, accept: 'image/*,application/pdf' }
        ]
    },
    gumasta: {
        id: 'gumasta',
        name: 'Gumasta License',
        subtitle: 'Shop & Establishment',
        fee: 699,
        timeline: '4 to 6 working days',
        desc: 'Choose Individual Proprietorship or Partnership Firm for Gumasta license registration.',
        icon: 'store',
        eligibility: [
            'Any retail shop, service firm, commercial office, restaurant or hotel.',
            'Must have a commercial establishment premise with a physical address.',
            'Must register within 30 days of initiating business activities.'
        ],
        benefits: [
            'Legal and mandatory permit under the State Shop & Establishment Act.',
            'Acts as official proof of business existence required for opening bank accounts.',
            'Enables access to local municipal tenders and business loans.',
            'Prevents heavy fines and closure notices during labor department inspections.'
        ],
        faqs: [
            { q: 'Is Gumasta license required for home-based work?', a: 'Yes, if you operate a commercial entity, hire employees, or need a business current account, Gumasta registration is legally required.' },
            { q: 'How long is the Gumasta license valid?', a: 'It varies by state; it can be issued for 1 year, 5 years, or have lifetime validity with an option to select during filing.' },
            { q: 'What is the penalty for operating without a license?', a: 'Local authorities can levy fines ranging from ₹5,000 to ₹50,000 or issue closure warnings depending on establishment size.' }
        ],
        svgMarkup: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
                <defs>
                    <linearGradient id="gumastaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#0369a1"/>
                        <stop offset="100%" stop-color="#0c4a6e"/>
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" rx="15" fill="url(#gumastaGrad)"/>
                <circle cx="355" cy="165" r="95" fill="rgba(255, 255, 255, 0.05)"/>
                <text x="25" y="35" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">GUMASTA LICENSE</text>
                <text x="25" y="50" fill="#bae6fd" font-family="sans-serif" font-size="9" letter-spacing="0.5">SHOPS &amp; ESTABLISHMENTS ACT</text>
                <g transform="translate(275, 55)" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.85">
                    <path d="M0,35 L50,8 L100,35 Z" fill="rgba(255,255,255,0.15)" stroke="none"/>
                    <rect x="10" y="35" width="80" height="60" />
                    <line x1="30" y1="55" x2="30" y2="95" />
                    <line x1="50" y1="55" x2="50" y2="95" />
                    <line x1="70" y1="55" x2="70" y2="95" />
                    <line x1="10" y1="55" x2="90" y2="55" />
                    <rect x="38" y="68" width="14" height="27" fill="rgba(255,255,255,0.2)" stroke="none"/>
                </g>
                <text x="25" y="90" fill="#bae6fd" font-family="sans-serif" font-size="10">Shop / Establishment Name</text>
                <text x="25" y="108" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">Mishra General Store</text>
                <text x="25" y="138" fill="#bae6fd" font-family="sans-serif" font-size="10">License Registration No.</text>
                <text x="25" y="158" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold" letter-spacing="1">GUM/2026/04521</text>
            </svg>
        `,
        fields: [
            { id: 'fullName', label: 'Full Name', type: 'text', required: true },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' },
            { id: 'email', label: 'Email ID', type: 'email', required: true },
            { id: 'businessName', label: 'Business Name', type: 'text', required: true },
            { id: 'businessAddress', label: 'Business Address', type: 'textarea', required: true },
            { id: 'businessCategory', label: 'Business Category', type: 'select', required: true, options: ['Retail Shop', 'Wholesale', 'Restaurant / Eatery', 'Service Provider', 'Others'] }
        ],
        documents: [
            { id: 'aadhaarFront', label: 'Aadhaar Card (Front Side)', required: true, accept: 'image/*' },
            { id: 'aadhaarBack', label: 'Aadhaar Card (Back Side)', required: true, accept: 'image/*' },
            { id: 'signature', label: 'Signature', required: true, accept: 'image/*' },
            { id: 'samagraId', label: 'Samagra ID', required: true, accept: 'image/*,application/pdf' }
        ]
    },
    ayushman: {
        id: 'ayushman',
        name: 'Ayushman Card',
        subtitle: 'PM-JAY Health Insurance',
        fee: 200,
        timeline: '3 to 5 working days',
        desc: 'Apply for a new Ayushman Bharat Golden Card to get free health insurance coverage up to ₹5 Lakhs.',
        icon: 'shield',
        eligibility: [
            'Must be listed in the SECC-2011 (Socio-Economic Caste Census) database.',
            'Should hold an active, valid NFSA Ration Card or state-eligible Food Slip.',
            'Family members mapped under an active state resident profile.'
        ],
        benefits: [
            'Provides free, cashless health insurance coverage up to ₹5 Lakhs per family per year.',
            'Covers secondary and tertiary hospitalisation at all government and impaneled private hospitals.',
            'Pre-existing conditions and post-treatment expenses are covered from day one.',
            'Zero out-of-pocket expenses for surgery, diagnostics, and essential medicines.'
        ],
        faqs: [
            { q: 'Is there any age or family size limit under PM-JAY?', a: 'No, PM-JAY does not restrict family size or age. All members registered on the eligible card receive full individual benefits.' },
            { q: 'How can I check if my name is in the beneficiary list?', a: 'Our cafe operators will search the official PM-JAY portal using your Aadhaar number, Samagra ID, or Ration card details to check eligibility.' },
            { q: 'What is the Ayushman Golden Card?', a: 'It is a physical beneficiary identity card. Once issued, you simply present it at hospital reception to start cashless treatment.' }
        ],
        svgMarkup: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
                <defs>
                    <linearGradient id="ayushmanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#f97316"/>
                        <stop offset="100%" stop-color="#ea580c"/>
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" rx="15" fill="url(#ayushmanGrad)"/>
                <circle cx="360" cy="160" r="90" fill="rgba(255, 255, 255, 0.05)"/>
                <path d="M 0,160 Q 100,120 200,170 T 400,140" stroke="rgba(255,255,255,0.05)" fill="none" stroke-width="2"/>
                <circle cx="45" cy="40" r="14" fill="rgba(255, 255, 255, 0.2)"/>
                <path d="M 45,31 L 53,35 L 53,42 C 53,47 49,51 45,52 C 41,51 37,47 37,42 L 37,35 Z" fill="#ffffff"/>
                <text x="68" y="44" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold" letter-spacing="1">PM-JAY AYUSHMAN CARD</text>
                <rect x="290" y="65" width="80" height="95" rx="6" fill="#f97316" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
                <circle cx="330" cy="100" r="18" fill="#ffedd5"/>
                <path d="M 305,145 C 305,125 355,125 355,145 Z" fill="#ffedd5"/>
                <text x="30" y="90" fill="#ffedd5" font-family="sans-serif" font-size="9" letter-spacing="0.5">BENEFICIARY NAME</text>
                <text x="30" y="108" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">AMIT KUMAR MISHRA</text>
                <text x="30" y="138" fill="#ffedd5" font-family="sans-serif" font-size="9" letter-spacing="0.5">HEALTH COVER AMOUNT</text>
                <text x="30" y="158" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold" letter-spacing="1">₹ 5,00,000 / YEAR</text>
            </svg>
        `,
        fields: [
            { id: 'fullName', label: 'Full Name', type: 'text', required: true },
            { id: 'email', label: 'Email ID', type: 'email', required: true },
            { id: 'samagraIdNo', label: 'Samagra ID Number', type: 'text', required: true }
        ],
        documents: [
            { id: 'aadhaarFront', label: 'Aadhaar Card (Front Side)', required: true, accept: 'image/*' },
            { id: 'aadhaarBack', label: 'Aadhaar Card (Back Side)', required: true, accept: 'image/*' },
            { id: 'samagraDoc', label: 'Samagra ID Document', required: true, accept: 'image/*,application/pdf' },
            { id: 'mobileInfo', label: 'Mobile Number Linked with Aadhaar', required: true },
            { id: 'familyIdInfo', label: 'Family ID / Ration Details', required: true }
        ]
    },
    itr: {
        id: 'itr',
        name: 'ITR Filing',
        subtitle: 'Income Tax Return',
        fee: 799,
        timeline: '2 to 3 working days',
        desc: 'Submit your income tax return request with PAN, bank passbook, and Aadhaar documents.',
        icon: 'file-text',
        eligibility: [
            'Individuals with gross annual income exceeding ₹2.5 Lakhs (New/Old tax regime limits).',
            'Anyone who has paid excess TDS and wishes to claim a refund.',
            'Mandatory for those seeking visa approvals, high-value loans, or business registrations.'
        ],
        benefits: [
            'Stay fully compliant with Income Tax Department rules and avoid penalties.',
            'Acts as official, government-accepted income proof for visa processing and loan approvals.',
            'Allows you to offset capital losses against capital gains in future years.',
            'Enables direct refund of extra TDS deducted on salary or bank interest.'
        ],
        faqs: [
            { q: 'What is Form 16 and is it mandatory?', a: 'Form 16 is a certificate of TDS issued by employers. If you are salaried, it is highly recommended, but ITR can still be filed using monthly payslips and bank statements.' },
            { q: 'Is my financial data secure?', a: 'Absolutely. EasyCafe uses end-to-end security, and returns are prepared only by certified tax professionals.' },
            { q: 'What is the last date to file ITR?', a: 'For individuals, the standard deadline is July 31st of the assessment year, but late returns can be filed with a penalty fee.' }
        ],
        svgMarkup: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
                <defs>
                    <linearGradient id="itrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#0f766e"/>
                        <stop offset="100%" stop-color="#115e59"/>
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" rx="15" fill="url(#itrGrad)"/>
                <circle cx="355" cy="55" r="85" fill="rgba(255, 255, 255, 0.06)"/>
                <path d="M 0,155 Q 120,115 235,160 T 400,125" stroke="rgba(255,255,255,0.06)" fill="none" stroke-width="3"/>
                <text x="25" y="36" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">ITR FILING</text>
                <text x="25" y="52" fill="#ccfbf1" font-family="sans-serif" font-size="9" letter-spacing="0.5">INCOME TAX RETURN SERVICE</text>
                <g transform="translate(282, 56)" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.9">
                    <rect x="0" y="0" width="76" height="96" rx="6" fill="rgba(255,255,255,0.12)"/>
                    <path d="M18 28 h40 M18 48 h40 M18 68 h26" stroke="rgba(255,255,255,0.75)"/>
                    <circle cx="54" cy="70" r="13" fill="#fbbf24" stroke="#fbbf24"/>
                    <path d="M48 70 h12 M54 64 v12" stroke="#78350f" stroke-width="2"/>
                </g>
                <text x="25" y="92" fill="#ccfbf1" font-family="sans-serif" font-size="10">Applicant Details</text>
                <text x="25" y="111" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">Name, Email, Mobile, PAN</text>
                <text x="25" y="142" fill="#ccfbf1" font-family="sans-serif" font-size="10">Documents</text>
                <text x="25" y="162" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">Passbook, PAN, Aadhaar</text>
            </svg>
        `,
        fields: [
            { id: 'fullName', label: 'Full Name', type: 'text', required: true },
            { id: 'email', label: 'Email ID', type: 'email', required: true },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' },
            { id: 'panNumber', label: 'PAN Card Number', type: 'text', required: true, pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}' }
        ],
        documents: [
            { id: 'bankPassbook', label: 'Bank Passbook', required: true, accept: 'image/*,application/pdf' },
            { id: 'panCard', label: 'PAN Card', required: true, accept: 'image/*,application/pdf' },
            { id: 'aadhaarFront', label: 'Aadhaar Card (Front Side)', required: true, accept: 'image/*' },
            { id: 'aadhaarBack', label: 'Aadhaar Card (Back Side)', required: true, accept: 'image/*' }
        ]
    },
    aadhaarUpdate: {
        id: 'aadhaarUpdate',
        name: 'Aadhaar Update',
        subtitle: 'Correction & Mobile Link',
        fee: 199,
        timeline: '3 to 5 working days',
        desc: 'Request Aadhaar correction or update with registered mobile and supporting document upload.',
        icon: 'id-card',
        eligibility: [
            'Any resident holding an existing 12-digit Aadhaar Card.',
            'Must have a valid mobile number linked with Aadhaar (or linking request ready).',
            'Must provide official supporting proof for requested name, DOB, or address changes.'
        ],
        benefits: [
            'Keeps your identity details matching other legal documents (like PAN and Passport).',
            'Ensures hassle-free banking eKYC, SIM registration, and mutual fund updates.',
            'Enables login to government portals (EPFO, I-T portal, DigiLocker) using secure OTPs.'
        ],
        faqs: [
            { q: 'Can I change my address online without proof?', a: 'No, a valid document proof of address (like electricity bill, rent agreement, bank statement) is mandatory.' },
            { q: 'Can mobile number be updated online?', a: 'Mobile number links require biometrics at an Aadhaar center, but we can pre-file and schedule the update request to minimize wait times.' },
            { q: 'How long does Aadhaar update take?', a: 'Once submitted to UIDAI by our cafe, it typically reflects in their database within 3 to 5 working days.' }
        ],
        svgMarkup: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
                <defs>
                    <linearGradient id="aadhaarUpdateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#be123c"/>
                        <stop offset="100%" stop-color="#9f1239"/>
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" rx="15" fill="url(#aadhaarUpdateGrad)"/>
                <circle cx="55" cy="168" r="88" fill="rgba(255, 255, 255, 0.06)"/>
                <text x="25" y="36" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">AADHAAR UPDATE</text>
                <text x="25" y="52" fill="#ffe4e6" font-family="sans-serif" font-size="9" letter-spacing="0.5">DETAIL CORRECTION SERVICE</text>
                <g transform="translate(278, 58)">
                    <rect x="0" y="0" width="86" height="92" rx="8" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.45)" stroke-width="1.4"/>
                    <circle cx="43" cy="34" r="16" fill="#ffe4e6"/>
                    <path d="M18 76 C18 55 68 55 68 76 Z" fill="#ffe4e6"/>
                    <path d="M63 10 l9 9 l-9 9" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M72 19 h-22" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
                </g>
                <text x="25" y="92" fill="#ffe4e6" font-family="sans-serif" font-size="10">Aadhaar Details</text>
                <text x="25" y="111" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">Name, Aadhaar No, Mobile</text>
                <text x="25" y="142" fill="#ffe4e6" font-family="sans-serif" font-size="10">Documents</text>
                <text x="25" y="162" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">Aadhaar Front/Back + Other</text>
            </svg>
        `,
        fields: [
            { id: 'fullName', label: 'Full Name', type: 'text', required: true },
            { id: 'aadhaarNo', label: 'Aadhaar Number', type: 'text', required: true, pattern: '[0-9]{12}' },
            { id: 'aadhaarRegisteredMobile', label: 'Aadhaar Registered Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' },
            { id: 'email', label: 'Email ID', type: 'email', required: true }
        ],
        documents: [
            { id: 'aadhaarFront', label: 'Aadhaar Card (Front Side)', required: true, accept: 'image/*' },
            { id: 'aadhaarBack', label: 'Aadhaar Card (Back Side)', required: true, accept: 'image/*' },
            { id: 'otherDocument', label: 'Other Document', required: true, accept: 'image/*,application/pdf' }
        ]
    },
    loan: {
        id: 'loan',
        name: 'Loan Services',
        subtitle: 'Home, Personal & Business',
        fee: 0,
        inquiryOnly: true,
        timeline: '1 to 2 working days',
        desc: 'Choose from Home Loan, Personal Loan, or Business Loan services.',
        icon: 'landmark',
        eligibility: [
            'Indian citizens aged between 21 and 65 years.',
            'Salaried employees or self-employed professionals with business turnover details.',
            'Minimum stable monthly income of ₹15,000 (varies by bank and loan type).',
            'Good credit score (typically 700+ is preferred for instant offers).'
        ],
        benefits: [
            'Get matched with customized loan options from top-tier public & private banks.',
            'Assisted documentation review by cyber cafe experts to prevent bank rejections.',
            'Completely free service—this is an initial eligibility inquiry with zero charges.'
        ],
        faqs: [
            { q: 'Will submitting this inquiry affect my CIBIL/Credit score?', a: 'No. This is a soft inquiry carried out through initial criteria, meaning it does not register as a hard check on your credit report.' },
            { q: 'What is the maximum loan amount I can inquire for?', a: 'There is no limit. It depends on your monthly income, business balance sheets, and collateral details (if applying for home/business loans).' },
            { q: 'How long does bank approval take?', a: 'Once our operator registers your profile, bank partners typically contact you and provide pre-approvals within 1 to 2 working days.' }
        ],
        svgMarkup: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
                <defs>
                    <linearGradient id="loanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#0284c7"/>
                        <stop offset="100%" stop-color="#0369a1"/>
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" rx="15" fill="url(#loanGrad)"/>
                <circle cx="350" cy="160" r="95" fill="rgba(255, 255, 255, 0.04)"/>
                <path d="M 0,130 Q 120,180 240,110 T 400,150" stroke="rgba(255,255,255,0.03)" fill="none" stroke-width="2"/>
                <circle cx="45" cy="40" r="14" fill="rgba(255, 255, 255, 0.2)"/>
                <path d="M 45,29 L 36,36 L 54,36 Z M 38,37 L 38,47 L 40,47 L 40,37 Z M 44,37 L 44,47 L 46,47 L 46,37 Z M 50,37 L 50,47 L 52,47 L 52,37 Z M 35,48 L 35,50 L 55,50 L 55,48 Z" fill="#ffffff"/>
                <text x="68" y="44" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold" letter-spacing="1">EASYCAFE LOAN PORTAL</text>
                <path d="M 300,140 L 320,110 L 340,120 L 370,80" stroke="#38bdf8" stroke-width="3" fill="none" stroke-linecap="round"/>
                <polygon points="370,80 362,82 368,88" fill="#38bdf8" stroke="#38bdf8"/>
                <text x="30" y="90" fill="#e0f2fe" font-family="sans-serif" font-size="9" letter-spacing="0.5">LOAN TYPES AVAILABLE</text>
                <text x="30" y="108" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">Home, Personal, Business</text>
                <text x="30" y="138" fill="#e0f2fe" font-family="sans-serif" font-size="9" letter-spacing="0.5">FEE TYPE</text>
                <text x="30" y="158" fill="#38bdf8" font-family="sans-serif" font-size="15" font-weight="bold" letter-spacing="0.5">INQUIRY ONLY (FREE)</text>
            </svg>
        `,
        fields: [],
        documents: [
            { id: 'aadhaarInfo', label: 'Aadhaar Card Details', required: true },
            { id: 'panInfo', label: 'PAN Card Details', required: true },
            { id: 'incomeInfo', label: 'Income / Salary Details', required: true },
            { id: 'bankInfo', label: 'Preferred Bank Name', required: true },
            { id: 'mobileInfo', label: 'Mobile Number', required: true }
        ]
    }
};



const SAMAGRA_SERVICES = {
    kyc: {
        id: 'samagra_kyc',
        parentId: 'samagra',
        name: 'Samagra KYC',
        shortName: 'KYC',
        fee: 40,
        timeline: '1 to 2 working days',
        desc: 'Complete Samagra KYC with Aadhaar and mobile details.',
        requiredSummary: ['Aadhaar Card', 'Mobile Number'],
        fields: [
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' },
            { id: 'samagraId', label: 'Samagra ID', type: 'text', required: true }
        ],
        documents: [
            { id: 'aadhaarFront', label: 'Aadhaar Card (Front)', required: true, accept: 'image/*' },
            { id: 'aadhaarBack', label: 'Aadhaar Card (Back)', required: true, accept: 'image/*' }
        ]
    },
    memberAdd: {
        id: 'samagra_member_add',
        parentId: 'samagra',
        name: 'Samagra Member Add',
        shortName: 'Member Add',
        fee: 50,
        timeline: '2 to 3 working days',
        desc: 'Add a new member to an existing Samagra family record.',
        requiredSummary: ['Aadhaar Card', 'Samagra ID', 'Mobile Number'],
        fields: [
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' },
            { id: 'memberName', label: 'Member Name', type: 'text', required: true }
        ],
        documents: [
            { id: 'aadhaarFront', label: 'Aadhaar Card (Front)', required: true, accept: 'image/*' },
            { id: 'aadhaarBack', label: 'Aadhaar Card (Back)', required: true, accept: 'image/*' },
            { id: 'samagraIdDoc', label: 'Samagra ID', required: true, accept: 'image/*,application/pdf' }
        ]
    },
    otherStateAdd: {
        id: 'samagra_other_state_add',
        parentId: 'samagra',
        name: 'Other State Samagra Add',
        shortName: 'Other State Samagra Add',
        fee: 149,
        timeline: '3 to 5 working days',
        desc: 'Create Samagra details for applicants coming from another state.',
        requiredSummary: ['Aadhaar Card', 'Father\'s Name'],
        fields: [
            { id: 'fatherName', label: 'Father\'s Name', type: 'text', required: true },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' }
        ],
        documents: [
            { id: 'aadhaarFront', label: 'Aadhaar Card (Front)', required: true, accept: 'image/*' },
            { id: 'aadhaarBack', label: 'Aadhaar Card (Back)', required: true, accept: 'image/*' }
        ]
    }
};

const GUMASTA_SERVICES = {
    individual: {
        id: 'gumasta_individual',
        parentId: 'gumasta',
        name: 'Gumasta License - Individual Proprietorship',
        shortName: 'Individual Proprietorship',
        gumastaApplicationType: 'Individual Proprietorship',
        fee: SERVICES.gumasta.fee,
        timeline: SERVICES.gumasta.timeline,
        desc: 'Apply as a single owner or proprietor for Gumasta license registration.',
        requiredSummary: ['Aadhaar Front & Back', 'Signature', 'Samagra ID'],
        fields: [
            { id: 'fullName', label: 'Full Name', type: 'text', required: true },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' },
            { id: 'email', label: 'Email ID', type: 'email', required: true },
            { id: 'businessName', label: 'Business Name', type: 'text', required: true },
            { id: 'businessAddress', label: 'Business Address', type: 'textarea', required: true },
            { id: 'businessCategory', label: 'Business Category', type: 'select', required: true, options: ['Retail Shop', 'Wholesale', 'Restaurant / Eatery', 'Service Provider', 'Others'] }
        ],
        documents: getGumastaDocuments('Individual Proprietorship')
    },
    partnership: {
        id: 'gumasta_partnership',
        parentId: 'gumasta',
        name: 'Gumasta License - Partnership Firm',
        shortName: 'Partnership Firm',
        gumastaApplicationType: 'Partnership Firm',
        fee: SERVICES.gumasta.fee,
        timeline: SERVICES.gumasta.timeline,
        desc: 'Apply for a partnership firm with partner-wise Aadhaar document uploads.',
        requiredSummary: ['Partner Aadhaar Front & Back', 'Firm PAN Card', 'Signature', 'Samagra ID'],
        fields: [
            { id: 'firmName', label: 'Firm Name', type: 'text', required: true },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' },
            { id: 'email', label: 'Email ID', type: 'email', required: true },
            { id: 'businessAddress', label: 'Business Address', type: 'textarea', required: true },
            { id: 'businessCategory', label: 'Business Category', type: 'select', required: true, options: ['Retail Shop', 'Wholesale', 'Restaurant / Eatery', 'Service Provider', 'Others'] },
            { id: 'partnerCount', label: 'Number of Owners/Partners', type: 'number', required: true, min: 2 }
        ],
        documents: getGumastaDocuments('Partnership Firm', 2)
    }
};

const LOAN_SERVICES = {
    home: {
        id: 'loan_home',
        parentId: 'loan',
        name: 'Home Loan Inquiry',
        shortName: 'Home Loan',
        fee: 0,
        inquiryOnly: true,
        timeline: '1 to 2 working days',
        desc: 'Inquire about Home Loans for property purchase, house construction, or renovation.',
        requiredSummary: ['Full Name', 'Mobile Number', 'Bank Selection'],
        fields: [
            { id: 'fullName', label: 'Full Name', type: 'text', required: true },
            { id: 'fatherName', label: "Father's Name", type: 'text', required: true },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' },
            { id: 'email', label: 'Email ID', type: 'email', required: true },
            { id: 'bankName', label: 'Preferred Bank Name', type: 'select', required: true, options: [
                'State Bank of India (SBI)', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
                'Punjab National Bank (PNB)', 'Bank of Baroda (BoB)', 'Canara Bank',
                'Union Bank of India', 'Kotak Mahindra Bank', 'IndusInd Bank',
                'IDFC First Bank', 'Yes Bank', 'Federal Bank', 'Indian Bank',
                'Bank of India', 'Central Bank of India', 'Indian Overseas Bank',
                'UCO Bank', 'Bank of Maharashtra', 'Punjab & Sind Bank',
                'Saraswat Cooperative Bank', 'Cosmos Cooperative Bank',
                'SVC Cooperative Bank', 'Bandhan Bank', 'RBL Bank',
                'South Indian Bank', 'Karur Vysya Bank', 'City Union Bank',
                'Abhyudaya Cooperative Bank'
            ] }
        ],
        documents: []
    },
    personal: {
        id: 'loan_personal',
        parentId: 'loan',
        name: 'Personal Loan Inquiry',
        shortName: 'Personal Loan',
        fee: 0,
        inquiryOnly: true,
        timeline: '1 to 2 working days',
        desc: 'Inquire about Personal Loans for medical expenses, marriage, travel, or personal needs.',
        requiredSummary: ['Full Name', 'Mobile Number', 'Bank Selection'],
        fields: [
            { id: 'fullName', label: 'Full Name', type: 'text', required: true },
            { id: 'fatherName', label: "Father's Name", type: 'text', required: true },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' },
            { id: 'email', label: 'Email ID', type: 'email', required: true },
            { id: 'bankName', label: 'Preferred Bank Name', type: 'select', required: true, options: [
                'State Bank of India (SBI)', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
                'Punjab National Bank (PNB)', 'Bank of Baroda (BoB)', 'Canara Bank',
                'Union Bank of India', 'Kotak Mahindra Bank', 'IndusInd Bank',
                'IDFC First Bank', 'Yes Bank', 'Federal Bank', 'Indian Bank',
                'Bank of India', 'Central Bank of India', 'Indian Overseas Bank',
                'UCO Bank', 'Bank of Maharashtra', 'Punjab & Sind Bank',
                'Saraswat Cooperative Bank', 'Cosmos Cooperative Bank',
                'SVC Cooperative Bank', 'Bandhan Bank', 'RBL Bank',
                'South Indian Bank', 'Karur Vysya Bank', 'City Union Bank',
                'Abhyudaya Cooperative Bank'
            ] }
        ],
        documents: []
    },
    business: {
        id: 'loan_business',
        parentId: 'loan',
        name: 'Business Loan Inquiry',
        shortName: 'Business Loan',
        fee: 0,
        inquiryOnly: true,
        timeline: '1 to 2 working days',
        desc: 'Inquire about Business Loans for expansion, working capital, inventory, or equipment purchase.',
        requiredSummary: ['Full Name', 'Mobile Number', 'Bank Selection'],
        fields: [
            { id: 'fullName', label: 'Full Name', type: 'text', required: true },
            { id: 'fatherName', label: "Father's Name", type: 'text', required: true },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' },
            { id: 'email', label: 'Email ID', type: 'email', required: true },
            { id: 'bankName', label: 'Preferred Bank Name', type: 'select', required: true, options: [
                'State Bank of India (SBI)', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
                'Punjab National Bank (PNB)', 'Bank of Baroda (BoB)', 'Canara Bank',
                'Union Bank of India', 'Kotak Mahindra Bank', 'IndusInd Bank',
                'IDFC First Bank', 'Yes Bank', 'Federal Bank', 'Indian Bank',
                'Bank of India', 'Central Bank of India', 'Indian Overseas Bank',
                'UCO Bank', 'Bank of Maharashtra', 'Punjab & Sind Bank',
                'Saraswat Cooperative Bank', 'Cosmos Cooperative Bank',
                'SVC Cooperative Bank', 'Bandhan Bank', 'RBL Bank',
                'South Indian Bank', 'Karur Vysya Bank', 'City Union Bank',
                'Abhyudaya Cooperative Bank'
            ] }
        ],
        documents: []
    }
};

const PAN_SERVICES = {
    new: {
        id: 'pan',
        parentId: 'pan',
        name: 'New PAN Card',
        shortName: 'New PAN Card',
        applicationType: 'New PAN Card',
        fee: SERVICES.pan.fee,
        timeline: SERVICES.pan.timeline,
        desc: 'Apply for a fresh PAN card with Aadhaar, photo, and basic applicant details.',
        requiredSummary: ['Aadhaar Card', 'Passport Size Photo', 'One Supporting Proof'],
        fields: [
            { id: 'fullName', label: 'Full Name (as in Aadhaar)', type: 'text', required: true },
            { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
            { id: 'fatherName', label: "Father's Name", type: 'text', required: true },
            { id: 'email', label: 'Email Address', type: 'email', required: true },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' }
        ],
        documents: getPANDocuments('New PAN Card')
    },
    correction: {
        id: 'pan',
        parentId: 'pan',
        name: 'PAN Card Correction',
        shortName: 'Correction',
        applicationType: 'Correction / Update Existing PAN Card',
        fee: SERVICES.pan.fee,
        timeline: SERVICES.pan.timeline,
        desc: 'Update name, DOB, address, or other details on an existing PAN card.',
        requiredSummary: ['Aadhaar Card', 'Existing PAN Copy', 'One Supporting Proof'],
        fields: [
            { id: 'existingPanNumber', label: 'Existing PAN Number', type: 'text', required: true, pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}' },
            { id: 'fullName', label: 'Full Name (as in Aadhaar)', type: 'text', required: true },
            { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
            { id: 'fatherName', label: "Father's Name", type: 'text', required: true },
            { id: 'email', label: 'Email Address', type: 'email', required: true },
            { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' }
        ],
        documents: getPANDocuments('Correction / Update Existing PAN Card')
    }
};

// Remove placeholder layout key to prevent visual pollution
delete SERVICES.relative;

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Add Helper Function to Get PAN Documents Based on Application Type
// ─────────────────────────────────────────────────────────────────────────────

// Function to get documents for PAN service based on application type
function getPANDocuments(applicationType) {

    const commonDocs = [
        {
            id: "aadhaarFront",
            label: "Aadhaar Card - Front Side",
            required: true,
            accept: "image/*"
        },
        {
            id: "aadhaarBack",
            label: "Aadhaar Card - Back Side",
            required: true,
            accept: "image/*"
        },
        {
            id: "passportPhoto",
            label: "Passport Size Photograph",
            required: true,
            accept: "image/*"
        },
        {
            id: "marksheet10",
            label: "10th Marksheet",
            required: false,
            note: "Any ONE Required"
        },
        {
            id: "voterId",
            label: "Voter ID",
            required: false,
            note: "Any ONE Required"
        },
        {
            id: "marriageCertificate",
            label: "Marriage Certificate",
            required: false,
            note: "Any ONE Required"
        },
        {
            id: "samagraId",
            label: "Samagra ID",
            required: false,
            note: "Any ONE Required"
        },
        {
            id: "drivingLicence",
            label: "Driving Licence",
            required: false,
            note: "Any ONE Required"
        }
    ];

    if (applicationType === "New PAN Card") {
        return [
            commonDocs[0], // Aadhaar Front
            commonDocs[1], // Aadhaar Back
            commonDocs[2], // Passport Size Photograph
            commonDocs[3],
            commonDocs[4],
            commonDocs[5],
            commonDocs[6],
            commonDocs[7]
        ];
    }

    if (applicationType === "Correction / Update Existing PAN Card") {
        return [
            commonDocs[0], // Aadhaar Front
            commonDocs[1], // Aadhaar Back
            commonDocs[2],
            commonDocs[3],
            {
                id: "existingPanCopy",
                label: "Existing PAN Card Copy",
                required: true,
                accept: "image/*,application/pdf"
            },
            commonDocs[4],
            commonDocs[5],
            commonDocs[6],
            commonDocs[7]
        ];
    }

    // No application type selected yet — show the common/base set
    return commonDocs;
}

function getGumastaDocuments(applicationType, partnerCount = 0) {
    if (applicationType === 'Partnership Firm') {
        const count = Math.max(2, Number.parseInt(partnerCount, 10) || 2);
        const partnerDocs = [];

        for (let index = 1; index <= count; index += 1) {
            partnerDocs.push(
                { id: `partner${index}AadhaarFront`, label: `Partner ${index} Aadhaar Front`, required: true, accept: 'image/*' },
                { id: `partner${index}AadhaarBack`, label: `Partner ${index} Aadhaar Back`, required: true, accept: 'image/*' }
            );
        }

        return [
            ...partnerDocs,
            { id: 'firmPanCard', label: 'PAN Card of Firm', required: true, accept: 'image/*,application/pdf' },
            { id: 'partnerSignature', label: 'Signature of Any One Partner', required: true, accept: 'image/*' },
            { id: 'partnerSamagraId', label: 'Samagra ID of Any One Partner', required: true, accept: 'image/*,application/pdf' }
        ];
    }

    return [
        { id: 'aadhaarFront', label: 'Aadhaar Card (Front Side)', required: true, accept: 'image/*' },
        { id: 'aadhaarBack', label: 'Aadhaar Card (Back Side)', required: true, accept: 'image/*' },
        { id: 'signature', label: 'Signature', required: true, accept: 'image/*' },
        { id: 'samagraId', label: 'Samagra ID', required: true, accept: 'image/*,application/pdf' }
    ];
}

const SEED_APPLICATIONS = [
    {
        id: 'EC-2026-98104',
        service: 'pan',
        serviceName: 'PAN Card Registration',
        customerName: 'Amit Kumar Mishra',
        customerPhone: '9876543210',
        customerEmail: 'amit.mishra@gmail.com',
        details: {
            fullName: 'Amit Kumar Mishra',
            dob: '1995-08-12',
            fatherName: 'Rajesh Kumar Mishra',
            email: 'amit.mishra@gmail.com',
            phone: '9876543210'
        },
        documents: {
            aadhaarDoc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="%23e2e8f0"/><text x="10" y="50" fill="%2364748b" font-family="sans-serif" font-size="12">Mock Aadhaar - Amit Mishra</text></svg>',
            photoDoc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23cbd5e1"/><text x="25" y="55" fill="%23475569" font-family="sans-serif" font-size="10">Amit Photo</text></svg>',
            signDoc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50" viewBox="0 0 200 50"><rect width="200" height="50" fill="%23f8fafc"/><path d="M10,25 Q50,10 90,30 T180,25" stroke="%231e293b" fill="none" stroke-width="2"/></svg>'
        },
        amountPaid: 150,
        paymentStatus: 'Paid',
        status: 'Pending Verification',
        statusComment: '',
        certificateNumber: '',
        createdAt: '2026-06-17T10:15:30.000Z',
        completionTimeline: '3 to 5 working days'
    },
    {
        id: 'EC-2026-44021',
        service: 'eshram',
        serviceName: 'E-Shram Card Registration',
        customerName: 'Sunita Devi',
        customerPhone: '8765432109',
        customerEmail: 'sunita.devi@outlook.com',
        details: {
            fullName: 'Sunita Devi',
            aadhaarNo: '452187650932',
            dob: '1988-11-23',
            bankAccount: '30998273645',
            bankIfsc: 'SBIN0001234',
            phone: '8765432109'
        },
        documents: {
            aadhaarDoc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="%23e2e8f0"/><text x="10" y="50" fill="%2364748b" font-family="sans-serif" font-size="12">Mock Aadhaar - Sunita Devi</text></svg>',
            passbookDoc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="%23ffe4e6"/><text x="10" y="50" fill="%23be123c" font-family="sans-serif" font-size="12">Mock Passbook - Sunita Devi</text></svg>'
        },
        amountPaid: 50,
        paymentStatus: 'Paid',
        status: 'Processing',
        statusComment: 'Sent details to the regional registration queue.',
        certificateNumber: '',
        createdAt: '2026-06-16T14:30:00.000Z',
        completionTimeline: '1 to 2 working days'
    },
    {
        id: 'EC-2026-12093',
        service: 'msme',
        serviceName: 'MSME / Udyam Registration',
        customerName: 'Rajesh Sharma',
        customerPhone: '7654321098',
        customerEmail: 'info@sharmatech.co.in',
        details: {
            enterpriseName: 'Sharma Tech Services',
            ownerName: 'Rajesh Sharma',
            aadhaarNo: '987654321012',
            businessPan: 'ABCDE1234F',
            businessType: 'Proprietorship',
            phone: '7654321098',
            email: 'info@sharmatech.co.in',
            firmAddress: 'Flat 202, Sunshine Arcade, Main Market, Mumbai',
            annualIncome: '450000'
        },
        documents: {
            aadhaarFront: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="%23e2e8f0"/><text x="10" y="50" fill="%2364748b" font-family="sans-serif" font-size="12">Mock Aadhaar Front - Rajesh Sharma</text></svg>',
            aadhaarBack: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="%23e2e8f0"/><text x="10" y="50" fill="%2364748b" font-family="sans-serif" font-size="12">Mock Aadhaar Back - Rajesh Sharma</text></svg>',
            panDoc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="%23e0f2fe"/><text x="10" y="50" fill="%230369a1" font-family="sans-serif" font-size="12">Mock PAN ABCDE1234F</text></svg>',
            businessProofDoc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="%23fef3c7"/><text x="10" y="50" fill="%23b45309" font-family="sans-serif" font-size="11">Rent Agreement - Sharma Tech</text></svg>',
            passbookDoc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="%23ffe4e6"/><text x="10" y="50" fill="%23be123c" font-family="sans-serif" font-size="12">Mock Passbook - Rajesh Sharma</text></svg>'
        },
        amountPaid: 250,
        paymentStatus: 'Paid',
        status: 'Approved',
        statusComment: 'MSME registration generated successfully.',
        certificateNumber: 'UDYAM-MH-12-0098765',
        createdAt: '2026-06-15T09:00:00.000Z',
        completionTimeline: '2 to 3 working days'
    }
];

class CafeDB {
    constructor() {
        if (!localStorage.getItem('easycafe_applications')) {
            localStorage.setItem('easycafe_applications', JSON.stringify(SEED_APPLICATIONS));
        }
    }

    getServices() {
        return SERVICES;
    }

    getService(id) {
        return SERVICES[id] || this.getSamagraService(id) || this.getGumastaService(id) || this.getLoanService(id);
    }

    getSamagraServices() {
        return SAMAGRA_SERVICES;
    }

    getSamagraService(key) {
        return SAMAGRA_SERVICES[key] || Object.values(SAMAGRA_SERVICES).find(service => service.id === key);
    }

    getGumastaServices() {
        return GUMASTA_SERVICES;
    }

    getGumastaService(key) {
        return GUMASTA_SERVICES[key] || Object.values(GUMASTA_SERVICES).find(service => service.id === key);
    }

    getLoanServices() {
        return LOAN_SERVICES;
    }

    getLoanService(key) {
        return LOAN_SERVICES[key] || Object.values(LOAN_SERVICES).find(service => service.id === key);
    }

    getPANServices() {
        return PAN_SERVICES;
    }

    getPANService(key) {
        return PAN_SERVICES[key] || Object.values(PAN_SERVICES).find(service => service.shortName === key || service.name === key);
    }

    // NEW: Get documents for a service - with dynamic support for PAN
    getServiceDocuments(serviceId, applicationDetails = null) {
        if (serviceId === 'pan' && applicationDetails && applicationDetails.applicationType) {
            return getPANDocuments(applicationDetails.applicationType);
        }
        if ((serviceId === 'gumasta' || serviceId === 'gumasta_partnership') && applicationDetails && applicationDetails.gumastaApplicationType) {
            return getGumastaDocuments(applicationDetails.gumastaApplicationType, applicationDetails.partnerCount);
        }
        const service = this.getService(serviceId);
        return service ? service.documents : [];
    }

    getAllApplications() {
        return JSON.parse(localStorage.getItem('easycafe_applications')) || [];
    }

    getApplication(id) {
        const apps = this.getAllApplications();
        return apps.find(app => app.id === id);
    }

    saveApplication(applicationData) {
        const apps = this.getAllApplications();
        const id = 'EC-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
        
        const newApp = {
            id,
            ...applicationData,
            paymentStatus: applicationData.amountPaid === 0 ? 'Inquiry' : 'Paid',
            status: 'Pending Verification',
            statusComment: '',
            certificateNumber: '',
            createdAt: new Date().toISOString()
        };
        apps.unshift(newApp);
        localStorage.setItem('easycafe_applications', JSON.stringify(apps));
        return newApp;
    }

    updateApplicationStatus(id, status, comment = '', certNo = '') {
        const apps = this.getAllApplications();
        const index = apps.findIndex(app => app.id === id);
        if (index !== -1) {
            apps[index].status = status;
            if (comment !== undefined) apps[index].statusComment = comment;
            if (certNo !== undefined) apps[index].certificateNumber = certNo;
            
            localStorage.setItem('easycafe_applications', JSON.stringify(apps));
            return apps[index];
        }
        return null;
    }

    getStats() {
        const apps = this.getAllApplications();
        const pending = apps.filter(a => a.status === 'Pending Verification').length;
        const processing = apps.filter(a => a.status === 'Processing').length;
        const approved = apps.filter(a => a.status === 'Approved').length;
        const rejected = apps.filter(a => a.status === 'Rejected').length;
        const totalRevenue = apps.reduce((sum, a) => sum + (a.amountPaid || 0), 0);
        return {
            total: apps.length,
            pending,
            processing,
            approved,
            rejected,
            totalRevenue
        };
    }
}

window.SERVICES = SERVICES;
window.SAMAGRA_SERVICES = SAMAGRA_SERVICES;
window.GUMASTA_SERVICES = GUMASTA_SERVICES;
window.LOAN_SERVICES = LOAN_SERVICES;
window.db = new CafeDB();
window.getPANDocuments = getPANDocuments;
window.getGumastaDocuments = getGumastaDocuments;
