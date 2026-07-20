// src/components/FloatingWhatsApp.jsx
import React, { useState } from 'react';
import { MessageSquare, Calendar, HelpCircle, FileSearch, Send, X } from 'lucide-react';

export default function FloatingWhatsApp({ setCurrentView, setAiAssistantOpen }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (type) => {
    setIsOpen(false);
    if (type === 'track') {
      setCurrentView('track');
    } else if (type === 'chat') {
      window.open('https://wa.me/917415921990?text=Hello%20EasyCafe%2C%20I%20need%20help%20with%20my%20document%20application.', '_blank');
    } else if (type === 'ask') {
      setAiAssistantOpen(true);
    } else if (type === 'hours') {
      alert('📅 Business Hours:\nMonday to Saturday: 9:00 AM - 8:00 PM\nSunday: Closed\n\nSubmit your documents anytime—our operators will process them first thing in the morning!');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Action Menu */}
      {isOpen && (
        <div className="mb-3 w-64 rounded-xl border border-slate-100 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 transform translate-y-0 opacity-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              WhatsApp Support
            </span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-2 space-y-1">
            <button
              onClick={() => handleAction('chat')}
              className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Send className="mr-2.5 h-3.5 w-3.5 text-emerald-500" />
              Chat with Support
            </button>
            <button
              onClick={() => handleAction('track')}
              className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60 transition-colors"
            >
              <FileSearch className="mr-2.5 h-3.5 w-3.5 text-blue-500" />
              Track Application
            </button>
            <button
              onClick={() => handleAction('ask')}
              className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60 transition-colors"
            >
              <HelpCircle className="mr-2.5 h-3.5 w-3.5 text-purple-500" />
              Ask a Question (AI Assistant)
            </button>
            <button
              onClick={() => handleAction('hours')}
              className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Calendar className="mr-2.5 h-3.5 w-3.5 text-amber-500" />
              Business Hours
            </button>
          </div>
          
          <div className="mt-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-[10px] text-emerald-700 dark:text-emerald-400">
            🟢 Operators Online. Average response: 3 mins.
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/25 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 transition-all hover:scale-105 duration-200"
        aria-label="Contact WhatsApp Support"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6 fill-white text-emerald-500" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
