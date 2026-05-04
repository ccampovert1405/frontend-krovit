import { useState, useEffect, useMemo, useCallback } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { ProgressBar } from 'primereact/progressbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import {
  BarChart,
  PieChart,
  Activity,
  TrendingUp,
  AlertCircle,
  Home,
  FileText,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ClipboardCheck,
  Zap,
  Star,
  Phone,
  Users,
  Search,
  MoreVertical,
  Download,
  ShieldAlert,
  Target
} from 'lucide-react';
import { Lead, Period, VendorStats } from './types';
import { normalizeVendor, VENDOR_COLOR_MAP, getDateRange, parseLeadDate } from './utils';
import { leadService } from './services';
import { jsPDF } from 'jspdf';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeflex/primeflex.css';
import './dashboard-leads.css';

const CHART_OPTIONS = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'rectRounded',
        boxWidth: 10,
        font: { size: 12, family: 'DM Sans', weight: '500' },
        padding: 20,
        color: '#4a5568'
      }
    }
  }
};

const BAR_OPTIONS = {
  ...CHART_OPTIONS,
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11, family: 'DM Sans' }, color: '#9ea3b5' }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#f0f2f5', drawBorder: false },
      ticks: { font: { size: 11, family: 'DM Sans' }, color: '#9ea3b5' }
    }
  }
};

const STACKED_BAR_OPTIONS = {
  ...CHART_OPTIONS,
  plugins: {
    ...CHART_OPTIONS.plugins,
    legend: {
      ...CHART_OPTIONS.plugins.legend,
      position: 'top' as const,
    }
  },
  scales: {
    x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ea3b5' } },
    y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, color: '#9ea3b5' } }
  }
};

const DONUT_OPTIONS = {
  ...CHART_OPTIONS,
  cutout: '68%',
  plugins: {
    ...CHART_OPTIONS.plugins,
    legend: {
      ...CHART_OPTIONS.plugins?.legend,
      display: true
    }
  }
};

// ── Helpers for data analysis (from HTML) ───────────────────────

const isVentaGanadaVeh = (r: Lead) => {
  const e = (r['Etapa'] || '').toLowerCase();
  const r1 = (r['Resultado 1ra.Llamada'] || '').toLowerCase();
  const r2 = (r['Resultado 2da.Llamada'] || '').toLowerCase();
  const eo = (r['Etapa Oportunidad'] || '').toLowerCase();
  return e.includes('ganada') || r1.includes('venta ganada') ||
    r2.includes('venta ganada') || eo.includes('ganada');
};

const isVentaGanadaViv = (r: Lead) => {
  // Viviendas specifically counts based on 'Etapa Oportunidad' according to HTML
  return (r['Etapa Oportunidad'] || '').toLowerCase().includes('ganada');
};

const isCaliente = (r: Lead) => {
  return (r['¿Tienes disponible para un pago inicial ?'] || '').includes('sí');
};

const sinGestion = (r: Lead) => {
  return !r['Resultado 1ra.Llamada'] || r['Resultado 1ra.Llamada'].trim() === '';
};

const isPremium = (r: Lead) => {
  const p = (r['¿Cuánto puedes pagar mensualmente por tu vivienda?'] || '');
  return p.includes('más_de') || p.includes('entre_$301') || p.includes('$600');
};

export default function DashboardLeadsPage() {
  const [rawVeh, setRawVeh] = useState<Lead[]>([]);
  const [rawViv, setRawViv] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(7);
  const [activeTab, setActiveTab] = useState(0);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [pdfOptions, setPdfOptions] = useState({
    kpis: true,
    vehiculos: true,
    viviendas: true,
    vendedores: true
  });
  const [pdfProgress, setPdfProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vehData, vivData] = await leadService.getAllLeads();
      setRawVeh(vehData);
      setRawViv(vivData);
      setLastUpdate(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      setError('No se pudo conectar con una o más fuentes de datos.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredVeh = useMemo(() => {
    if (period === 0) return rawVeh;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (period as number));
    cutoff.setHours(0, 0, 0, 0);

    return rawVeh.filter(r => {
      const d = parseLeadDate(r['Data created'] || r['Date created'] || '');
      return isNaN(d.getTime()) || d >= cutoff;
    });
  }, [rawVeh, period]);

  const filteredViv = useMemo(() => {
    if (period === 0) return rawViv;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (period as number));
    cutoff.setHours(0, 0, 0, 0);

    return rawViv.filter(r => {
      const d = parseLeadDate(r['Date created'] || r['Data created'] || '');
      return isNaN(d.getTime()) || d >= cutoff;
    });
  }, [rawViv, period]);

  const totalLeads: any = filteredVeh.length + filteredViv.length;
  const dateRange = getDateRange([...filteredVeh, ...filteredViv]);

  const alertCount = useMemo(() => {
    let count = 0;
    const sinGTotal = filteredVeh.filter(sinGestion).length + filteredViv.filter(sinGestion).length;
    if (sinGTotal > 0) count++;
    const premSinGest = filteredViv.filter(r => isPremium(r) && sinGestion(r)).length;
    if (premSinGest > 0) count++;
    const calientesSinGest = filteredVeh.filter(r => isCaliente(r) && sinGestion(r)).length;
    if (calientesSinGest > 0) count++;
    const sinClas = filteredVeh.filter(r => !r['Lead']).length + filteredViv.filter(r => !r['Lead']).length;
    if (sinClas > 0) count++;
    const sucios = [...filteredVeh, ...filteredViv].filter(r => /\.\s|\s{2,}/.test(r['Vendedor Asignado'] || '')).length;
    if (sucios > 0) count++;
    return count;
  }, [filteredVeh, filteredViv]);

  const generatePDF = async () => {
    setIsExporting(true);
    setPdfProgress(10);

    const doc = new jsPDF('p', 'mm', 'a4');
    const pW = 210, pH = 297, margin = 15, cW = pW - 2 * margin;
    let y = margin;

    // Header Color Box
    doc.setFillColor(13, 110, 78);
    doc.rect(0, 0, pW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Dashboard de Leads — Planifikt', margin, 17);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const sub = `Exportado el ${new Date().toLocaleString('es-EC')} · ${totalLeads} leads totales`;
    doc.text(sub, margin, 23);
    y = 38;
    setPdfProgress(30);

    if (pdfOptions.kpis) {
      const calientes = filteredVeh.filter(isCaliente).length;
      const ventas = [...filteredVeh, ...filteredViv].filter(isVentaGanadaVeh).length;
      const sinG = [...filteredVeh, ...filteredViv].filter(sinGestion).length;

      const kpis = [
        ['Vehículos', filteredVeh.length, [13, 110, 78]],
        ['Viviendas', filteredViv.length, [80, 70, 166]],
        ['Calientes', calientes, [200, 75, 31]],
        ['Ventas', ventas, [44, 110, 44]],
        ['Sin Gestión', sinG, [160, 98, 10]],
        ['Total', totalLeads, [51, 51, 51]],
      ];

      const kW = cW / 3; const kH = 18;
      kpis.forEach(([label, val, col]: any, i) => {
        const colIdx = i % 3; const rowIdx = Math.floor(i / 3);
        const kx = margin + colIdx * kW; const ky = y + rowIdx * (kH + 4);
        doc.setFillColor(col[0] as number, col[1] as number, col[2] as number);
        doc.roundedRect(kx, ky, kW - 4, kH, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16); doc.setFont('helvetica', 'bold');
        doc.text(String(val), kx + 4, ky + 11);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text(label as string, kx + 4, ky + 16);
      });
      y += 46;
    }

    const addSection = (title: string) => {
      if (y > pH - 40) { doc.addPage(); y = margin; }
      doc.setFillColor(240, 242, 245); doc.rect(margin, y, cW, 7, 'F');
      doc.setTextColor(30, 30, 30); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), margin + 3, y + 5);
      y += 10;
    };

    const addTable = (headers: string[], rows: any[][], colWidths: number[]) => {
      const rowH = 7; const hdrH = 8;
      if (y + hdrH > pH - margin) { doc.addPage(); y = margin; }
      let tx = margin;
      doc.setFillColor(80, 70, 166); doc.rect(margin, y, cW, hdrH, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      headers.forEach((h, i) => { doc.text(h, tx + 2, y + 5.5); tx += colWidths[i]; });
      y += hdrH;
      rows.slice(0, 25).forEach((row, ri) => {
        if (y + rowH > pH - margin) { doc.addPage(); y = margin; }
        if (ri % 2 === 0) { doc.setFillColor(248, 248, 252); doc.rect(margin, y, cW, rowH, 'F'); }
        doc.setDrawColor(220, 220, 230); doc.line(margin, y + rowH, margin + cW, y + rowH);
        tx = margin;
        doc.setTextColor(30, 30, 30); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        row.forEach((cell, i) => {
          const txt = String(cell || '—').slice(0, Math.floor(colWidths[i] / 2.2));
          doc.text(txt, tx + 2, y + 5);
          tx += colWidths[i];
        });
        y += rowH;
      });
      y += 4;
    };

    if (pdfOptions.vehiculos) {
      setPdfProgress(50);
      addSection('Campaña Vehículos');
      addTable(
        ['Nombre', 'Teléfono', 'Presupuesto', 'Entrada', 'Vendedor', 'Resultado'],
        filteredVeh.map(r => [
          r['Full name'], r['Phone number'],
          (r['¿Cuánto puedes pagar mensualmente por tu vehículo?'] || '').split('(')[0],
          isCaliente(r) ? 'Sí' : 'No',
          normalizeVendor(r['Vendedor Asignado']),
          r['Resultado 1ra.Llamada'] || 'Sin gestión'
        ]),
        [48, 30, 42, 16, 34, 30]
      );
    }

    if (pdfOptions.viviendas) {
      setPdfProgress(75);
      addSection('Campaña Viviendas');
      addTable(
        ['Nombre', 'Teléfono', 'Presupuesto', 'Tipo', 'Vendedor', 'Estado'],
        filteredViv.map(r => [
          r['Full name'], r['Phone number'],
          (r['¿Cuánto puedes pagar mensualmente por tu vivienda?'] || '').split('(')[0],
          (r['¿En qué estás interesado?'] || '').replace(/_/g, ' '),
          normalizeVendor(r['Vendedor Asignado']),
          r['Resultado 1ra.Llamada'] || 'Sin gestión'
        ]),
        [48, 30, 42, 20, 34, 26]
      );
    }

    // Footers for all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(248, 248, 250); doc.rect(0, pH - 12, pW, 12, 'F');
      doc.setFontSize(7.5); doc.setTextColor(120, 120, 140); doc.setFont('helvetica', 'normal');
      doc.text('Planifikt CRM — Informe de Gestión de Leads', margin, pH - 4);
      doc.text(`Pág. ${i}/${pageCount}`, pW - margin, pH - 4, { align: 'right' });
    }

    setPdfProgress(100);
    doc.save(`Planifikt_Leads_${new Date().toISOString().slice(0, 10)}.pdf`);

    setTimeout(() => {
      setIsExporting(false);
      setPdfProgress(0);
      setShowPdfModal(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-surface2">
      {/* LOADING OVERLAY */}
      {loading && rawVeh.length === 0 && (
        <div className="fixed inset-0 z-50 flex flex-column align-items-center justify-content-center bg-white-alpha-90">
          <div className="w-4rem h-4rem border-3 border-300 border-top-primary border-circle animate-spin" style={{ borderTopColor: 'var(--col-veh)' }}></div>
          <div className="mt-4 text-sm font-semibold text-700">Cargando datos en tiempo real</div>
          <div className="mt-1 text-xs text-400">Conectando con las APIs de Planifikt...</div>
        </div>
      )}

      {/* TOPBAR */}
      <header className="sticky top-0 z-5 flex align-items-center justify-content-between h-4rem px-4 bg-white border-bottom-1 border-300 shadow-1" style={{ height: '60px' }}>
        <div className="flex align-items-center gap-3">
          <div className="flex align-items-center justify-content-center w-2rem h-2rem border-round-md bg-gradient-brand text-white font-bold" style={{
            background: 'linear-gradient(135deg, var(--col-veh), var(--col-viv))',
            width: '34px', height: '34px', borderRadius: '10px', fontSize: '14px'
          }}>PL</div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-900" style={{ fontSize: '15px' }}>Planifikt</div>
            <div className="text-xs text-500" style={{ fontSize: '11px' }}>Dashboard de Leads</div>
          </div>
        </div>

        <div className="flex align-items-center gap-2 md:gap-4">
          <div className="hidden md:flex align-items-center gap-2 text-xs text-400">
            <Clock size={14} />
            <span>Actualizado {lastUpdate}</span>
          </div>
          <div className="flex align-items-center gap-2 px-3 py-1 text-xs font-medium border-round-3xl" style={{ backgroundColor: 'var(--col-ok-l)', color: 'var(--col-ok)' }}>
            <div className="w-1 h-1 border-circle animate-pulse" style={{ backgroundColor: 'var(--col-ok)', width: '7px', height: '7px' }}></div>
            <span className="hidden xs:inline">En vivo</span>
          </div>
          <Button
            icon="pi pi-refresh"
            className="p-button-rounded p-button-text p-button-plain p-button-sm"
            onClick={fetchData}
            style={{ width: '36px', height: '36px' }}
          />
          <Button
            label="Exportar PDF"
            icon="pi pi-file-pdf"
            className="hidden sm:flex border-none"
            style={{ backgroundColor: 'var(--col-veh)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px' }}
            onClick={() => setShowPdfModal(true)}
          />
        </div>
      </header>

      <main className="max-w-1280 mx-auto p-3 md:p-5">
        {error && (
          <div className="flex align-items-center gap-3 p-3 mb-4 text-sm border-round-md bg-err-l border-err text-err">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <Button label="Reintentar" className="ml-auto p-button-text p-button-sm" onClick={fetchData} />
          </div>
        )}

        {/* CONTROLS */}
        <div className="flex flex-column md:flex-row md:align-items-center justify-content-between gap-3 mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold m-0 text-900">Dashboard de Leads</h1>
            <p className="text-xs text-500 mt-1">{totalLeads} leads totales · {dateRange} · Datos en tiempo real</p>
          </div>
          <div className="flex gap-1 p-1 bg-white border-1 border-300 border-round-3xl shadow-sm" style={{ alignSelf: 'flex-start' }}>
            {[7, 14, 30, 0].map((d) => (
              <button
                key={d}
                onClick={() => setPeriod(d as Period)}
                className={`px-3 py-1 text-xs font-semibold border-round-3xl border-none cursor-pointer transition-all ${period === d
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-500 hover:bg-100'
                  }`}
                style={{
                  backgroundColor: period === d ? 'var(--col-veh)' : 'transparent',
                  color: period === d ? 'white' : 'var(--text2)',
                  minWidth: '60px'
                }}
              >
                {d === 0 ? 'Todos' : `${d} días`}
              </button>
            ))}
          </div>
        </div>

        {/* TABS */}
        <TabView
          activeIndex={activeTab}
          onTabChange={(e) => setActiveTab(e.index)}
          className="custom-tabview"
        >
          <TabPanel header="General" leftIcon="pi pi-th-large mr-2">
            <GeneralPanel filteredVeh={filteredVeh} filteredViv={filteredViv} />
          </TabPanel>
          <TabPanel header={`Vehículos (${filteredVeh.length})`} leftIcon="pi pi-car mr-2">
            <VehiculosPanel data={filteredVeh} />
          </TabPanel>
          <TabPanel header={`Viviendas (${filteredViv.length})`} leftIcon="pi pi-home mr-2">
            <ViviendasPanel data={filteredViv} />
          </TabPanel>
          <TabPanel header="Vendedores" leftIcon="pi pi-users mr-2">
            <VendedoresPanel filteredVeh={filteredVeh} filteredViv={filteredViv} />
          </TabPanel>
          <TabPanel header={
            <div className="flex align-items-center gap-2">
              <AlertTriangle size={16} />
              <span>Alertas</span>
              <span className="text-xs px-2 py-0 border-round-3xl" style={{ backgroundColor: 'var(--col-err-l)', color: 'var(--col-err)' }}>{alertCount}</span>
            </div>
          }>
            <AlertasPanel filteredVeh={filteredVeh} filteredViv={filteredViv} />
          </TabPanel>
        </TabView>
      </main>

      {/* FAB FAST EXPORT */}
      <button
        className="fixed bottom-4 right-4 w-4rem h-4rem bg-primary text-white border-round-xl shadow-4 flex align-items-center justify-content-center border-none cursor-pointer hover:shadow-6 transition-all"
        style={{ backgroundColor: 'var(--col-veh)', zIndex: 100, width: '56px', height: '56px', borderRadius: '16px' }}
        onClick={() => setShowPdfModal(true)}
        title="Exportar PDF"
      >
        <Download size={22} />
      </button>

      {/* PDF MODAL */}
      <Dialog
        header={
          <div className="flex align-items-center gap-2 text-900">
            <FileText size={20} className="text-primary" />
            <span>Exportar Informe PDF</span>
          </div>
        }
        visible={showPdfModal}
        onHide={() => setShowPdfModal(false)}
        className="w-11 md:w-5 lg:w-4"
        style={{ borderRadius: '24px' }}
        footer={
          <div className="flex justify-content-end gap-2 pt-3">
            <Button label="Cancelar" className="p-button-text p-button-sm text-500" onClick={() => setShowPdfModal(false)} />
            <Button
              label={isExporting ? "Generando..." : "Descargar PDF"}
              icon="pi pi-download"
              className="border-none p-button-sm"
              style={{ backgroundColor: 'var(--col-veh)', borderRadius: '8px' }}
              onClick={generatePDF}
              disabled={isExporting}
            />
          </div>
        }
      >
        <p className="mt-0 mb-4 text-sm text-500">Selecciona las secciones a incluir en el informe profesional para gerencia.</p>
        <div className="flex flex-column gap-2 mb-4">
          {[
            { id: 'kpis', label: 'Resumen Ejecutivo', sub: 'Métricas generales, KPIs y totales' },
            { id: 'vehiculos', label: 'Campaña Vehículos', sub: 'Leads, ciudades y leads calientes' },
            { id: 'viviendas', label: 'Campaña Viviendas', sub: 'Leads premium, tipos y distribución' },
            { id: 'vendedores', label: 'Análisis Vendedores', sub: 'Eficacia de gestión y carga de trabajo' }
          ].map((item) => (
            <div
              key={item.id}
              className={`flex align-items-center gap-3 p-3 border-1 border-round-md cursor-pointer transition-all ${(pdfOptions as any)[item.id] ? 'border-primary bg-primary-reverse' : 'border-300 hover:bg-100'}`}
              style={{ borderRadius: '12px' }}
              onClick={() => setPdfOptions({ ...pdfOptions, [item.id as keyof typeof pdfOptions]: !pdfOptions[item.id as keyof typeof pdfOptions] })}
            >
              <Checkbox checked={(pdfOptions as any)[item.id]} onChange={() => { }} />
              <div>
                <div className="text-sm font-bold text-800">{item.label}</div>
                <div className="text-xs text-500">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
        {isExporting && <ProgressBar value={pdfProgress} className="h-1" style={{ height: '4px' }} />}
      </Dialog>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function KPICard({ value, label, icon, trend, type, trendColor }: { value: any, label: string, icon: string, trend?: string, type: string, trendColor?: string }) {
  return (
    <div className={`kpi-card ${type}`}>
      <div className="kpi-icon-row flex justify-content-between align-items-start mb-2">
        <div className="text-xl" style={{ fontSize: '24px' }}>{icon}</div>
        {trend && (
          <div className="text-xs px-2 py-1 border-round-2xl font-bold" style={{ backgroundColor: 'rgba(0,0,0,0.03)', color: trendColor || '#718096' }}>
            {trend}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold line-height-1 mb-1 text-900 tracking-tight" style={{ fontSize: '28px' }}>{value}</div>
      <div className="text-xs font-semibold text-500 uppercase tracking-wider" style={{ fontSize: '11px' }}>{label}</div>
    </div>
  );
}

function GeneralPanel({ filteredVeh, filteredViv }: { filteredVeh: Lead[], filteredViv: Lead[] }) {
  const calientes = filteredVeh.filter(isCaliente).length;
  const totalLeads: any = filteredVeh.length + filteredViv.length;
  const ventasVeh = filteredVeh.filter(isVentaGanadaVeh).length;
  const ventasViv = filteredViv.filter(isVentaGanadaViv).length;
  const ventas = ventasVeh + ventasViv;
  const sinGTotal = filteredVeh.filter(sinGestion).length + filteredViv.filter(sinGestion).length;
  // ... (rest of the calculation logic)

  const allDates = [...filteredVeh, ...filteredViv].map(r => parseLeadDate(r['Data created'] || r['Date created'] || '')).filter(d => !isNaN(d.getTime()));
  const days = allDates.length ? Math.max(1, Math.ceil((Math.max(...allDates.map(d => d.getTime())) - Math.min(...allDates.map(d => d.getTime()))) / 86400000) + 1) : 1;
  const avg = Math.round((filteredVeh.length + filteredViv.length) / days);

  // Chart: leads por día (Últimos 7 días - Stacked)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dayMapVeh: Record<string, number> = {};
  const dayMapViv: Record<string, number> = {};

  filteredVeh.forEach(r => {
    const d = parseLeadDate(r['Data created'] || r['Date created'] || '');
    if (!isNaN(d.getTime())) {
      const k = d.toISOString().split('T')[0];
      dayMapVeh[k] = (dayMapVeh[k] || 0) + 1;
    }
  });

  filteredViv.forEach(r => {
    const d = parseLeadDate(r['Data created'] || r['Date created'] || '');
    if (!isNaN(d.getTime())) {
      const k = d.toISOString().split('T')[0];
      dayMapViv[k] = (dayMapViv[k] || 0) + 1;
    }
  });

  const displayLabels = last7Days.map(k => {
    const [y, m, d] = k.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }).replace('.', '');
  });

  const diarioData = {
    labels: displayLabels,
    datasets: [
      { label: 'Vehículos', data: last7Days.map(k => dayMapVeh[k] || 0), backgroundColor: '#0D6E4E', borderRadius: 4 },
      { label: 'Viviendas', data: last7Days.map(k => dayMapViv[k] || 0), backgroundColor: '#5046A6', borderRadius: 4 }
    ]
  };

  const mixData = {
    labels: ['Vehículos', 'Viviendas'],
    datasets: [{
      data: [filteredVeh.length, filteredViv.length],
      backgroundColor: ['#0D6E4E', '#5046A6'],
      borderWidth: 2, borderColor: '#fff'
    }]
  };

  const estadoData = {
    labels: ['Hot (Entrada)', 'Tibios', 'Fríos', 'Sin Clasif.'],
    datasets: [{
      data: [
        filteredVeh.filter(isCaliente).length,
        filteredVeh.filter(r => (r['Lead'] || '').toLowerCase() === 'tibio').length,
        filteredVeh.filter(r => (r['Lead'] || '').toLowerCase() === 'frio').length,
        Math.max(0, filteredVeh.length - filteredVeh.filter(isCaliente).length - filteredVeh.filter(r => (r['Lead'] || '').toLowerCase() === 'tibio').length - filteredVeh.filter(r => (r['Lead'] || '').toLowerCase() === 'frio').length)
      ],
      backgroundColor: ['#C84B1F', '#A0620A', '#1565C0', '#9EA3B5'],
      borderWidth: 2, borderColor: '#fff'
    }]
  };

  const ciudades: Record<string, number> = {};
  [...filteredVeh, ...filteredViv].forEach(r => {
    const c = (r['¿En qué ciudad vives?'] || 'otra').replace(/_/g, ' ');
    ciudades[c] = (ciudades[c] || 0) + 1;
  });
  const topCiudades = Object.entries(ciudades).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const ciudadData = {
    labels: topCiudades.map(x => x[0]),
    datasets: [{
      data: topCiudades.map(x => x[1]),
      backgroundColor: '#5046A6',
      borderRadius: 4
    }]
  };

  return (
    <div className="panel animate-in">
      <div className="grid grid-nogutter mb-4" style={{ gap: '12px' }}>
        <div className="col-12 md:col-4 lg:col-2 flex-grow-1 min-w-[160px]"><KPICard icon="🚗" value={filteredVeh.length} label="Leads vehicc" trend={`~${Math.round(filteredVeh.length / days)}/d`} type="veh" trendColor="var(--col-ok)" /></div>
        <div className="col-12 md:col-4 lg:col-2 flex-grow-1 min-w-[160px]"><KPICard icon="🏠" value={filteredViv.length} label="Leads viviendas" trend={`~${Math.round(filteredViv.length / days)}/d`} type="viv" trendColor="var(--col-ok)" /></div>
        <div className="col-12 md:col-4 lg:col-2 flex-grow-1 min-w-[160px]"><KPICard icon="🔥" value={calientes} label="Hot (Entrada)" trend={`${Math.round(calientes / (filteredVeh.length || 1) * 100)}%`} type="hot" trendColor="var(--col-hot)" /></div>
        <div className="col-12 md:col-4 lg:col-2 flex-grow-1 min-w-[160px]"><KPICard icon="🏆" value={ventas} label="Ventas confirmadas" trend="¡Top Conversión!" type="ok" trendColor="var(--col-ok)" /></div>
        <div className="col-12 md:col-4 lg:col-2 flex-grow-1 min-w-[160px]"><KPICard icon="⚠️" value={sinGTotal} label="Sin Gestión" trend={`${Math.round(sinGTotal / (totalLeads || 1) * 100)}%`} type="warn" trendColor="var(--col-err)" /></div>
        <div className="col-12 md:col-4 lg:col-2 flex-grow-1 min-w-[160px]"><KPICard icon="📅" value={`~${avg}`} label="Total día" trend="Sostenido" type="default" trendColor="var(--text3)" /></div>
      </div>

      <div className="grid">
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><BarChart size={16} /> Leads por día — Mix Campañas</div>
            <div className="chart-container"><Chart type="bar" data={diarioData} options={STACKED_BAR_OPTIONS} /></div>
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><PieChart size={16} /> Presupuesto por Campaña</div>
            <div className="chart-container"><Chart type="doughnut" data={mixData} options={DONUT_OPTIONS} /></div>
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><Target size={16} /> Clasificación Leads Vehículos</div>
            <div className="chart-container"><Chart type="doughnut" data={estadoData} options={DONUT_OPTIONS} /></div>
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><MapPin size={16} /> Distribución Geográfica</div>
            <div className="chart-container"><Chart type="bar" data={ciudadData} options={{ ...BAR_OPTIONS, indexAxis: 'y', plugins: { ...BAR_OPTIONS.plugins, legend: { display: false } } }} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehiculosPanel({ data }: { data: Lead[] }) {
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string | null>(null);

  const hot = data.filter(isCaliente);
  const sinG = data.filter(sinGestion).length;
  const ganadas = data.filter(isVentaGanadaVeh).length;

  const presMap: Record<string, number> = {};
  data.forEach(r => {
    const p = (r['¿Cuánto puedes pagar mensualmente por tu vehículo?'] || '').replace(/_/g, ' ').replace(/\(.*\)/g, '').trim();
    if (p) presMap[p] = (presMap[p] || 0) + 1;
  });
  const sortedPres = Object.entries(presMap).sort((a, b) => b[1] - a[1]);

  const ciudadesVeh: Record<string, number> = {};
  data.forEach(r => {
    const c = (r['¿En qué ciudad vives?'] || 'Otra').replace(/_/g, ' ').trim();
    ciudadesVeh[c] = (ciudadesVeh[c] || 0) + 1;
  });
  const topC = Object.entries(ciudadesVeh).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const filteredData = data.filter(r => {
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matchesSearch = normalize(JSON.stringify(r)).includes(normalize(search));
    const matchesVendor = !vendorFilter || normalizeVendor(r['Vendedor Asignado']) === vendorFilter;
    return matchesSearch && matchesVendor;
  });

  const vendors = Array.from(new Set(data.map(r => normalizeVendor(r['Vendedor Asignado'])))).sort();

  return (
    <div className="panel animate-in">
      <div className="grid grid-nogutter mb-4" style={{ gap: '12px' }}>
        <div className="col-12 md:col-3 flex-grow-1"><KPICard icon="🚗" value={data.length} label="Leads Totales" type="veh" /></div>
        <div className="col-12 md:col-3 flex-grow-1"><KPICard icon="📵" value={sinG} label="Sin Gestión" type="err" trend={`${Math.round(sinG / (data.length || 1) * 100)}%`} trendColor="var(--col-err)" /></div>
        <div className="col-12 md:col-3 flex-grow-1"><KPICard icon="🏆" value={ganadas} label="Ganadas" type="ok" trend="¡Éxito!" trendColor="var(--col-ok)" /></div>
        <div className="col-12 md:col-3 flex-grow-1"><KPICard icon="🔥" value={hot.length} label="Con Entrada" type="hot" trend={`${Math.round(hot.length / (data.length || 1) * 100)}%`} trendColor="var(--col-hot)" /></div>
      </div>

      <div className="grid">
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><DollarSign size={16} /> Distribución de Presupuesto</div>
            <div className="flex flex-column gap-2 mt-2">
              {sortedPres.map(([k, v]) => (
                <div key={k} className="progress-row">
                  <div className="text-sm font-semibold min-w-[140px] text-700">{k.replace('hasta ', '≤').replace('entre ', '')}</div>
                  <div className="flex-1 h-2 bg-100 border-round-3xl overflow-hidden" style={{ height: '8px' }}>
                    <div className="h-full border-round-3xl transition-width duration-500" style={{ width: `${Math.round(v / data.length * 100)}%`, backgroundColor: 'var(--col-veh)' }}></div>
                  </div>
                  <div className="text-sm font-bold min-w-[32px] text-right text-900">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><MapPin size={16} /> Ciudad del Lead — Vehículos</div>
            <div className="chart-container">
              <Chart type="doughnut" data={{ labels: topC.map(x => x[0]), datasets: [{ data: topC.map(x => x[1]), backgroundColor: ['#0D6E4E', '#A0620A', '#1565C0', '#C84B1F', '#5046A6', '#9EA3B5'] }] }} options={DONUT_OPTIONS} />
            </div>
          </div>
        </div>
      </div>

      <div className="card-custom">
        <div className="card-title-custom text-hot"><Zap size={16} /> Leads calientes — acción inmediata</div>
        <DataTable value={hot.slice(0, 15)} className="text-xs custom-table" responsiveLayout="scroll">
          <Column field="Full name" header="Nombre" body={(r) => <span className="font-bold text-900">{r['Full name'] || '—'}</span>} />
          <Column field="Phone number" header="Teléfono" body={(r) => <span className="font-mono text-500">{r['Phone number'] || '—'}</span>} />
          <Column header="Presupuesto" body={(r) => <span className="badge badge-veh">{(r['¿Cuánto puedes pagar mensualmente por tu vehículo?'] || '').split('(')[0].replace('hasta ', '≤').trim()}</span>} />
          <Column header="Vendedor" body={(r) => <span className="text-500">{normalizeVendor(r['Vendedor Asignado'])}</span>} />
          <Column header="Estado" body={(r) => {
            const res = r['Resultado 2da.Llamada'] || r['Resultado 1ra.Llamada'] || 'Sin gestión';
            return sinGestion(r)
              ? <span className="badge badge-err">Sin gestión</span>
              : <span className="badge badge-info">{res.slice(0, 25)}</span>;
          }} />
        </DataTable>
      </div>

      <div className="card-custom">
        <div className="flex flex-column md:flex-row justify-content-between gap-3 mb-4">
          <div className="card-title-custom mb-0"><ClipboardCheck size={16} /> Todos los leads <span className="badge badge-veh ml-2 font-bold">{data.length}</span></div>
          <div className="flex gap-2 flex-wrap">
            <span className="p-input-icon-left flex-1 min-w-[200px]">
              <i className="pi pi-search" />
              <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nombre, telf..." className="p-inputtext-sm w-full border-round-lg" />
            </span>
            <Dropdown value={vendorFilter} options={vendors} onChange={(e) => setVendorFilter(e.value)} placeholder="Vendedor" className="p-inputtext-sm border-round-lg w-full md:w-auto" style={{ minWidth: '180px' }} showClear />
          </div>
        </div>
        <DataTable value={filteredData} paginator rows={10} className="text-xs custom-table" responsiveLayout="scroll">
          <Column field="Full name" header="Nombre" body={(r) => <span className="font-bold text-900">{r['Full name'] || '—'}</span>} />
          <Column field="Phone number" header="Teléfono" body={(r) => <span className="font-mono text-500">{r['Phone number'] || '—'}</span>} />
          <Column header="Ciudad" body={(r) => <span className="text-500">{(r['¿En qué ciudad vives?'] || '').replace(/_/g, ' ')}</span>} />
          <Column header="Mensualidad" body={(r) => <span className="text-500" style={{ fontSize: '12px' }}>{(r['¿Cuánto puedes pagar mensualmente por tu vehículo?'] || '').split('(')[0].replace('hasta ', '≤').trim()}</span>} />
          <Column header="Entrada" body={(r) => isCaliente(r) ? <span className="badge badge-ok">Sí</span> : <span className="badge badge-neu">No</span>} />
          <Column header="Vendedor" body={(r) => <span className="text-500">{normalizeVendor(r['Vendedor Asignado'])}</span>} />
          <Column header="Clasificación" body={(r) => {
            const lead = (r['Lead'] || '').toLowerCase();
            const isHot = lead === 'caliente' || isCaliente(r);
            const isWarm = lead === 'tibio';
            const isCold = lead === 'frio';

            let cls = 'badge-neu', lbl = r['Lead'] || 'Sin clasificar';
            if (isHot) { cls = 'badge-hot'; lbl = isCaliente(r) ? 'Con Entrada' : lbl; }
            else if (isWarm) cls = 'badge-warm';
            else if (isCold) cls = 'badge-cold';

            return <span className={`badge ${cls}`}>{lbl}</span>;
          }} />
        </DataTable>
      </div>
    </div>
  );
}

function ViviendasPanel({ data }: { data: Lead[] }) {
  const [search, setSearch] = useState('');

  const ganadas = data.filter(isVentaGanadaViv).length;
  const sinG = data.filter(sinGestion).length;
  const premium = data.filter(isPremium);

  const tipos: Record<string, number> = {};
  data.forEach(r => {
    let t = (r['¿En qué estás interesado?'] || 'Otro').replace(/_/g, ' ').trim();
    if (t.includes('quiero')) t = 'Solo info';
    tipos[t] = (tipos[t] || 0) + 1;
  });

  const presViv: Record<string, number> = {};
  data.forEach(r => {
    let p = (r['¿Cuánto puedes pagar mensualmente por tu vivienda?'] || '').replace(/_/g, ' ');
    p = p.replace('hasta ', '≤').replace('entre ', '').split('(')[0].trim();
    if (p) presViv[p] = (presViv[p] || 0) + 1;
  });

  const filteredData = data.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="panel animate-in">
      <div className="grid grid-nogutter mb-4" style={{ gap: '12px' }}>
        <div className="col-12 md:col-3 flex-grow-1"><KPICard icon="🏠" value={data.length} label="Registros Totales" type="viv" /></div>
        <div className="col-12 md:col-3 flex-grow-1"><KPICard icon="🏆" value={ganadas} label="Ventas Confirm." type="ok" trendColor="var(--col-ok)" /></div>
        <div className="col-12 md:col-3 flex-grow-1"><KPICard icon="📵" value={sinG} label="Sin Atención" type="err" trend={`${Math.round(sinG / (data.length || 1) * 100)}%`} trendColor="var(--col-err)" /></div>
        <div className="col-12 md:col-3 flex-grow-1"><KPICard icon="💎" value={premium.length} label="Premium +$300" type="hot" trendColor="var(--col-hot)" /></div>
      </div>

      <div className="grid">
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><Home size={16} /> Interés de Vivienda</div>
            <div className="chart-container">
              <Chart type="doughnut" data={{ labels: Object.keys(tipos), datasets: [{ data: Object.values(tipos), backgroundColor: ['#5046A6', '#C84B1F', '#0D6E4E', '#BA7517', '#1565C0'] }] }} options={DONUT_OPTIONS} />
            </div>
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><DollarSign size={16} /> Presupuesto Vivienda</div>
            <div className="chart-container">
              <Chart type="doughnut" data={{ labels: Object.keys(presViv), datasets: [{ data: Object.values(presViv), backgroundColor: ['#5046A6', '#C84B1F', '#0D6E4E', '#BA7517'] }] }} options={DONUT_OPTIONS} />
            </div>
          </div>
        </div>
      </div>

      <div className="card-custom">
        <div className="card-title-custom text-err"><AlertCircle size={16} className="text-err" /> Leads premium sin gestión — HOY</div>
        <DataTable value={premium.filter(sinGestion).slice(0, 15)} className="text-xs custom-table" responsiveLayout="scroll">
          <Column field="Full name" header="Nombre" body={(r) => <span className="font-bold text-900">{r['Full name'] || '—'}</span>} />
          <Column field="Phone number" header="Teléfono" body={(r) => <span className="font-mono text-500">{r['Phone number'] || '—'}</span>} />
          <Column header="Presupuesto" body={(r) => <span className="badge badge-viv">{(r['¿Cuánto puedes pagar mensualmente por tu vivienda?'] || '').split('(')[0].replace('más_de ', '+').trim()}</span>} />
          <Column header="Vendedor" body={(r) => <span className="text-500">{normalizeVendor(r['Vendedor Asignado'])}</span>} />
          <Column header="Estado" body={() => <span className="badge badge-err">SIN GESTIÓN</span>} />
        </DataTable>
      </div>

      <div className="card-custom">
        <div className="flex flex-column md:flex-row justify-content-between gap-3 mb-4">
          <div className="card-title-custom mb-0"><ClipboardCheck size={16} /> Todos los leads viviendas <span className="badge badge-viv ml-2 font-bold">{data.length}</span></div>
          <span className="p-input-icon-left w-full md:w-20rem">
            <i className="pi pi-search" />
            <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="p-inputtext-sm w-full border-round-lg" />
          </span>
        </div>
        <DataTable value={filteredData} paginator rows={10} className="text-xs custom-table" responsiveLayout="scroll">
          <Column field="Full name" header="Nombre" body={(r) => <span className="font-bold text-900">{r['Full name'] || '—'}</span>} />
          <Column field="Phone number" header="Teléfono" body={(r) => <span className="font-mono text-500">{r['Phone number'] || '—'}</span>} />
          <Column header="Ciudad" body={(r) => <span className="text-500">{(r['¿En qué ciudad vives?'] || '').replace(/_/g, ' ')}</span>} />
          <Column header="Presupuesto" body={(r) => <span className="text-500" style={{ fontSize: '11px' }}>{(r['¿Cuánto puedes pagar mensualmente por tu vivienda?'] || '').split('(')[0].trim()}</span>} />
          <Column header="Interés" body={(r) => <span className="text-500">{(r['¿En qué estás interesado?'] || '—').replace(/_/g, ' ')}</span>} />
          <Column header="Vendedor" body={(r) => <span className="text-500">{normalizeVendor(r['Vendedor Asignado'])}</span>} />
          <Column header="Estado" body={(r) => {
            const sinG = sinGestion(r);
            return sinG ? <span className="badge badge-err">Sin atención</span> : <span className="badge badge-ok">{(r['Resultado 1ra.Llamada'] || '').slice(0, 20)}</span>;
          }} />
        </DataTable>
      </div>
    </div>
  );
}

function VendedoresPanel({ filteredVeh, filteredViv }: { filteredVeh: Lead[], filteredViv: Lead[] }) {
  const allLeads = [
    ...filteredVeh.map(r => ({ ...r, _tipo: 'veh' as const })),
    ...filteredViv.map(r => ({ ...r, _tipo: 'viv' as const }))
  ];

  const byVendor: Record<string, VendorStats & { ganadas: number }> = {};
  allLeads.forEach(r => {
    const v = normalizeVendor(r['Vendedor Asignado']);
    if (!byVendor[v]) byVendor[v] = { total: 0, veh: 0, viv: 0, gestionados: 0, calientes: 0, ganadas: 0 };
    byVendor[v].total++;
    if (r._tipo === 'veh') byVendor[v].veh++;
    else byVendor[v].viv++;
    if (!sinGestion(r)) byVendor[v].gestionados++;
    if (isCaliente(r)) byVendor[v].calientes++;
    if (isVentaGanadaVeh(r)) byVendor[v].ganadas++;
  });

  const mainVendors = Object.entries(byVendor).filter(([k]) => k !== 'Sin asignar').sort((a, b) => b[1].total - a[1].total);
  const vNames = mainVendors.map(x => x[0].split(' ')[0]);

  const assignedData = {
    labels: vNames,
    datasets: [{
      label: 'Total leads',
      data: mainVendors.map(x => x[1].total),
      backgroundColor: mainVendors.map(x => VENDOR_COLOR_MAP[x[0]] || '#9EA3B5'),
      borderRadius: 4
    }]
  };

  const mixData = {
    labels: vNames,
    datasets: [
      { label: 'Vehículos', data: mainVendors.map(x => x[1].veh), backgroundColor: '#0D6E4E', borderRadius: 4 },
      { label: 'Viviendas', data: mainVendors.map(x => x[1].viv), backgroundColor: '#5046A6', borderRadius: 4 }
    ]
  };

  return (
    <div className="panel animate-in">
      <div className="grid gap-3 mb-4">
        {mainVendors.map(([name, s]) => {
          const pct = Math.round(s.gestionados / s.total * 100) || 0;
          const col = VENDOR_COLOR_MAP[name] || '#9EA3B5';
          return (
            <div key={name} className="col-12 md:col-6 lg:col-3">
              <div className="vendor-card" style={{ borderTopColor: col }}>
                <div className="flex align-items-center justify-content-center mb-3 text-sm font-bold text-white shadow-sm" style={{ backgroundColor: col, width: '40px', height: '40px', borderRadius: '12px' }}>
                  {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="text-sm font-bold text-900 mb-1">{name}</div>
                <div className="text-xs text-500 mb-3">{s.veh} veh · {s.viv} viv</div>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 text-center bg-surface2 border-round-md py-2">
                    <div className="text-md font-bold text-900">{s.total}</div>
                    <div className="text-xs text-500">Total</div>
                  </div>
                  <div className="flex-1 text-center bg-surface2 border-round-md py-2">
                    <div className="text-md font-bold text-hot">{s.calientes}</div>
                    <div className="text-xs text-500">Hot</div>
                  </div>
                  <div className="flex-1 text-center bg-surface2 border-round-md py-2">
                    <div className="text-md font-bold text-ok">{s.ganadas}</div>
                    <div className="text-xs text-500">Ganadas</div>
                  </div>
                </div>
                <div className="flex justify-content-between text-xs font-bold text-600 mb-1 px-1">
                  <span>Eficacia</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1 bg-200 border-round-3xl overflow-hidden" style={{ height: '4px' }}>
                  <div className="h-full border-round-3xl" style={{ width: `${pct}%`, backgroundColor: col }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid">
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><BarChart size={16} /> Leads Asignados</div>
            <div className="chart-container"><Chart type="bar" data={assignedData} options={{ ...CHART_OPTIONS, plugins: { ...CHART_OPTIONS.plugins, legend: { display: false } } }} /></div>
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><Activity size={16} /> Vehículos vs Viviendas por Asesor</div>
            <div className="chart-container"><Chart type="bar" data={mixData} options={CHART_OPTIONS} /></div>
          </div>
        </div>
      </div>

      <div className="card-custom">
        <div className="card-title-custom"><Star size={16} /> Ranking de Eficacia Operativa</div>
        <div className="flex flex-column gap-2 mt-3">
          {mainVendors.map(([name, s]) => {
            const pct = Math.round(s.gestionados / s.total * 100) || 0;
            const col = VENDOR_COLOR_MAP[name] || '#9EA3B5';
            const maxTotal = Math.max(...mainVendors.map(x => x[1].total), 1);
            return (
              <div key={name} className="progress-row py-3">
                <div className="text-sm font-bold min-w-[150px] text-800">{name.split(' ')[0]} <span className="text-500 font-normal" style={{ fontSize: '11px' }}>{name.split(' ').slice(1).join(' ')}</span></div>
                <div className="flex-1 h-2 bg-100 border-round-3xl overflow-hidden" style={{ height: '8px' }}>
                  <div className="h-full border-round-3xl transition-width duration-700" style={{ width: `${Math.round(s.total / maxTotal * 100)}%`, backgroundColor: col }}></div>
                </div>
                <div className="text-xs font-bold text-600 min-w-[90px] text-right">{s.gestionados} atendidos</div>
                <div className="min-w-[60px] text-right">
                  <span className={`badge ${pct < 50 ? 'badge-err' : 'badge-ok'}`}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AlertasPanel({ filteredVeh, filteredViv }: { filteredVeh: Lead[], filteredViv: Lead[] }) {
  const totalLeads = filteredVeh.length + filteredViv.length;

  const sinGTotal = filteredVeh.filter(sinGestion).length + filteredViv.filter(sinGestion).length;
  const premiumSinG = filteredViv.filter(r => isPremium(r) && sinGestion(r));
  const calientesSinG = filteredVeh.filter(r => isCaliente(r) && sinGestion(r));
  const sinClas = [...filteredVeh, ...filteredViv].filter(r => !r['Lead']);
  const ventas = [...filteredVeh, ...filteredViv].filter(isVentaGanadaVeh);

  const sucios = [...filteredVeh, ...filteredViv].filter(r => /\.\s|\s{2,}/.test(r['Vendedor Asignado'] || ''));
  const existentes = [...filteredVeh, ...filteredViv].filter(r => (r['Resultado 1ra.Llamada'] || '').toLowerCase().includes('contrato con planifikt'));

  // Get top vendor
  const vMap: Record<string, number> = {};
  [...filteredVeh, ...filteredViv].forEach(r => {
    const v = normalizeVendor(r['Vendedor Asignado']);
    if (v !== 'Sin asignar') vMap[v] = (vMap[v] || 0) + 1;
  });
  const topV = Object.entries(vMap).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="panel animate-in">
      {/* ALERTAS CRÍTICAS */}
      <h3 className="text-xs font-bold text-500 uppercase tracking-widest mb-3 mt-0 flex align-items-center gap-2">
        <ShieldAlert size={16} className="text-err" /> Alertas Críticas de Operación
      </h3>

      {sinGTotal > 0 && (
        <AlertItem
          type="err" icon={<Phone size={18} />} title="Leads sin gestión acumulados"
          desc={`${sinGTotal} leads sin ninguna llamada registrada (${Math.round(sinGTotal / Math.max(totalLeads, 1) * 100)}% del total). Atención prioritaria requerida.`}
        />
      )}

      {premiumSinG.length > 0 && (
        <AlertItem
          type="err" icon={<Star size={18} />} title="Leads Premium +$300 sin contacto"
          desc={`${premiumSinG.length} leads de viviendas con alto presupuesto mensuales sin atención. Representan el mayor retorno potencial.`}
        />
      )}

      {calientesSinG.length > 0 && (
        <AlertItem
          type="err" icon={<Activity size={18} />} title="Calientes con entrada sin llamar"
          desc={`${calientesSinG.length} prospectos listos para pagar entrada en vehículos siguen sin recibir la primera llamada.`}
        />
      )}

      {sucios.length > 0 && (
        <AlertItem
          type="warn" icon={<Users size={18} />} title="Nombres de vendedores con errores"
          desc={`Se detectaron ${sucios.length} registros con nombres de asesores mal formateados (ej. con puntos o espacios extras). Corregir en CRM.`}
        />
      )}

      {existentes.length > 0 && (
        <AlertItem
          type="warn" icon={<AlertCircle size={18} />} title="Clientes existentes en flujo"
          desc={`${existentes.length} leads ya tienen contrato previo. Deben ser excluidos de las listas de llamadas de prospección.`}
        />
      )}

      {sinClas.length > 0 && (
        <AlertItem
          type="warn" icon={<MoreVertical size={18} />} title="Leads sin clasificar"
          desc={`${sinClas.length} registros sin etiqueta (Caliente/Tibio/Frío). Imposible priorizar la gestión sin clasificación.`}
        />
      )}

      {/* OPORTUNIDADES */}
      <h3 className="text-xs font-bold text-500 uppercase tracking-widest mt-5 mb-3 flex align-items-center gap-2">
        <Lightbulb size={16} className="text-ok" /> Oportunidades de Crecimiento
      </h3>

      {ventas.length > 0 && (
        <AlertItem
          type="ok" icon={<CheckCircle2 size={18} />} title={`${ventas.length} Ventas Ganadas en el período`}
          desc={`Tasa de conversión actual del ${Math.round(ventas.length / totalLeads * 100)}%. Analizar el proceso de estos cierres para replicarlo.`}
        />
      )}

      {filteredViv.length > filteredVeh.length * 0.3 && (
        <AlertItem
          type="ok" icon={<TrendingUp size={18} />} title="Crecimiento Acelerado en Viviendas"
          desc={`${filteredViv.length} leads vs ${filteredVeh.length} en vehículos. Los datos sugieren oportunidad para escalar pauta en viviendas.`}
        />
      )}

      {topV && (
        <AlertItem
          type="ok" icon={<Target size={18} />} title="Asesor con Mayor Productividad"
          desc={`${topV[0]} lidera la recepción de leads con ${topV[1]} asignados. Verificar calidad de respuesta.`}
        />
      )}

      {/* PLAN DE ACCIÓN */}
      <h3 className="text-xs font-bold text-500 uppercase tracking-widest mt-5 mb-3 flex align-items-center gap-2">
        <ClipboardCheck size={16} className="text-info" /> Plan de Acción Propuesto
      </h3>

      <AlertItem
        type="info" icon={<Phone size={18} />} title="HOY — Gestión Masiva Pendientes"
        desc={`Liquidar la cola de ${sinGTotal} leads sin gestión, empezando por los ${premiumSinG.length} premium y ${calientesSinG.length} calientes.`}
      />

      <AlertItem
        type="info" icon={<Zap size={18} />} title="48h — Activación Bot de Respuesta (Zolutium)"
        desc="Implementar respuesta automática por WhatsApp para reducir el tiempo de primer contacto a menos de 1 minuto."
      />

      <AlertItem
        type="info" icon={<Search size={18} />} title="Esta Semana — Auditoría de Datos"
        desc="Estandarizar nombres de vendedores y clasificar los leads pendientes para optimizar los reportes gerenciales."
      />
    </div>
  );
}

function AlertItem({ type, icon, title, desc }: { type: 'err' | 'warn' | 'ok' | 'info', icon: React.ReactNode, title: string, desc: string }) {
  const configs = {
    err: { bg: 'var(--col-err-l)', border: 'var(--col-err)', color: '#5d1212', iconCol: 'var(--col-err)' },
    warn: { bg: 'var(--col-warn-l)', border: 'var(--col-warn)', color: '#4a2d00', iconCol: 'var(--col-warn)' },
    ok: { bg: 'var(--col-ok-l)', border: 'var(--col-ok)', color: '#1a3d1a', iconCol: 'var(--col-ok)' },
    info: { bg: 'var(--col-info-l)', border: 'var(--col-info)', color: '#0d3472', iconCol: 'var(--col-info)' },
  };
  const c = configs[type];

  return (
    <div className="alert-custom border-1 shadow-sm mb-3 animate-in" style={{ backgroundColor: c.bg, borderColor: c.border, color: c.color }}>
      <div className="shrink-0 mt-1" style={{ color: c.iconCol }}>{icon}</div>
      <div>
        <div className="font-bold text-sm md:text-base mb-1">{title}</div>
        <div className="text-xs md:text-sm line-height-3 opacity-90">{desc}</div>
      </div>
    </div>
  );
}
