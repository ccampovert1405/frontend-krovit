import React, { useState, useCallback } from 'react';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressBar } from 'primereact/progressbar';
import { PageHeader, KPICard } from '@/components/ui';
import { useOportunidades } from '@/hooks';
import {
    COLORS,
    ETAPA_OPORTUNIDAD_COLORS,
} from '@/utils/constants';
import { Oportunidad, EtapaOportunidad } from '@/types';
import { NuevaOportunidadModal, NuevaOportunidadForm } from './NuevaOportunidadModal';
import { EditarOportunidadModal } from './EditarOportunidadModal';
import { useNotification } from '@/context/NotificationContext';

// ════════════════════════════════════════════════════════════
// TIPOS DE PRODUCTO — Emojis y Colores
// ════════════════════════════════════════════════════════════
type EtapaKanban = 'Calificación' | 'Propuesta' | 'Negociación' | 'Cierre';
const ETAPAS_KANBAN: EtapaKanban[] = ['Calificación', 'Propuesta', 'Negociación', 'Cierre'];

const ETAPA_DOT: Record<EtapaKanban, string> = {
    'Calificación': COLORS.gray500,
    'Propuesta': COLORS.blue,
    'Negociación': COLORS.yellow,
    'Cierre': COLORS.purple,
};

const PRODUCTO_META: Record<string, { emoji: string; color: string; bg: string }> = {
    'Vehículo': { emoji: '🚗', color: '#3B82F6', bg: '#DBEAFE' },
    'Vivienda': { emoji: '🏠', color: '#8B5CF6', bg: '#EDE9FE' },
    'Remodelación': { emoji: '🔨', color: '#F97316', bg: '#FFF7ED' },
};

// ════════════════════════════════════════════════════════════
// KANBAN CARD
// ════════════════════════════════════════════════════════════
interface KanbanCardProps {
    op: Oportunidad;
    onEdit: (o: Oportunidad) => void;
    onDelete: (o: Oportunidad) => void;
    onCerrar?: (o: Oportunidad) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ op, onEdit, onDelete, onCerrar }) => {
    const [hovered, setHovered] = useState(false);
    const meta = PRODUCTO_META[op.producto] ?? { emoji: '📋', color: COLORS.gray500, bg: COLORS.gray100 };
    const isCierre = op.etapa === 'Cierre';
    const etapaColor = (ETAPA_OPORTUNIDAD_COLORS as Record<string, string>)[op.etapa] ?? COLORS.gray400;

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: COLORS.white,
                border: `1.5px solid ${hovered ? COLORS.gray200 : COLORS.gray100}`,
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '8px',
                boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
            }}
        >
            {/* Row: nombre + acciones */}
            <div className="flex justify-content-between align-items-start mb-1">
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: COLORS.gray800, lineHeight: 1.3 }}>
                    {op.nombre}
                </div>
                <div className="flex gap-1" style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.2s', flexShrink: 0 }}>
                    <button
                        onClick={e => { e.stopPropagation(); onEdit(op); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '3px 5px', borderRadius: '6px', color: COLORS.blue }}
                        title="Editar"
                    >
                        <i className="pi pi-pencil" style={{ fontSize: '0.75rem' }} />
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(op); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '3px 5px', borderRadius: '6px', color: COLORS.red }}
                        title="Eliminar"
                    >
                        <i className="pi pi-trash" style={{ fontSize: '0.75rem' }} />
                    </button>
                </div>
            </div>

            {/* Cliente */}
            <div style={{ fontSize: '0.76rem', color: COLORS.gray500, marginBottom: '10px' }}>
                {op.cliente}
            </div>

            {/* Badges: Producto + Plan */}
            <div className="flex gap-2 flex-wrap mb-2">
                {op.producto && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '0.72rem', fontWeight: 600,
                        color: meta.color, backgroundColor: meta.bg,
                        borderRadius: '999px', padding: '2px 8px',
                    }}>
                        {meta.emoji} {op.producto}
                    </span>
                )}
                {op.valor > 0 && (
                    <span style={{
                        fontSize: '0.72rem', fontWeight: 600,
                        color: COLORS.green, backgroundColor: COLORS.greenLight,
                        borderRadius: '999px', padding: '2px 8px',
                    }}>
                        ${op.valor.toLocaleString()}
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <ProgressBar
                value={op.probabilidad}
                showValue={false}
                style={{ height: '5px', marginBottom: '10px' }}
                pt={{ value: { style: { backgroundColor: etapaColor } } }}
            />

            {/* Footer */}
            <div className="flex justify-content-between align-items-center">
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: COLORS.red }}>
                    ${op.valor.toLocaleString()}
                </span>
                {isCierre && onCerrar && (
                    <Button
                        label="Cerrar"
                        onClick={() => onCerrar(op)}
                        style={{
                            backgroundColor: COLORS.gray800,
                            borderColor: COLORS.gray800,
                            borderRadius: '8px',
                            padding: '5px 14px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                        }}
                    />
                )}
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════
// OPORTUNIDADES PAGE
// ════════════════════════════════════════════════════════════
export const OportunidadesPage: React.FC = () => {
    const {
        oportunidades,
        modalVisible,
        openModal,
        closeModal,
        addOportunidad,
        updateOportunidad,
        deleteOportunidad,
        loading,
        error,
    } = useOportunidades();

    const [editingOp, setEditingOp] = useState<Oportunidad | null>(null);
    const [saving, setSaving] = useState(false);
    const { showSuccess, showError } = useNotification();

    // ─── KPIs ────────────────────────────────────────────────
    const pipeline = oportunidades.filter((o: Oportunidad) => !['Ganada', 'Perdida'].includes(o.etapa));
    const totalPipeline = pipeline.reduce((s: number, o: Oportunidad) => s + o.valor, 0);
    const ganadas = oportunidades.filter((o: Oportunidad) => o.etapa === 'Ganada');
    const valorGanado = ganadas.reduce((s: number, o: Oportunidad) => s + o.valor, 0);

    // ─── Agrupación por etapa ─────────────────────────────────
    const grouped = ETAPAS_KANBAN.reduce((acc: Record<EtapaKanban, Oportunidad[]>, etapa: EtapaKanban) => {
        acc[etapa] = oportunidades.filter((o: Oportunidad) => o.etapa === (etapa as EtapaOportunidad));
        return acc;
    }, {} as Record<EtapaKanban, Oportunidad[]>);

    // ─── Handlers ────────────────────────────────────────────
    const handleSave = useCallback(async (data: NuevaOportunidadForm) => {
        const today = new Date();
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        setSaving(true);
        try {
            await addOportunidad({
                nombre: data.nombre,
                cliente: data.cliente,
                clienteId: data.clienteId ?? undefined,
                producto: data.producto,
                plan: data.plan,
                fuente: data.fuente,
                notas: data.notas,
                valor: typeof data.plan === 'number' ? data.plan : 0,
                probabilidad: 20,
                etapa: data.etapa,
                fecha: `${today.getDate()} ${meses[today.getMonth()]}`,
                mes: today.getMonth(),
                agente: '',
                color: (ETAPA_OPORTUNIDAD_COLORS as Record<string, string>)[data.etapa],
            });
            closeModal();
            showSuccess(`"${data.nombre}" fue creada correctamente.`, 'Oportunidad creada');
        } catch (err) {
            showError((err as Error).message ?? 'No se pudo crear la oportunidad.', 'Error al crear');
        } finally {
            setSaving(false);
        }
    }, [addOportunidad, closeModal, showSuccess, showError]);

    const handleDelete = useCallback((op: Oportunidad) => {
        confirmDialog({
            message: `¿Eliminar "${op.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await deleteOportunidad(op.id);
                    showSuccess(`"${op.nombre}" fue eliminada.`, 'Oportunidad eliminada');
                } catch (err) {
                    showError((err as Error).message ?? 'No se pudo eliminar.', 'Error al eliminar');
                }
            },
        });
    }, [deleteOportunidad, showSuccess, showError]);

    const handleCerrar = useCallback((op: Oportunidad) => {
        confirmDialog({
            message: `¿Marcar "${op.nombre}" como Ganada?`,
            header: 'Cerrar Oportunidad',
            icon: 'pi pi-check-circle',
            acceptLabel: '¡Sí, ganada!',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await updateOportunidad(op.id, { etapa: 'Ganada', probabilidad: 100 });
                    showSuccess(`"${op.nombre}" marcada como Ganada. 🎉`, 'Cierre exitoso');
                } catch (err) {
                    showError((err as Error).message ?? 'No se pudo cerrar.', 'Error al cerrar');
                }
            },
        });
    }, [updateOportunidad, showSuccess, showError]);

    return (
        <div>
            <ConfirmDialog />

            {/* Banner de error */}
            {error && (
                <div style={{
                    background: '#FEF2F2', border: '1px solid #FECACA',
                    borderRadius: '10px', padding: '12px 16px',
                    color: COLORS.red, fontSize: '0.88rem',
                    marginBottom: '16px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    <i className="pi pi-exclamation-triangle" />
                    {error}
                </div>
            )}

            {/* Spinner de carga */}
            {loading && (
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: COLORS.red }} />
                </div>
            )}

            {!loading && (
                <>
                    <PageHeader title="Oportunidades" subtitle="Pipeline de ventas">
                        <Button
                            label="Nueva Oportunidad"
                            icon="pi pi-plus"
                            iconPos="left"
                            onClick={openModal}
                            style={{
                                backgroundColor: COLORS.red, borderColor: COLORS.red,
                                borderRadius: '10px', fontWeight: 600,
                                padding: '12px 20px', fontSize: '0.92rem',
                            }}
                            pt={{ icon: { style: { fontSize: '1.1rem' } } }}
                        />
                    </PageHeader>

                    {/* KPIs */}
                    <div className="flex gap-3 mb-4 flex-wrap">
                        <KPICard
                            icon="pi-sync"
                            label="PIPELINE TOTAL"
                            value={`$${totalPipeline.toLocaleString()}`}
                            color={COLORS.red}
                        />
                        <KPICard
                            icon="pi-check-circle"
                            label="GANADAS"
                            value={ganadas.length}
                            color={COLORS.green}
                        />
                        <KPICard
                            icon="pi-dollar"
                            label="VALOR GANADO"
                            value={`$${valorGanado.toLocaleString()}`}
                            color={COLORS.blue}
                        />
                    </div>

                    {/* ── Kanban Pipeline ── */}
                    <div className="flex gap-3 overflow-x-auto pb-3 mb-4" style={{ alignItems: 'flex-start' }}>
                        {ETAPAS_KANBAN.map((etapa: EtapaKanban) => {
                            const ops = grouped[etapa] || [];
                            return (
                                <div key={etapa} style={{ minWidth: '240px', flex: 1 }}>
                                    {/* Column Header */}
                                    <div className="flex align-items-center gap-2 mb-3">
                                        <div style={{
                                            width: '10px', height: '10px', borderRadius: '50%',
                                            backgroundColor: ETAPA_DOT[etapa],
                                            flexShrink: 0,
                                        }} />
                                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: COLORS.gray800 }}>
                                            {etapa}
                                        </span>
                                    </div>

                                    {/* Cards */}
                                    {ops.length === 0 ? (
                                        <div style={{
                                            background: COLORS.white,
                                            border: `1.5px dashed ${COLORS.gray200}`,
                                            borderRadius: '12px', padding: '20px',
                                            textAlign: 'center', color: COLORS.gray400,
                                            fontSize: '0.78rem',
                                        }}>
                                            Sin oportunidades
                                        </div>
                                    ) : (
                                        ops.map((op: Oportunidad) => (
                                            <KanbanCard
                                                key={op.id}
                                                op={op}
                                                onEdit={setEditingOp}
                                                onDelete={handleDelete}
                                                onCerrar={handleCerrar}
                                            />
                                        ))
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Ganadas ── */}
                    {ganadas.length > 0 && (
                        <div style={{
                            background: COLORS.white,
                            border: `1.5px solid ${COLORS.gray100}`,
                            borderRadius: '14px',
                            padding: '20px 24px',
                        }}>
                            <div className="flex align-items-center gap-2 mb-3">
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS.green }} />
                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: COLORS.gray800 }}>Ganadas</span>
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: 600,
                                    color: COLORS.green, backgroundColor: COLORS.greenLight,
                                    borderRadius: '999px', padding: '1px 8px',
                                }}>
                                    {ganadas.length}
                                </span>
                            </div>
                            {ganadas.map((op: Oportunidad) => (
                                <div key={op.id} className="flex justify-content-between align-items-start py-3"
                                    style={{ borderBottom: `1px solid ${COLORS.gray100}` }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: COLORS.gray800 }}>{op.nombre}</div>
                                        <div style={{ fontSize: '0.78rem', color: COLORS.gray500, marginTop: '2px' }}>{op.cliente}</div>
                                    </div>
                                    <span style={{ fontWeight: 700, color: COLORS.green, fontSize: '0.95rem' }}>
                                        ${op.valor.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Modales */}
                    <NuevaOportunidadModal
                        visible={modalVisible}
                        onHide={closeModal}
                        onSave={handleSave}
                        saving={saving}
                    />

                    {editingOp && (
                        <EditarOportunidadModal
                            oportunidad={editingOp}
                            visible={!!editingOp}
                            onHide={() => setEditingOp(null)}
                            onSave={async (id: number, changes: Partial<Oportunidad>) => {
                                try {
                                    await updateOportunidad(id, changes);
                                    setEditingOp(null);
                                } catch {
                                    // error ya manejado en el hook
                                }
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default OportunidadesPage;
