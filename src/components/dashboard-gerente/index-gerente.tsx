import { useState, useEffect, useMemo } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { ProgressBar } from 'primereact/progressbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
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
  Users,
  Ban,
  Phone,
  Pencil,
  Tag,
  ArrowLeftRight,
  Trophy,
  UserX,
  RefreshCcw,
  type LucideIcon
} from 'lucide-react';
import { Lead, Period, VendorStats } from './types';
import { normalizeVendor, getDateRange, parseLeadDate } from './utils';
import { leadService } from './services';
import { jsPDF } from 'jspdf';
import 'primeicons/primeicons.css';
import './dashboard-gerente.css';

const BAR_OPTIONS = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11, family: 'DM Sans' }, color: '#9ea3b5' }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#f0f2f5' },
      ticks: { font: { size: 11, family: 'DM Sans' }, color: '#9ea3b5' }
    }
  }
};

const STACKED_BAR_OPTIONS = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { font: { size: 11, family: 'DM Sans' }, boxWidth: 10 }
    }
  },
  scales: {
    x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ea3b5' } },
    y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, color: '#9ea3b5' } }
  }
};

const DONUT_OPTIONS = {
  maintainAspectRatio: false,
  responsive: true,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        boxWidth: 10,
        font: { size: 11, family: 'DM Sans' },
        padding: 8,
        color: '#5A5F72'
      }
    }
  }
};

const VENDOR_COLORS = ['#1565C0', '#0D6E4E', '#BA7517', '#C84B1F'];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function DashboardGerentePage() {
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

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredVeh = useMemo(() => {
    if (period === 0) return rawVeh;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    return rawVeh.filter(r => {
      const d = parseLeadDate(r['Date created'] || r['Data created'] || '');
      return isNaN(d.getTime()) || d >= cutoff;
    });
  }, [rawVeh, period]);

  const filteredViv = useMemo(() => {
    if (period === 0) return rawViv;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    return rawViv.filter(r => {
      const d = parseLeadDate(r['Date created'] || r['Data created'] || '');
      const ventas_viv = rawViv.filter(r => (r['Etapa Oportunidad'] || '').toLowerCase().includes('ganada')).length;
      console.log('ventas_viv', ventas_viv);
      return isNaN(d.getTime()) || d >= cutoff;
    });
  }, [rawViv, period]);

  const totalLeads = filteredVeh.length + filteredViv.length;
  const dateRange = getDateRange([...filteredVeh, ...filteredViv]);

  // Alert count for tab badge
  const alertCount = useMemo(() => {
    let count = 0;
    if (filteredViv.filter(r => !r['Resultado 1ra.Llamada'] || r['Resultado 1ra.Llamada'].trim() === '').length > 0) count++;
    if (filteredViv.filter(r => {
      const p = (r['¿Cuánto puedes pagar mensualmente por tu vivienda?'] || '');
      const sinG = !r['Resultado 1ra.Llamada'] || r['Resultado 1ra.Llamada'].trim() === '';
      return sinG && (p.includes('más_de') || p.includes('entre_$301'));
    }).length > 0) count++;
    return count;
  }, [filteredViv]);

  const generatePDF = async () => {
    setIsExporting(true);
    setPdfProgress(10);
    const doc = new jsPDF('p', 'mm', 'a4');
    const pW = 210; const margin = 15; const cW = pW - 2 * margin;
    let y = margin;
    doc.setFillColor(13, 110, 78);
    doc.rect(0, 0, pW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Dashboard Gerente — Planifikt', margin, 17);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exportado el ${new Date().toLocaleString('es-EC')} · ${totalLeads} leads totales`, margin, 23);
    y = 38;
    setPdfProgress(30);

    const addSection = (title: string) => {
      if (y > 257) { doc.addPage(); y = margin; }
      doc.setFillColor(240, 242, 245); doc.rect(margin, y, cW, 7, 'F');
      doc.setTextColor(30, 30, 30); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), margin + 3, y + 5);
      y += 10;
    };

    const addTable = (headers: string[], rows: any[][], colWidths: number[]) => {
      const rowH = 7; const hdrH = 8;
      if (y + hdrH > 282) { doc.addPage(); y = margin; }
      let x = margin;
      doc.setFillColor(80, 70, 166); doc.rect(margin, y, cW, hdrH, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      headers.forEach((h, i) => { doc.text(h, x + 2, y + 5.5); x += colWidths[i]; });
      y += hdrH;
      rows.slice(0, 20).forEach((row, ri) => {
        if (y + rowH > 282) { doc.addPage(); y = margin; }
        if (ri % 2 === 0) { doc.setFillColor(248, 248, 252); doc.rect(margin, y, cW, rowH, 'F'); }
        doc.setDrawColor(220, 220, 230); doc.line(margin, y + rowH, margin + cW, y + rowH);
        x = margin;
        doc.setTextColor(30, 30, 30); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        row.forEach((cell, i) => {
          const txt = String(cell || '—').slice(0, Math.floor(colWidths[i] / 2.2));
          doc.text(txt, x + 2, y + 5);
          x += colWidths[i];
        });
        y += rowH;
      });
      y += 4;
    };

    if (pdfOptions.kpis) {
      addSection('Resumen Ejecutivo');
      const calientes = filteredVeh.filter(r => (r['¿Tienes disponible para un pago inicial ?'] || '').includes('sí')).length;
      const ventas = filteredViv.filter(r => (r['Etapa Oportunidad'] || '').toLowerCase().includes('Venta Ganada')).length;
      const kpis = [
        ['Vehículos', filteredVeh.length, '#0D6E4E'], ['Viviendas', filteredViv.length, '#5046A6'],
        ['Calientes', calientes, '#C84B1F'], ['Ventas ganadas', ventas, '#2C6E2C'],
        ['Total leads', totalLeads, '#333'], ['Período activo', period === 0 ? 'Todos' : `${period} días`, '#5046A6'],
      ];
      const kW = cW / 3; const kH = 18;
      kpis.forEach(([label, val, col], i) => {
        const col2 = i % 3; const row2 = Math.floor(i / 3);
        const x = margin + col2 * kW; const ky = y + row2 * (kH + 4);
        doc.setFillColor(col as string); doc.roundedRect(x, ky, kW - 4, kH, 2, 2, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
        doc.text(String(val), x + 4, ky + 11);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text(String(label), x + 4, ky + 16);
      });
      y += 46;
    }
    setPdfProgress(40);

    if (pdfOptions.vehiculos) {
      addSection('Campaña Vehículos');
      addTable(
        ['Nombre', 'Teléfono', 'Presupuesto', 'Entrada', 'Vendedor', 'Resultado'],
        filteredVeh.map(r => [r['Full name'], r['Phone number'],
        (r['¿Cuánto puedes pagar mensualmente por tu vehículo?'] || '').replace(/_/g, ' ').split('(')[0],
        (r['¿Tienes disponible para un pago inicial ?'] || '').includes('sí') ? 'Sí' : 'No',
        normalizeVendor(r['Vendedor Asignado']),
        r['Resultado 1ra.Llamada'] || 'Sin gestión']),
        [48, 32, 38, 16, 36, 30]
      );
    }
    setPdfProgress(60);

    if (pdfOptions.viviendas) {
      addSection('Campaña Viviendas');
      addTable(
        ['Nombre', 'Teléfono', 'Presupuesto', 'Tipo', 'Vendedor', 'Estado'],
        filteredViv.map(r => [r['Full name'], r['Phone number'],
        (r['¿Cuánto puedes pagar mensualmente por tu vivienda?'] || '').replace(/_/g, ' ').split('(')[0],
        (r['¿En qué estás interesado?'] || '—').replace(/_/g, ' '),
        normalizeVendor(r['Vendedor Asignado']),
        r['Resultado 1ra.Llamada'] || 'Sin gestión']),
        [48, 32, 38, 20, 36, 26]
      );
    }
    setPdfProgress(80);

    if (pdfOptions.vendedores) {
      addSection('Eficacia por Vendedor');
      const vMap: Record<string, { total: number, gestionados: number }> = {};
      [...filteredVeh, ...filteredViv].forEach(r => {
        const v = normalizeVendor(r['Vendedor Asignado']);
        if (!vMap[v]) vMap[v] = { total: 0, gestionados: 0 };
        vMap[v].total++;
        if (r['Resultado 1ra.Llamada'] && r['Resultado 1ra.Llamada'].trim()) vMap[v].gestionados++;
      });
      addTable(
        ['Vendedor', 'Total leads', 'Gestionados', 'Sin gestión', '% Eficacia'],
        Object.entries(vMap).filter(([k]) => k !== 'Sin asignar').sort((a, b) => b[1].total - a[1].total).map(([name, s]) => [
          name, s.total, s.gestionados, s.total - s.gestionados, Math.round(s.gestionados / s.total * 100) + '%'
        ]),
        [56, 30, 30, 30, 30]
      );
    }

    setPdfProgress(100);
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(248, 248, 250); doc.rect(0, 285, pW, 12, 'F');
      doc.setFontSize(7.5); doc.setTextColor(120, 120, 140); doc.setFont('helvetica', 'normal');
      doc.text('Planifikt CRM — Dashboard Gerencial', margin, 292);
      doc.text(`Pág. ${i}/${pageCount}`, pW - margin, 292, { align: 'right' });
    }

    doc.save(`Planifikt_Gerente_${new Date().toISOString().slice(0, 10)}.pdf`);
    setTimeout(() => { setIsExporting(false); setPdfProgress(0); setShowPdfModal(false); }, 800);
  };

  if (loading && rawVeh.length === 0) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        <div className="loading-text">Cargando datos en tiempo real</div>
        <div className="loading-sub">Conectando con las APIs de Planifikt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface2)' }}>
      {/* TOPBAR */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--surface)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '60px', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--col-veh), var(--col-viv))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '14px' }}>PL</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text1)' }}>Planifikt</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Dashboard Gerencial</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {lastUpdate && (
            <div style={{ fontSize: '11px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} /><span>Actualizado {lastUpdate}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--col-ok-l)', color: 'var(--col-ok)', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 500 }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--col-ok)', animation: 'pulse 2s ease infinite' }} />
            <span>En vivo</span>
          </div>
          <button onClick={fetchData} style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>
            <span className="pi pi-refresh" style={{ fontSize: '16px', color: 'var(--text2)' }} />
          </button>
          <button onClick={() => setShowPdfModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--col-veh)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            <FileText size={16} /><span>Exportar PDF</span>
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
        {error && (
          <div style={{ background: 'var(--col-err-l)', border: '1px solid #FFCDD2', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--col-err)', fontSize: '13px' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button onClick={fetchData} style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '12px', background: 'white', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>Reintentar</button>
          </div>
        )}

        {/* CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text1)' }}>Dashboard Gerencial de Leads</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{totalLeads} leads totales · {dateRange} · Datos en tiempo real</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {([7, 14, 30, 0] as Period[]).map(d => (
              <button key={d} onClick={() => setPeriod(d)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${period === d ? 'var(--col-veh)' : 'var(--border)'}`, background: period === d ? 'var(--col-veh)' : 'var(--surface)', color: period === d ? 'white' : 'var(--text2)' }}>
                {d === 0 ? 'Todos' : `${d} días`}
              </button>
            ))}
          </div>
        </div>

        {/* TABS */}
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)} className="custom-tabview">
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
          <TabPanel header={`Alertas${alertCount > 0 ? ` (${alertCount})` : ''}`} leftIcon="pi pi-bell mr-2">
            <AlertasPanel filteredVeh={filteredVeh} filteredViv={filteredViv} rawVeh={rawVeh} />
          </TabPanel>
        </TabView>
      </div>

      {/* FAB */}
      <button onClick={() => setShowPdfModal(true)} style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50, width: '56px', height: '56px', borderRadius: '16px', background: 'var(--col-veh)', color: 'white', border: 'none', boxShadow: '0 4px 16px rgba(13,110,78,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <FileText size={24} />
      </button>

      {/* PDF MODAL */}
      <Dialog header="📄 Exportar informe PDF Gerencial" visible={showPdfModal} onHide={() => setShowPdfModal(false)} style={{ width: '420px', borderRadius: '24px' }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button label="Cancelar" className="p-button-text" onClick={() => setShowPdfModal(false)} />
            <Button label={isExporting ? 'Generando...' : 'Descargar PDF'} icon="pi pi-download" style={{ background: 'var(--col-veh)', border: 'none', borderRadius: '8px' }} onClick={generatePDF} disabled={isExporting} />
          </div>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>Selecciona las secciones a incluir en el informe gerencial</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {(Object.entries(pdfOptions) as [string, boolean][]).map(([key, val]) => (
            <div key={key} onClick={() => setPdfOptions({ ...pdfOptions, [key]: !val })} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: `1.5px solid ${val ? 'var(--col-veh)' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', background: val ? 'var(--col-veh-l)' : 'white' }}>
              <Checkbox checked={val} onChange={() => { }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{key === 'kpis' ? 'Métricas generales' : `Campaña ${key}`}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                  {key === 'kpis' && 'KPIs, totales y resumen ejecutivo'}
                  {key === 'vehiculos' && 'Leads, clasificación y calientes'}
                  {key === 'viviendas' && 'Leads premium y distribución'}
                  {key === 'vendedores' && 'Rendimiento por asesor'}
                </div>
              </div>
            </div>
          ))}
        </div>
        {isExporting && <ProgressBar value={pdfProgress} style={{ height: '4px' }} />}
      </Dialog>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// KPI CARD
// ────────────────────────────────────────────────────────
function KPICard({ value, label, icon, trend, type, trendColor }: { value: any; label: string; icon: string; trend?: string; type: string; trendColor?: string }) {
  return (
    <div className={`kpi-card ${type}`}>
      <div style={{ fontSize: '20px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: 600, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>{label}</div>
      {trend && <div style={{ fontSize: '11px', marginTop: '6px', color: trendColor || 'var(--text3)' }}>{trend}</div>}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// GENERAL PANEL
// ────────────────────────────────────────────────────────
function GeneralPanel({ filteredVeh, filteredViv }: { filteredVeh: Lead[]; filteredViv: Lead[] }) {
  const calientes = filteredVeh.filter(r => (r['¿Tienes disponible para un pago inicial ?'] || '').includes('sí')).length + filteredViv.filter(r => (r['¿Tienes disponible para un pago inicial ?'] || '').includes('sí')).length;
  const ventas = filteredVeh.filter(r => (r['Etapa Oportunidad'] || '').toLowerCase().includes('ganada')).length + filteredViv.filter(r => (r['Etapa Oportunidad'] || '').toLowerCase().includes('ganada')).length;
  const sinGest = (
    filteredVeh.filter(r => !r['Resultado 1ra.Llamada'] || r['Resultado 1ra.Llamada'].trim() === '').length +
    filteredViv.filter(r => !r['Resultado 1ra.Llamada'] || r['Resultado 1ra.Llamada'].trim() === '').length
  );

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
    datasets: [{ data: [filteredVeh.length, filteredViv.length], backgroundColor: ['#0D6E4E', '#5046A6'], borderWidth: 2, borderColor: '#fff', hoverOffset: 4 }]
  };

  const estadoData = {
    labels: ['Con entrada', 'Tibios', 'Fríos', 'Sin clasificar'],
    datasets: [{
      data: [
        filteredVeh.filter(r => (r['¿Tienes disponible para un pago inicial ?'] || '').includes('sí')).length,
        filteredVeh.filter(r => (r['Lead'] || '').toLowerCase() === 'tibio').length,
        filteredVeh.filter(r => (r['Lead'] || '').toLowerCase() === 'frio').length,
        Math.max(0, filteredVeh.length -
          filteredVeh.filter(r => (r['¿Tienes disponible para un pago inicial ?'] || '').includes('sí')).length -
          filteredVeh.filter(r => (r['Lead'] || '').toLowerCase() === 'tibio').length -
          filteredVeh.filter(r => (r['Lead'] || '').toLowerCase() === 'frio').length
        )
      ],
      backgroundColor: ['#C84B1F', '#A0620A', '#1565C0', '#9EA3B5'], borderWidth: 2, borderColor: '#fff'
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
    datasets: [{ data: topCiudades.map(x => x[1]), backgroundColor: '#5046A6', borderRadius: 4 }]
  };

  return (
    <div className="panel">
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <KPICard icon="🚗" value={filteredVeh.length} label="Leads vehículos" trend={`~${Math.round(filteredVeh.length / days)}/día`} type="veh" trendColor="var(--col-ok)" />
        <KPICard icon="🏠" value={filteredViv.length} label="Leads viviendas" trend="Creció x10 esta semana" type="viv" trendColor="var(--col-ok)" />
        <KPICard icon="🔥" value={calientes} label="Leads calientes (entrada)" trend={`${Math.round(calientes / (filteredVeh.length || 1) * 100)}% del total vehículos`} type="hot" />
        <KPICard icon="🏆" value={ventas} label="Ventas confirmadas" trend="¡Primera conversión!" type="ok" trendColor="var(--col-ok)" />
        <KPICard icon="⚠️" value={sinGest} label="Sin gestión registrada" trend={`${Math.round(sinGest / ((filteredVeh.length + filteredViv.length) || 1) * 100)}% sin atender`} type="warn" trendColor="var(--col-err)" />
        <KPICard icon="📅" value={`~${avg}`} label="Promedio leads/día" trend="Ritmo sostenido" type="default" />
      </div>

      <div className="grid">
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><BarChart size={16} /> Leads por día — Mix Campañas (7d)</div>
            <div className="chart-container"><Chart type="bar" data={diarioData} options={STACKED_BAR_OPTIONS} /></div>
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><PieChart size={16} /> Mix de campañas</div>
            <div className="chart-container"><Chart type="doughnut" data={mixData} options={DONUT_OPTIONS} /></div>
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><PieChart size={16} /> Estado leads vehículos</div>
            <div className="chart-container"><Chart type="doughnut" data={estadoData} options={DONUT_OPTIONS} /></div>
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><MapPin size={16} /> Leads por ciudad</div>
            <div className="chart-container"><Chart type="bar" data={ciudadData} options={{ ...BAR_OPTIONS, indexAxis: 'y', plugins: { legend: { display: false } } }} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// VEHÍCULOS PANEL
// ────────────────────────────────────────────────────────
function VehiculosPanel({ data }: { data: Lead[] }) {
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string | null>(null);

  const calientes = data.filter(r => (r['¿Tienes disponible para un pago inicial ?'] || '').includes('sí'));
  const tibios = data.filter(r => (r['Lead'] || '').toLowerCase() === 'tibio').length;
  const gye = data.filter(r => (r['¿En qué ciudad vives?'] || '').toLowerCase().includes('guayaquil')).length;

  const presMap: Record<string, number> = {};
  data.forEach(r => {
    const p = (r['¿Cuánto puedes pagar mensualmente por tu vehículo?'] || '').replace(/_/g, ' ').replace(/\(.*\)/g, '').trim();
    if (p) presMap[p] = (presMap[p] || 0) + 1;
  });

  const etapas: Record<string, number> = {};
  data.forEach(r => { const e = (r['Etapa'] || 'Sin etapa').trim() || 'Sin etapa'; etapas[e] = (etapas[e] || 0) + 1; });

  const filteredData = data.filter(r => {
    const matchesSearch = !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase());
    const matchesVendor = !vendorFilter || normalizeVendor(r['Vendedor Asignado']) === vendorFilter;
    return matchesSearch && matchesVendor;
  });

  const vendors = Array.from(new Set(data.map(r => normalizeVendor(r['Vendedor Asignado'])))).sort();

  return (
    <div className="panel">
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <KPICard icon="🚗" value={data.length} label="Total leads" type="veh" />
        <KPICard icon="💰" value={calientes.length} label="Con entrada disponible" type="hot" />
        <KPICard icon="⏰" value={tibios} label="Tibios" type="warn" />
        <KPICard icon="🏙️" value={gye} label="Guayaquil" type="default" />
      </div>

      <div className="grid">
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><DollarSign size={16} /> Distribución de presupuesto</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.entries(presMap).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k} className="progress-row">
                  <div style={{ fontSize: '13px', fontWeight: 500, minWidth: '140px' }}>{k.replace('hasta ', '≤').split('(')[0].trim()}</div>
                  <div style={{ flex: 1, height: '8px', background: 'var(--surface3)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round(v / (data.length || 1) * 100)}%`, backgroundColor: 'var(--col-veh)', borderRadius: '4px' }} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, minWidth: '32px', textAlign: 'right' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><Activity size={16} /> Etapas en CRM</div>
            <div className="chart-container">
              <Chart type="doughnut" data={{ labels: Object.keys(etapas), datasets: [{ data: Object.values(etapas), backgroundColor: ['#0D6E4E', '#A0620A', '#1565C0', '#9EA3B5', '#C84B1F'], borderWidth: 2, borderColor: '#fff' }] }} options={DONUT_OPTIONS} />
            </div>
          </div>
        </div>
      </div>

      <div className="card-custom">
        <div className="card-title-custom" style={{ color: 'var(--col-hot)' }}><Zap size={16} /> Leads calientes — acción inmediata</div>
        {calientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)' }}>
            <CheckCircle2 size={40} style={{ display: 'block', margin: '0 auto 8px' }} />
            Sin leads calientes en el período
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['Nombre', 'Teléfono', 'Presupuesto', 'Vendedor', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calientes.slice(0, 15).map((r, i) => {
                  const res = r['Resultado 1ra.Llamada'] || '';
                  const sinG = !res.trim();
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r['Full name'] || '—'}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text2)' }}>{r['Phone number'] || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="badge badge-veh">{(r['¿Cuánto puedes pagar mensualmente por tu vehículo?'] || '').replace(/_/g, ' ').split('(')[0].replace('hasta ', '≤').trim()}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{normalizeVendor(r['Vendedor Asignado'])}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {sinG
                          ? <span className="badge badge-err">Sin gestión</span>
                          : <span className="badge badge-cold">{res.slice(0, 30)}</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-custom">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div className="card-title-custom mb-0"><ClipboardCheck size={16} /> Todos los leads <span className="badge badge-veh" style={{ fontSize: '11px' }}>{data.length}</span></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nombre, teléfono..." className="p-inputtext-sm" />
            </span>
            <Dropdown value={vendorFilter} options={vendors} onChange={e => setVendorFilter(e.value)} placeholder="Vendedor" className="p-inputtext-sm" style={{ width: '160px' }} showClear />
          </div>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: '360px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0 }}>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Nombre', 'Teléfono', 'Ciudad', 'Presupuesto', 'Entrada', 'Vendedor', '1ra llamada', 'Clasificación'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text2)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)' }}>Sin datos</td></tr>
              ) : filteredData.map((r, i) => {
                const tieneEntrada = (r['¿Tienes disponible para un pago inicial ?'] || '').includes('sí');
                const lead = (r['Lead'] || '').toLowerCase();
                const label = tieneEntrada ? 'Con entrada' : (r['Lead'] || 'Sin clasificar');
                const badgeCls = tieneEntrada ? 'badge-hot' : lead === 'tibio' ? 'badge-warm' : lead === 'frio' ? 'badge-cold' : 'badge-neu';
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r['Full name'] || '—'}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text2)' }}>{r['Phone number'] || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{(r['¿En qué ciudad vives?'] || '').replace(/_/g, ' ')}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)', fontSize: '12px' }}>{(r['¿Cuánto puedes pagar mensualmente por tu vehículo?'] || '').replace(/_/g, ' ').split('(')[0].replace('hasta ', '≤').trim()}</td>
                    <td style={{ padding: '10px 12px' }}>{tieneEntrada ? <span className="badge badge-ok">Sí</span> : <span className="badge badge-neu">No</span>}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{normalizeVendor(r['Vendedor Asignado'])}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)', fontSize: '12px' }}>{(r['Resultado 1ra.Llamada'] || '—').slice(0, 35)}</td>
                    <td style={{ padding: '10px 12px' }}><span className={`badge ${badgeCls}`}>{label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// VIVIENDAS PANEL
// ────────────────────────────────────────────────────────
function ViviendasPanel({ data }: { data: Lead[] }) {
  const [search, setSearch] = useState('');

  const ganadas = data.filter(r => (r['Etapa Oportunidad'] || '').toLowerCase().includes('ganada')).length;
  const sinGest = data.filter(r => !r['Resultado 1ra.Llamada'] || r['Resultado 1ra.Llamada'].trim() === '').length;
  const premium = data.filter(r => {
    const p = (r['¿Cuánto puedes pagar mensualmente por tu vivienda?'] || '');
    return p.includes('más_de') || p.includes('entre_$301') || p.includes('$600');
  });

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

  const filteredData = data.filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="panel">
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <KPICard icon="🏠" value={data.length} label="Total leads" type="viv" />
        <KPICard icon="🏆" value={ganadas} label="Ventas ganadas" type="ok" />
        <KPICard icon="📵" value={sinGest} label="Sin gestión" type="err" />
        <KPICard icon="💎" value={premium.length} label="Leads premium +$300" type="hot" />
      </div>

      <div className="grid">
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><Home size={16} /> Tipo de propiedad</div>
            <div className="chart-container">
              <Chart type="doughnut" data={{ labels: Object.keys(tipos), datasets: [{ data: Object.values(tipos), backgroundColor: ['#5046A6', '#C84B1F', '#0D6E4E', '#BA7517', '#1565C0'], borderWidth: 2, borderColor: '#fff' }] }} options={DONUT_OPTIONS} />
            </div>
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><DollarSign size={16} /> Presupuesto declarado</div>
            <div className="chart-container">
              <Chart type="doughnut" data={{ labels: Object.keys(presViv), datasets: [{ data: Object.values(presViv), backgroundColor: ['#5046A6', '#C84B1F', '#0D6E4E', '#BA7517'], borderWidth: 2, borderColor: '#fff' }] }} options={DONUT_OPTIONS} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla premium sin gestión */}
      <div className="card-custom">
        <div className="card-title-custom" style={{ color: 'var(--col-err)' }}><AlertCircle size={16} style={{ color: 'var(--col-err)' }} /> Leads premium sin gestión — contactar HOY</div>
        {premium.filter(r => !r['Resultado 1ra.Llamada'] || r['Resultado 1ra.Llamada'].trim() === '').length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)' }}>
            <CheckCircle2 size={36} style={{ display: 'block', margin: '0 auto 8px' }} />
            Todos los leads premium tienen gestión registrada
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['Nombre', 'Teléfono', 'Presupuesto', 'Tipo', 'Vendedor', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {premium.map((r, i) => {
                  const sinG = !r['Resultado 1ra.Llamada'] || r['Resultado 1ra.Llamada'].trim() === '';
                  const pres = (r['¿Cuánto puedes pagar mensualmente por tu vivienda?'] || '').replace(/_/g, ' ').split('(')[0].trim();
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: sinG ? '#fff8f7' : undefined }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r['Full name'] || '—'}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text2)' }}>{r['Phone number'] || '—'}</td>
                      <td style={{ padding: '10px 12px' }}><span className="badge badge-viv">{pres.slice(0, 25)}</span></td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{(r['¿En qué estás interesado?'] || '—').replace(/_/g, ' ')}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{normalizeVendor(r['Vendedor Asignado'])}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {sinG
                          ? <span className="badge badge-err">SIN GESTIÓN</span>
                          : <span className="badge badge-cold">{(r['Resultado 1ra.Llamada'] || '').slice(0, 25)}</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabla completa */}
      <div className="card-custom">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div className="card-title-custom mb-0"><ClipboardCheck size={16} /> Todos los leads viviendas <span className="badge badge-viv" style={{ fontSize: '11px' }}>{data.length}</span></div>
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nombre, teléfono..." className="p-inputtext-sm" />
          </span>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: '360px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0 }}>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Nombre', 'Teléfono', 'Ciudad', 'Presupuesto', 'Tipo', 'Vendedor', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text2)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)' }}>Sin datos</td></tr>
              ) : filteredData.map((r, i) => {
                const sinG = !r['Resultado 1ra.Llamada'] || r['Resultado 1ra.Llamada'].trim() === '';
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r['Full name'] || '—'}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text2)' }}>{r['Phone number'] || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{(r['¿En qué ciudad vives?'] || '').replace(/_/g, ' ')}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)', fontSize: '12px' }}>{(r['¿Cuánto puedes pagar mensualmente por tu vivienda?'] || '').replace(/_/g, ' ').split('(')[0].replace('hasta ', '≤').trim().slice(0, 25)}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{(r['¿En qué estás interesado?'] || '—').replace(/_/g, ' ')}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{normalizeVendor(r['Vendedor Asignado'])}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {sinG
                        ? <span className="badge badge-err">Sin gestión</span>
                        : <span className="badge badge-ok" style={{ fontSize: '10px' }}>{(r['Resultado 1ra.Llamada'] || '').slice(0, 25)}</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// VENDEDORES PANEL
// ────────────────────────────────────────────────────────
function VendedoresPanel({ filteredVeh, filteredViv }: { filteredVeh: Lead[]; filteredViv: Lead[] }) {
  const allLeads = [
    ...filteredVeh.map(r => ({ ...r, _tipo: 'veh' as const })),
    ...filteredViv.map(r => ({ ...r, _tipo: 'viv' as const }))
  ];

  const byVendor: Record<string, VendorStats> = {};
  allLeads.forEach(r => {
    const v = normalizeVendor(r['Vendedor Asignado']);
    if (!byVendor[v]) byVendor[v] = { total: 0, veh: 0, viv: 0, gestionados: 0, calientes: 0 };
    byVendor[v].total++;
    if (r._tipo === 'veh') byVendor[v].veh++;
    else byVendor[v].viv++;
    if (r['Resultado 1ra.Llamada'] && r['Resultado 1ra.Llamada'].trim()) byVendor[v].gestionados++;
    if ((r['¿Tienes disponible para un pago inicial ?'] || '').includes('sí')) byVendor[v].calientes++;
    // Also count vivienda premium as "caliente"
    if (r._tipo === 'viv') {
      const p = (r['¿Cuánto puedes pagar mensualmente por tu vivienda?'] || '');
      if (p.includes('más_de') || p.includes('entre_$301')) byVendor[v].calientes++;
    }
  });

  // Main vendors (named), sorted by total
  const mainVendors = Object.entries(byVendor)
    .filter(([k]) => k !== 'Sin asignar')
    .sort((a, b) => b[1].total - a[1].total);

  const sinAsignar = byVendor['Sin asignar'];
  const vNames = mainVendors.map(x => x[0].split(' ')[0]);

  if (mainVendors.length === 0) {
    return (
      <div className="panel">
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)' }}>
          <Users size={48} style={{ display: 'block', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '16px', fontWeight: 500 }}>Sin vendedores asignados en este período</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>
            {sinAsignar ? `${sinAsignar.total} leads sin asignar. Cambia el período o asigna vendedores.` : 'Cambia el período para ver más datos.'}
          </div>
        </div>
      </div>
    );
  }

  // Chart: total por vendedor
  const assignedData = {
    labels: vNames,
    datasets: [{
      label: 'Asignaciones',
      data: mainVendors.map(x => x[1].total),
      backgroundColor: mainVendors.map((_, i) => VENDOR_COLORS[i % VENDOR_COLORS.length]),
      borderRadius: 4
    }]
  };

  // Chart: mix veh/viv
  const mixData = {
    labels: vNames,
    datasets: [
      { label: 'Vehículos', data: mainVendors.map(x => x[1].veh), backgroundColor: '#0D6E4E', borderRadius: 4 },
      { label: 'Viviendas', data: mainVendors.map(x => x[1].viv), backgroundColor: '#5046A6', borderRadius: 4 }
    ]
  };

  const maxT = Math.max(...mainVendors.map(x => x[1].total), 1);

  return (
    <div className="panel">
      {/* Vendor cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        {mainVendors.map(([name, s], i) => {
          const pct = Math.round(s.gestionados / (s.total || 1) * 100);
          const col = VENDOR_COLORS[i % VENDOR_COLORS.length];
          return (
            <div key={name} className="vendor-card" style={{ borderTopColor: col }}>
              <div className="vendor-avatar" style={{ backgroundColor: col }}>{initials(name)}</div>
              <div className="vendor-name">{name}</div>
              <div className="vendor-sub">{s.veh} veh · {s.viv} viv</div>
              <div className="vendor-stats">
                <div className="vendor-stat">
                  <div className="vendor-stat-val" style={{ color: col }}>{s.total}</div>
                  <div className="vendor-stat-lbl">Total</div>
                </div>
                <div className="vendor-stat">
                  <div className="vendor-stat-val" style={{ color: '#C84B1F' }}>{s.calientes}</div>
                  <div className="vendor-stat-lbl">Calientes</div>
                </div>
                <div className="vendor-stat">
                  <div className="vendor-stat-val" style={{ color: 'var(--col-ok)' }}>{pct}%</div>
                  <div className="vendor-stat-lbl">Gestionados</div>
                </div>
              </div>
              <div style={{ height: '4px', borderRadius: '2px', marginTop: '10px', background: 'var(--surface3)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: col, borderRadius: '2px' }} />
              </div>
            </div>
          );
        })}
        {/* Sin asignar info card */}
        {sinAsignar && (
          <div className="vendor-card" style={{ borderTopColor: '#9EA3B5' }}>
            <div className="vendor-avatar" style={{ backgroundColor: '#9EA3B5' }}>SA</div>
            <div className="vendor-name">Sin asignar</div>
            <div className="vendor-sub">Leads pendientes de asignación</div>
            <div className="vendor-stats">
              <div className="vendor-stat">
                <div className="vendor-stat-val" style={{ color: '#9EA3B5' }}>{sinAsignar.total}</div>
                <div className="vendor-stat-lbl">Total</div>
              </div>
              <div className="vendor-stat">
                <div className="vendor-stat-val" style={{ color: 'var(--col-err)' }}>0%</div>
                <div className="vendor-stat-lbl">Gestionados</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid">
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><BarChart size={16} /> Volumen por Asesor</div>
            <div className="chart-container"><Chart type="bar" data={assignedData} options={BAR_OPTIONS} /></div>
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="card-custom">
            <div className="card-title-custom"><TrendingUp size={16} /> Vehículos vs Viviendas por Asesor</div>
            <div className="chart-container"><Chart type="bar" data={mixData} options={STACKED_BAR_OPTIONS} /></div>
          </div>
        </div>
      </div>

      {/* Eficacia rows */}
      <div className="card-custom">
        <div className="card-title-custom"><Activity size={16} /> Eficacia de gestión</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {mainVendors.map(([name, s], i) => {
            const pct = Math.round(s.gestionados / (s.total || 1) * 100);
            const col = VENDOR_COLORS[i % VENDOR_COLORS.length];
            const noGest = s.total - s.gestionados;
            const [first, ...rest] = name.split(' ');
            return (
              <div key={name} className="progress-row">
                <div style={{ minWidth: '140px', fontSize: '13px' }}>
                  <span style={{ fontWeight: 600 }}>{first}</span>{' '}
                  <span style={{ color: 'var(--text3)', fontSize: '12px' }}>{rest.join(' ')}</span>
                </div>
                <div style={{ flex: 1, height: '8px', background: 'var(--surface3)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round(s.total / maxT * 100)}%`, backgroundColor: col, borderRadius: '4px' }} />
                </div>
                <div style={{ minWidth: '80px', textAlign: 'right', fontSize: '12px', color: 'var(--text2)' }}>{s.gestionados} gest.</div>
                <div style={{ minWidth: '60px', textAlign: 'right' }}>
                  <span className={noGest > 5 ? 'badge badge-err' : 'badge badge-ok'}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// ALERTAS PANEL
// ────────────────────────────────────────────────────────
function AlertasPanel({ filteredViv, rawVeh }: { filteredVeh: Lead[]; filteredViv: Lead[]; rawVeh: Lead[] }) {
  const sinGestViv = filteredViv.filter(r => !r['Resultado 1ra.Llamada'] || r['Resultado 1ra.Llamada'].trim() === '').length;
  const premiumSinGest = filteredViv.filter(r => {
    const p = (r['¿Cuánto puedes pagar mensualmente por tu vivienda?'] || '');
    const sinG = !r['Resultado 1ra.Llamada'] || r['Resultado 1ra.Llamada'].trim() === '';
    return sinG && (p.includes('más_de') || p.includes('entre_$301'));
  }).length;
  const sinClasViv = filteredViv.filter(r => !r['Lead'] || r['Lead'].trim() === '').length;
  const dupVendedores = rawVeh.some(r => /doris\s*\./i.test(r['Vendedor Asignado'] || '') || /marvin\s*\./i.test(r['Vendedor Asignado'] || ''));
  const clienteExistente = rawVeh.some(r => (r['Resultado 1ra.Llamada'] || '').toLowerCase().includes('contrato con planifikt'));
  const ventas = filteredViv.filter(r => (r['Etapa Oportunidad'] || '').toLowerCase().includes('ganada')).length;

  type AlertEntry = { cls: string; Icon: LucideIcon; title: string; body: string };
  const alertasCriticas: AlertEntry[] = [];
  const oportunidades: AlertEntry[] = [];
  const acciones: AlertEntry[] = [];

  if (sinGestViv > 0)
    alertasCriticas.push({ cls: 'alert-r', Icon: AlertTriangle, title: 'Viviendas sin gestión urgente', body: `${sinGestViv} de ${filteredViv.length} leads de viviendas (${Math.round(sinGestViv / Math.max(filteredViv.length, 1) * 100)}%) sin resultado de primera llamada.` });
  if (premiumSinGest > 0)
    alertasCriticas.push({ cls: 'alert-r', Icon: AlertCircle, title: 'Leads premium sin contactar', body: `${premiumSinGest} leads con presupuesto superior a $300/mes en viviendas sin ninguna gestión. Son los tickets más altos.` });
  if (sinClasViv > 0)
    alertasCriticas.push({ cls: 'alert-y', Icon: Tag, title: 'Sin clasificación en viviendas', body: `El campo "Lead" está vacío en ${sinClasViv} leads de viviendas. Sin clasificación es imposible priorizar ni medir eficacia.` });
  if (dupVendedores)
    alertasCriticas.push({ cls: 'alert-y', Icon: UserX, title: 'Nombres de vendedores duplicados', body: 'Doris Guerrero y/o Marvin Franco aparecen con variantes de nombre (con punto o espacios extra). Esto rompe los reportes.' });
  if (clienteExistente)
    alertasCriticas.push({ cls: 'alert-y', Icon: Ban, title: 'Clientes existentes en flujo activo', body: 'Hay leads que ya tienen contrato con Planifikt recibiendo llamadas de ventas. Eliminar del flujo de contacto.' });

  if (ventas > 0)
    oportunidades.push({ cls: 'alert-g', Icon: Trophy, title: 'Ventas confirmadas', body: `Hay ${ventas} lead(s) en etapa "venta ganada" en viviendas. Identificar al vendedor y documentar el proceso para replicarlo.` });
  oportunidades.push({ cls: 'alert-g', Icon: TrendingUp, title: 'Viviendas creció x10 esta semana', body: 'La campaña de viviendas creció significativamente. El ROI justifica aumentar el presupuesto diario de esta campaña.' });
  oportunidades.push({ cls: 'alert-g', Icon: ArrowLeftRight, title: 'Demanda cruzada detectada', body: 'Varios leads de vehículos mencionaron interés en casa. Potencial de ventas cruzadas entre campañas.' });

  acciones.push({ cls: 'alert-b', Icon: Phone, title: 'Hoy — Contactar leads premium viviendas sin gestión', body: 'Prioridad: leads con presupuesto +$300/mes en viviendas sin ninguna llamada registrada.' });
  acciones.push({ cls: 'alert-b', Icon: Pencil, title: 'Hoy — Estandarizar nombres de vendedores', body: 'Un único formato por vendedor para que los reportes automáticos sean correctos.' });
  acciones.push({ cls: 'alert-b', Icon: Tag, title: '48h — Implementar clasificación en viviendas', body: 'Aplicar etiquetas caliente/tibio/frío a todos los leads de viviendas igual que en vehículos.' });
  acciones.push({ cls: 'alert-b', Icon: RefreshCcw, title: 'Esta semana — Escalar presupuesto viviendas', body: 'Con la conversión actual, el ROI justifica aumentar el presupuesto diario de la campaña +50%.' });

  const Section = ({ title, SectionIcon, items }: { title: string; SectionIcon: LucideIcon; items: AlertEntry[] }) => (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '20px 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <SectionIcon size={16} />{title}
      </div>
      {items.map((a, i) => (
        <div key={i} className={`alert-custom ${a.cls}`} style={{ marginBottom: '8px' }}>
          <a.Icon size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: '2px' }}>{a.title}</div>
            <div>{a.body}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="panel">
      <Section title="Alertas críticas" SectionIcon={AlertTriangle} items={alertasCriticas} />
      <Section title="Oportunidades" SectionIcon={Lightbulb} items={oportunidades} />
      <Section title="Plan de acción" SectionIcon={ClipboardCheck} items={acciones} />
    </div>
  );
}
