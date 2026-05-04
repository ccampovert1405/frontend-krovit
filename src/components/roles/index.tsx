import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Chip } from 'primereact/chip';
import { PageHeader, SearchBar, EmptyState, IconBox } from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { RolAPI } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { notifyApiError } from '@/utils/errorHelpers';
import { RolModal, RolForm } from './RolModal';
import { getRoles, getRolById, createRol, updateRol, deleteRol } from './services';

// ═══════════════════════════════════════════════════════════
// ROLES PAGE — CRUD
// ═══════════════════════════════════════════════════════════

export const RolesPage: React.FC = () => {
    const [roles, setRoles] = useState<RolAPI[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRol, setEditingRol] = useState<RolAPI | null>(null);
    const [expandedRows, setExpandedRows] = useState<any>(null);
    const { showSuccess, showError, showWarn } = useNotification();

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getRoles();
            setRoles(data);
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al cargar roles');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const filtered = roles.filter(r =>
        r.nombreRol.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => { setEditingRol(null); setModalVisible(true); };
    const openEdit = async (r: RolAPI) => {
        try {
            // Intentar obtener el rol completo con permisos
            const full = await getRolById(r.id);
            setEditingRol(full);
        } catch {
            setEditingRol(r);
        }
        setModalVisible(true);
    };
    const closeModal = () => { setModalVisible(false); setEditingRol(null); };

    const handleSave = async (form: RolForm) => {
        setSaving(true);
        try {
            if (editingRol?.id) {
                await updateRol(editingRol.id, form);
                showSuccess('Rol actualizado correctamente.', 'Rol actualizado');
            } else {
                await createRol(form);
                showSuccess('Rol creado correctamente.', 'Rol creado');
            }
            closeModal();
            fetchAll();
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (r: RolAPI) => {
        confirmDialog({
            message: `¿Eliminar el rol "${r.nombreRol}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await deleteRol(r.id);
                    showSuccess(`Rol "${r.nombreRol}" eliminado.`, 'Rol eliminado');
                    fetchAll();
                } catch (err) {
                    notifyApiError(err, { showError, showWarn }, 'Error al eliminar');
                }
            },
        });
    };

    // ─── Column Templates ───
    const nombreTemplate = (r: RolAPI) => (
        <div className="flex align-items-center gap-2">
            <IconBox icon="pi-shield" color={COLORS.purple} bg={`${COLORS.purple}15`} size="32px" iconSize="0.85rem" rounded={false} className="border-round-lg flex-shrink-0" />
            <span className="font-semibold text-900">{r.nombreRol}</span>
        </div>
    );

    const permisosCountTemplate = (r: RolAPI) => (
        <Chip
            label={`${r.permisos?.length ?? 0} permisos`}
            icon="pi pi-key"
            style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#F1F8E9',
                color: '#33691E'
            }}
        />
    );

    const accionesTemplate = (r: RolAPI) => (
        <div className="flex gap-1">
            <Button icon="pi pi-pencil" text className="p-button-sm"
                style={{ color: COLORS.blue }} onClick={() => openEdit(r)}
                tooltip="Editar" tooltipOptions={{ position: 'top' }} />
            <Button icon="pi pi-trash" text className="p-button-sm"
                style={{ color: COLORS.red }} onClick={() => handleDelete(r)}
                tooltip="Eliminar" tooltipOptions={{ position: 'top' }} />
        </div>
    );

    // Row expansion: permisos del rol
    const rowExpansionTemplate = (r: RolAPI) => {
        const permisos = r.permisos ?? [];
        if (permisos.length === 0) {
            return (
                <div className="px-4 py-3" style={{ color: COLORS.gray400, fontSize: '0.85rem' }}>
                    <i className="pi pi-info-circle mr-2" />
                    Sin permisos asignados
                </div>
            );
        }
        return (
            <div className="px-4 py-3">
                <div className="text-xs font-bold uppercase mb-2"
                    style={{ color: COLORS.gray400, letterSpacing: '1px' }}>
                    Permisos asignados
                </div>
                <div className="flex flex-wrap gap-2">
                    {permisos.map(p => (
                        <span
                            key={p.id}
                            className="px-2 py-1 border-round-lg text-xs font-semibold"
                            title={p.identificadorAccion}
                            style={{
                                background: `${COLORS.purple}15`,
                                color: COLORS.purple,
                                border: `1px solid ${COLORS.purple}30`,
                            }}
                        >
                            <i className="pi pi-key mr-1" style={{ fontSize: '0.65rem' }} />
                            {p.nombreAccion}
                            <span style={{ opacity: 0.6, marginLeft: '4px' }}>({p.identificadorAccion})</span>
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div>
            <ConfirmDialog />

            <PageHeader title="Roles" subtitle="Gestión de roles del sistema">
                <Button
                    label="Nuevo Rol"
                    icon="pi pi-plus"
                    onClick={openCreate}
                    className="btn-brand"
                />
            </PageHeader>

            <div className="mb-4" style={{ maxWidth: '360px' }}>
                <SearchBar
                    placeholder="Buscar rol..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Tabla */}
            <div className="card shadow-1 border-round-xl overflow-hidden">
                <DataTable
                    value={filtered}
                    loading={loading}
                    emptyMessage={<EmptyState message="No hay roles registrados" icon="pi-shield" />}
                    expandedRows={expandedRows}
                    onRowToggle={e => setExpandedRows(e.data)}
                    rowExpansionTemplate={rowExpansionTemplate}
                    dataKey="id"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[10, 20, 50]}
                    stripedRows
                    rowHover
                    removableSort
                    sortMode="multiple"
                    className="datatable-premium"
                    responsiveLayout="scroll"
                >
                    <Column expander style={{ width: '48px' }} />
                    <Column header="Nombre del Rol" body={nombreTemplate} style={{ minWidth: '200px' }} sortable field="nombreRol" alignHeader="left" />
                    <Column header="Permisos" body={permisosCountTemplate} style={{ width: '140px' }} sortable field="permisos.length" alignHeader="left" />
                    <Column header="Acciones" body={accionesTemplate} style={{ width: '100px' }} alignHeader="left" />
                </DataTable>
            </div>

            <RolModal
                visible={modalVisible}
                onHide={closeModal}
                onSave={handleSave}
                rol={editingRol}
                loading={saving}
            />
        </div>
    );
};

export default RolesPage;
