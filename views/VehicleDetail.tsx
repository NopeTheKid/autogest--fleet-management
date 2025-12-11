
import React, { useState } from 'react';
import { ViewState, Vehicle, MaintenanceRecord } from '../types';
import AddVehicleModal from '../components/AddVehicleModal';

interface VehicleDetailProps {
  vehicleId: string;
  vehicles: Vehicle[];
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onNavigate: (view: ViewState) => void;
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicleId, vehicles, onUpdateVehicle, onDeleteVehicle, onNavigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for Edit Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for Delete Confirmation
  const [modalType, setModalType] = useState<'inspection' | 'iuc' | 'annual'>('inspection');
  const [newDate, setNewDate] = useState('');

  // State for new record form
  const [newRecord, setNewRecord] = useState<Partial<MaintenanceRecord>>({
    date: new Date().toISOString().split('T')[0],
    type: 'Revisão',
    service: '',
    garage: '', // Will be set to default on save
    km: 0,
    // cost removed
  });

  // State for the Next Service Km input
  const [nextServiceKmInput, setNextServiceKmInput] = useState<number>(0);

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

  // Helper to get friendly days remaining message
  const getDaysMessage = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Expirou há ${Math.abs(diffDays)} dias`;
    if (diffDays === 0) return 'Vence hoje';
    return `Vence em ${diffDays} dias`;
  };

  const rawVehicle = vehicles.find(v => v.id === vehicleId) || vehicles[0];
  
  // Process vehicle with dynamic status
  const vehicle = {
    ...rawVehicle,
    nextInspectionStatus: calculateStatus(rawVehicle.nextInspectionDate),
    nextIucStatus: calculateStatus(rawVehicle.nextIucDate),
    nextAnnualReviewStatus: calculateStatus(rawVehicle.nextAnnualReviewDate)
  };

  const history = vehicle.history || [];
  const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const inspectionDaysMessage = getDaysMessage(vehicle.nextInspectionDate);
  const isInspectionExpired = vehicle.nextInspectionStatus === 'expired';

  const iucDaysMessage = getDaysMessage(vehicle.nextIucDate);
  const isIucExpired = vehicle.nextIucStatus === 'expired';

  const annualDaysMessage = getDaysMessage(vehicle.nextAnnualReviewDate);
  const isAnnualExpired = vehicle.nextAnnualReviewStatus === 'expired';

  const openModal = (type: 'inspection' | 'iuc' | 'annual') => {
    setModalType(type);
    setNewDate('');
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    if (newDate) {
      let updatedVehicle: Vehicle;
      
      if (modalType === 'inspection') {
        updatedVehicle = {
          ...vehicle,
          nextInspectionDate: newDate,
          nextInspectionStatus: calculateStatus(newDate)
        };
      } else if (modalType === 'iuc') {
        updatedVehicle = {
          ...vehicle,
          nextIucDate: newDate,
          nextIucStatus: calculateStatus(newDate)
        };
      } else {
        // Annual Review
        // When we confirm an annual review, we are essentially setting the Last Review Date to "today" (or the date provided)
        // AND updating the Next Review Date to 1 year from now.
        // However, the modal asks for "Data de Vencimento" (Due Date) usually.
        // If the user is marking as "Done", they should provide the date it was done (Last Review), and we calc the next.
        // OR they just provide the Next Due Date directly.
        // Based on the Modal Text "indique a data do próximo vencimento", we will set the next date directly.
        // But to be smart, if we are updating "Next", we assume "Last" was recent.
        // For simplicity consistent with other fields, we just update the NEXT date here as provided by user.
        
        updatedVehicle = {
            ...vehicle,
            nextAnnualReviewDate: newDate
            // Ideally we would also update lastAnnualReviewDate to today, but the modal prompt says "Proximo Vencimento"
        };
      }

      onUpdateVehicle(updatedVehicle);
      setIsModalOpen(false);
      setNewDate('');
    }
  };

  const handleDeleteConfirm = () => {
      onDeleteVehicle(vehicle.id);
      setIsDeleteModalOpen(false);
  };

  const handleSaveRecord = () => {
    if (!newRecord.service || !newRecord.date) return;

    // Get the mileage from the input
    const inputKm = Number(newRecord.km) || 0;

    const record: MaintenanceRecord = {
        id: crypto.randomUUID(),
        date: newRecord.date!,
        type: newRecord.type as any,
        service: newRecord.service!,
        garage: 'Não especificada', // Default since field was removed
        km: inputKm,
        cost: 0 // removed from UI, setting to 0 internally
    };

    const updatedVehicle = {
        ...vehicle,
        history: [record, ...(vehicle.history || [])],
        // Update the next service km if provided (otherwise keep existing)
        nextServiceKm: nextServiceKmInput > 0 ? nextServiceKmInput : vehicle.nextServiceKm,
        // CRITICAL: Update vehicle mileage if the new record has higher mileage than current
        km: inputKm > vehicle.km ? inputKm : vehicle.km
    };
    
    onUpdateVehicle(updatedVehicle);

    // Reset form
    setNewRecord({
        date: new Date().toISOString().split('T')[0],
        type: 'Revisão',
        service: '',
        garage: '',
        km: 0,
        // cost removed
    });
    setNextServiceKmInput(0);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Edit Modal */}
      {isEditModalOpen && (
        <AddVehicleModal
          vehicleToEdit={vehicle}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updatedVehicle) => {
            onUpdateVehicle(updatedVehicle);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-surface-dark border border-danger/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-border-dark flex justify-between items-center bg-danger/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-danger">warning</span>
                        Eliminar Veículo
                    </h3>
                    <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 flex flex-col gap-4">
                    <p className="text-slate-300 text-sm">
                        Tem a certeza que deseja eliminar o veículo <strong className="text-white">{vehicle.make} {vehicle.model} ({vehicle.plate})</strong>?
                    </p>
                    <p className="text-danger text-sm font-bold bg-danger/10 p-3 rounded-lg">
                        Esta ação é irreversível e todos os dados do histórico serão perdidos.
                    </p>
                </div>
                <div className="p-4 bg-[#151c29] flex justify-end gap-3">
                    <button 
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="px-4 py-2 rounded-lg text-slate-300 hover:bg-surface-dark-lighter font-bold text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleDeleteConfirm}
                        className="px-4 py-2 rounded-lg bg-danger hover:bg-red-600 text-white font-bold text-sm transition-colors shadow-lg shadow-danger/20 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Eliminar Veículo
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Confirmation Modal (Inspection/IUC/Annual) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-surface-dark border border-border-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-border-dark flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-success">check_circle</span>
                        {modalType === 'inspection' ? 'Confirmar Inspeção' : modalType === 'iuc' ? 'Confirmar IUC' : 'Confirmar Revisão Anual'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 flex flex-col gap-4">
                    <p className="text-slate-300 text-sm">
                        {modalType === 'inspection' 
                          ? 'Ao confirmar a realização da inspeção, este alerta será removido. Por favor, indique a data da ' 
                          : modalType === 'iuc' 
                             ? 'Ao confirmar o pagamento do selo, o status será atualizado. Por favor, indique a data do '
                             : 'Ao confirmar a revisão anual, o status será atualizado. Por favor, indique a data do '
                        }
                        <strong className="text-white">próximo vencimento</strong>.
                    </p>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Data de Vencimento</label>
                        <input 
                            type="date" 
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="bg-[#111722] border border-border-dark rounded-lg px-4 py-3 text-white focus:ring-primary focus:border-primary w-full outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="p-4 bg-[#151c29] flex justify-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 rounded-lg text-slate-300 hover:bg-surface-dark-lighter font-bold text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!newDate}
                        className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-lg shadow-primary/20"
                    >
                        Confirmar e Atualizar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header with Image */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Vehicle Image */}
        <div className="w-full lg:w-[400px] shrink-0">
             <div className="aspect-video w-full rounded-2xl bg-cover bg-center border border-border-dark shadow-2xl relative overflow-hidden group" style={{ backgroundImage: `url('${vehicle.image}')` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
             </div>
        </div>

        {/* Vehicle Info */}
        <div className="flex-1 flex flex-col gap-6">
            <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <button onClick={() => onNavigate('fleet')} className="lg:hidden text-slate-400 hover:text-white">
                    <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-white text-3xl lg:text-4xl font-black leading-tight tracking-tight">{vehicle.make} {vehicle.model}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="bg-surface-dark border border-border-dark px-2 py-1 rounded text-xs font-mono text-slate-300">{vehicle.plate}</span>
                    <span className={`bg-${vehicle.status === 'active' ? 'green' : 'red'}-500/20 text-${vehicle.status === 'active' ? 'green' : 'red'}-400 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>
                    {vehicle.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="text-slate-400 text-sm">{vehicle.year} • {vehicle.fuel}</span>
                </div>
                <p className="text-slate-500 text-sm mt-1 font-mono">VIN: {vehicle.vin}</p>
                </div>
                <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center justify-center rounded-lg size-10 bg-surface-dark border border-border-dark text-slate-400 hover:text-white hover:bg-danger/80 hover:border-danger transition-colors"
                    title="Eliminar Veículo"
                >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
                <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center justify-center rounded-lg h-10 px-4 bg-surface-dark border border-border-dark text-white hover:bg-border-dark transition-colors text-sm font-bold"
                >
                    <span className="material-symbols-outlined text-[20px] mr-2">edit</span>
                    Editar Veículo
                </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Mileage */}
                <div className="flex flex-col gap-2 rounded-xl p-4 bg-surface-dark border border-border-dark relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-3xl text-white">speed</span>
                    </div>
                    <div className="flex justify-between items-center z-10">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Quilometragem</p>
                         <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="p-1 -mr-2 rounded-md hover:bg-white/10 text-primary transition-colors" title="Atualizar Km"
                        >
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                    </div>
                    <div className="flex items-end gap-1.5">
                        <p className="text-white text-xl font-bold font-mono">{vehicle.km.toLocaleString()}</p>
                        <span className="text-slate-500 text-xs mb-1">km</span>
                    </div>
                </div>
                
                {/* Next IPO */}
                <div className="flex flex-col gap-2 rounded-xl p-4 bg-surface-dark border border-border-dark relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-3xl text-white">fact_check</span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Próx. Inspeção</p>
                    <div className="flex items-center gap-2">
                        <p className="text-white text-xl font-bold">{vehicle.nextInspectionDate ? new Date(vehicle.nextInspectionDate).toLocaleDateString('pt-PT') : 'N/A'}</p>
                        {vehicle.nextInspectionStatus !== 'ok' && <span className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>}
                    </div>
                </div>
                
                {/* Next Service */}
                <div className="flex flex-col gap-2 rounded-xl p-4 bg-surface-dark border border-border-dark relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-3xl text-white">build_circle</span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Próxima Revisão</p>
                    <div className="flex flex-col">
                        <p className="text-white text-xl font-bold">{vehicle.nextServiceKm.toLocaleString()} km</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (Timeline + History) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* Timeline */}
            <section className="bg-surface-dark border border-border-dark rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white text-lg font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        Próximas Ações e Prazos
                    </h3>
                </div>
                <div className="grid grid-cols-[40px_1fr] gap-x-4">
                    {/* Item 1: Inspection */}
                    <div className="flex flex-col items-center pt-1">
                        <div className={`flex items-center justify-center size-8 rounded-full ${isInspectionExpired ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>
                            <span className="material-symbols-outlined text-sm font-bold">{isInspectionExpired ? 'priority_high' : 'event'}</span>
                        </div>
                        <div className="w-0.5 bg-border-dark h-full min-h-[40px] my-1"></div>
                    </div>
                    <div className="pb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white text-base font-bold">Inspeção Periódica (IPO)</p>
                                <p className={`${isInspectionExpired ? 'text-red-400' : 'text-slate-400'} text-sm font-medium mt-1`}>{inspectionDaysMessage}</p>
                            </div>
                            <button 
                                onClick={() => openModal('inspection')}
                                className="flex items-center gap-2 bg-surface-dark-lighter hover:bg-success hover:text-white text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-border-dark hover:border-success group"
                            >
                                <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-white">check_circle</span>
                                Marcar como feito
                            </button>
                        </div>
                    </div>

                    {/* Item 2: IUC */}
                    <div className="flex flex-col items-center pt-1">
                        <div className={`flex items-center justify-center size-8 rounded-full ${isIucExpired ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            <span className="material-symbols-outlined text-sm font-bold">{isIucExpired ? 'priority_high' : 'receipt_long'}</span>
                        </div>
                        <div className="w-0.5 bg-border-dark h-full min-h-[40px] my-1"></div>
                    </div>
                    <div className="pb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white text-base font-bold">Pagamento IUC (Selo)</p>
                                <p className={`${isIucExpired ? 'text-red-400' : 'text-slate-400'} text-sm font-medium mt-1`}>{iucDaysMessage}</p>
                            </div>
                            <button 
                                onClick={() => openModal('iuc')}
                                className="flex items-center gap-2 bg-surface-dark-lighter hover:bg-success hover:text-white text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-border-dark hover:border-success group"
                            >
                                <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-white">check_circle</span>
                                Marcar como feito
                            </button>
                        </div>
                    </div>

                    {/* Item 3: Annual Review (New) */}
                    <div className="flex flex-col items-center pt-1">
                        <div className={`flex items-center justify-center size-8 rounded-full ${isAnnualExpired ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            <span className="material-symbols-outlined text-sm font-bold">{isAnnualExpired ? 'priority_high' : 'calendar_clock'}</span>
                        </div>
                        <div className="w-0.5 bg-border-dark h-full min-h-[40px] my-1"></div>
                    </div>
                    <div className="pb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white text-base font-bold">Revisão Anual</p>
                                <p className={`${isAnnualExpired ? 'text-red-400' : 'text-slate-400'} text-sm font-medium mt-1`}>{annualDaysMessage}</p>
                            </div>
                            <button 
                                onClick={() => openModal('annual')}
                                className="flex items-center gap-2 bg-surface-dark-lighter hover:bg-success hover:text-white text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-border-dark hover:border-success group"
                            >
                                <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-white">check_circle</span>
                                Marcar como feito
                            </button>
                        </div>
                    </div>

                     {/* Item 4: Service Km */}
                    <div className="flex flex-col items-center">
                         <div className="flex items-center justify-center size-8 rounded-full bg-surface-dark border border-border-dark text-slate-300">
                            <span className="material-symbols-outlined text-sm">build</span>
                         </div>
                    </div>
                    <div className="pb-2">
                         <div>
                            <p className="text-white text-base font-bold">Revisão por Quilometragem ({vehicle.nextServiceKm.toLocaleString()}km)</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* History Table */}
            <section className="bg-surface-dark border border-border-dark rounded-xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-border-dark flex flex-wrap gap-4 justify-between items-center">
                    <h3 className="text-white text-lg font-bold">Histórico de Manutenção</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#111722] text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Serviço</th>
                                <th className="px-6 py-4 text-right">Km</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark text-sm">
                            {sortedHistory.length > 0 ? (
                                sortedHistory.map((record) => (
                                    <tr key={record.id} className="group hover:bg-[#253042] transition-colors">
                                        <td className="px-6 py-4 text-white whitespace-nowrap">{new Date(record.date).toLocaleDateString('pt-PT')}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                record.type === 'Revisão' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                                record.type === 'Peças' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                record.type === 'IPO' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                            }`}>
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300 font-medium">{record.service}</td>
                                        <td className="px-6 py-4 text-slate-300 text-right font-mono">{record.km > 0 ? record.km.toLocaleString() : '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                                        Sem registos de manutenção.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>

        {/* Right Column (Docs & Info) */}
        <div className="flex flex-col gap-6">
            
            {/* Quick Add Form */}
            <section className="bg-surface-dark border border-border-dark rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5">
                    <span className="bg-primary/20 text-primary p-1.5 rounded-lg material-symbols-outlined text-[20px]">add_circle</span>
                    <h3 className="text-white text-lg font-bold">Novo Registo</h3>
                </div>
                <form className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-slate-400 text-xs font-bold uppercase">Data</label>
                            <input 
                                type="date" 
                                value={newRecord.date}
                                onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                                className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary w-full outline-none transition-all placeholder-slate-600" 
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400 text-xs font-bold uppercase">Tipo</label>
                        <select 
                            value={newRecord.type}
                            onChange={(e) => setNewRecord({...newRecord, type: e.target.value as any})}
                            className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary w-full outline-none transition-all"
                        >
                            <option value="Revisão">Revisão</option>
                            <option value="Peças">Peças</option>
                            <option value="IPO">Inspeção (IPO)</option>
                            <option value="Reparação">Reparação</option>
                            <option value="Imposto">Imposto</option>
                            <option value="Manutenção">Manutenção</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400 text-xs font-bold uppercase">Descrição / Serviço</label>
                        <textarea 
                            value={newRecord.service}
                            onChange={(e) => setNewRecord({...newRecord, service: e.target.value})}
                            className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary w-full h-20 resize-none outline-none transition-all" 
                            placeholder="Ex: Mudança de Óleo..."
                        ></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-slate-400 text-xs font-bold uppercase">Km (Atuais)</label>
                            <input 
                                type="number"
                                value={newRecord.km || ''}
                                onChange={(e) => setNewRecord({...newRecord, km: parseInt(e.target.value)})}
                                className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary w-full outline-none transition-all" 
                                placeholder={vehicle.km.toString()}
                            />
                        </div>
                         <div className="flex flex-col gap-1.5">
                            <label className="text-slate-400 text-xs font-bold uppercase">Próxima Revisão (Km)</label>
                            <input 
                                type="number"
                                value={nextServiceKmInput || ''}
                                onChange={(e) => setNextServiceKmInput(parseInt(e.target.value))}
                                className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary w-full outline-none transition-all" 
                                placeholder={vehicle.nextServiceKm.toString()}
                            />
                        </div>
                    </div>

                    <button 
                        type="button" 
                        onClick={handleSaveRecord}
                        disabled={!newRecord.service}
                        className="mt-2 w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
                    >
                        <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">save</span>
                        Guardar Registo
                    </button>
                </form>
            </section>

             {/* Vehicle Specs */}
             <section className="bg-surface-dark border border-border-dark rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white text-base font-bold">Detalhes Técnicos</h3>
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="text-primary text-xs font-bold hover:underline"
                    >
                        Editar
                    </button>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center py-2 border-b border-border-dark/50">
                        <span className="text-slate-500 text-sm">Combustível</span>
                        <span className="text-white text-sm font-medium">{vehicle.fuel}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border-dark/50">
                        <span className="text-slate-500 text-sm">Cilindrada</span>
                        <span className="text-white text-sm font-medium">{vehicle.engine}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border-dark/50">
                        <span className="text-slate-500 text-sm">Potência</span>
                        <span className="text-white text-sm font-medium">{vehicle.power}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border-dark/50">
                        <span className="text-slate-500 text-sm">Pneus</span>
                        <span className="text-white text-sm font-medium">{vehicle.tires}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-500 text-sm">Cor</span>
                        <div className="flex items-center gap-2">
                            <div className={`size-4 rounded-full border border-white/20`} style={{ backgroundColor: vehicle.color.toLowerCase() }}></div>
                            <span className="text-white text-sm font-medium">{vehicle.color}</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;
