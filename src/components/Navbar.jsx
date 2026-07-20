// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, User, Moon, Sun, Monitor, Search } from 'lucide-react';
import api from '../api';

export default function Navbar({ currentView, setCurrentView, currentService, setCurrentService, darkMode, setDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(api.isAdminAuthenticated());

  useEffect(() => {
    // Re-check authentication status on view changes
    setIsAdmin(api.isAdminAuthenticated());
  }, [currentView]);

  const handleServiceClick = (serviceId) => {
    setCurrentService(serviceId);
    setServicesDropdownOpen(false);
    setIsOpen(false);
    setCurrentView('service-detail');
  };

  const handleNavClick = (viewName) => {
    setCurrentView(viewName);
    setIsOpen(false);
    setServicesDropdownOpen(false);
  };

  const toggleAdminMode = () => {
    if (isAdmin) {
      api.logout();
      setIsAdmin(false);
      handleNavClick('home');
    } else {
      handleNavClick('staff-login');
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Area */}
          <div className="flex items-center cursor-pointer" onClick={() => handleNavClick('home')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white dark:bg-brand-500 shadow-md shadow-brand-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3z"/>
              </svg>
            </div>
            <div className="ml-2.5">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
                Easy<span className="text-brand-600 dark:text-brand-400">Cafe™</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase -mt-1">
                Smart Cyber Assistant
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => handleNavClick('home')}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${currentView === 'home' ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/30' : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-brand-400 dark:hover:bg-slate-900/55'}`}
            >
              Home
            </button>

            {/* Services Dropdown */}
            <div className="relative">
              <button
                onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-brand-400 dark:hover:bg-slate-900/55 transition-colors"
              >
                Services
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${servicesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {servicesDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setServicesDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 w-60 rounded-xl border border-slate-100 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-20 transition-all">
                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Government Filings
                    </div>
                    <button
                      onClick={() => handleServiceClick('samagra')}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    >
                      <span className="mr-2">👥</span> Samagra ID Portal
                    </button>
                    <button
                      onClick={() => handleServiceClick('pan')}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    >
                      <span className="mr-2">💳</span> PAN Card Registration
                    </button>
                    <button
                      onClick={() => handleServiceClick('gumasta')}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    >
                      <span className="mr-2">🏢</span> Gumasta License
                    </button>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Financial Services
                    </div>
                    <button
                      onClick={() => handleServiceClick('loan')}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    >
                      <span className="mr-2">🏛️</span> Loan Inquiry & Offers
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => handleNavClick('about')}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${currentView === 'about' ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/30' : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-brand-400 dark:hover:bg-slate-900/55'}`}
            >
              About Us
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${currentView === 'contact' ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/30' : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-brand-400 dark:hover:bg-slate-900/55'}`}
            >
              Contact Us
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-950 dark:hover:text-brand-400 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Quick Track Application (Pinned next to logo on mobile as well) */}
            <button
              onClick={() => handleNavClick('track')}
              className="inline-flex items-center rounded-lg border border-brand-600 dark:border-brand-400 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40 transition-colors shadow-sm"
            >
              <Search className="mr-1 h-3.5 w-3.5 hidden sm:inline" />
              Track Status
            </button>

            {/* Staff / Owner Switch Link */}
            <button
              onClick={toggleAdminMode}
              className={`hidden sm:inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                isAdmin
                  ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/20'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900/60'
              }`}
            >
              <User className="mr-1.5 h-3.5 w-3.5" />
              {isAdmin ? 'Staff Logout' : 'Staff Panel'}
            </button>

            {/* Mobile menu hamburger button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-brand-400 transition-colors"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 shadow-inner dark:border-slate-900 dark:bg-slate-950 transition-colors">
          <div className="space-y-1 px-2 pb-3 pt-2">
            <button
              onClick={() => handleNavClick('home')}
              className="block w-full rounded-md px-3 py-2 text-left text-base font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Home
            </button>
            <div className="px-3 py-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Services
            </div>
            <div className="pl-4 space-y-1">
              <button
                onClick={() => handleServiceClick('samagra')}
                className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
              >
                👥 Samagra Portal
              </button>
              <button
                onClick={() => handleServiceClick('pan')}
                className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
              >
                💳 PAN Card Registration
              </button>
              <button
                onClick={() => handleServiceClick('gumasta')}
                className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
              >
                🏢 Gumasta License
              </button>
              <button
                onClick={() => handleServiceClick('loan')}
                className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
              >
                🏛️ Loan Inquiry
              </button>
            </div>
            <button
              onClick={() => handleNavClick('about')}
              className="block w-full rounded-md px-3 py-2 text-left text-base font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              About Us
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="block w-full rounded-md px-3 py-2 text-left text-base font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Contact Us
            </button>
            <div className="my-2 border-t border-slate-100 dark:border-slate-900" />
            <button
              onClick={toggleAdminMode}
              className="flex w-full items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <User className="mr-2 h-4 w-4" />
              {isAdmin ? 'Staff Logout' : 'Staff Dashboard Access'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
