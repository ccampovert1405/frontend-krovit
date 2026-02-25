import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { PageHeader } from '@/components/ui';
import { useProspectos } from '@/hooks';
import { COLORS, ETAPAS_AIDA, ETAPA_COLORS } from '@/utils/constants';
import { Prospecto, EtapaAIDA } from '@/types';
import { ProspectoCard } from './ProspectoCard';
import { NuevoProspectoModal, NuevoProspectoForm } from './NuevoProspectoModal';
import { EditarProspectoModal } from './ProspectoEditor';
import { useNotification } from '@/context/NotificationContext';

// ═══════════════════════════════════════════════════════════
// PROSPECTOS PAGE — Tablero Kanban AIDA
// ═══════════════════════════════════════════════════════════

export const ProspectosPage: React.FC = () => {
    const { prospectos, modalVisible, addProspecto, openModal, closeModal, deleteProspecto, updateProspecto } = useProspectos();
    const [editingProspecto, setEditingProspecto] = useState<Prospecto | null>(null);
    const { showSuccess, showError } = useNotification();

    // Agrupar por etapa
    const grouped = ETAPAS_AIDA.reduce((acc, etapa) => {
        acc[etapa] = prospectos.filter(p => p.etapa === etapa);
        return acc;
    }, {} as Record<EtapaAIDA, Prospecto[]>);

    const handleSave = async (formData: NuevoProspectoForm) => {
        const today = new Date();
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        try {
            await addProspecto({
                nombre: `${formData.nombre} ${formData.apellido}`.trim(),
                apellido: formData.apellido,
                empresa: formData.empresa,
                email: formData.email,
                telefono: formData.telefono,
                cargo: formData.cargo,
                fuente: 'Directo',
                tipo: 'Vehículo',
                etapa: 'Atención',
                fecha: `${today.getDate()} ${meses[today.getMonth()]} ${today.getFullYear()}`,
                mes: today.getMonth(),
                agente: '',
                color: ETAPA_COLORS['Atención'],
            });
            closeModal();
            showSuccess(`${formData.nombre} fue registrado correctamente.`, 'Prospecto creado');
        } catch (err) {
            showError((err as Error).message ?? 'No se pudo crear el prospecto.', 'Error al crear');
        }
    };

    const handleDelete = (prospecto: Prospecto) => {
        confirmDialog({
            message: `¿Estás seguro de que deseas eliminar a ${prospecto.nombre}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await deleteProspecto(prospecto.id);
                    showSuccess(`${prospecto.nombre} fue eliminado.`, 'Prospecto eliminado');
                } catch (err) {
                    showError((err as Error).message ?? 'No se pudo eliminar.', 'Error al eliminar');
                }
            },
        });
    };

    const etapaDotColor: Record<string, string> = {
        'Atención': COLORS.blue, 'Interés': COLORS.yellow,
        'Deseo': COLORS.purple, 'Acción': COLORS.green,
    };

    return (
        <div>
            <ConfirmDialog />

            <PageHeader title="Prospectos" subtitle="Gestiona tus leads con metodología AIDA">
                <Button
                    label="Nuevo Prospecto"
                    icon="pi pi-plus"
                    className="p-button"
                    onClick={openModal}
                    iconPos="left"
                    style={{
                        backgroundColor: COLORS.red,
                        borderColor: COLORS.red,
                        borderRadius: '10px',
                        fontWeight: 600,
                        padding: '12px 28px',
                        fontSize: '0.95rem',
                    }}
                    pt={{ icon: { style: { fontSize: '1.1rem' } } }}
                />
            </PageHeader>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-3" style={{ marginTop: '8px' }}>
                {ETAPAS_AIDA.map(etapa => (
                    <div key={etapa} style={{ minWidth: '260px', flex: 1 }}>
                        {/* Column Header */}
                        <div className="flex align-items-center gap-2 mb-3">
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: etapaDotColor[etapa], flexShrink: 0 }} />
                            <span className="font-bold text-900" style={{ fontSize: '0.95rem' }}>{etapa}</span>
                            <span
                                className="font-semibold"
                                style={{
                                    fontSize: '0.78rem', color: etapaDotColor[etapa],
                                    backgroundColor: `${etapaDotColor[etapa]}18`,
                                    borderRadius: '999px', padding: '1px 8px',
                                }}
                            >
                                {grouped[etapa]?.length || 0}
                            </span>
                        </div>

                        {/* Cards */}
                        <div className="flex flex-column gap-2">
                            {(grouped[etapa] || []).length === 0 ? (
                                <div
                                    style={{
                                        background: COLORS.white, border: `1.5px dashed ${COLORS.gray200}`,
                                        borderRadius: '12px', padding: '24px',
                                        textAlign: 'center', color: COLORS.gray400, fontSize: '0.8rem',
                                    }}
                                >
                                    Sin prospectos
                                </div>
                            ) : (
                                grouped[etapa].map(prospecto => (
                                    <ProspectoCard
                                        key={prospecto.id}
                                        prospecto={prospecto}
                                        onEdit={setEditingProspecto}
                                        onDelete={handleDelete}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <NuevoProspectoModal visible={modalVisible} onHide={closeModal} onSave={handleSave} />

            {editingProspecto && (
                <EditarProspectoModal
                    prospecto={editingProspecto}
                    visible={!!editingProspecto}
                    onHide={() => setEditingProspecto(null)}
                    onSave={async (id, changes) => {
                        try {
                            await updateProspecto(id, changes);
                            setEditingProspecto(null);
                            showSuccess('Los datos del prospecto fueron actualizados.', 'Prospecto actualizado');
                        } catch (err) {
                            showError((err as Error).message ?? 'No se pudo actualizar.', 'Error al actualizar');
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ProspectosPage;
