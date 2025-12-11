
import React, { useState, useRef } from 'react';
import { Vehicle } from '../types';

interface AddVehicleModalProps {
  onClose: () => void;
  onSave: (vehicle: Vehicle) => void;
  vehicleToEdit?: Vehicle;
}

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ onClose, onSave, vehicleToEdit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  
  // Initialize form data with vehicleToEdit if available, otherwise defaults
  const [formData, setFormData] = useState<Partial<Vehicle>>(
    vehicleToEdit ? { ...vehicleToEdit } : {
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plate: '',
    vin: '',
    fuel: '',
    engine: '',
    power: '',
    tires: '',
    color: '',
    image: '', 
    km: 0,
    status: 'active',
    nextInspectionDate: '',
    nextInspectionStatus: 'ok',
    nextIucDate: '',
    nextIucStatus: 'ok',
    nextServiceKm: 0,
    nextServiceDate: '',
    lastAnnualReviewDate: '',
    nextAnnualReviewDate: '',
    history: []
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Logic for Annual Review Date
    if (name === 'lastAnnualReviewDate') {
        // Automatically set next review date to 1 year later
        if (value) {
            const date = new Date(value);
            date.setFullYear(date.getFullYear() + 1);
            const nextDate = date.toISOString().split('T')[0];
            setFormData(prev => ({
                ...prev,
                [name]: value,
                nextAnnualReviewDate: nextDate
            }));
            return;
        }
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImg(true);

    try {
      const base64Image = await compressImage(file);
      setFormData(prev => ({ ...prev, image: base64Image }));
    } catch (error) {
      console.error("Error processing image", error);
      alert("Erro ao processar imagem. Tente uma imagem menor.");
    } finally {
      setIsProcessingImg(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          // Resize logic
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with 0.7 quality to save space in DB
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.make || !formData.plate) return;

    // Use default image if none provided
    const finalImage = formData.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJFpB2IUodS3S5Z1hRXF8HzBK50XzmqmJU3QpC7FCfQrJjXGvl9QvP9Svvjxyzbvt0z446EL9yQTinS-fGYAZU0gJgRxayyjcNIXqO04FCVziUZ5rqZPEd75S2PVPoqLXJow56z9n3DJiAf-C__ptwDvAVb5QUs_Ok79B1mRGekti-vvvXG6GKbvMt93gzmtguF3LYwZ53g2fn6uTgDgq1wEsmzcCJECks90eM26OakIbEHdzv90VXrygjllltbIJrKdvQ9kLejvw';

    // Helper to calculate status
    const calculateStatus = (dateStr: string) => {
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

    const newVehicle: Vehicle = {
      id: vehicleToEdit ? vehicleToEdit.id : crypto.randomUUID(), // Preserve ID if editing
      make: formData.make!,
      model: formData.model!,
      year: Number(formData.year),
      plate: formData.plate!,
      vin: formData.vin || 'N/A',
      fuel: formData.fuel || 'Desconhecido',
      engine: formData.engine || 'N/A',
      power: formData.power || 'N/A',
      tires: formData.tires || 'N/A',
      color: formData.color || 'N/A',
      image: finalImage,
      km: Number(formData.km),
      status: formData.status as 'active' | 'maintenance' | 'inactive' || 'active',
      nextInspectionDate: formData.nextInspectionDate!,
      nextInspectionStatus: calculateStatus(formData.nextInspectionDate!),
      nextIucDate: formData.nextIucDate!,
      nextIucStatus: calculateStatus(formData.nextIucDate!),
      nextServiceKm: Number(formData.nextServiceKm),
      nextServiceDate: formData.nextServiceDate!,
      lastAnnualReviewDate: formData.lastAnnualReviewDate,
      nextAnnualReviewDate: formData.nextAnnualReviewDate,
      history: vehicleToEdit ? vehicleToEdit.history : [] // Preserve history if editing
    };

    onSave(newVehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface-dark border border-border-dark w-full max-w-2xl rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border-dark flex justify-between items-center bg-[#111722] sticky top-0 z-10 rounded-t-2xl">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">{vehicleToEdit ? 'edit' : 'add_circle'}</span>
            {vehicleToEdit ? 'Editar Veículo' : 'Adicionar Veículo'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="addVehicleForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* General Info */}
            <section className="flex flex-col gap-4">
              <h4 className="text-primary font-bold text-sm uppercase tracking-wide border-b border-border-dark pb-2">Informação Geral</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Marca *</label>
                  <input required name="make" value={formData.make} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" placeholder="Ex: BMW" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Modelo *</label>
                  <input required name="model" value={formData.model} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" placeholder="Ex: X5" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Matrícula *</label>
                  <input required name="plate" value={formData.plate} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" placeholder="AA-00-BB" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Ano</label>
                  <input type="number" name="year" value={formData.year} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">VIN (Chassi)</label>
                  <input name="vin" value={formData.vin} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Quilometragem (km)</label>
                  <input type="number" name="km" value={formData.km} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" />
                </div>
                {vehicleToEdit && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400 text-xs font-bold uppercase">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none">
                            <option value="active">Ativo</option>
                            <option value="maintenance">Manutenção</option>
                            <option value="inactive">Inativo</option>
                        </select>
                    </div>
                )}
              </div>
            </section>

            {/* Technical Specs */}
            <section className="flex flex-col gap-4">
              <h4 className="text-primary font-bold text-sm uppercase tracking-wide border-b border-border-dark pb-2">Dados Técnicos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Combustível</label>
                  <select name="fuel" value={formData.fuel} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none">
                    <option value="">Selecione...</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Gasolina</option>
                    <option value="Hybrid">Híbrido</option>
                    <option value="Electric">Elétrico</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Motor</label>
                  <input name="engine" value={formData.engine} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" placeholder="Ex: 2.0L" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Potência</label>
                  <input name="power" value={formData.power} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" placeholder="Ex: 150 cv" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Cor</label>
                  <input name="color" value={formData.color} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" placeholder="Ex: Preto" />
                </div>
                 <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Pneus</label>
                  <input name="tires" value={formData.tires} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" placeholder="Ex: 225/50 R17" />
                </div>
                
                 {/* Image Upload Area */}
                 <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-slate-400 text-xs font-bold uppercase">Fotografia do Veículo</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full h-40 rounded-xl border-2 border-dashed border-border-dark hover:border-primary hover:bg-surface-dark-lighter transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group ${formData.image ? 'border-solid border-primary/50' : ''}`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                    
                    {isProcessingImg ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
                        <span className="text-xs text-slate-300">Comprimindo imagem...</span>
                      </div>
                    ) : formData.image ? (
                      <>
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <span className="text-white font-bold flex items-center gap-2">
                             <span className="material-symbols-outlined">edit</span>
                             Alterar Foto
                           </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-white">
                        <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                        <span className="text-sm font-medium">Clique para carregar foto</span>
                        <span className="text-[10px] text-slate-500">JPG, PNG (Max. 5MB)</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </section>

            {/* Dates & Deadlines */}
            <section className="flex flex-col gap-4">
              <h4 className="text-primary font-bold text-sm uppercase tracking-wide border-b border-border-dark pb-2">Prazos e Manutenção</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Próxima Inspeção (IPO)</label>
                  <input type="date" name="nextInspectionDate" value={formData.nextInspectionDate} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Próximo IUC (Selo)</label>
                  <input type="date" name="nextIucDate" value={formData.nextIucDate} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" />
                </div>
                
                {/* Annual Review Fields */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Última Revisão Anual</label>
                  <input 
                    type="date" 
                    name="lastAnnualReviewDate" 
                    value={formData.lastAnnualReviewDate || ''} 
                    onChange={handleChange} 
                    className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" 
                  />
                  <p className="text-[10px] text-slate-500">A próxima será calculada automaticamente.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Próxima Revisão Anual</label>
                  <input 
                    type="date" 
                    name="nextAnnualReviewDate" 
                    value={formData.nextAnnualReviewDate || ''} 
                    onChange={handleChange} 
                    className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase">Próxima Revisão (Km)</label>
                  <input type="number" name="nextServiceKm" value={formData.nextServiceKm} onChange={handleChange} className="bg-[#111722] border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary outline-none" />
                </div>
              </div>
            </section>

          </form>
        </div>
        
        <div className="p-4 bg-[#111722] border-t border-border-dark flex justify-end gap-3 rounded-b-2xl">
          <button 
            type="button"
            onClick={onClose} 
            className="px-6 py-2.5 rounded-lg text-slate-300 hover:bg-surface-dark-lighter font-bold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="addVehicleForm"
            disabled={isProcessingImg}
            className="px-6 py-2.5 rounded-lg bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {isProcessingImg ? 'Processando...' : vehicleToEdit ? 'Guardar Alterações' : 'Guardar Veículo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleModal;
