import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DailyEntry from './pages/DailyEntry';
import ReportHistory from './pages/ReportHistory';
import ReportDetails from './pages/ReportDetails';
import { Menu, X } from 'lucide-react';

function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedReportDate, setSelectedReportDate] = useState('');
  const [selectedDateForEdit, setSelectedDateForEdit] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'entry':
        return (
          <DailyEntry
            setActiveTab={setActiveTab}
            selectedDateForEdit={selectedDateForEdit}
          />
        );
      case 'history':
        return (
          <ReportHistory
            setActiveTab={setActiveTab}
            setSelectedReportDate={setSelectedReportDate}
          />
        );
      case 'report-details':
        return (
          <ReportDetails
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedReportDate={selectedReportDate}
            setSelectedDateForEdit={(date) => {
              setSelectedDateForEdit(date);
              setActiveTab('entry');
            }}
          />
        );
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Mobile Header & Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[rgba(8,12,22,0.92)] backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="text-[#10b981] font-extrabold tracking-tight">HP Fuel Station</div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-300 hover:text-white outline-none"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'entry') {
            setSelectedDateForEdit('');
          }
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
      />

      <main className="layout-main flex-1 min-w-0 p-4 lg:p-8 mt-16 lg:mt-0">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
