// src/components/AIAssistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, X, Sparkles, User, ArrowRight } from 'lucide-react';
import { SERVICES, CafeLocalDB } from '../servicesData';

export default function AIAssistant({ isOpen, onClose, setCurrentView, setCurrentService }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I am your EasyCafe AI Smart Assistant. ⚡ How can I help you today?",
      options: [
        { label: '🔍 Help me choose a service', value: 'choose' },
        { label: '📄 View required documents', value: 'docs' },
        { label: '⏱️ Estimate processing times & fees', value: 'timings' },
        { label: '📦 Track application status', value: 'track' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleOptionClick = (option) => {
    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: option.label
    };
    setMessages(prev => [...prev, userMsg]);

    // Bot response logic
    setTimeout(() => {
      let botResponse = {};
      if (option.value === 'choose') {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "What would you like to accomplish? Select a category:",
          options: [
            { label: '💳 Apply for an official Identity/Tax ID', value: 'choose_pan' },
            { label: '👥 Update state welfare profile (MP Residents)', value: 'choose_samagra' },
            { label: '🏢 Register my business establishment', value: 'choose_gumasta' },
            { label: '🏛️ Inquire for home or business loans', value: 'choose_loan' }
          ]
        };
      } else if (option.value === 'choose_pan') {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "You should apply for a PAN Card. It is required for filing income taxes, opening bank accounts, and transactions. Fee: ₹200. Would you like to view eligibility or apply directly?",
          options: [
            { label: '📝 Apply for PAN Card', value: 'apply_pan' },
            { label: '📊 View PAN Details', value: 'details_pan' }
          ]
        };
      } else if (option.value === 'choose_samagra') {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "You should use the Samagra ID Portal. It links MP citizen profiles to receive direct benefit transfers. Fee: ₹40. Would you like to view details or apply?",
          options: [
            { label: '📝 Apply for Samagra ID', value: 'apply_samagra' },
            { label: '📊 View Samagra Details', value: 'details_samagra' }
          ]
        };
      } else if (option.value === 'choose_gumasta') {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "You need a Gumasta License. It is mandatory for any shop/office in the municipal boundaries. Fee: ₹699. Would you like to review details?",
          options: [
            { label: '📝 Apply for Gumasta', value: 'apply_gumasta' },
            { label: '📊 View Gumasta Details', value: 'details_gumasta' }
          ]
        };
      } else if (option.value === 'choose_loan') {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "Our Loan inquiry service is completely free! We check eligibility for Home, Personal, and Business Loans with 20+ banks. Would you like to inquire?",
          options: [
            { label: '📝 Apply for Loan Inquiry', value: 'apply_loan' },
            { label: '📊 View Loan Details', value: 'details_loan' }
          ]
        };
      } else if (option.value.startsWith('apply_')) {
        const serviceId = option.value.replace('apply_', '');
        setCurrentService(serviceId);
        setCurrentView('wizard');
        onClose();
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: `Redirecting you to the application wizard for ${SERVICES[serviceId]?.name || serviceId}...`
        };
      } else if (option.value.startsWith('details_')) {
        const serviceId = option.value.replace('details_', '');
        setCurrentService(serviceId);
        setCurrentView('service-detail');
        onClose();
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: `Showing information details page for ${SERVICES[serviceId]?.name || serviceId}...`
        };
      } else if (option.value === 'docs') {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "Select a service to check its required documents checklist:",
          options: [
            { label: 'PAN Card Checklist', value: 'docs_pan' },
            { label: 'Samagra KYC Checklist', value: 'docs_samagra' },
            { label: 'Gumasta Checklist', value: 'docs_gumasta' },
            { label: 'MSME Udyam Checklist', value: 'docs_msme' }
          ]
        };
      } else if (option.value === 'docs_pan') {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "📝 Required Documents for PAN Card:\n1. Aadhaar Card (Identity & Address Proof)\n2. Passport size photo (Clear background)\n3. Scanned Signature\n4. Existing PAN Copy (only for Correction applications)\n\nAll files are end-to-end encrypted during upload.",
          options: [{ label: 'Apply Now', value: 'apply_pan' }]
        };
      } else if (option.value === 'docs_samagra') {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "📝 Required Documents for Samagra KYC:\n1. Aadhaar Card (Front and Back)\n2. Aadhaar-registered Mobile Number (for OTP verification)\n3. Existing Samagra Family ID number (8 digits)",
          options: [{ label: 'Apply Now', value: 'apply_samagra' }]
        };
      } else if (option.value === 'docs_gumasta') {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "📝 Required Documents for Gumasta Shop License:\n- Individual: Aadhaar card, signature photo, and Samagra ID.\n- Partnership: Aadhaar copies of all partners, firm PAN card, signature, and Samagra ID.",
          options: [{ label: 'Apply Now', value: 'apply_gumasta' }]
        };
      } else if (option.value === 'docs_msme') {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "📝 Required Documents for MSME Registration:\n1. Owner's Aadhaar Card\n2. Owner's PAN Card\n3. Bank Passbook/Cancelled Cheque\n4. Business Address Proof (Electricity bill / rent agreement)",
          options: [{ label: 'Apply Now', value: 'apply_msme' }]
        };
      } else if (option.value === 'timings') {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "⏱️ Processing Fees & Estimated Completion Timelines:\n\n• Samagra KYC: ₹40 (1-2 days)\n• MSME Udyam: ₹199 (2-3 days)\n• PAN Card: ₹200 (3-5 days)\n• Gumasta: ₹699 (4-6 days)\n• Loan Inquiry: FREE (1-2 days)\n\nNote: Timelines start after our operators verify document correctness.",
          options: [{ label: 'Apply For a Service', value: 'choose' }]
        };
      } else if (option.value === 'track') {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "To track your application, please type your Application ID (e.g., 'EC-2026-98104') or registered mobile number directly into the chat bar below. I will fetch the live details!"
        };
      }

      setMessages(prev => [...prev, botResponse]);
    }, 450);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    setTimeout(() => {
      let botResponseText = '';
      let botOptions = null;

      const lowerText = userText.toLowerCase();

      // Check if user is trying to search for a tracking ID
      if (lowerText.startsWith('ec-') || (lowerText.length === 10 && /^\d+$/.test(lowerText))) {
        const app = CafeLocalDB.getApplication(userText);
        if (app) {
          let statusText = '';
          if (app.status === 'PENDING_VERIFICATION') statusText = 'Pending operator verification';
          else if (app.status === 'PROCESSING') statusText = 'Processing & filling in department';
          else if (app.status === 'APPROVED') statusText = 'Approved! Document generated (' + (app.certificateNumber || 'N/A') + ')';
          else if (app.status === 'REJECTED') statusText = 'Rejected. Reason: ' + (app.statusComment || 'Incomplete details');

          botResponseText = `📦 **Application Status Found!**\n\n• **ID**: ${app.id}\n• **Service**: ${app.serviceName}\n• **Customer**: ${app.customerName}\n• **Status**: ${statusText}\n• **Estimated Time**: ${app.completionTimeline || '3 days'}\n\nYou can view full tracking dashboard or download receipts from the main panel.`;
          botOptions = [{ label: 'Go to Tracking Screen', value: 'go_track' }];
        } else {
          botResponseText = `❌ Sorry, I couldn't find any application matching "${userText}". Please double check your Application ID (e.g., EC-2026-98104) or registered mobile number.`;
        }
      } 
      // FAQ Responses
      else if (lowerText.includes('pan') || lowerText.includes('tax')) {
        botResponseText = "PAN Card service helps you register a new permanent account number or correct/update an existing one. Fees are ₹200 and processing takes 3-5 days.";
        botOptions = [
          { label: '📝 Apply for PAN', value: 'apply_pan' },
          { label: '📄 PAN Checklist', value: 'docs_pan' }
        ];
      } else if (lowerText.includes('samagra') || lowerText.includes('kyc')) {
        botResponseText = "Samagra portal links Aadhaar to your MP family registry. It is required for state admissions and benefits. Fees: ₹40, completed in 1-2 working days.";
        botOptions = [
          { label: '📝 Apply for Samagra', value: 'apply_samagra' },
          { label: '📄 Samagra Docs', value: 'docs_samagra' }
        ];
      } else if (lowerText.includes('gumasta') || lowerText.includes('shop') || lowerText.includes('license')) {
        botResponseText = "Gumasta is the local shop/establishment license required to open business bank accounts and operate legally in Madhya Pradesh. Fee: ₹699, takes 4-6 days.";
        botOptions = [
          { label: '📝 Apply for Gumasta', value: 'apply_gumasta' },
          { label: '📄 Gumasta Docs', value: 'docs_gumasta' }
        ];
      } else if (lowerText.includes('loan') || lowerText.includes('bank') || lowerText.includes('credit')) {
        botResponseText = "We offer free initial eligibility reviews for home, personal, and business loans with major public and private banks. We help align your documents to ensure fast approvals.";
        botOptions = [
          { label: '📝 Inquire for Loan', value: 'apply_loan' },
          { label: '⏱️ Check Timelines', value: 'timings' }
        ];
      } else if (lowerText.includes('safe') || lowerText.includes('secure') || lowerText.includes('privacy') || lowerText.includes('delete')) {
        botResponseText = "🔒 **Security & Privacy is our First Priority!** All documents uploaded are end-to-end encrypted during transit and are automatically wiped completely from our active processing servers 30 days after your service is finalized. We do not store files long-term.";
      } else if (lowerText.includes('how long') || lowerText.includes('timeline') || lowerText.includes('days')) {
        botResponseText = "Timelines vary by service:\n- Samagra KYC: 1-2 working days\n- MSME Certificate: 2-3 working days\n- PAN Card: 3-5 working days\n- Gumasta License: 4-6 working days\n- Loan Inquiry: 1-2 working days.";
      } else {
        botResponseText = "Thank you for asking! For specific document uploads, checking eligibility, or applying, you can choose from the options below or ask about PAN, Samagra, MSME, Gumasta, Loans, or application security.";
        botOptions = [
          { label: '🔍 Browse Services', value: 'choose' },
          { label: '📄 Check Documents', value: 'docs' },
          { label: '⏱️ View Fees & Timelines', value: 'timings' }
        ];
      }

      if (botOptions && botOptions[0]?.value === 'go_track') {
        setCurrentView('track');
        onClose();
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponseText,
        options: botOptions
      }]);
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="flex flex-col w-full max-w-lg h-[550px] rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 dark:bg-slate-900 transition-colors duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 p-4 text-white">
          <div className="flex items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold flex items-center">
                EasyCafe Assistant <Sparkles className="ml-1 h-3.5 w-3.5 text-amber-300 animate-pulse" />
              </h3>
              <p className="text-[10px] text-brand-100">🔒 Verified Data Secure Operator</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/10 text-white/80 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950/60 transition-colors">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] flex items-start gap-2.5">
                {msg.sender === 'bot' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className="flex flex-col space-y-2">
                  <div className={`rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 shadow-sm border border-slate-100 dark:border-slate-800 rounded-tl-none'
                  }`}>
                    {msg.text.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-1" : ""}>{line}</p>
                    ))}
                  </div>

                  {/* Render Quick Options */}
                  {msg.options && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      {msg.options.map((opt, index) => (
                        <button
                          key={index}
                          onClick={() => handleOptionClick(opt)}
                          className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-left text-xs font-semibold text-brand-600 hover:bg-brand-50 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:text-brand-400 dark:hover:bg-slate-800/80 transition-all shadow-sm"
                        >
                          {opt.label}
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {msg.sender === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Form Input */}
        <form onSubmit={handleSendMessage} className="border-t border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question or type Application ID..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-md shadow-brand-500/10"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
