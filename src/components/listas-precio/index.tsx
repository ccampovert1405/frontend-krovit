import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Checkbox } from 'primereact/checkbox';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { PageHeader, SearchBar, EmptyState } from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { useNotification } from '@/context/NotificationContext';
import { notifyApiError } from '@/utils/errorHelpers';
import {
    apiGetListaPrecio,
    apiCreateListaPrecio,
    apiUpdateListaPrecio,
    apiDeleteListaPrecio,
    apiGetPlazoPorProducto,
    apiGetFinanciamientoPorProducto,
    ListaPrecio,
    Plazo,
    Financiamiento
} from '@/services/api';

interface DetalleForm {
    id?: number;
    monto: number;
    monto_final: number;
    valor_inscripcion: number;
    cuotas?: Record<number, number>; // plazoId -> valor_cuota
}

interface ListaPrecioForm {
    detalle: string;
    producto: string;
    estado: boolean;
    selectedPlazoIds: number[];
    selectedFinanciamientoIds: number[];
    plazoReferenciaId: number | null;
    detalles: DetalleForm[];
}

export const ListasPrecioPage: React.FC = () => {
    const [listas, setListas] = useState<ListaPrecio[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingLista, setEditingLista] = useState<ListaPrecio | null>(null);
    const { showSuccess, showError, showWarn } = useNotification();

    // Plazos y financiamientos cargados dinámicamente según el producto
    const [availablePlazos, setAvailablePlazos] = useState<Plazo[]>([]);
    const [availableFinanciamientos, setAvailableFinanciamientos] = useState<Financiamiento[]>([]);

    // Estado del Formulario
    const [form, setForm] = useState<ListaPrecioForm>({
        detalle: '',
        producto: 'vehiculo',
        estado: true,
        selectedPlazoIds: [],
        selectedFinanciamientoIds: [],
        plazoReferenciaId: null,
        detalles: [{ monto: 0, monto_final: 0, valor_inscripcion: 0, cuotas: {} }]
    });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGetListaPrecio();
            setListas(data || []);
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al cargar listas de precio');
        } finally {
            setLoading(false);
        }
    }, [showError, showWarn]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Cargar plazos y financiamientos disponibles cuando cambie el producto en el formulario
    useEffect(() => {
        if (!modalVisible) return;
        
        const loadProductMetadata = async () => {
            try {
                const [plazos, fins] = await Promise.all([
                    apiGetPlazoPorProducto(form.producto),
                    apiGetFinanciamientoPorProducto(form.producto)
                ]);
                setAvailablePlazos(plazos || []);
                setAvailableFinanciamientos(fins || []);
                
                // Si es una creación, dejar vacíos por defecto para que el usuario los elija explícitamente
                if (!editingLista) {
                    setForm(prev => ({
                        ...prev,
                        selectedPlazoIds: [],
                        selectedFinanciamientoIds: [],
                        plazoReferenciaId: null
                    }));
                }
            } catch (err) {
                console.error('Error al cargar plazos o financiamientos', err);
            }
        };

        loadProductMetadata();
    }, [form.producto, modalVisible, editingLista]);

    const filtered = (listas || []).filter(l =>
        `${l.detalle} ${l.producto}`.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setEditingLista(null);
        setForm({
            detalle: '',
            producto: 'vehiculo',
            estado: true,
            selectedPlazoIds: [],
            selectedFinanciamientoIds: [],
            plazoReferenciaId: null,
            detalles: [{ monto: 0, monto_final: 0, valor_inscripcion: 0, cuotas: {} }]
        });
        setModalVisible(true);
    };

    const openEdit = (l: ListaPrecio) => {
        setEditingLista(l);
        
        // Determinar plazos y financiamientos activos en esta lista
        const activePlazoIdsSet = new Set<number>();
        const activeFinIdsSet = new Set<number>();
        
        l.detalles?.forEach(d => {
            d.detalles_plazo?.forEach((dp: any) => {
                if (dp.plazo?.id) activePlazoIdsSet.add(dp.plazo.id);
            });
            d.detalles_financiamiento?.forEach((df: any) => {
                if (df.financiamiento?.id) activeFinIdsSet.add(df.financiamiento.id);
            });
        });

        const activePlazoIds = Array.from(activePlazoIdsSet);
        const activeFinIds = Array.from(activeFinIdsSet);

        // Mapear los detalles existentes
        const mappedDetalles = (l.detalles || []).map(d => {
            const cuotasMap: Record<number, number> = {};
            d.detalles_plazo?.forEach((dp: any) => {
                if (dp.plazo?.id) {
                    cuotasMap[dp.plazo.id] = Number(dp.valor_cuota) || 0;
                }
            });

            return {
                id: d.id,
                monto: Number(d.monto) || 0,
                monto_final: Number(d.monto_final) || 0,
                valor_inscripcion: Number(d.valor_inscripcion) || 0,
                cuotas: cuotasMap
            };
        });

        setForm({
            detalle: l.detalle || '',
            producto: l.producto || 'vehiculo',
            estado: l.estado !== false,
            selectedPlazoIds: activePlazoIds,
            selectedFinanciamientoIds: activeFinIds,
            plazoReferenciaId: activePlazoIds[0] || null,
            detalles: mappedDetalles.length > 0 ? mappedDetalles : [{ monto: 0, monto_final: 0, valor_inscripcion: 0, cuotas: {} }]
        });
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingLista(null);
    };

    const handleFormChange = (field: keyof ListaPrecioForm, value: any) => {
        setForm(prev => {
            const newForm = { ...prev, [field]: value };
            // Si cambia producto, reseteamos las selecciones
            if (field === 'producto') {
                newForm.selectedPlazoIds = [];
                newForm.selectedFinanciamientoIds = [];
                newForm.plazoReferenciaId = null;
            }
            return newForm;
        });
    };

    const handleDetailChange = (index: number, field: keyof DetalleForm, value: number) => {
        setForm(prev => {
            const newDetalles = [...prev.detalles];
            newDetalles[index] = { ...newDetalles[index], [field]: value };
            return { ...prev, detalles: newDetalles };
        });
    };

    const handleCuotaChange = (detailIndex: number, plazoId: number, value: number) => {
        setForm(prev => {
            const newDetalles = [...prev.detalles];
            const currentCuotas = newDetalles[detailIndex].cuotas || {};
            newDetalles[detailIndex] = {
                ...newDetalles[detailIndex],
                cuotas: {
                    ...currentCuotas,
                    [plazoId]: value
                }
            };
            return { ...prev, detalles: newDetalles };
        });
    };

    const handlePlazoCheckbox = (plazoId: number, checked: boolean) => {
        setForm(prev => {
            let nextPlazos = [...prev.selectedPlazoIds];
            if (checked) {
                if (!nextPlazos.includes(plazoId)) nextPlazos.push(plazoId);
            } else {
                nextPlazos = nextPlazos.filter(id => id !== plazoId);
            }
            
            // Ajustar plazo de referencia si el actual es deseleccionado
            let nextRef = prev.plazoReferenciaId;
            if (!nextPlazos.includes(nextRef as number)) {
                nextRef = nextPlazos[0] || null;
            }

            return {
                ...prev,
                selectedPlazoIds: nextPlazos,
                plazoReferenciaId: nextRef
            };
        });
    };

    const handleFinanciamientoCheckbox = (finId: number, checked: boolean) => {
        setForm(prev => {
            let nextFins = [...prev.selectedFinanciamientoIds];
            if (checked) {
                if (!nextFins.includes(finId)) nextFins.push(finId);
            } else {
                nextFins = nextFins.filter(id => id !== finId);
            }
            return {
                ...prev,
                selectedFinanciamientoIds: nextFins
            };
        });
    };

    const addDetailRow = () => {
        setForm(prev => ({
            ...prev,
            detalles: [...prev.detalles, { monto: 0, monto_final: 0, valor_inscripcion: 0, cuotas: {} }]
        }));
    };

    const removeDetailRow = (index: number) => {
        setForm(prev => {
            if (prev.detalles.length <= 1) {
                showWarn('La lista de precios debe tener al menos un registro de detalle.', 'Fila requerida');
                return prev;
            }
            return {
                ...prev,
                detalles: prev.detalles.filter((_, i) => i !== index)
            };
        });
    };

    const calculateFinancingVal = (detail: DetalleForm, finId: number): number => {
        if (!form.plazoReferenciaId) return 0;
        const refPlazo = availablePlazos.find(p => p.id === form.plazoReferenciaId);
        const refFin = availableFinanciamientos.find(f => f.id === finId);
        if (!refPlazo || !refFin) return 0;

        const numPlazo = Number(refPlazo.num_plazo) || 0;
        // Parsear el tipo de financiamiento (ej: "20%" -> 20)
        const finPct = parseFloat(refFin.tipo) || 0;
        
        // Multiplicación redondeada a entero del plazo y financiamiento
        const mesesFin = Math.round(numPlazo * (finPct / 100));
        
        const valorCuota = detail.cuotas?.[form.plazoReferenciaId] || 0;
        
        return mesesFin * valorCuota;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.detalle.trim()) {
            showError('El nombre de la lista de precio es requerido.', 'Validación');
            return;
        }

        if (form.selectedPlazoIds.length === 0) {
            showError('Debe seleccionar al menos un plazo.', 'Validación');
            return;
        }

        // Validación de detalles
        const invalidDetail = form.detalles.some(d => d.monto <= 0 || d.valor_inscripcion <= 0);
        if (invalidDetail) {
            showError('Todos los registros de detalle deben tener valores mayores a 0.', 'Validación');
            return;
        }

        // Validación de cuotas ingresadas
        let invalidCuota = false;
        form.detalles.forEach(d => {
            form.selectedPlazoIds.forEach(pId => {
                const c = d.cuotas?.[pId] || 0;
                if (c <= 0) invalidCuota = true;
            });
        });
        if (invalidCuota) {
            showError('Todas las cuotas de los plazos seleccionados deben ser mayores a 0.', 'Validación');
            return;
        }

        if (form.selectedFinanciamientoIds.length > 0 && !form.plazoReferenciaId) {
            showError('Debe seleccionar un plazo de referencia para los cálculos de financiamiento.', 'Validación');
            return;
        }

        setSaving(true);
        try {
            // Estructurar el payload final según las entidades de base de datos
            const payload = {
                detalle: form.detalle,
                producto: form.producto,
                estado: form.estado,
                detalles: form.detalles.map(d => {
                    const plazosPayload = form.selectedPlazoIds.map(pId => ({
                        plazoId: pId,
                        valor_cuota: d.cuotas?.[pId] || 0
                    }));

                    const financiamientosPayload = form.selectedFinanciamientoIds.map(fId => ({
                        financiamientoId: fId,
                        valor_financiamiento: calculateFinancingVal(d, fId)
                    }));

                    const refPlazo = availablePlazos.find(p => p.id === form.plazoReferenciaId);
                    const numPlazo = refPlazo?.num_plazo || 0;
                    const cuotaRef = d.cuotas?.[form.plazoReferenciaId || 0] || 0;
                    const calculatedMontoFinal = numPlazo * cuotaRef;

                    return {
                        id: d.id,
                        monto: d.monto,
                        monto_final: calculatedMontoFinal,
                        valor_inscripcion: d.valor_inscripcion,
                        plazos: plazosPayload,
                        financiamientos: financiamientosPayload
                    };
                })
            };

            if (editingLista?.id) {
                await apiUpdateListaPrecio(editingLista.id, payload as any);
                showSuccess('Lista de precios actualizada correctamente.', 'Actualización exitosa');
            } else {
                await apiCreateListaPrecio(payload as any);
                showSuccess('Lista de precios creada correctamente.', 'Creación exitosa');
            }
            closeModal();
            fetchAll();
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al guardar lista de precios');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (l: ListaPrecio) => {
        confirmDialog({
            message: `¿Estás seguro de eliminar la lista de precios "${l.detalle}"? Se eliminarán en cascada todos sus detalles asociados (plazos y financiamientos).`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await apiDeleteListaPrecio(l.id);
                    showSuccess(`La lista "${l.detalle}" fue eliminada.`, 'Lista eliminada');
                    fetchAll();
                } catch (err) {
                    notifyApiError(err, { showError, showWarn }, 'Error al eliminar lista de precios');
                }
            },
        });
    };

    const productoTemplate = (row: ListaPrecio) => {
        const labels: Record<string, string> = {
            vehiculo: 'Vehículo',
            vivienda: 'Vivienda',
            remodelacion: 'Remodelación'
        };
        return <span>{labels[row.producto] || row.producto}</span>;
    };

    const estadoTemplate = (row: ListaPrecio) => (
        <span className={`inline-block px-3 py-1 text-xs font-bold border-round-xl ${row.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {row.estado ? 'ACTIVO' : 'INACTIVO'}
        </span>
    );

    const detallesCountTemplate = (row: ListaPrecio) => (
        <span className="font-bold text-700">{(row.detalles || []).length} Registros</span>
    );

    const accionesTemplate = (row: ListaPrecio) => (
        <div className="flex gap-1 justify-content-center">
            <Button
                icon="pi pi-pencil"
                text
                onClick={() => openEdit(row)}
                className="p-button-sm"
                style={{ color: COLORS.blue }}
                tooltip="Editar lista de precios"
                tooltipOptions={{ position: 'top' }}
            />
            <Button
                icon="pi pi-trash"
                text
                onClick={() => handleDelete(row)}
                className="p-button-sm"
                style={{ color: COLORS.red }}
                tooltip="Eliminar lista de precios"
                tooltipOptions={{ position: 'top' }}
            />
        </div>
    );

    return (
        <div className="p-4">
            <ConfirmDialog />

            <PageHeader title="Listas de Precios" subtitle="Administra las tablas de precios, cuotas y montos base de productos">
                <Button
                    label="Nueva Lista"
                    className="btn-brand"
                    icon="pi pi-plus"
                    onClick={openCreate}
                    style={{ backgroundColor: COLORS.red, borderColor: COLORS.red }}
                />
            </PageHeader>

            <div className="mb-4" style={{ maxWidth: '400px' }}>
                <SearchBar
                    placeholder="Buscar listas de precio..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="card shadow-2 border-round-2xl overflow-hidden bg-white">
                <DataTable
                    value={filtered}
                    loading={loading}
                    emptyMessage={<EmptyState message="No se encontraron listas de precios" icon="pi-money-bill" />}
                    paginator
                    rows={10}
                    className="datatable-premium"
                    stripedRows
                    rowHover
                    responsiveLayout="scroll"
                >
                    <Column header="Detalle/Nombre" field="detalle" sortable style={{ minWidth: '200px' }} />
                    <Column header="Producto" body={productoTemplate} field="producto" sortable style={{ width: '180px' }} />
                    <Column header="Registros en Detalle" body={detallesCountTemplate} style={{ width: '180px' }} />
                    <Column header="Estado" body={estadoTemplate} field="estado" style={{ width: '120px' }} align="center" />
                    <Column header="Acciones" body={accionesTemplate} style={{ width: '120px' }} align="center" />
                </DataTable>
            </div>

            {/* Modal de CRUD Multirregistro */}
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
                            <i className="pi pi-money-bill text-xl" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.15rem', color: COLORS.gray800 }}>
                                {editingLista ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: COLORS.gray500, marginTop: '2px' }}>
                                {editingLista ? 'Actualiza la información y el listado de registros' : 'Crea una lista de precios cargando varios registros'}
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
                            label={saving ? 'Guardando...' : (editingLista ? 'Guardar Cambios' : 'Crear Lista')}
                            icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                            onClick={handleSave}
                            disabled={saving || !form.detalle}
                            style={{ backgroundColor: COLORS.red, borderColor: COLORS.red, borderRadius: '10px', fontWeight: 600, padding: '10px 24px' }}
                        />
                    </div>
                }
                style={{ width: '90%', maxWidth: '1200px', borderRadius: '16px' }}
                modal
                className="p-fluid"
                draggable={false}
                resizable={false}
            >
                <form onSubmit={handleSave} className="flex flex-column gap-3 mt-3">
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <label className="block text-900 font-bold mb-2">Nombre de la Lista *</label>
                            <InputText
                                value={form.detalle}
                                onChange={(e) => handleFormChange('detalle', e.target.value)}
                                placeholder="Ej: Tabla General 2026 / Plan Oro"
                                required
                            />
                        </div>
                        <div className="col-12 md:col-6">
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
                    </div>

                    <div className="grid">
                        {/* Selector de Plazos */}
                        <div className="col-12 md:col-6">
                            <label className="block text-900 font-bold mb-2">Plazos (Meses)</label>
                            <div className="flex flex-wrap gap-3 p-3 border-1 surface-border border-round bg-gray-50">
                                {availablePlazos.length === 0 ? (
                                    <span className="text-500 italic">No hay plazos disponibles para este producto</span>
                                ) : (
                                    availablePlazos.map(p => (
                                        <div key={p.id} className="flex align-items-center gap-2">
                                            <Checkbox
                                                inputId={`plazo-${p.id}`}
                                                value={p.id}
                                                checked={form.selectedPlazoIds.includes(p.id)}
                                                onChange={(e) => handlePlazoCheckbox(p.id, e.checked || false)}
                                            />
                                            <label htmlFor={`plazo-${p.id}`} className="text-800 font-medium cursor-pointer">{p.tipo}</label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Selector de Financiamientos */}
                        <div className="col-12 md:col-6">
                            <label className="block text-900 font-bold mb-2">Financiamientos (Porcentaje)</label>
                            <div className="flex flex-wrap gap-3 p-3 border-1 surface-border border-round bg-gray-50">
                                {availableFinanciamientos.length === 0 ? (
                                    <span className="text-500 italic">No hay financiamientos disponibles para este producto</span>
                                ) : (
                                    availableFinanciamientos.map(f => (
                                        <div key={f.id} className="flex align-items-center gap-2">
                                            <Checkbox
                                                inputId={`fin-${f.id}`}
                                                value={f.id}
                                                checked={form.selectedFinanciamientoIds.includes(f.id)}
                                                onChange={(e) => handleFinanciamientoCheckbox(f.id, e.checked || false)}
                                            />
                                            <label htmlFor={`fin-${f.id}`} className="text-800 font-medium cursor-pointer">{f.tipo}</label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid">
                        {/* Selector de Plazo de Referencia */}
                        {form.selectedPlazoIds.length > 0 && form.selectedFinanciamientoIds.length > 0 && (
                            <div className="col-12 md:col-6">
                                <label className="block text-900 font-bold mb-2">Plazo de Referencia para Cálculo de Financiamiento *</label>
                                <Dropdown
                                    value={form.plazoReferenciaId}
                                    options={availablePlazos
                                        .filter(p => form.selectedPlazoIds.includes(p.id))
                                        .map(p => ({ label: p.tipo, value: p.id }))
                                    }
                                    onChange={(e) => handleFormChange('plazoReferenciaId', e.value)}
                                    placeholder="Selecciona el plazo de referencia"
                                    required
                                />
                            </div>
                        )}
                        <div className="col-12 md:col-6 flex align-items-center">
                            <div className="flex align-items-center gap-3 p-3 surface-50 border-round-xl w-full">
                                <div className="flex-1">
                                    <div className="font-semibold text-800" style={{ fontSize: '0.92rem' }}>Lista Activa</div>
                                    <div className="text-500" style={{ fontSize: '0.78rem' }}>Permitir cotizaciones con esta lista</div>
                                </div>
                                <InputSwitch
                                    checked={form.estado}
                                    onChange={(e) => handleFormChange('estado', e.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Editor de registros en lista */}
                    <div className="mt-4">
                        <div className="flex justify-content-between align-items-center mb-3">
                            <span className="font-bold text-lg text-900">Registros de Montos y Valores</span>
                            <Button
                                type="button"
                                label="Añadir Fila"
                                icon="pi pi-plus"
                                size="small"
                                className="p-button-outlined"
                                style={{ color: COLORS.green, borderColor: COLORS.green, width: 'auto' }}
                                onClick={addDetailRow}
                            />
                        </div>

                        <div className="overflow-x-auto border-1 surface-border border-round bg-gray-50 p-2">
                            <table className="w-full text-left border-collapse" style={{ minWidth: '900px' }}>
                                <thead>
                                    <tr className="bg-gray-100 border-bottom-1 surface-border">
                                        <th className="p-3 text-700 text-sm font-bold">Monto Base ($)</th>
                                        <th className="p-3 text-700 text-sm font-bold">Inscripción ($)</th>
                                        
                                        {/* Cabeceras dinámicas para Plazos */}
                                        {availablePlazos.filter(p => form.selectedPlazoIds.includes(p.id)).map(p => (
                                            <th key={`h-plazo-${p.id}`} className="p-3 text-700 text-sm font-bold">Cuota {p.tipo} ($)</th>
                                        ))}

                                        {/* Cabeceras dinámicas para Financiamientos */}
                                        {availableFinanciamientos.filter(f => form.selectedFinanciamientoIds.includes(f.id)).map(f => (
                                            <th key={`h-fin-${f.id}`} className="p-3 text-green-700 text-sm font-bold">Financiamiento {f.tipo} ($)</th>
                                        ))}

                                        <th className="p-3 text-700 text-sm font-bold text-center" style={{ width: '80px' }}>Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.detalles.map((detalle, index) => (
                                        <tr key={index} className="border-bottom-1 surface-border hover:bg-white transition-duration-150">
                                            <td className="p-2">
                                                <InputNumber
                                                    value={detalle.monto}
                                                    onValueChange={(e) => handleDetailChange(index, 'monto', e.value || 0)}
                                                    min={0}
                                                    mode="decimal"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <InputNumber
                                                    value={detalle.valor_inscripcion}
                                                    onValueChange={(e) => handleDetailChange(index, 'valor_inscripcion', e.value || 0)}
                                                    min={0}
                                                    mode="decimal"
                                                    placeholder="0"
                                                />
                                            </td>

                                            {/* Celdas para ingresos de Cuotas por Plazo */}
                                            {availablePlazos.filter(p => form.selectedPlazoIds.includes(p.id)).map(p => (
                                                <td key={`c-plazo-${p.id}-${index}`} className="p-2">
                                                    <InputNumber
                                                        value={detalle.cuotas?.[p.id] || 0}
                                                        onValueChange={(e) => handleCuotaChange(index, p.id, e.value || 0)}
                                                        min={0}
                                                        mode="decimal"
                                                        placeholder="Cuota"
                                                    />
                                                </td>
                                            ))}

                                            {/* Celdas calculadas de Financiamientos */}
                                            {availableFinanciamientos.filter(f => form.selectedFinanciamientoIds.includes(f.id)).map(f => (
                                                <td key={`c-fin-${f.id}-${index}`} className="p-2 text-center font-bold text-green-700">
                                                    <span>${calculateFinancingVal(detalle, f.id).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                                </td>
                                            ))}

                                            <td className="p-2 text-center">
                                                <Button
                                                    type="button"
                                                    icon="pi pi-trash"
                                                    className="p-button-danger p-button-outlined"
                                                    onClick={() => removeDetailRow(index)}
                                                    disabled={form.detalles.length <= 1}
                                                    style={{ padding: '0.5rem' }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </form>
            </Dialog>
        </div>
    );
};
