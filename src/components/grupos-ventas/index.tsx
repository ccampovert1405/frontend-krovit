import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { PageHeader, SearchBar, EmptyState, Avatar } from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { GrupoVentasAPI, UsuarioAPI, AgenciaAPI } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { notifyApiError } from '@/utils/errorHelpers';
import { GrupoVentasModal, GrupoVentasForm } from './GrupoVentasModal';
import { getGruposVentas, createGrupoVentas, updateGrupoVentas, deleteGrupoVentas, getUsuarios, assignAgentesToGrupo, getAgencias } from './services';

// ═══════════════════════════════════════════════════════════
// GRUPOS DE VENTAS PAGE — CRUD
// ═══════════════════════════════════════════════════════════

export const GruposVentasPage: React.FC = () => {
    const [grupos, setGrupos] = useState<GrupoVentasAPI[]>([]);
    const [usuarios, setUsuarios] = useState<UsuarioAPI[]>([]);
    const [agencias, setAgencias] = useState<AgenciaAPI[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingGrupo, setEditingGrupo] = useState<GrupoVentasAPI | null>(null);
    const { showSuccess, showError, showWarn } = useNotification();

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [grps, usrs, ags] = await Promise.all([getGruposVentas(), getUsuarios(), getAgencias()]);
            setGrupos(grps || []);
            setUsuarios(usrs || []);
            setAgencias(ags || []);
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al cargar grupos');
        } finally {
            setLoading(false);
        }
    }, [showError, showWarn]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const filtered = (grupos || []).filter(g =>
        `${g.nombre} ${g.descripcion ?? ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => { setEditingGrupo(null); setModalVisible(true); };
    const openEdit = (g: GrupoVentasAPI) => { setEditingGrupo(g); setModalVisible(true); };
    const closeModal = () => { setModalVisible(false); setEditingGrupo(null); };

    const handleSave = async (form: GrupoVentasForm) => {
        setSaving(true);
        try {
            const { agenteIds, ...basicInfo } = form;
            let grupoId: string | number;

            if (editingGrupo?.id) {
                await updateGrupoVentas(editingGrupo.id, basicInfo as any);
                grupoId = editingGrupo.id;
                showSuccess('Información del grupo actualizada.', 'Grupo actualizado');
            } else {
                const newGrupo = await createGrupoVentas(basicInfo as any);
                grupoId = newGrupo.id;
                showSuccess('Grupo creado correctamente.', 'Grupo creado');
            }

            // Asignar agentes (PATCH)
            if (agenteIds && agenteIds.length >= 0) {
                await assignAgentesToGrupo(grupoId, agenteIds);
            }

            closeModal();
            fetchAll();
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al guardar grupo');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (g: GrupoVentasAPI) => {
        confirmDialog({
            message: `¿Eliminar el grupo "${g.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await deleteGrupoVentas(g.id);
                    showSuccess(`El grupo "${g.nombre}" fue eliminado.`, 'Grupo eliminado');
                    fetchAll();
                } catch (err) {
                    notifyApiError(err, { showError, showWarn }, 'Error al eliminar');
                }
            },
        });
    };

    // ─── Templates ───

    const grupoTemplate = (g: GrupoVentasAPI) => (
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
                <i className="pi pi-sitemap text-2xl" />
            </div>
            <div>
                <div className="flex align-items-center gap-2">
                    <div className="font-bold text-900 text-lg">{g.nombre}</div>
                    {g.leads && <Tag value="Leads" severity="success" style={{ fontSize: '0.65rem' }} />}
                </div>
                <div className="text-sm text-500 line-height-2">{g.descripcion || 'Sin descripción'}</div>
            </div>
        </div>
    );

    const agentesTemplate = (g: GrupoVentasAPI) => {
        const count = g.agentes?.length || 0;
        if (count === 0) return <span className="text-400 italic">Sin agentes</span>;
        
        return (
            <div className="flex flex-column gap-1">
                <div className="flex align-items-center gap-1">
                    <Tag value={`${count} ${count === 1 ? 'Agente' : 'Agentes'}`} severity="info" rounded />
                </div>
                <div className="flex -space-x-2 overflow-hidden py-1">
                    {g.agentes?.slice(0, 3).map((a, i) => (
                        <Avatar 
                            key={a.userID} 
                            name={`${a.nombres} ${a.apellidos}`} 
                            size="normal"
                            style={{ border: '2px solid white', marginLeft: i > 0 ? '-8px' : '0' }}
                        />
                    ))}
                    {count > 3 && (
                        <div 
                            className="flex align-items-center justify-content-center bg-gray-200 text-600 font-bold border-round-circle text-xs"
                            style={{ width: '24px', height: '24px', border: '2px solid white', marginLeft: '-8px' }}
                        >
                            +{count - 3}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const accionesTemplate = (g: GrupoVentasAPI) => (
        <div className="flex gap-1">
            <Button
                icon="pi pi-pencil"
                text
                onClick={() => openEdit(g)}
                className="p-button-sm"
                style={{ color: COLORS.blue }}
                tooltip="Editar grupo"
                tooltipOptions={{ position: 'top' }}
            />
            <Button
                icon="pi pi-trash"
                text
                onClick={() => handleDelete(g)}
                className="p-button-sm"
                style={{ color: COLORS.red }}
                tooltip="Eliminar grupo"
                tooltipOptions={{ position: 'top' }}
            />
        </div>
    );

    return (
        <div className="p-4">
            <ConfirmDialog />

            <PageHeader title="Grupos de Ventas" subtitle="Crea y gestiona equipos comerciales">
                <Button
                    label="Nuevo Grupo"
                    className="btn-brand"
                    icon="pi pi-plus"
                    onClick={openCreate}
                />
            </PageHeader>

            <div className="mb-4" style={{ maxWidth: '400px' }}>
                <SearchBar
                    placeholder="Buscar grupos por nombre..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="card shadow-2 border-round-2xl overflow-hidden bg-white">
                <DataTable
                    value={filtered}
                    loading={loading}
                    emptyMessage={<EmptyState message="No se encontraron grupos de ventas" icon="pi-sitemap" />}
                    paginator
                    rows={10}
                    className="datatable-premium"
                    stripedRows
                    rowHover
                    responsiveLayout="scroll"
                >
                    <Column header="Grupo / Equipo" body={grupoTemplate} field="nombre" sortable />
                    <Column 
                        header="Agencia" 
                        field="agencia" 
                        body={(g: GrupoVentasAPI) => g.agencia ? (
                            <Tag 
                                value={g.agencia.nombre} 
                                severity="warning" 
                                style={{ backgroundColor: COLORS.yellowLight, color: COLORS.yellow }} 
                            />
                        ) : (
                            <span className="text-400 italic">No asignada</span>
                        )} 
                        sortable 
                        style={{ width: '180px' }} 
                    />
                    <Column header="Agentes Asignados" body={agentesTemplate} style={{ width: '250px' }} />
                    <Column 
                        header="Gestión de Leads" 
                        body={(g: GrupoVentasAPI) => (
                            <Tag 
                                value={g.leads ? 'SÍ' : 'NO'} 
                                severity={g.leads ? 'success' : 'secondary'} 
                                style={{ borderRadius: '6px', padding: '4px 12px' }}
                            />
                        )} 
                        style={{ width: '150px' }} 
                        align="center" 
                    />
                    <Column header="Acciones" body={accionesTemplate} style={{ width: '120px' }} align="center" />
                </DataTable>
            </div>

            <GrupoVentasModal
                visible={modalVisible}
                onHide={closeModal}
                onSave={handleSave}
                grupo={editingGrupo}
                usuarios={usuarios}
                agencias={agencias}
                loading={saving}
            />
        </div>
    );
};

export default GruposVentasPage;
