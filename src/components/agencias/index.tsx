import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { PageHeader, SearchBar, EmptyState, Avatar } from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { AgenciaAPI, UsuarioAPI, apiGetAgencias, apiGetUsers, apiCreateAgencia, apiUpdateAgencia, apiDeleteAgencia } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { notifyApiError } from '@/utils/errorHelpers';
import { AgenciaModal, AgenciaForm } from './AgenciaModal';

export const AgenciasPage: React.FC = () => {
    const [agencias, setAgencias] = useState<AgenciaAPI[]>([]);
    const [usuarios, setUsuarios] = useState<UsuarioAPI[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAgencia, setEditingAgencia] = useState<AgenciaAPI | null>(null);
    const { showSuccess, showError, showWarn } = useNotification();

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [agenciesList, usersList] = await Promise.all([
                apiGetAgencias(),
                apiGetUsers()
            ]);
            setAgencias(agenciesList || []);
            setUsuarios(usersList || []);
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al cargar agencias');
        } finally {
            setLoading(false);
        }
    }, [showError, showWarn]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const filtered = (agencias || []).filter(a =>
        `${a.nombre} ${a.direccion ?? ''} ${a.telefono ?? ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setEditingAgencia(null);
        setModalVisible(true);
    };

    const openEdit = (a: AgenciaAPI) => {
        setEditingAgencia(a);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingAgencia(null);
    };

    const handleSave = async (form: AgenciaForm) => {
        setSaving(true);
        try {
            if (editingAgencia?.id) {
                await apiUpdateAgencia(editingAgencia.id, form as any);
                showSuccess('Agencia actualizada exitosamente.', 'Agencia actualizada');
            } else {
                await apiCreateAgencia(form as any);
                showSuccess('Agencia creada correctamente.', 'Agencia creada');
            }
            closeModal();
            fetchAll();
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al guardar agencia');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (a: AgenciaAPI) => {
        confirmDialog({
            message: `¿Eliminar la agencia "${a.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await apiDeleteAgencia(a.id);
                    showSuccess(`La agencia "${a.nombre}" fue eliminada.`, 'Agencia eliminada');
                    fetchAll();
                } catch (err) {
                    notifyApiError(err, { showError, showWarn }, 'Error al eliminar');
                }
            },
        });
    };

    // ─── Templates ───

    const agenciaTemplate = (a: AgenciaAPI) => (
        <div className="flex align-items-center gap-3">
            <div
                className="flex align-items-center justify-content-center border-round-xl"
                style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    backgroundColor: COLORS.redLight,
                    color: COLORS.red
                }}
            >
                <i className="pi pi-building text-2xl" />
            </div>
            <div>
                <div className="font-bold text-900 text-lg">{a.nombre}</div>
                <div className="text-sm text-500 line-height-2">{a.direccion || 'Sin dirección'}</div>
            </div>
        </div>
    );

    const encargadoTemplate = (a: AgenciaAPI) => {
        if (!a.encargado) return <span className="text-400 italic">Sin encargado</span>;
        return (
            <div className="flex align-items-center gap-2">
                <Avatar 
                    name={`${a.encargado.nombres} ${a.encargado.apellidos}`} 
                    size="normal"
                />
                <div className="flex flex-column">
                    <span className="font-semibold text-800">{a.encargado.nombres} {a.encargado.apellidos}</span>
                    <span className="text-xs text-500">{a.encargado.correo || a.encargado.email}</span>
                </div>
            </div>
        );
    };

    const accionesTemplate = (a: AgenciaAPI) => (
        <div className="flex gap-1">
            <Button
                icon="pi pi-pencil"
                text
                onClick={() => openEdit(a)}
                className="p-button-sm"
                style={{ color: COLORS.blue }}
                tooltip="Editar agencia"
                tooltipOptions={{ position: 'top' }}
            />
            <Button
                icon="pi pi-trash"
                text
                onClick={() => handleDelete(a)}
                className="p-button-sm"
                style={{ color: COLORS.red }}
                tooltip="Eliminar agencia"
                tooltipOptions={{ position: 'top' }}
            />
        </div>
    );

    return (
        <div className="p-4">
            <ConfirmDialog />

            <PageHeader title="Agencias" subtitle="Administración de sucursales y encargados comerciales">
                <Button
                    label="Nueva Agencia"
                    className="btn-brand"
                    icon="pi pi-plus"
                    onClick={openCreate}
                />
            </PageHeader>

            <div className="mb-4" style={{ maxWidth: '400px' }}>
                <SearchBar
                    placeholder="Buscar agencias por nombre, dirección o teléfono..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading && agencias.length === 0 ? (
                <div className="card p-6 flex justify-content-center align-items-center">
                    <i className="pi pi-spin pi-spinner text-4xl" style={{ color: COLORS.red }} />
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    message={search ? 'No se encontraron resultados' : 'No hay agencias creadas. Comienza registrando tu primera sucursal comercial.'}
                    icon="pi-building"
                />
            ) : (
                <div className="card shadow-1 border-round-xl overflow-hidden bg-white">
                    <DataTable
                        value={filtered}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 20]}
                        className="p-datatable-sm"
                        rowHover
                        responsiveLayout="scroll"
                        style={{ fontSize: '0.92rem' }}
                    >
                        <Column 
                            header="Agencia" 
                            body={agenciaTemplate} 
                            style={{ minWidth: '250px', padding: '16px' }} 
                        />
                        <Column 
                            header="Encargado" 
                            body={encargadoTemplate} 
                            style={{ minWidth: '220px', padding: '16px' }} 
                        />
                        <Column 
                            field="telefono" 
                            header="Teléfono" 
                            body={(a: AgenciaAPI) => a.telefono || <span className="text-300">-</span>}
                            style={{ minWidth: '150px', padding: '16px' }} 
                        />
                        <Column 
                            body={accionesTemplate} 
                            style={{ width: '100px', textAlign: 'center', padding: '16px' }} 
                        />
                    </DataTable>
                </div>
            )}

            <AgenciaModal
                visible={modalVisible}
                onHide={closeModal}
                onSave={handleSave}
                agencia={editingAgencia}
                usuarios={usuarios}
                loading={saving}
            />
        </div>
    );
};
