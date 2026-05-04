import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Chip } from 'primereact/chip';
import { PageHeader, SearchBar, EmptyState, Avatar } from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { UsuarioAPI, RolAPI } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { notifyApiError } from '@/utils/errorHelpers';
import { UsuarioModal, UsuarioForm } from './UsuarioModal';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, getRoles } from './services';
import { formatUserDisplayName } from '@/utils/formatters';

// ═══════════════════════════════════════════════════════════
// USUARIOS PAGE — CRUD
// ═══════════════════════════════════════════════════════════

export const UsuariosPage: React.FC = () => {
    const [usuarios, setUsuarios] = useState<UsuarioAPI[]>([]);
    const [roles, setRoles] = useState<RolAPI[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<UsuarioAPI | null>(null);
    const { showSuccess, showError, showWarn } = useNotification();

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [usrs, rols] = await Promise.all([getUsuarios(), getRoles()]);
            setUsuarios(usrs);
            setRoles(rols);
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const filtered = usuarios.filter(u =>
        `${u.nombres} ${u.apellidos} ${u.correo ?? u.email ?? ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => { setEditingUsuario(null); setModalVisible(true); };
    const openEdit = (u: UsuarioAPI) => { setEditingUsuario(u); setModalVisible(true); };
    const closeModal = () => { setModalVisible(false); setEditingUsuario(null); };

    const handleSave = async (form: UsuarioForm) => {
        setSaving(true);
        try {
            if (editingUsuario?.userID) {
                await updateUsuario(editingUsuario.userID, form as any);
                showSuccess('Usuario actualizado correctamente.', 'Usuario actualizado');
            } else {
                await createUsuario(form as any);
                showSuccess('Usuario creado correctamente.', 'Usuario creado');
            }
            closeModal();
            fetchAll();
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (u: UsuarioAPI) => {
        const formattedName = formatUserDisplayName(u.nombres, u.apellidos);
        confirmDialog({
            message: `¿Eliminar a ${formattedName}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await deleteUsuario(u.userID);
                    showSuccess(`${u.nombres} fue eliminado.`, 'Usuario eliminado');
                    fetchAll();
                } catch (err) {
                    notifyApiError(err, { showError, showWarn }, 'Error al eliminar');
                }
            },
        });
    };

    // ─── Column Templates ───
    const nameTemplate = (u: UsuarioAPI) => {
        const displayName = formatUserDisplayName(u.nombres, u.apellidos);
        return (
            <div className="flex align-items-center gap-2">
                <Avatar name={displayName} color={COLORS.red} />
                <div>
                    <div className="font-semibold text-900">{displayName}</div>
                    <div className="text-xs" style={{ color: COLORS.gray400 }}>{u.correo ?? u.email}</div>
                </div>
            </div>
        );
    };

    const estadoTemplate = (u: UsuarioAPI) => (
        <Chip
            label={u.estado === 'activo' ? 'Activo' : 'Inactivo'}
            icon={`pi ${u.estado === 'activo' ? 'pi-check-circle' : 'pi-times-circle'}`}
            style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                background: u.estado === 'activo' ? '#E8F5E9' : '#FFEBEE',
                color: u.estado === 'activo' ? '#2E7D32' : '#C62828'
            }}
        />
    );

    const rolTemplate = (u: UsuarioAPI) => (
        <Chip
            label={u.rol?.nombreRol ?? '—'}
            style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#E3F2FD',
                color: '#1565C0'
            }}
        />
    );

    const accionesTemplate = (u: UsuarioAPI) => (
        <div className="flex gap-1">
            <Button
                icon="pi pi-pencil"
                text
                className="p-button-sm"
                style={{ color: COLORS.blue }}
                onClick={() => openEdit(u)}
                tooltip="Editar"
                tooltipOptions={{ position: 'top' }}
            />
            <Button
                icon="pi pi-trash"
                text
                className="p-button-sm"
                style={{ color: COLORS.red }}
                onClick={() => handleDelete(u)}
                tooltip="Eliminar"
                tooltipOptions={{ position: 'top' }}
            />
        </div>
    );

    return (
        <div>
            <ConfirmDialog />

            <PageHeader title="Usuarios" subtitle="Gestión de usuarios del sistema">
                <Button
                    label="Nuevo Usuario"
                    className="btn-brand"
                    icon="pi pi-plus"
                    onClick={openCreate}

                />
            </PageHeader>

            {/* Barra de búsqueda */}
            <div className="mb-4" style={{ maxWidth: '360px' }}>
                <SearchBar
                    placeholder="Buscar por nombre o correo..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Tabla */}
            <div className="card shadow-1 border-round-xl overflow-hidden">
                <DataTable
                    value={filtered}
                    loading={loading}
                    emptyMessage={<EmptyState message="No hay usuarios registrados" icon="pi-users" />}
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
                    <Column header="Usuario" body={nameTemplate} style={{ minWidth: '240px' }} sortable field="nombres" alignHeader="left" />
                    <Column header="Estado" body={estadoTemplate} style={{ width: '120px' }} sortable field="estado" alignHeader="left" />
                    <Column header="Rol" body={rolTemplate} style={{ width: '160px' }} sortable field="rol.nombreRol" alignHeader="left" />
                    <Column header="Acciones" body={accionesTemplate} style={{ width: '100px' }} alignHeader="left" />
                </DataTable>
            </div>

            <UsuarioModal
                visible={modalVisible}
                onHide={closeModal}
                onSave={handleSave}
                usuario={editingUsuario}
                roles={roles}
                loading={saving}
            />
        </div>
    );
};

export default UsuariosPage;
