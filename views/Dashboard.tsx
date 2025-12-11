
import React from 'react';
import { ViewState, Vehicle } from '../types';

interface DashboardProps {
  vehicles: Vehicle[];
  onNavigate: (view: ViewState, id?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ vehicles, onNavigate }) => {
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

  // Process vehicles with dynamic status
  const processedVehicles = vehicles.map(v => ({
    ...v,
    nextInspectionStatus: calculateStatus(v.nextInspectionDate),
    nextIucStatus: calculateStatus(v.nextIucDate),
    nextAnnualReviewStatus: calculateStatus(v.nextAnnualReviewDate)
  }));

  // Calculate alerts dynamically based on processed vehicles (Check Inspection, IUC and Annual Review)
  const alertsCount = processedVehicles.reduce((acc, v) => {
    let count = 0;
    if (v.nextInspectionStatus === 'expired' || v.nextInspectionStatus === 'warning') count++;
    if (v.nextIucStatus === 'expired' || v.nextIucStatus === 'warning') count++;
    if (v.nextAnnualReviewStatus === 'expired' || v.nextAnnualReviewStatus === 'warning') count++;
    return acc + count;
  }, 0);
  
  // Generate list of active alerts
  const activeAlerts = processedVehicles
    .flatMap(v => {
      const alerts = [];
      // Inspection Alerts
      if (v.nextInspectionStatus === 'expired' || v.nextInspectionStatus === 'warning') {
        alerts.push({
          id: `${v.id}-inspection`,
          vehicle: v,
          category: 'inspection',
          type: v.nextInspectionStatus === 'expired' ? 'danger' as const : 'warning' as const,
          title: v.nextInspectionStatus === 'expired' ? 'Inspeção Expirada' : 'Inspeção Brevemente',
          message: v.nextInspectionStatus === 'expired' ? ' expirou em ' : ' vence em ',
          date: v.nextInspectionDate,
          icon: v.nextInspectionStatus === 'expired' ? 'gpp_maybe' : 'warning',
        });
      }
      // IUC Alerts
      if (v.nextIucStatus === 'expired' || v.nextIucStatus === 'warning') {
        alerts.push({
          id: `${v.id}-iuc`,
          vehicle: v,
          category: 'iuc',
          type: v.nextIucStatus === 'expired' ? 'danger' as const : 'warning' as const,
          title: v.nextIucStatus === 'expired' ? 'Selo (IUC) em Atraso' : 'Pagamento IUC Brevemente',
          message: v.nextIucStatus === 'expired' ? ' expirou em ' : ' vence em ',
          date: v.nextIucDate,
          icon: v.nextIucStatus === 'expired' ? 'receipt_long' : 'payments',
        });
      }
      // Annual Review Alerts
      if (v.nextAnnualReviewStatus === 'expired' || v.nextAnnualReviewStatus === 'warning') {
        alerts.push({
          id: `${v.id}-annual`,
          vehicle: v,
          category: 'annual',
          type: v.nextAnnualReviewStatus === 'expired' ? 'danger' as const : 'warning' as const,
          title: v.nextAnnualReviewStatus === 'expired' ? 'Revisão Anual Expirada' : 'Revisão Anual Brevemente',
          message: v.nextAnnualReviewStatus === 'expired' ? ' expirou em ' : ' vence em ',
          date: v.nextAnnualReviewDate!,
          icon: 'calendar_clock',
        });
      }
      return alerts;
    })
    .sort((a, b) => {
      // Prioritize danger over warning
      if (a.type === 'danger' && b.type !== 'danger') return -1;
      if (a.type !== 'danger' && b.type === 'danger') return 1;
      return 0;
    });

  const alertStyles = {
    danger: {
      container: "bg-danger/10 border-danger/20",
      iconBg: "bg-danger",
      title: "text-danger",
      button: "bg-danger hover:bg-red-600"
    },
    warning: {
      container: "bg-warning/10 border-warning/20",
      iconBg: "bg-warning",
      title: "text-warning",
      button: "bg-warning hover:bg-yellow-600"
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <div className="bg-surface-dark p-6 rounded-2xl border border-surface-dark-lighter shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px] text-primary">directions_car</span>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Total de Veículos</p>
            <h3 className="text-3xl font-bold text-white mt-1">{vehicles.length}</h3>
          </div>
        </div>

        <div className="bg-surface-dark p-6 rounded-2xl border border-surface-dark-lighter shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px] text-danger">warning</span>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Alertas Críticos</p>
            <h3 className="text-3xl font-bold text-white mt-1">{alertsCount}</h3>
          </div>
        </div>
      </div>

      {/* Critical Alert Banners */}
      {activeAlerts.length > 0 && (
        <div className="flex flex-col gap-4">
          {activeAlerts.map((alert) => (
            <div key={alert.id} className={`${alertStyles[alert.type].container} border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
              <div className="flex items-center gap-4">
                <div className={`${alertStyles[alert.type].iconBg} text-white p-2 rounded-lg shrink-0`}>
                  <span className="material-symbols-outlined block">{alert.icon}</span>
                </div>
                <div>
                  <h4 className={`${alertStyles[alert.type].title} font-bold text-base`}>{alert.title}</h4>
                  <p className="text-slate-300 text-sm">
                    {alert.category === 'annual' ? 'A revisão anual' : alert.category === 'iuc' ? 'O IUC' : 'A inspeção'} do veículo <span className="font-bold">{alert.vehicle.make} {alert.vehicle.model} ({alert.vehicle.plate})</span> 
                    {alert.message} 
                    {new Date(alert.date).toLocaleDateString('pt-PT')}
                    {alert.type === 'danger' ? '. Resolva imediatamente.' : '.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('details', alert.vehicle.id)} 
                className={`${alertStyles[alert.type].button} text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap shrink-0`}
              >
                Resolver Agora
              </button>
            </div>
          ))}
        </div>
      )}

      {/* My Fleet Horizontal Scroll */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Minha Frota</h3>
          <button onClick={() => onNavigate('fleet')} className="text-sm font-bold text-primary hover:text-blue-400 flex items-center gap-1">
            Ver todos
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 custom-scrollbar snap-x">
          {processedVehicles.map((car) => {
            // Determine overall vehicle status for the card based on worst case
            let cardStatus: 'ok' | 'warning' | 'expired' = 'ok';
            if (car.nextInspectionStatus === 'warning' || car.nextIucStatus === 'warning' || car.nextAnnualReviewStatus === 'warning') cardStatus = 'warning';
            if (car.nextInspectionStatus === 'expired' || car.nextIucStatus === 'expired' || car.nextAnnualReviewStatus === 'expired') cardStatus = 'expired';

            return (
              <div key={car.id} onClick={() => onNavigate('details', car.id)} className="snap-start min-w-[280px] w-[280px] bg-surface-dark rounded-2xl p-3 border border-surface-dark-lighter hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="aspect-video w-full rounded-xl bg-cover bg-center mb-3 relative overflow-hidden" style={{ backgroundImage: `url('${car.image}')` }}>
                  <div className={`absolute top-2 right-2 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${cardStatus === 'expired' ? 'bg-danger/90' : cardStatus === 'warning' ? 'bg-warning/90 text-black' : 'bg-success/90'}`}>
                    {cardStatus === 'expired' ? 'Ação Necessária' : cardStatus === 'warning' ? 'Atenção' : 'Em Dia'}
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-bold border border-white rounded-lg px-3 py-1">Ver Detalhes</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-white">{car.make} {car.model}</h4>
                  <p className="text-xs text-slate-400">{car.plate} • {car.km.toLocaleString()} km</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 gap-8">
        {/* Upcoming Activities (Full Width) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Próximas Atividades</h3>
            <div className="flex bg-surface-dark p-1 rounded-lg">
              <button className="px-3 py-1 text-xs font-bold rounded-md bg-surface-dark-lighter shadow-sm text-white">Todas</button>
              <button className="px-3 py-1 text-xs font-bold rounded-md text-slate-400 hover:text-white">Revisões</button>
              <button className="px-3 py-1 text-xs font-bold rounded-md text-slate-400 hover:text-white">Inspeções</button>
            </div>
          </div>
          <div className="bg-surface-dark rounded-2xl border border-surface-dark-lighter overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-dark-lighter/30 text-slate-400 font-medium border-b border-surface-dark-lighter">
                <tr>
                  <th className="px-6 py-4">Veículo</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Data Limite</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-dark-lighter text-slate-300">
                {activeAlerts.slice(0, 5).map(alert => (
                    <tr key={alert.id} className="hover:bg-surface-dark-lighter/10 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{alert.vehicle.make} {alert.vehicle.model}</td>
                        <td className="px-6 py-4">
                            {alert.category === 'annual' ? 'Revisão Anual' : alert.category === 'iuc' ? 'Pagamento IUC' : 'Inspeção IPO'}
                        </td>
                        <td className="px-6 py-4">{new Date(alert.date).toLocaleDateString('pt-PT')}</td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${alert.type === 'danger' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}>
                                {alert.type === 'danger' ? 'Expirado' : 'Pendente'}
                            </span>
                        </td>
                    </tr>
                ))}
                {activeAlerts.length === 0 && (
                     <tr className="hover:bg-surface-dark-lighter/10 transition-colors">
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                            Sem atividades pendentes.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
            <div className="p-4 border-t border-surface-dark-lighter flex justify-center">
              <button className="text-sm text-slate-400 hover:text-primary font-medium transition-colors">Ver todas as atividades</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
