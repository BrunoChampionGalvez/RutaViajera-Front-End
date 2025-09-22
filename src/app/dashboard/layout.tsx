"use client";

import { useState, useEffect } from "react";
import DashboardNavbar from "@/components/DashboardNavbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // When screen is resized from mobile open state to desktop, ensure sidebar shows
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true); // force visible state on desktop so translate class not applied unexpectedly
      }
    };
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
  <div className="h-screen w-full flex md:flex-row relative overflow-hidden">
      {/* Sidebar (desktop static, mobile slide-in) */}
  <div className="hidden md:flex md:flex-col md:w-40 lg:w-44 bg-gray-800 shrink-0 z-[80]">
        <DashboardNavbar />
      </div>
      {/* Mobile sidebar overlay */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 w-40 bg-gray-800 z-[140] shadow-xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ willChange: 'transform' }}
      >
        <DashboardNavbar />
      </div>
      {/* Content wrapper */}
  <div className="flex-1 flex flex-col relative z-[10] bg-white min-w-0">
        {/* Top bar (always above content, below open sidebar) */}
        <div className="md:hidden p-4 pl-5 bg-gray-800 text-white flex items-center justify-between sticky top-0 z-[60]">
          <button onClick={toggleSidebar} aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Dashboard</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full mx-auto max-w-[1500px] min-w-0">
          {children}
        </div>
      </div>
      {/* Backdrop for mobile when sidebar open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-[130]"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
