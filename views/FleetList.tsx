
import React, { useState } from 'react';
import { ViewState, Vehicle } from '../types';
import AddVehicleModal from '../components/AddVehicleModal';

interface FleetListProps {
  vehicles: Vehicle[];
  onNavigate: (view: ViewState, id?: string) => void;
  onAddVehicle?: (vehicle: Vehicle) => void;
  onUpdateVehicle?: (vehicle: Vehicle) => void;
  onDeleteVehicle?: (id: string) => void;
}

const FleetList: React.FC<FleetListProps> = ({ vehicles, onNavigate, onAddVehicle, onUpdateVehicle, onDeleteVehicle }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | undefined>(undefined);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // Helper to calculate status based on date
  const calculateStatus = (dateStr?: string): 'ok' | 'warning' | 'expired' => {
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

  // Process vehicles with dynamic status
  const processedVehicles = vehicles.map(v => ({
    ...v,
    nextInspectionStatus: calculateStatus(v.nextInspectionDate),
    nextIucStatus: calculateStatus(v.nextIucDate),
    nextAnnualReviewStatus: calculateStatus(v.nextAnnualReviewDate)
  }));

  const handleDeleteClick = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation();
    setVehicleToDelete(vehicle);
  };

  const confirmDelete = () => {
    if (vehicleToDelete && onDeleteVehicle) {
      onDeleteVehicle(vehicleToDelete.id);
      setVehicleToDelete(null);
    }
  };

  const handleEditClick = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation();
    setVehicleToEdit(vehicle);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setVehicleToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleModalSave = (vehicle: Vehicle) => {
    if (vehicleToEdit) {
        if (onUpdateVehicle) onUpdateVehicle(vehicle);
    } else {
        if (onAddVehicle) onAddVehicle(vehicle);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Edit/Add Modal Integration */}
      {isModalOpen && (
        <AddVehicleModal 
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
          vehicleToEdit={vehicleToEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-surface-dark border border-danger/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-border-dark flex justify-between items-center bg-danger/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-danger">warning</span>
                        Eliminar Veículo
                    </h3>
                    <button onClick={() => setVehicleToDelete(null)} className="text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 flex flex-col gap-4">
                    <p className="text-slate-300 text-sm">
                        Tem a certeza que deseja eliminar o veículo <strong className="text-white">{vehicleToDelete.make} {vehicleToDelete.model} ({vehicleToDelete.plate})</strong>?
                    </p>
                    <p className="text-danger text-sm font-bold bg-danger/10 p-3 rounded-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">info</span>
                        Esta ação é irreversível.
                    </p>
                </div>
                <div className="p-4 bg-[#151c29] flex justify-end gap-3">
                    <button 
                        onClick={() => setVehicleToDelete(null)}
                        className="px-4 py-2 rounded-lg text-slate-300 hover:bg-surface-dark-lighter font-bold text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="px-4 py-2 rounded-lg bg-danger hover:bg-red-600 text-white font-bold text-sm transition-colors shadow-lg shadow-danger/20 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="relative w-full lg:max-w-md h-12">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input className="block w-full h-full pl-10 pr-3 py-2 border-none rounded-lg leading-5 bg-surface-dark border border-surface-dark-lighter text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm" placeholder="Pesquisar por matrícula, marca ou modelo..." type="text"/>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
          <button className="px-4 py-2 rounded-full bg-surface-dark hover:bg-surface-dark-lighter text-slate-400 hover:text-white text-sm font-medium transition-all border border-transparent hover:border-gray-700 hidden sm:block">Filtros</button>
          
          {/* Add Vehicle Button */}
          {onAddVehicle && (
            <button 
                onClick={handleAddClick}
                className="ml-auto lg:ml-0 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-blue-600 text-white text-sm font-bold shadow-lg shadow-primary/30 transition-all active:scale-95"
            >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Adicionar Veículo
            </button>
          )}
        </div>
      </div>

      {/* Vehicle Table */}
      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-dark bg-[#1c2433]">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400">Veículo</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400">Matrícula</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400">Próxima Inspeção</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400">Revisão Anual</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400">IUC (Selo)</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {processedVehicles.map((car) => (
                <tr key={car.id} className="group hover:bg-[#2a3855] transition-colors cursor-pointer" onClick={() => onNavigate('details', car.id)}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-lg bg-cover bg-center bg-gray-700 shrink-0" style={{ backgroundImage: `url('${car.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJFpB2IUodS3S5Z1hRXF8HzBK50XzmqmJU3QpC7FCfQrJjXGvl9QvP9Svvjxyzbvt0z446EL9yQTinS-fGYAZU0gJgRxayyjcNIXqO04FCVziUZ5rqZPEd75S2PVPoqLXJow56z9n3DJiAf-C__ptwDvAVb5QUs_Ok79B1mRGekti-vvvXG6GKbvMt93gzmtguF3LYwZ53g2fn6uTgDgq1wEsmzcCJECks90eM26OakIbEHdzv90VXrygjllltbIJrKdvQ9kLejvw'}')` }}></div>
                      <div>
                        <p className="text-white font-bold text-sm">{car.make} {car.model}</p>
                        <p className="text-slate-400 text-xs">{car.year} • {car.fuel} • {car.km.toLocaleString()} km</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-white bg-black/40 px-2 py-1 rounded border border-gray-700 text-sm tracking-wide whitespace-nowrap">{car.plate}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-white text-sm font-medium">{car.nextInspectionDate ? car.nextInspectionDate : 'N/A'}</span>
                      {car.nextInspectionDate && (
                        <div className="flex items-center gap-1.5">
                            <span className={`size-2 rounded-full ${car.nextInspectionStatus === 'ok' ? 'bg-emerald-500' : car.nextInspectionStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                            <span className={`text-xs font-medium ${car.nextInspectionStatus === 'ok' ? 'text-emerald-400' : car.nextInspectionStatus === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                            {car.nextInspectionStatus === 'ok' ? 'Em dia' : car.nextInspectionStatus === 'warning' ? 'Agendar Breve' : 'Expirada'}
                            </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-white text-sm font-medium">{car.nextAnnualReviewDate ? car.nextAnnualReviewDate : 'N/A'}</span>
                      {car.nextAnnualReviewDate && (
                        <div className="flex items-center gap-1.5">
                            <span className={`size-2 rounded-full ${car.nextAnnualReviewStatus === 'ok' ? 'bg-emerald-500' : car.nextAnnualReviewStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                            <span className={`text-xs font-medium ${car.nextAnnualReviewStatus === 'ok' ? 'text-emerald-400' : car.nextAnnualReviewStatus === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                            {car.nextAnnualReviewStatus === 'ok' ? 'Em dia' : car.nextAnnualReviewStatus === 'warning' ? 'Agendar Breve' : 'Expirada'}
                            </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-white text-sm font-medium">{car.nextIucDate ? car.nextIucDate : 'N/A'}</span>
                      {car.nextIucDate && (
                        <div className="flex items-center gap-1.5">
                            <span className={`size-2 rounded-full ${car.nextIucStatus === 'ok' ? 'bg-emerald-500' : car.nextIucStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                            <span className={`text-xs font-medium ${car.nextIucStatus === 'ok' ? 'text-emerald-400' : car.nextIucStatus === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                            {car.nextIucStatus === 'ok' ? 'Pago' : car.nextIucStatus === 'warning' ? 'A Vencer' : 'Em Atraso'}
                            </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        className="p-2 rounded-lg text-slate-400 hover:bg-primary hover:text-white transition-colors" 
                        title="Editar" 
                        onClick={(e) => handleEditClick(e, car)}
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button 
                        className="p-2 rounded-lg text-slate-400 hover:bg-danger hover:text-white transition-colors" 
                        title="Eliminar"
                        onClick={(e) => handleDeleteClick(e, car)}
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {processedVehicles.length === 0 && (
                <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-4xl">no_crash</span>
                            <p>Nenhum veículo encontrado.</p>
                        </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border-dark flex items-center justify-between bg-[#1c2433]">
          <p className="text-sm text-slate-400">Mostrando <span className="font-medium text-white">1</span> a <span className="font-medium text-white">{processedVehicles.length}</span> de <span className="font-medium text-white">{processedVehicles.length}</span> resultados</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border border-gray-700 text-gray-400 text-sm hover:bg-gray-700 hover:text-white disabled:opacity-50" disabled>Anterior</button>
            <button className="px-3 py-1 rounded border border-gray-700 text-gray-400 text-sm hover:bg-gray-700 hover:text-white" disabled>Próximo</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetList;
