// src/servicesData.js - Services database & helpers for EasyCafe

export const SERVICES = {
  pan: {
    id: 'pan',
    name: 'PAN Card Registration',
    subtitle: 'New & Correction',
    fee: 200,
    timeline: '3 to 5 working days',
    desc: 'Apply for a new PAN card or correct/update details on an existing PAN card.',
    icon: 'CreditCard',
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
      { q: 'Is physical presence required for applying?', a: 'No, our operators handle the entire submission digitally. You only need to verify via Aadhaar OTP or upload signature scans.' },
      { q: 'How is the physical PAN card delivered?', a: 'Once approved, the Income Tax Department dispatches the physical card directly to your Aadhaar-registered address via speed post.' }
    ],
    fields: [
      { id: 'applicationType', label: 'Application Type', type: 'select', required: true, options: ['New PAN Card', 'Correction / Update Existing PAN Card'] },
      { id: 'existingPanNumber', label: 'Existing PAN Number (fill only if selecting Correction/Update)', type: 'text', required: false, pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}', placeholder: 'ABCDE1234F' },
      { id: 'fullName', label: 'Full Name (as in Aadhaar)', type: 'text', required: true },
      { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { id: 'fatherName', label: "Father's Name", type: 'text', required: true },
      { id: 'email', label: 'Email Address', type: 'email', required: true },
      { id: 'phone', label: 'Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}', placeholder: '10-digit mobile number' }
    ]
  },
  samagra: {
    id: 'samagra',
    name: 'Samagra Portal',
    subtitle: 'KYC & Member Services',
    fee: 40,
    timeline: '5 to 7 working days',
    desc: 'Choose KYC, Member Add, or Other State Samagra Add services from one place.',
    icon: 'Users',
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
      { q: 'How long does member addition take?', a: 'Once submitted by our operator, it goes to municipal/Panchayat level approval, taking 5 to 7 working days.' }
    ]
  },
  msme: {
    id: 'msme',
    name: 'MSME Registration',
    subtitle: 'Udyam Certificate',
    fee: 199,
    timeline: '2 to 3 working days',
    desc: 'Register your micro, small or medium enterprise to obtain MSME Udyam Certificate.',
    icon: 'Briefcase',
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
    fields: [
      { id: 'enterpriseName', label: 'Name of Enterprise / Business', type: 'text', required: true },
      { id: 'ownerName', label: 'Name of Entrepreneur / Owner', type: 'text', required: true },
      { id: 'aadhaarNo', label: 'Aadhaar Number of Owner', type: 'text', required: true, pattern: '[0-9]{12}', placeholder: '12-digit Aadhaar number' },
      { id: 'businessPan', label: 'Business / Owner PAN Card Number', type: 'text', required: true, pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}', placeholder: 'ABCDE1234F' },
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
    icon: 'Store',
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
    ]
  },
  ayushman: {
    id: 'ayushman',
    name: 'Ayushman Card',
    subtitle: 'PM-JAY Health Insurance',
    fee: 200,
    timeline: '3 to 5 working days',
    desc: 'Apply for a new Ayushman Bharat Golden Card to get free health insurance coverage up to ₹5 Lakhs.',
    icon: 'Shield',
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
      { q: 'How can I check if my name is in the beneficiary list?', a: 'Our operators will search the official PM-JAY portal using your Aadhaar number, Samagra ID, or Ration card details to check eligibility.' },
      { q: 'What is the Ayushman Golden Card?', a: 'It is a physical beneficiary identity card. Once issued, you simply present it at hospital reception to start cashless treatment.' }
    ],
    fields: [
      { id: 'fullName', label: 'Full Name', type: 'text', required: true },
      { id: 'aadhaarNo', label: 'Aadhaar Number', type: 'text', required: true, pattern: '[0-9]{12}' },
      { id: 'aadhaarRegisteredMobile', label: 'Aadhaar Registered Mobile Number', type: 'tel', required: true, pattern: '[0-9]{10}' },
      { id: 'email', label: 'Email ID', type: 'email', required: true }
    ],
    documents: [
      { id: 'aadhaarFront', label: 'Aadhaar Card (Front Side)', required: true, accept: 'image/*' },
      { id: 'aadhaarBack', label: 'Aadhaar Card (Back Side)', required: true, accept: 'image/*' },
      { id: 'otherDocument', label: 'Other Document (Ration Card/Food Slip)', required: true, accept: 'image/*,application/pdf' }
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
    icon: 'Landmark',
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

export const SAMAGRA_SERVICES = {
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
      { id: 'samagraIdDoc', label: 'Samagra ID Copy', required: true, accept: 'image/*,application/pdf' }
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

export const GUMASTA_SERVICES = {
  individual: {
    id: 'gumasta_individual',
    parentId: 'gumasta',
    name: 'Gumasta License - Individual Proprietorship',
    shortName: 'Individual Proprietorship',
    gumastaApplicationType: 'Individual Proprietorship',
    fee: 699,
    timeline: '4 to 6 working days',
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
    fee: 699,
    timeline: '4 to 6 working days',
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

export const LOAN_SERVICES = {
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
      { id: 'bankName', label: 'Preferred Bank Name', type: 'select', required: true, options: getBankOptions() }
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
      { id: 'bankName', label: 'Preferred Bank Name', type: 'select', required: true, options: getBankOptions() }
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
      { id: 'bankName', label: 'Preferred Bank Name', type: 'select', required: true, options: getBankOptions() }
    ],
    documents: []
  }
};

function getBankOptions() {
  return [
    'State Bank of India (SBI)', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
    'Punjab National Bank (PNB)', 'Bank of Baroda (BoB)', 'Canara Bank',
    'Union Bank of India', 'Kotak Mahindra Bank', 'IndusInd Bank',
    'IDFC First Bank', 'Yes Bank', 'Federal Bank', 'Indian Bank',
    'Bank of India', 'Central Bank of India', 'Indian Overseas Bank',
    'UCO Bank', 'Bank of Maharashtra', 'Punjab & Sind Bank',
    'Bandhan Bank', 'RBL Bank', 'South Indian Bank', 'Karur Vysya Bank', 'City Union Bank'
  ];
}

export function getPANDocuments(applicationType) {
  const commonDocs = [
    { id: "aadhaarFront", label: "Aadhaar Card - Front Side", required: true, accept: "image/*" },
    { id: "aadhaarBack", label: "Aadhaar Card - Back Side", required: true, accept: "image/*" },
    { id: "passportPhoto", label: "Passport Size Photograph", required: true, accept: "image/*" },
    { id: "marksheet10", label: "10th Marksheet", required: false, note: "Any ONE Required" },
    { id: "voterId", label: "Voter ID", required: false, note: "Any ONE Required" },
    { id: "marriageCertificate", label: "Marriage Certificate", required: false, note: "Any ONE Required" },
    { id: "samagraId", label: "Samagra ID", required: false, note: "Any ONE Required" },
    { id: "drivingLicence", label: "Driving Licence", required: false, note: "Any ONE Required" }
  ];

  if (applicationType === "New PAN Card") {
    return commonDocs;
  }

  if (applicationType === "Correction / Update Existing PAN Card") {
    return [
      commonDocs[0], // Aadhaar Front
      commonDocs[1], // Aadhaar Back
      commonDocs[2], // Photo
      { id: "existingPanCopy", label: "Existing PAN Card Copy", required: true, accept: "image/*,application/pdf" },
      commonDocs[3], // 10th marksheet
      commonDocs[4], // voter
      commonDocs[5], // marriage
      commonDocs[6], // samagra
      commonDocs[7]  // driving
    ];
  }

  return commonDocs;
}

export function getGumastaDocuments(applicationType, partnerCount = 0) {
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

export const SEED_APPLICATIONS = [
  {
    id: 'EC-2026-98104',
    service: 'pan',
    serviceName: 'PAN Card Registration',
    customerName: 'Amit Kumar Mishra',
    customerPhone: '9876543210',
    customerEmail: 'amit.mishra@gmail.com',
    details: {
      applicationType: 'New PAN Card',
      fullName: 'Amit Kumar Mishra',
      dob: '1995-08-12',
      fatherName: 'Rajesh Kumar Mishra',
      email: 'amit.mishra@gmail.com',
      phone: '9876543210'
    },
    documents: {
      aadhaarFront: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="%23e2e8f0"/><text x="10" y="50" fill="%2364748b">Aadhaar Front - Amit</text></svg>',
      aadhaarBack: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="%23e2e8f0"/><text x="10" y="50" fill="%2364748b">Aadhaar Back - Amit</text></svg>',
      passportPhoto: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="%23cbd5e1"/></svg>'
    },
    amountPaid: 200,
    paymentStatus: 'Paid',
    status: 'PENDING_VERIFICATION',
    statusComment: '',
    certificateNumber: '',
    createdAt: '2026-07-17T10:15:30.000Z',
    completionTimeline: '3 to 5 working days',
    whatsappUpdates: true,
    whatsappNumber: '9876543210'
  },
  {
    id: 'EC-2026-44021',
    service: 'samagra_kyc',
    serviceName: 'Samagra KYC',
    customerName: 'Sunita Devi',
    customerPhone: '8765432109',
    customerEmail: 'sunita.devi@outlook.com',
    details: {
      samagraId: '39882094',
      phone: '8765432109'
    },
    documents: {
      aadhaarFront: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="%23e2e8f0"/><text x="10" y="50" fill="%2364748b">Aadhaar Front - Sunita</text></svg>',
      aadhaarBack: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="%23e2e8f0"/><text x="10" y="50" fill="%2364748b">Aadhaar Back - Sunita</text></svg>'
    },
    amountPaid: 40,
    paymentStatus: 'Paid',
    status: 'PROCESSING',
    statusComment: 'Sent details to the regional registration queue.',
    certificateNumber: '',
    createdAt: '2026-07-16T14:30:00.000Z',
    completionTimeline: '1 to 2 working days',
    whatsappUpdates: false
  },
  {
    id: 'EC-2026-12093',
    service: 'msme',
    serviceName: 'MSME Registration',
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
      aadhaarFront: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="%23e2e8f0"/><text x="10" y="50" fill="%2364748b">Aadhaar Front - Rajesh</text></svg>',
      aadhaarBack: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="%23e2e8f0"/><text x="10" y="50" fill="%2364748b">Aadhaar Back - Rajesh</text></svg>',
      panDoc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="%23e0f2fe"/><text x="10" y="50" fill="%230369a1">PAN - ABCDE1234F</text></svg>'
    },
    amountPaid: 199,
    paymentStatus: 'Paid',
    status: 'APPROVED',
    statusComment: 'MSME registration generated successfully.',
    certificateNumber: 'UDYAM-MH-12-0098765',
    createdAt: '2026-07-15T09:00:00.000Z',
    completionTimeline: '2 to 3 working days',
    whatsappUpdates: true,
    whatsappNumber: '7654321098'
  }
];

export class CafeLocalDB {
  static getApplications() {
    const data = localStorage.getItem('easycafe_applications');
    if (!data) {
      localStorage.setItem('easycafe_applications', JSON.stringify(SEED_APPLICATIONS));
      return SEED_APPLICATIONS;
    }
    return JSON.parse(data);
  }

  static getApplication(id) {
    const apps = this.getApplications();
    return apps.find(app => app.id === id || app.customerPhone === id);
  }

  static saveApplication(appData) {
    const apps = this.getApplications();
    const id = 'EC-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const newApp = {
      id,
      ...appData,
      status: appData.amountPaid === 0 ? 'PROCESSING' : 'PENDING_VERIFICATION',
      statusComment: '',
      certificateNumber: '',
      createdAt: new Date().toISOString()
    };
    apps.unshift(newApp);
    localStorage.setItem('easycafe_applications', JSON.stringify(apps));
    return newApp;
  }

  static updateApplicationStatus(id, updateData) {
    const apps = this.getApplications();
    const index = apps.findIndex(app => app.id === id);
    if (index !== -1) {
      apps[index] = {
        ...apps[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('easycafe_applications', JSON.stringify(apps));
      return apps[index];
    }
    return null;
  }

  static confirmPayment(id, txnId = '') {
    const apps = this.getApplications();
    const index = apps.findIndex(app => app.id === id);
    if (index !== -1) {
      apps[index].paymentStatus = 'Paid';
      apps[index].paymentDetails = { status: 'SUCCESS', transactionId: txnId || 'TXN-' + Date.now() };
      apps[index].status = 'PENDING_VERIFICATION';
      apps[index].updatedAt = new Date().toISOString();
      localStorage.setItem('easycafe_applications', JSON.stringify(apps));
      return apps[index];
    }
    return null;
  }
}
