// src/App.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { HelpCircle, ArrowRight, ShieldCheck, Star, Clock, Search, Check, Send, CheckCircle, Lock, MessageCircle, User } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import AIAssistant from './components/AIAssistant';
import ApplyWizard from './components/ApplyWizard';
import TrackingPage from './components/TrackingPage';
import CustomerDashboard from './components/CustomerDashboard';
import StaffDashboard from './components/StaffDashboard';
import { SERVICES, CafeLocalDB } from './servicesData';
import api from './api';

// Helper to retrieve a service by its ID
const getServiceDetails = (id) => SERVICES[id] || null;

// ─── Shared animation variants ───────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }
  })
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };
const cardHover = { scale: 1.025, y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } };
const viewTransition = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.35 } };

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [currentService, setCurrentService] = useState('pan');
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  
  // Quick Search & Tracking states
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [headerSearchId, setHeaderSearchId] = useState('');
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  
  // Testimonial statistics counts
  const [statsCounter, setStatsCounter] = useState({ customers: 9840, docs: 24700, rate: 99.4 });
  
  // FAQ accordion open states
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  
  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  // Apply Theme class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Simulated increments for counters (Premium visual experience)
  useEffect(() => {
    const timer = setInterval(() => {
      setStatsCounter(prev => ({
        customers: prev.customers + (Math.random() > 0.7 ? 1 : 0),
        docs: prev.docs + (Math.random() > 0.4 ? 1 : 0),
        rate: 99.8
      }));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleHeaderSearch = (e) => {
    e.preventDefault();
    if (!headerSearchId.trim()) return;
    setCurrentView('track');
  };

  const handleServiceSelect = (serviceId) => {
    setCurrentService(serviceId);
    setCurrentView('service-detail');
  };

  const handleApplyNow = (serviceId) => {
    setCurrentService(serviceId);
    setCurrentView('wizard');
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await api.login(loginEmail, loginPassword);
      toast.success('Staff authenticated successfully!');
      setLoginEmail('');
      setLoginPassword('');
      setCurrentView('staff-dashboard');
    } catch (err) {
      setLoginError(err.message || 'Authentication failed. Please verify credentials.');
      toast.error('Login Failed');
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    toast.success('Message sent! Support will contact you shortly.');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setContactMsg('');
  };

  // Autocomplete suggestions for Search bar
  const getSuggestions = () => {
    if (!globalSearchQuery.trim()) return [];
    const q = globalSearchQuery.toLowerCase();
    return Object.values(SERVICES).filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.subtitle.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q)
    );
  };

  const suggestions = getSuggestions();

  // FAQs Database
  const faqs = [
    { q: 'How long does document processing typically take?', a: 'Timelines vary by service. Samagra KYC takes 1-2 days, MSME registration takes 2-3 days, and PAN card processing takes 3-5 days. Timelines start after documents are verified.' },
    { q: 'What security measures do you take with sensitive files?', a: '🔒 Privacy is our core policy. All documents are encrypted end-to-end and are automatically, permanently deleted from our active servers 30 days after service completion.' },
    { q: 'Can I track my application updates on WhatsApp?', a: 'Yes! When completing your application details, check the "WhatsApp Alerts" option to receive automated updates directly to your registered number.' },
    { q: 'What is the refund policy if my application is rejected?', a: 'If your application is rejected due to operator filing errors, we provide a full refund of EasyCafe service fees. Fees are non-refundable once forwarded to departments.' },
    { q: 'Is physical presence needed at a cyber cafe?', a: 'No. Our Smart cyber operators handle the entire registration digitally online, bridging the gap so you never have to stand in physical queues.' }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(faqSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Toaster position="top-right" richColors />
      
      {/* Sticky Header */}
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        currentService={currentService}
        setCurrentService={setCurrentService}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Content Pane */}
      <main className="flex-1">
        
        {/* VIEW 1: HOME PAGE */}
        {currentView === 'home' && (
          <div className="space-y-24 pb-24">
            {/* Hero Section — animated entrance */}
            <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-transparent dark:from-slate-900/50 dark:via-slate-950 dark:to-transparent py-24 lg:py-32">
              {/* Animated background orbs */}
              <motion.div
                className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-600/10"
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="pointer-events-none absolute top-20 right-12 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-600/10"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              />

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
                <motion.div
                  variants={fadeUp} custom={0} initial="hidden" animate="visible"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200/50 dark:border-brand-900/20 shadow-sm"
                >
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ⭐ 4.9/5 Rating by 10,000+ Happy Customers
                </motion.div>

                <motion.h1
                  variants={fadeUp} custom={1} initial="hidden" animate="visible"
                  className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08] max-w-4xl mx-auto"
                >
                  Get Your Official Documents Processed{' '}
                  <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent dark:from-brand-400 dark:to-brand-300">
                    Fast. Hassle-Free.
                  </span>
                </motion.h1>

                <motion.p
                  variants={fadeUp} custom={2} initial="hidden" animate="visible"
                  className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
                >
                  Fill in your details, securely upload documents, and complete checkout. Our expert cyber cafe operators will verify, file, and submit your requests immediately.
                </motion.p>

                {/* Instant Service Search */}
                <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="max-w-lg mx-auto relative pt-2">
                  <div className="relative">
                    <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={globalSearchQuery}
                      onChange={(e) => setGlobalSearchQuery(e.target.value)}
                      placeholder="Search services (e.g. PAN card, Samagra)..."
                      className="w-full rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 pl-12 pr-4 py-3.5 text-base text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-md"
                    />
                  </div>
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="absolute left-0 right-0 mt-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-20 text-left"
                      >
                        {suggestions.map(s => (
                          <button
                            key={s.id}
                            onClick={() => { setGlobalSearchQuery(''); handleServiceSelect(s.id); }}
                            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <span>{s.name}</span>
                            <span className="text-xs text-brand-600 bg-brand-50 dark:bg-brand-950/30 px-2 py-0.5 rounded-lg">View</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="pt-2 flex flex-wrap justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(14,165,233,0.35)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleServiceSelect('pan')}
                    className="rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base px-8 py-4 shadow-lg shadow-brand-500/20 transition-colors"
                  >
                    Apply Now
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setCurrentView('track')}
                    className="rounded-2xl border-2 border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-base px-8 py-4 transition-colors"
                  >
                    Track Application
                  </motion.button>
                </motion.div>
              </div>
            </section>

            {/* 3-Step Process Timeline */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                className="text-center space-y-3 mb-14"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              >
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">How EasyCafe Works</h2>
                <p className="text-base sm:text-lg text-slate-400">Simple, secure document processing in 3 quick steps.</p>
              </motion.div>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
              >
                {[
                  { num: '1', bg: 'bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400', title: 'Select Service', desc: 'Choose Samagra KYC, PAN Card, Gumasta Shop License, or MSME fillings in our services list.' },
                  { num: '2', bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400', title: 'Upload Documents', desc: 'Securely upload scanned identity files. Encrypted uploads are automatically deleted after 30 days.' },
                  { num: '3', bg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400', title: 'Operators File It', desc: 'Verified cyber operators process and submit files manually to govt departments immediately.' },
                ].map((step, i) => (
                  <motion.div
                    key={step.num} variants={fadeUp} custom={i}
                    whileHover={cardHover}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center space-y-4 cursor-default"
                  >
                    <div className={`h-14 w-14 rounded-2xl ${step.bg} flex items-center justify-center font-black text-xl`}>{step.num}</div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{step.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* Main Services Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              >
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">Available Assistance Services</h2>
                  <p className="text-base text-slate-400 mt-2">Get fast and verified submissions on digital cards and filings.</p>
                </div>
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => setCurrentView('about')}
                  className="text-sm font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1.5"
                >
                  Learn about verified operators <ArrowRight className="h-4 w-4" />
                </motion.button>
              </motion.div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
              >
                {Object.values(SERVICES).map((s, i) => (
                  <motion.div
                    key={s.id} variants={fadeUp} custom={i}
                    whileHover={cardHover}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-7 shadow-sm flex flex-col justify-between group cursor-default"
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        {s.subtitle}
                      </span>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-2">{s.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">{s.desc}</p>

                      <div className="flex items-center gap-x-5 text-sm text-slate-400 pt-5 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-brand-500" /> {s.timeline}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{s.fee > 0 ? `₹${s.fee}` : 'FREE (Inquiry)'}</span>
                      </div>
                    </div>

                    <div className="pt-5 flex gap-2.5 w-full">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleServiceSelect(s.id)}
                        className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm py-2.5 transition-colors"
                      >Details</motion.button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleApplyNow(s.id)}
                        className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-2.5 shadow-md shadow-brand-500/20 transition-colors"
                      >Apply Now</motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* Why Choose Us & Trust grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp}
                className="bg-slate-900 text-white rounded-3xl p-10 sm:p-14 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />
                <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-brand-400/5 blur-3xl" />
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 relative z-10">
                  <div className="lg:col-span-2 space-y-5">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-3 py-1 rounded-lg">Why Choose Us</span>
                    <h2 className="text-3xl sm:text-4xl font-black leading-tight">Why Thousands Trust EasyCafe Portal</h2>
                    <p className="text-base text-slate-400 leading-relaxed">
                      Citizen paperwork involves handling highly sensitive identity inputs. We build trust by backing every application with certified operators and industry security policies.
                    </p>
                  </div>
                  <motion.div
                    className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5"
                    variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  >
                    {[
                      { icon: ShieldCheck, title: '256-bit Secure Encryption', desc: 'All uploaded documents are fully encrypted during transmission and operator filing checks.' },
                      { icon: CheckCircle, title: 'Verified Cyber Operators', desc: 'Applications are manually cross-checked and filed by certified cafe executives to prevent departmental rejections.' },
                      { icon: Lock, title: '30-Day Auto-Wipe Policy', desc: 'Documents are permanently deleted from our active servers exactly 30 days after your certificate has generated.' },
                      { icon: MessageCircle, title: 'Live WhatsApp Updates', desc: 'Subscribe to automated progress timelines delivered straight to your WhatsApp mobile phone.' },
                    ].map(({ icon: Icon, title, desc }, i) => (
                      <motion.div key={title} variants={fadeUp} custom={i} whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.08)' }} className="space-y-2 p-5 rounded-2xl bg-white/5 border border-white/10 transition-colors cursor-default">
                        <h4 className="font-bold flex items-center gap-2 text-white text-base">
                          <Icon className="h-5 w-5 text-brand-400 flex-shrink-0" /> {title}
                        </h4>
                        <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </section>

            {/* Stats Counters */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-10 shadow-md transition-colors"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              >
                {[
                  { value: `${statsCounter.customers.toLocaleString()}+`, label: 'Happy Customers Served' },
                  { value: `${statsCounter.docs.toLocaleString()}+`, label: 'Documents Filed & Processed' },
                  { value: `${statsCounter.rate}%`, label: 'Filing Approval Success Rate' },
                  { value: '4.9★', label: 'Customer Satisfaction Score' },
                ].map(({ value, label }, i) => (
                  <motion.div key={label} variants={fadeUp} custom={i} className="space-y-2 text-center">
                    <div className="text-4xl font-black text-brand-600 dark:text-brand-400">{value}</div>
                    <p className="text-sm text-slate-400 font-medium">{label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* Testimonials */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                className="text-center space-y-3 mb-12"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              >
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">What Our Happy Clients Say</h3>
                <p className="text-base text-slate-400">Read verified success stories from citizens who processed documents from home.</p>
              </motion.div>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
              >
                {[
                  { quote: '"I applied for MSME registration and got my Udyam certificate within 2 days! The automated WhatsApp alerts kept me informed at each step. Highly secure and recommended."', author: 'Amit Kumar Mishra, Indore' },
                  { quote: '"Filing PAN updates was always confusing at government centers. EasyCafe operators took my details, uploaded files, and processed it securely from home. Seamless experience!"', author: 'Sunita Devi, Bhopal' },
                  { quote: '"Was looking for Gumasta License for my retail general store. Operators checked partnership documents, aligned all details, and got my license ref number fast. Super service."', author: 'Rajesh Sharma, Jabalpur' },
                ].map(({ quote, author }, i) => (
                  <motion.div
                    key={author} variants={fadeUp} custom={i}
                    whileHover={cardHover}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-7 shadow-sm transition-colors space-y-4 cursor-default"
                  >
                    <div className="flex text-amber-400 gap-1">
                      {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed">{quote}</p>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{author}</h4>
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* Accordion FAQ section */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                className="text-center space-y-4 mb-10"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              >
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                <p className="text-base text-slate-400">Search and check common questions about document security and payouts.</p>
                <div className="max-w-lg mx-auto pt-2">
                  <input
                    type="text"
                    value={faqSearchQuery}
                    onChange={(e) => setFaqSearchQuery(e.target.value)}
                    placeholder="Search FAQ keywords..."
                    className="w-full text-sm rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                  />
                </div>
              </motion.div>

              <motion.div
                className="space-y-3"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              >
                {filteredFaqs.map((faq, idx) => (
                  <motion.div key={idx} variants={fadeUp} custom={idx} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left text-base font-bold text-slate-800 dark:text-slate-200"
                    >
                      <span>{faq.q}</span>
                      <motion.span
                        animate={{ rotate: openFaqIndex === idx ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-brand-500 font-normal text-xl ml-4 flex-shrink-0"
                      >+</motion.span>
                    </button>
                    <AnimatePresence>
                      {openFaqIndex === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-4">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
                {filteredFaqs.length === 0 && (
                  <motion.div variants={fadeIn} className="text-center text-base text-slate-400 py-8">No matching FAQs found.</motion.div>
                )}
              </motion.div>
            </section>

            {/* Blog & News Updates */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                className="space-y-3 mb-10"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              >
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">Latest Government Schemes & Updates</h3>
                <p className="text-base text-slate-400">Keep tracked of current tax, Aadhaar, PAN, and MSME announcements.</p>
              </motion.div>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              >
                {[
                  { tag: 'Govt Announcements', title: 'PAN Aadhaar Linking Deadline and Penalties Extended', body: 'Tax department issues notice: Citizens must link Aadhaar to PAN immediately to prevent status deactivation and ₹1,000 penalties.' },
                  { tag: 'MSME Schemes', title: 'Udyam Registration Mandate for Business Bank Accounts', body: 'RBI issues circular: Commercial bank accounts for sole proprietorship firms now prefer a valid MSME Udyam Certificate for KYC validation.' },
                  { tag: 'Welfare Updates', title: 'MP Samagra eKYC Mandatory for DBT Scheme Beneficiaries', body: 'State government directs: Link Aadhaar eKYC to your Samagra profile to receive uninterrupted scholarship and direct subsidy credits.' },
                ].map(({ tag, title, body }, i) => (
                  <motion.div
                    key={tag} variants={fadeUp} custom={i}
                    whileHover={cardHover}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-7 shadow-sm transition-colors space-y-3 cursor-default"
                  >
                    <span className="text-xs font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400 px-3 py-1 rounded-lg">{tag}</span>
                    <h4 className="font-bold text-slate-800 dark:text-white leading-snug text-base">{title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{body}</p>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          </div>
        )}

        {/* VIEW 2: ABOUT US PAGE */}
        {currentView === 'about' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 animate-fadeIn">
            <div className="text-center space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 px-2.5 py-1 rounded-md">
                Who We Are
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Bridging the Digital Divide, Right from Your Home
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                Empowering citizens with secure, speed-focused government filing assistance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors space-y-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Our Story</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  EasyCafe evolved from a physical, brick-and-mortar digital service center helping locals in Madhya Pradesh file online paperwork. We quickly realized that citizens struggled with complex governmental forms, security practices, and lengthy queues.
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  To solve this, we expanded into a high-end Smart Cyber Assistant portal. Now, citizens from all over the region upload paperwork securely from home, allowing our expert operator teams to handle validation and filing behind the scenes.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors space-y-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Our Vision & Core Values</h3>
                <div className="space-y-3 pt-1">
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">✓ Accuracy First</strong>
                    <span className="text-slate-400 block mt-0.5">Every document check is manual. We match entries to Aadhaar details to eliminate departmental rejections completely.</span>
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">✓ Absolute Transparency</strong>
                    <span className="text-slate-400 block mt-0.5">Zero hidden fees. We provide digital receipts, government order IDs, and real-time tracking alerts on WhatsApp.</span>
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">✓ Inclusivity</strong>
                    <span className="text-slate-400 block mt-0.5">Form layout controls, high-contrast states, and friendly AI helpers make document filing accessible to everyone.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Team Roster Section */}
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verified Document Experts</h3>
                <p className="text-xs text-slate-400">Our senior operators checking your filings.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-center">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors space-y-2">
                  <div className="mx-auto h-12 w-12 rounded-full bg-brand-100 text-brand-700 font-black text-lg flex items-center justify-center dark:bg-slate-800 dark:text-brand-400">RM</div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Rohan Mishra</h4>
                  <p className="text-[10px] text-slate-400">Lead Operations Executive<br/>5+ Years Experience</p>
                  <span className="inline-block text-[9px] font-bold bg-brand-50 text-brand-650 px-2 py-0.5 rounded">MSME Specialist</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors space-y-2">
                  <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 font-black text-lg flex items-center justify-center dark:bg-slate-800 dark:text-emerald-400">PS</div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Priya Sharma</h4>
                  <p className="text-[10px] text-slate-400">Senior Cyber Analyst<br/>4+ Years Experience</p>
                  <span className="inline-block text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">PAN Cards Expert</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors space-y-2">
                  <div className="mx-auto h-12 w-12 rounded-full bg-purple-100 text-purple-700 font-black text-lg flex items-center justify-center dark:bg-slate-800 dark:text-purple-400">AD</div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Amit Dubey</h4>
                  <p className="text-[10px] text-slate-400">Compliance Officer<br/>6+ Years Experience</p>
                  <span className="inline-block text-[9px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded">Gumasta Filings</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: CONTACT US PAGE */}
        {currentView === 'contact' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 animate-fadeIn">
            <div className="text-center space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 px-2.5 py-1 rounded-md">
                Get In Touch
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Support Details & Contact Form
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                Need help with document checklist items or payment inquiries? Message our team directly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Functional Contact Form */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm transition-colors">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Your name"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Mobile Number</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="10-digit registered number"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1.5">Your Message</label>
                    <textarea
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                      placeholder="Details of your inquiry..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 h-24"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-brand-650 hover:bg-brand-700 text-white font-semibold text-xs py-3 flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 transition-colors"
                  >
                    <Send className="h-4 w-4" /> Send Message
                  </button>
                </form>
              </div>

              {/* Mapped Details & Google Map Placeholder */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors text-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">Helpline & Support Details</h3>
                  <div className="space-y-2">
                    <p className="text-slate-500 dark:text-slate-400">
                      📍 <strong>Address:</strong> 12, Sunshine Arcade, Municipal Main Road, Indore, MP - 452001
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      📧 <strong>Email Helpline:</strong> help@easycafe.com
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      📞 <strong>Phone Support:</strong> +91 74159 21990 (Mon-Sat, 9am - 8pm)
                    </p>
                  </div>
                </div>

                {/* Google Map Visual Placeholder */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 h-52 flex flex-col items-center justify-center text-xs text-slate-405 dark:text-slate-600 text-center p-6 gap-2">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold">📍</div>
                  <div>
                    <strong>Google Maps Location</strong><br/>
                    12, Sunshine Arcade, Main Market Area, Indore
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: SERVICES DETAIL VIEW (Generic Service Info Page) */}
        {currentView === 'service-detail' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 animate-fadeIn">
            {/* Service Title Hero */}
            {(() => {
              const s = getServiceDetails(currentService);
              if (!s) return <p className="text-xs text-slate-400">Service not found.</p>;
              return (
                <>
                  <div className="text-center space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-650 bg-brand-50 dark:bg-brand-950/30 px-3 py-1.5 rounded-md">
                      {s.subtitle}
                    </span>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{s.name}</h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">{s.desc}</p>
                    
                    <div className="flex justify-center items-center gap-6 pt-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-405"><Clock className="h-4.5 w-4.5 text-brand-500" /> TIMELINE: <strong>{s.timeline}</strong></div>
                      <div className="font-bold text-slate-700 dark:text-slate-300">FEE: {s.fee > 0 ? `₹${s.fee}` : 'FREE (Inquiry)'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed">
                    {/* Eligibility criteria list */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors space-y-3">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Check Eligibility Requirements</h3>
                      <ul className="space-y-2 pt-1 list-disc pl-4 text-slate-500 dark:text-slate-400">
                        {s.eligibility?.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Benefits of applying */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors space-y-3">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Major Service Benefits</h3>
                      <ul className="space-y-2 pt-1 list-disc pl-4 text-slate-500 dark:text-slate-400">
                        {s.benefits?.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* FAQs Specific to service */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Service Frequently Asked Questions</h3>
                    <div className="space-y-3">
                      {s.faqs?.map((faq, index) => (
                        <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5">{faq.q}</h4>
                          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 flex justify-center gap-4">
                    <button onClick={() => setCurrentView('home')} className="rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm px-6 py-3 transition-colors">
                      Back to Services
                    </button>
                    <button onClick={() => handleApplyNow(s.id)} className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-3 shadow-md shadow-brand-500/10 flex items-center gap-1.5 transition-all">
                      Proceed to Apply <ArrowRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* VIEW 5: APPLY WIZARD PAGE */}
        {currentView === 'wizard' && (
          <ApplyWizard
            serviceId={currentService}
            onBack={() => setCurrentView('home')}
            onComplete={(application) => {
              setHeaderSearchId(application.id);
              setCurrentView('track');
            }}
          />
        )}

        {/* VIEW 6: TRACK APPLICATION PAGE */}
        {currentView === 'track' && (
          <TrackingPage 
            defaultSearchId={headerSearchId} 
            onBack={() => {
              setHeaderSearchId('');
              setCurrentView('home');
            }} 
          />
        )}

        {/* VIEW 7: STAFF LOGIN PAGE */}
        {currentView === 'staff-login' && (
          <div className="w-full min-h-[600px] bg-slate-50 dark:bg-slate-955 py-16 px-4 flex items-center justify-center transition-colors duration-300">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm transition-colors">
              <div className="text-center mb-6">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400 mb-3">
                  <User className="h-5.5 w-5.5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Staff authentication</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Log in to access the Employee Operation Center dashboard panel.
                </p>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. admin@easycafe.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    required
                  />
                </div>

                {loginError && (
                  <div className="text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-2.5 rounded-lg">
                    ❌ {loginError}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 flex items-center justify-center transition-colors shadow-md shadow-brand-500/10"
                  >
                    Authenticate & Access
                  </button>
                </div>
                
                <div className="text-[10px] text-slate-400 text-center leading-relaxed mt-2.5 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                  Offline Credentials:<br/>
                  Email: <strong>admin@easycafe.com</strong> | Password: <strong>AdminPassword123!</strong>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 8: STAFF DASHBOARD PAGE */}
        {currentView === 'staff-dashboard' && (
          <StaffDashboard />
        )}

        {/* VIEW 9: CUSTOMER DASHBOARD PAGE */}
        {currentView === 'customer-dashboard' && (
          <CustomerDashboard setCurrentView={setCurrentView} />
        )}

      </main>

      {/* legally compliant footer */}
      <Footer setCurrentView={setCurrentView} />

      {/* Floating WhatsApp Quick Action Support */}
      <FloatingWhatsApp setCurrentView={setCurrentView} setAiAssistantOpen={setAiAssistantOpen} />

      {/* Draggable AI powered assistant chatbot */}
      <AIAssistant 
        isOpen={aiAssistantOpen} 
        onClose={() => setAiAssistantOpen(false)} 
        setCurrentView={setCurrentView} 
        setCurrentService={setCurrentService} 
      />
    </div>
  );
}
