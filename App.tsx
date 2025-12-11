
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import FleetList from './views/FleetList';
import VehicleDetail from './views/VehicleDetail';
import { ViewState, Vehicle } from './types';
import { dbService } from './db';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize DB and load data
  useEffect(() => {
    const initData = async () => {
      await dbService.init();
      const loadedVehicles = await dbService.getAllVehicles();
      setVehicles(loadedVehicles);
      setIsLoading(false);
    };
    initData();
  }, []);

  const handleNavigate = (view: ViewState, id?: string) => {
    if (id) {
      setSelectedVehicleId(id);
    }
    setCurrentView(view);
  };

  const handleUpdateVehicle = async (updatedVehicle: Vehicle) => {
    // Optimistic UI Update
    setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
    
    // DB Update
    await dbService.updateVehicle(updatedVehicle);
  };

  const handleAddVehicle = async (newVehicle: Vehicle) => {
    // Optimistic UI Update
    setVehicles(prev => [...prev, newVehicle]);
    
    // DB Update
    await dbService.addVehicle(newVehicle);
  };

  const handleDeleteVehicle = async (id: string) => {
    // Optimistic UI Update
    setVehicles(prev => prev.filter(v => v.id !== id));
    
    // DB Update
    await dbService.deleteVehicle(id);
    
    // If we were viewing the deleted vehicle, go back to fleet
    if (currentView === 'details' && selectedVehicleId === id) {
        setCurrentView('fleet');
        setSelectedVehicleId(undefined);
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard Geral';
      case 'fleet': return 'Lista de Veículos';
      case 'details': return 'Detalhes do Veículo';
      case 'schedule': return 'Agendamento';
      default: return 'AutoGest';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#101622] text-white">
        <div className="animate-pulse">A carregar...</div>
      </div>
    );
  }

  return (
    <Layout currentView={currentView} setView={handleNavigate} title={getTitle()} vehicles={vehicles}>
      {currentView === 'dashboard' && (
        <Dashboard 
          vehicles={vehicles} 
          onNavigate={handleNavigate} 
        />
      )}
      {currentView === 'fleet' && (
        <FleetList 
          vehicles={vehicles} 
          onNavigate={handleNavigate}
          onAddVehicle={handleAddVehicle}
          onUpdateVehicle={handleUpdateVehicle}
          onDeleteVehicle={handleDeleteVehicle}
        />
      )}
      {currentView === 'details' && selectedVehicleId && (
        <VehicleDetail 
          vehicleId={selectedVehicleId} 
          vehicles={vehicles}
          onUpdateVehicle={handleUpdateVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onNavigate={handleNavigate} 
        />
      )}
    </Layout>
  );
}
