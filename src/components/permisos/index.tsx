import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Chip } from 'primereact/chip';
import { PageHeader, SearchBar, EmptyState, IconBox } from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { PermisoAPI, RolAPI } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { notifyApiError } from '@/utils/errorHelpers';
import { PermisoModal, PermisoForm } from './PermisoModal';
import { getPermisos, createPermiso, updatePermiso, deletePermiso, getRoles } from './services';

// ═══════════════════════════════════════════════════════════
// PERMISOS PAGE — CRUD
// ═══════════════════════════════════════════════════════════

export const PermisosPage: React.FC = () => {
    const [permisos, setPermisos] = useState<PermisoAPI[]>([]);
    const [roles, setRoles] = useState<RolAPI[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPermiso, setEditingPermiso] = useState<PermisoAPI | null>(null);
    const { showSuccess, showError, showWarn } = useNotification();

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [perms, rols] = await Promise.all([getPermisos(), getRoles()]);
            setPermisos(perms);
            setRoles(rols);
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al cargar permisos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const filtered = permisos.filter(p =>
        `${p.nombreAccion} ${p.identificadorAccion} ${p.role?.nombreRol ?? ''}`
            .toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => { setEditingPermiso(null); setModalVisible(true); };
    const openEdit = (p: PermisoAPI) => { setEditingPermiso(p); setModalVisible(true); };
    const closeModal = () => { setModalVisible(false); setEditingPermiso(null); };

    const handleSave = async (form: PermisoForm) => {
        setSaving(true);
        try {
            if (editingPermiso?.id) {
                await updatePermiso(editingPermiso.id, form);
                showSuccess('Permiso actualizado correctamente.', 'Permiso actualizado');
            } else {
                await createPermiso(form);
                showSuccess('Permiso creado correctamente.', 'Permiso creado');
            }
            closeModal();
            fetchAll();
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (p: PermisoAPI) => {
        confirmDialog({
            message: `¿Eliminar el permiso "${p.nombreAccion}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await deletePermiso(p.id);
                    showSuccess(`Permiso "${p.nombreAccion}" eliminado.`, 'Permiso eliminado');
                    fetchAll();
                } catch (err) {
                    notifyApiError(err, { showError, showWarn }, 'Error al eliminar');
                }
            },
        });
    };

    // ─── Column Templates ───
    const accionTemplate = (p: PermisoAPI) => (
        <div className="flex align-items-center gap-2">
            <IconBox icon="pi-key" color={COLORS.purple} bg={`${COLORS.purple}15`} size="32px" iconSize="0.85rem" rounded={false} className="border-round-lg flex-shrink-0" />
            <span className="font-semibold text-900">{p.nombreAccion}</span>
        </div>
    );

    const identificadorTemplate = (p: PermisoAPI) => (
        <code style={{
            background: COLORS.gray100,
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '0.82rem',
            color: COLORS.gray700,
            fontFamily: 'monospace',
        }}>
            {p.identificadorAccion}
        </code>
    );

    const rolTemplate = (p: PermisoAPI) => (
        <Chip
            label={p.role?.nombreRol ?? roles.find(r => r.id === p.roleId)?.nombreRol ?? '—'}
            icon="pi pi-shield"
            style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#E3F2FD',
                color: '#1565C0'
            }}
        />
    );

    const accionesTemplate = (p: PermisoAPI) => (
        <div className="flex gap-1">
            <Button icon="pi pi-pencil" text className="p-button-sm"
                style={{ color: COLORS.blue }} onClick={() => openEdit(p)}
                tooltip="Editar" tooltipOptions={{ position: 'top' }} />
            <Button icon="pi pi-trash" text className="p-button-sm"
                style={{ color: COLORS.red }} onClick={() => handleDelete(p)}
                tooltip="Eliminar" tooltipOptions={{ position: 'top' }} />
        </div>
    );

    return (
        <div>
            <ConfirmDialog />

            <PageHeader title="Permisos" subtitle="Gestión de permisos y acciones del sistema">
                <Button
                    label="Nuevo Permiso"
                    icon="pi pi-plus"
                    onClick={openCreate}
                    className="btn-brand"
                />
            </PageHeader>

            <div className="mb-4" style={{ maxWidth: '360px' }}>
                <SearchBar
                    placeholder="Buscar por nombre, identificador o rol..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Stats rápidas */}
            <div className="flex gap-3 mb-4 flex-wrap">
                {roles.map(r => {
                    const count = permisos.filter(p => p.roleId === r.id || p.role?.id === r.id).length;
                    return (
                        <div key={r.id} className="flex align-items-center gap-2 px-3 py-2 border-round-xl shadow-hover transition-all transition-duration-200"
                            style={{ background: COLORS.white, border: `1px solid ${COLORS.gray100}` }}>
                            <IconBox icon="pi-shield" color={COLORS.blue} bg={`${COLORS.blue}10`} size="28px" iconSize="0.75rem" rounded={false} className="border-round-lg" />
                            <span className="text-sm font-bold text-700">{r.nombreRol}</span>
                            <span className="text-xs px-2 py-1 border-round-lg font-bold"
                                style={{ background: `${COLORS.purple}15`, color: COLORS.purple, minWidth: '24px', textAlign: 'center' }}>
                                {count}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="card shadow-1 border-round-xl overflow-hidden">
                <DataTable
                    value={filtered}
                    loading={loading}
                    emptyMessage={<EmptyState message="No hay permisos registrados" icon="pi-key" />}
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
                    <Column header="Acción" body={accionTemplate} style={{ minWidth: '200px' }} sortable field="nombreAccion" alignHeader="left" />
                    <Column header="Identificador" body={identificadorTemplate} style={{ minWidth: '200px' }} sortable field="identificadorAccion" alignHeader="left" />
                    <Column header="Rol" body={rolTemplate} style={{ width: '160px' }} sortable field="role.nombreRol" alignHeader="left" />
                    <Column header="Acciones" body={accionesTemplate} style={{ width: '100px' }} alignHeader="left" />
                </DataTable>
            </div>

            <PermisoModal
                visible={modalVisible}
                onHide={closeModal}
                onSave={handleSave}
                permiso={editingPermiso}
                roles={roles}
                loading={saving}
            />
        </div>
    );
};

export default PermisosPage;
