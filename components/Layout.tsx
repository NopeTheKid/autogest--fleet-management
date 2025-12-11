
import React, { useRef, useState, useEffect } from 'react';
import { ViewState, Vehicle } from '../types';
import { dbService } from '../db';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState, id?: string) => void;
  title: string;
  vehicles: Vehicle[];
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, title, vehicles }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check API connection status
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // We only need to check if the endpoint is reachable, so we can use HEAD to be more efficient
        const response = await fetch('http://localhost:3001/api/vehicles', { method: 'HEAD' });
        if (response.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch (error) {
        setApiStatus('offline');
      }
    };
    checkApiStatus();
    const intervalId = setInterval(checkApiStatus, 15000); // Check every 15 seconds
    return () => clearInterval(intervalId);
  }, []);

  const handleNavClick = (view: ViewState) => {
    setView(view);
    setIsSidebarOpen(false);
  };

  // Helper to calculate status based on date
  const calculateStatus = (dateStr?: string) => {
    if (!dateStr) return 'ok';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'warning';
    return 'ok';
  };

  const alerts = vehicles.flatMap(v => {
    const list = [];
    const inspectionStatus = calculateStatus(v.nextInspectionDate);
    const iucStatus = calculateStatus(v.nextIucDate);
    const annualStatus = calculateStatus(v.nextAnnualReviewDate);

    if (inspectionStatus !== 'ok') {
      list.push({
        id: `${v.id}-insp`,
        vehicleId: v.id,
        title: `Inspeção ${v.make} ${v.model}`,
        desc: inspectionStatus === 'expired' ? `Expirou a ${v.nextInspectionDate}` : `Vence a ${v.nextInspectionDate}`,
        type: inspectionStatus,
        icon: 'fact_check'
      });
    }

    if (iucStatus !== 'ok') {
      list.push({
        id: `${v.id}-iuc`,
        vehicleId: v.id,
        title: `IUC ${v.make} ${v.model}`,
        desc: iucStatus === 'expired' ? `Expirou a ${v.nextIucDate}` : `Vence a ${v.nextIucDate}`,
        type: iucStatus,
        icon: 'receipt_long'
      });
    }

    if (annualStatus !== 'ok') {
      list.push({
        id: `${v.id}-annual`,
        vehicleId: v.id,
        title: `Revisão Anual ${v.make} ${v.model}`,
        desc: annualStatus === 'expired' ? `Expirou a ${v.nextAnnualReviewDate}` : `Vence a ${v.nextAnnualReviewDate}`,
        type: annualStatus,
        icon: 'calendar_clock'
      });
    }
    return list;
  });

  const apiStatusInfo = {
    connecting: {
      icon: 'sync',
      color: 'text-slate-400',
      title: 'Verificando conexão...',
      description: 'Aguarde um momento.',
      iconClass: 'animate-spin'
    },
    online: {
      icon: 'cloud_done',
      color: 'text-green-500',
      title: 'Conectado',
      description: 'Sincronizado com a API.',
      iconClass: ''
    },
    offline: {
      icon: 'cloud_off',
      color: 'text-red-500',
      title: 'Offline',
      description: 'A trabalhar em modo local.',
      iconClass: ''
    }
  };

  const currentApiStatus = apiStatusInfo[apiStatus];

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static z-50 h-full w-72 bg-[#111722] border-r border-border-dark flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-4">
          {/* User Profile / App Header */}
          <div className="flex gap-3 mb-8 items-center p-2 justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center bg-primary rounded-xl size-10 shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-white text-xl">directions_car</span>
              </div>
              <h1 className="text-white text-lg font-bold leading-tight tracking-wide">GestorAuto</h1>
            </div>
            {/* Close button mobile only */}
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden text-slate-400 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Nav Menu */}
          <nav className="flex flex-col gap-2 flex-1">
            <button 
              onClick={() => handleNavClick('dashboard')}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group text-left ${currentView === 'dashboard' ? 'bg-primary/20 text-white shadow-[inset_4px_0_0_0_#135bec]' : 'hover:bg-surface-dark text-slate-400'}`}
            >
              <span className={`material-symbols-outlined ${currentView === 'dashboard' ? 'material-symbols-fill text-primary' : 'group-hover:text-white'}`}>dashboard</span>
              <p className={`text-sm font-medium ${currentView === 'dashboard' ? '' : 'group-hover:text-white'}`}>Dashboard</p>
            </button>

            <button 
              onClick={() => handleNavClick('fleet')}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group text-left ${currentView === 'fleet' || currentView === 'details' ? 'bg-primary/20 text-white shadow-[inset_4px_0_0_0_#135bec]' : 'hover:bg-surface-dark text-slate-400'}`}
            >
              <span className={`material-symbols-outlined ${currentView === 'fleet' || currentView === 'details' ? 'material-symbols-fill text-primary' : 'group-hover:text-white'}`}>directions_car</span>
              <p className={`text-sm font-medium ${currentView === 'fleet' || currentView === 'details' ? '' : 'group-hover:text-white'}`}>Frota</p>
            </button>
          </nav>

          {/* Footer Actions */}
          <div className="mt-auto border-t border-border-dark pt-4 flex flex-col gap-2">
            <div className="bg-surface-dark rounded-xl p-3 border border-border-dark relative overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-lg ${currentApiStatus.color} ${currentApiStatus.iconClass}`}>
                        {currentApiStatus.icon}
                    </span>
                    <div>
                        <p className="text-xs font-bold text-white">{currentApiStatus.title}</p>
                        <p className="text-[10px] text-slate-400">{currentApiStatus.description}</p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header - Mobile Menu & Context */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border-dark bg-[#111722]/90 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-slate-500 hover:text-primary transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <div 
                className="relative size-8 rounded-full bg-surface-dark flex items-center justify-center cursor-pointer hover:bg-surface-dark-lighter transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <span className="material-symbols-outlined text-sm text-slate-400">notifications</span>
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                    {alerts.length}
                  </span>
                )}
              </div>

              {/* Notification Dropdown */}
              {showNotifications && (
                 <div className="absolute top-12 right-0 w-80 bg-surface-dark border border-border-dark rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="p-3 border-b border-border-dark flex justify-between items-center bg-[#111722]">
                      <h3 className="text-white font-bold text-sm">Notificações</h3>
                      <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{alerts.length} novas</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {alerts.length === 0 ? (
                         <div className="p-8 flex flex-col items-center text-slate-500 gap-2">
                            <span className="material-symbols-outlined text-2xl">notifications_off</span>
                            <p className="text-xs">Sem alertas pendentes</p>
                         </div>
                      ) : (
                        <div className="flex flex-col">
                          {alerts.map(alert => (
                            <div 
                              key={alert.id} 
                              onClick={() => {
                                  setView('details', alert.vehicleId);
                                  setShowNotifications(false);
                              }} 
                              className="p-3 border-b border-border-dark hover:bg-surface-dark-lighter cursor-pointer flex gap-3 items-start transition-colors last:border-0"
                            >
                               <div className={`p-2 rounded-full shrink-0 ${alert.type === 'expired' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                  <span className="material-symbols-outlined text-lg">{alert.icon}</span>
                               </div>
                               <div>
                                  <p className="text-white text-sm font-bold leading-tight">{alert.title}</p>
                                  <p className="text-slate-400 text-xs mt-0.5">{alert.desc}</p>
                               </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                 </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-[1600px] mx-auto pb-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
