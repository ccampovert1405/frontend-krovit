import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { PageHeader, SearchBar, EmptyState } from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { useNotification } from '@/context/NotificationContext';
import { notifyApiError } from '@/utils/errorHelpers';
import {
    apiGetPlazosAll,
    apiCreatePlazo,
    apiUpdatePlazo,
    apiDeletePlazo,
    Plazo
} from '@/services/api';

interface PlazoForm {
    tipo: string;
    num_plazo: number;
    producto: string;
    estado: boolean;
}

export const PlazosPage: React.FC = () => {
    const [plazos, setPlazos] = useState<Plazo[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPlazo, setEditingPlazo] = useState<Plazo | null>(null);
    const { showSuccess, showError, showWarn } = useNotification();

    // Estado del Formulario
    const [form, setForm] = useState<PlazoForm>({
        tipo: '',
        num_plazo: 0,
        producto: 'vehiculo',
        estado: true
    });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGetPlazosAll();
            setPlazos(data || []);
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al cargar plazos');
        } finally {
            setLoading(false);
        }
    }, [showError, showWarn]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const filtered = (plazos || []).filter(p =>
        `${p.tipo} ${p.producto}`.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setEditingPlazo(null);
        setForm({
            tipo: '',
            num_plazo: 0,
            producto: 'vehiculo',
            estado: true
        });
        setModalVisible(true);
    };

    const openEdit = (p: Plazo) => {
        setEditingPlazo(p);
        setForm({
            tipo: p.tipo || '',
            num_plazo: p.num_plazo || 0,
            producto: p.producto || 'vehiculo',
            estado: p.estado !== false
        });
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingPlazo(null);
    };

    const handleFormChange = (field: keyof PlazoForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.tipo.trim()) {
            showError('El nombre/tipo de plazo es requerido.', 'Validación');
            return;
        }
        if (form.num_plazo <= 0) {
            showError('El número de meses debe ser mayor a 0.', 'Validación');
            return;
        }

        setSaving(true);
        try {
            if (editingPlazo?.id) {
                await apiUpdatePlazo(editingPlazo.id, form);
                showSuccess('Plazo actualizado correctamente.', 'Actualización exitosa');
            } else {
                await apiCreatePlazo(form);
                showSuccess('Plazo creado correctamente.', 'Creación exitosa');
            }
            closeModal();
            fetchAll();
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al guardar plazo');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (p: Plazo) => {
        confirmDialog({
            message: `¿Estás seguro de eliminar el plazo "${p.tipo}"? Se eliminarán en cascada todos los detalles de listas de precios que usen este plazo.`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await apiDeletePlazo(p.id);
                    showSuccess(`El plazo "${p.tipo}" fue eliminado.`, 'Plazo eliminado');
                    fetchAll();
                } catch (err) {
                    notifyApiError(err, { showError, showWarn }, 'Error al eliminar plazo');
                }
            },
        });
    };

    const productoTemplate = (row: Plazo) => {
        const labels: Record<string, string> = {
            vehiculo: 'Vehículo',
            vivienda: 'Vivienda',
            remodelacion: 'Remodelación'
        };
        return <span>{labels[row.producto || ''] || row.producto}</span>;
    };

    const estadoTemplate = (row: Plazo) => (
        <span className={`inline-block px-3 py-1 text-xs font-bold border-round-xl ${row.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {row.estado ? 'ACTIVO' : 'INACTIVO'}
        </span>
    );

    const accionesTemplate = (row: Plazo) => (
        <div className="flex gap-1 justify-content-center">
            <Button
                icon="pi pi-pencil"
                text
                onClick={() => openEdit(row)}
                className="p-button-sm"
                style={{ color: COLORS.blue }}
                tooltip="Editar plazo"
                tooltipOptions={{ position: 'top' }}
            />
            <Button
                icon="pi pi-trash"
                text
                onClick={() => handleDelete(row)}
                className="p-button-sm"
                style={{ color: COLORS.red }}
                tooltip="Eliminar plazo"
                tooltipOptions={{ position: 'top' }}
            />
        </div>
    );

    return (
        <div className="p-4">
            <ConfirmDialog />

            <PageHeader title="Plazos" subtitle="Administra los meses y plazos disponibles para las cotizaciones">
                <Button
                    label="Nuevo Plazo"
                    className="btn-brand"
                    icon="pi pi-plus"
                    onClick={openCreate}
                    style={{ backgroundColor: COLORS.red, borderColor: COLORS.red }}
                />
            </PageHeader>

            <div className="mb-4" style={{ maxWidth: '400px' }}>
                <SearchBar
                    placeholder="Buscar plazos..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="card shadow-2 border-round-2xl overflow-hidden bg-white">
                <DataTable
                    value={filtered}
                    loading={loading}
                    emptyMessage={<EmptyState message="No se encontraron plazos registrados" icon="pi-clock" />}
                    paginator
                    rows={10}
                    className="datatable-premium"
                    stripedRows
                    rowHover
                    responsiveLayout="scroll"
                >
                    <Column header="Tipo / Etiqueta" field="tipo" sortable style={{ minWidth: '150px' }} />
                    <Column header="Meses" field="num_plazo" sortable style={{ width: '120px' }} />
                    <Column header="Producto" body={productoTemplate} field="producto" sortable style={{ width: '180px' }} />
                    <Column header="Estado" body={estadoTemplate} field="estado" style={{ width: '120px' }} align="center" />
                    <Column header="Acciones" body={accionesTemplate} style={{ width: '120px' }} align="center" />
                </DataTable>
            </div>

            {/* Modal de Plazo */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-3">
                        <div
                            className="flex align-items-center justify-content-center border-round-xl"
                            style={{
                                width: '3rem',
                                height: '3rem',
                                backgroundColor: COLORS.redLight,
                                color: COLORS.red
                            }}
                        >
                            <i className="pi pi-clock text-xl" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.15rem', color: COLORS.gray800 }}>
                                {editingPlazo ? 'Editar Plazo' : 'Nuevo Plazo'}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: COLORS.gray500, marginTop: '2px' }}>
                                {editingPlazo ? 'Actualiza la información del plazo registrado' : 'Agrega un nuevo plazo para cotizaciones'}
                            </div>
                        </div>
                    </div>
                }
                visible={modalVisible}
                onHide={closeModal}
                footer={
                    <div className="flex justify-content-end gap-3" style={{ padding: '8px 0' }}>
                        <Button
                            label="Cancelar"
                            onClick={closeModal}
                            outlined
                            style={{ borderColor: COLORS.red, color: COLORS.red, borderRadius: '10px', fontWeight: 600, padding: '10px 24px' }}
                        />
                        <Button
                            label={saving ? 'Guardando...' : (editingPlazo ? 'Guardar Cambios' : 'Crear Plazo')}
                            icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                            onClick={handleSave}
                            disabled={saving || !form.tipo}
                            style={{ backgroundColor: COLORS.red, borderColor: COLORS.red, borderRadius: '10px', fontWeight: 600, padding: '10px 24px' }}
                        />
                    </div>
                }
                style={{ width: '500px', borderRadius: '16px' }}
                modal
                className="p-fluid"
                draggable={false}
                resizable={false}
            >
                <form onSubmit={handleSave} className="flex flex-column gap-3 mt-3">
                    <div>
                        <label className="block text-900 font-bold mb-2">Etiqueta del Plazo *</label>
                        <InputText
                            value={form.tipo}
                            onChange={(e) => handleFormChange('tipo', e.target.value)}
                            placeholder="Ej: 60 meses"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-900 font-bold mb-2">Número de Meses *</label>
                        <InputNumber
                            value={form.num_plazo}
                            onValueChange={(e) => handleFormChange('num_plazo', e.value || 0)}
                            min={0}
                            placeholder="Ej: 60"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-900 font-bold mb-2">Producto *</label>
                        <Dropdown
                            value={form.producto}
                            options={[
                                { label: 'Vehículo', value: 'vehiculo' },
                                { label: 'Vivienda', value: 'vivienda' },
                                { label: 'Remodelación', value: 'remodelacion' }
                            ]}
                            onChange={(e) => handleFormChange('producto', e.value)}
                            placeholder="Selecciona el producto"
                        />
                    </div>

                    <div className="flex align-items-center gap-3 p-3 surface-50 border-round-xl mt-2">
                        <div className="flex-1">
                            <div className="font-semibold text-800" style={{ fontSize: '0.92rem' }}>Plazo Activo</div>
                            <div className="text-500" style={{ fontSize: '0.78rem' }}>Habilitar o deshabilitar este plazo para nuevas cotizaciones</div>
                        </div>
                        <InputSwitch
                            checked={form.estado}
                            onChange={(e) => handleFormChange('estado', e.value)}
                        />
                    </div>
                </form>
            </Dialog>
        </div>
    );
};
