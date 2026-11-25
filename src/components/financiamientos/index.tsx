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
    apiGetFinanciamientosAll,
    apiCreateFinanciamiento,
    apiUpdateFinanciamiento,
    apiDeleteFinanciamiento,
    Financiamiento
} from '@/services/api';

interface FinanciamientoForm {
    tipo: string;
    cuotas: number;
    producto: string;
    estado: boolean;
}

export const FinanciamientosPage: React.FC = () => {
    const [financiamientos, setFinanciamientos] = useState<Financiamiento[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingFin, setEditingFin] = useState<Financiamiento | null>(null);
    const { showSuccess, showError, showWarn } = useNotification();

    // Estado del Formulario
    const [form, setForm] = useState<FinanciamientoForm>({
        tipo: '',
        cuotas: 0,
        producto: 'vehiculo',
        estado: true
    });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGetFinanciamientosAll();
            setFinanciamientos(data || []);
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al cargar financiamientos');
        } finally {
            setLoading(false);
        }
    }, [showError, showWarn]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const filtered = (financiamientos || []).filter(f =>
        `${f.tipo} ${f.producto}`.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setEditingFin(null);
        setForm({
            tipo: '',
            cuotas: 0,
            producto: 'vehiculo',
            estado: true
        });
        setModalVisible(true);
    };

    const openEdit = (f: Financiamiento) => {
        setEditingFin(f);
        setForm({
            tipo: f.tipo || '',
            cuotas: f.cuotas || 0,
            producto: f.producto || 'vehiculo',
            estado: f.estado !== false
        });
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingFin(null);
    };

    const handleFormChange = (field: keyof FinanciamientoForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.tipo.trim()) {
            showError('El tipo/porcentaje de financiamiento es requerido.', 'Validación');
            return;
        }
        if (form.cuotas <= 0) {
            showError('El número de cuotas debe ser mayor a 0.', 'Validación');
            return;
        }

        setSaving(true);
        try {
            if (editingFin?.id) {
                await apiUpdateFinanciamiento(editingFin.id, form);
                showSuccess('Financiamiento actualizado correctamente.', 'Actualización exitosa');
            } else {
                await apiCreateFinanciamiento(form);
                showSuccess('Financiamiento creado correctamente.', 'Creación exitosa');
            }
            closeModal();
            fetchAll();
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al guardar financiamiento');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (f: Financiamiento) => {
        confirmDialog({
            message: `¿Estás seguro de eliminar el financiamiento "${f.tipo}"? Se eliminarán en cascada todos los detalles de listas de precios que usen este financiamiento.`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await apiDeleteFinanciamiento(f.id);
                    showSuccess(`El financiamiento "${f.tipo}" fue eliminado.`, 'Financiamiento eliminado');
                    fetchAll();
                } catch (err) {
                    notifyApiError(err, { showError, showWarn }, 'Error al eliminar financiamiento');
                }
            },
        });
    };

    const productoTemplate = (row: Financiamiento) => {
        const labels: Record<string, string> = {
            vehiculo: 'Vehículo',
            vivienda: 'Vivienda',
            remodelacion: 'Remodelación'
        };
        return <span>{labels[row.producto || ''] || row.producto}</span>;
    };

    const estadoTemplate = (row: Financiamiento) => (
        <span className={`inline-block px-3 py-1 text-xs font-bold border-round-xl ${row.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {row.estado ? 'ACTIVO' : 'INACTIVO'}
        </span>
    );

    const accionesTemplate = (row: Financiamiento) => (
        <div className="flex gap-1 justify-content-center">
            <Button
                icon="pi pi-pencil"
                text
                onClick={() => openEdit(row)}
                className="p-button-sm"
                style={{ color: COLORS.blue }}
                tooltip="Editar financiamiento"
                tooltipOptions={{ position: 'top' }}
            />
            <Button
                icon="pi pi-trash"
                text
                onClick={() => handleDelete(row)}
                className="p-button-sm"
                style={{ color: COLORS.red }}
                tooltip="Eliminar financiamiento"
                tooltipOptions={{ position: 'top' }}
            />
        </div>
    );

    return (
        <div className="p-4">
            <ConfirmDialog />

            <PageHeader title="Financiamientos" subtitle="Administra los porcentajes y cuotas del Compromiso de Oferta">
                <Button
                    label="Nuevo Financiamiento"
                    className="btn-brand"
                    icon="pi pi-plus"
                    onClick={openCreate}
                    style={{ backgroundColor: COLORS.red, borderColor: COLORS.red }}
                />
            </PageHeader>

            <div className="mb-4" style={{ maxWidth: '400px' }}>
                <SearchBar
                    placeholder="Buscar financiamientos..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="card shadow-2 border-round-2xl overflow-hidden bg-white">
                <DataTable
                    value={filtered}
                    loading={loading}
                    emptyMessage={<EmptyState message="No se encontraron financiamientos registrados" icon="pi-percentage" />}
                    paginator
                    rows={10}
                    className="datatable-premium"
                    stripedRows
                    rowHover
                    responsiveLayout="scroll"
                >
                    <Column header="Tipo / Porcentaje" field="tipo" sortable style={{ minWidth: '150px' }} />
                    <Column header="Cuotas" field="cuotas" sortable style={{ width: '120px' }} />
                    <Column header="Producto" body={productoTemplate} field="producto" sortable style={{ width: '180px' }} />
                    <Column header="Estado" body={estadoTemplate} field="estado" style={{ width: '120px' }} align="center" />
                    <Column header="Acciones" body={accionesTemplate} style={{ width: '120px' }} align="center" />
                </DataTable>
            </div>

            {/* Modal de Financiamiento */}
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
                            <i className="pi pi-percentage text-xl" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.15rem', color: COLORS.gray800 }}>
                                {editingFin ? 'Editar Financiamiento' : 'Nuevo Financiamiento'}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: COLORS.gray500, marginTop: '2px' }}>
                                {editingFin ? 'Actualiza la información del financiamiento registrado' : 'Agrega un nuevo porcentaje y cuotas asociadas'}
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
                            label={saving ? 'Guardando...' : (editingFin ? 'Guardar Cambios' : 'Crear Financiamiento')}
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
                        <label className="block text-900 font-bold mb-2">Porcentaje de Financiamiento *</label>
                        <InputText
                            value={form.tipo}
                            onChange={(e) => handleFormChange('tipo', e.target.value)}
                            placeholder="Ej: 20%"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-900 font-bold mb-2">Número de Cuotas *</label>
                        <InputNumber
                            value={form.cuotas}
                            onValueChange={(e) => handleFormChange('cuotas', e.value || 0)}
                            min={0}
                            placeholder="Ej: 12"
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
                            <div className="font-semibold text-800" style={{ fontSize: '0.92rem' }}>Financiamiento Activo</div>
                            <div className="text-500" style={{ fontSize: '0.78rem' }}>Habilitar o deshabilitar este financiamiento para cotizaciones</div>
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
