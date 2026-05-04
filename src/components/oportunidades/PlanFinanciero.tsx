import React from 'react';
import { COLORS } from '@/utils/constants';
import type { PlanFinancieroData } from '@/types';

// ════════════════════════════════════════════════════════════
// COMPONENTE REUTILIZABLE — Plan Financiero
//
// Muestra el detalle de un plan financiero (Vehículo, Vivienda, etc.)
// con soporte para Compromiso de Oferta opcional.
// ════════════════════════════════════════════════════════════

export interface PlanFinancieroProps {
    data: PlanFinancieroData;
    loading?: boolean;
    hideHeader?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────
const fmt = (n?: number | null) => {
    if (n === undefined || n === null) return '$0';
    return `$${n.toLocaleString('en-US')}`;
};

// ─── Componente ───────────────────────────────────────────
export const PlanFinanciero: React.FC<PlanFinancieroProps> = ({ data, loading = false, hideHeader = false }) => {
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: COLORS.red }} />
                <div style={{ marginTop: '12px', fontSize: '0.88rem', color: COLORS.gray500 }}>
                    Cargando plan financiero...
                </div>
            </div>
        );
    }

    const cellStyle: React.CSSProperties = {
        flex: 1,
        minWidth: '140px',
        border: `1px solid ${COLORS.gray200}`,
        borderRadius: '12px',
        padding: '14px 16px',
        background: COLORS.white,
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Header */}
            {!hideHeader && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <i className="pi pi-file" style={{ color: COLORS.red, fontSize: '1.2rem' }} />
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: COLORS.red }}>Resumen del Plan</span>
                </div>
            )}

            {/* Fila 1: Inscripción + Cuota Mensual */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={cellStyle}>
                    <div style={{ fontSize: '0.75rem', color: COLORS.gray400, marginBottom: '6px', fontWeight: 500 }}>Inscripción</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS.gray800 }}>{fmt(data.inscripcion)}</div>
                </div>
                <div style={cellStyle}>
                    <div style={{ fontSize: '0.75rem', color: COLORS.gray400, marginBottom: '6px', fontWeight: 500 }}>Cuota Mensual</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS.gray800 }}>{fmt(data.cuotaMensual)}<span style={{ fontSize: '0.9rem', color: COLORS.gray400, marginLeft: '2px' }}>/mes</span></div>
                </div>
            </div>

            {/* Fila 2: Monto Base + Monto Final */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={cellStyle}>
                    <div style={{ fontSize: '0.75rem', color: COLORS.gray400, marginBottom: '6px', fontWeight: 500 }}>Monto Base</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS.gray800 }}>{fmt(data.montoBase)}</div>
                </div>
                <div style={cellStyle}>
                    <div style={{ fontSize: '0.75rem', color: COLORS.gray400, marginBottom: '6px', fontWeight: 500 }}>Monto Final</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS.red }}>{fmt(data.montoFinal)}</div>
                </div>
            </div>

            {/* Compromiso de Oferta */}
            {data.compromiso && (
                <div style={{
                    background: `${COLORS.green}08`, // Muy suave
                    border: `1.2px solid ${COLORS.green}A0`, // Borde verde más definido
                    borderRadius: '12px',
                    padding: '16px 20px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1rem' }}>💰</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: COLORS.green }}>Compromiso de Oferta</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: COLORS.black }}>
                            {data.compromiso.tipo}{!String(data.compromiso.tipo).includes('%') && '%'} <span style={{ color: COLORS.gray400, fontWeight: 400, fontSize: '1.05rem', margin: '0 4px' }}>en</span> {data.compromiso.cuotas} cuotas
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: COLORS.green }}>
                            {fmt(data.compromiso.valor_financiamiento)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanFinanciero;
