// src/components/Footer.jsx
import React from 'react';

export default function Footer({ setCurrentView }) {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 py-12 px-4 border-t border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-b border-slate-800 pb-8">
          
          {/* Logo & Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3z"/>
                </svg>
              </div>
              <span className="ml-2 text-lg font-bold tracking-tight">
                Easy<span className="text-brand-400">Cafe™</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              A premium, trust-building Smart Cyber Assistant portal helping citizens submit paperwork and document filings with security and speed.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Helpful Links</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button onClick={() => setCurrentView('home')} className="text-left hover:text-white transition-colors">Home</button>
              <button onClick={() => setCurrentView('about')} className="text-left hover:text-white transition-colors">About Us</button>
              <button onClick={() => setCurrentView('contact')} className="text-left hover:text-white transition-colors">Contact Us</button>
              <button onClick={() => setCurrentView('track')} className="text-left hover:text-white transition-colors">Track Application</button>
              <button onClick={() => alert('Our Privacy Policy ensures your uploads are encrypted and auto-wiped within 30 days.')} className="text-left hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => alert('Terms of Service governing cyber cafe operator document assistance.')} className="text-left hover:text-white transition-colors">Terms of Service</button>
              <button onClick={() => alert('Refund Policy: Fees are refundable if operators have not yet processed filings.')} className="text-left hover:text-white transition-colors">Refund Policy</button>
            </div>
          </div>

          {/* Security Promise Column */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Our Security Guarantee</h4>
            <div className="rounded-lg bg-slate-950 p-4 border border-slate-800/60 text-xs leading-relaxed text-slate-400">
              <span className="mr-1.5" role="img" aria-label="Lock">🔒</span> 
              <strong>Enterprise-Grade Data Security</strong>. All user uploaded documents are automatically and permanently wiped from our active processing servers 30 days after your service is finalized.
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Attribution */}
        <div className="space-y-4 text-center">
          <p className="text-[10.5px] leading-relaxed text-slate-500 max-w-4xl mx-auto italic">
            Disclaimer: EasyCafe is an independent cyber service consultancy and digital assistance portal. EasyCafe is not directly affiliated with, authorized by, or endorsed by any government department or official authority.
          </p>
          <div className="text-[11px] text-slate-600">
            © {new Date().getFullYear()} EasyCafe. All rights reserved. Built for security & transparency.
          </div>
        </div>
      </div>
    </footer>
  );
}
