import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { IconBox } from '@/components/ui';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { COLORS, MESES_NOMBRES } from '@/utils/constants';
import { Meta } from '@/types';
import { UsuarioAPI } from '@/services/api';

interface MetaModalProps {
    visible: boolean;
    onHide: () => void;
    onSave: (meta: Partial<Meta>) => void;
    meta?: Meta | null;
    loading?: boolean;
    agentes: UsuarioAPI[];
}

export const MetaModal: React.FC<MetaModalProps> = ({
    visible,
    onHide,
    onSave,
    meta,
    loading = false,
    agentes
}) => {
    const currentYear = new Date().getFullYear();
    const [formData, setFormData] = useState<Partial<Meta>>({
        mes: MESES_NOMBRES[new Date().getMonth()],
        anio: currentYear,
        metaProspectos: 0,
        metaOportunidades: 0,
        metaCierres: 0,
        metaIngresos: 0,
        user_id: ''
    });

    useEffect(() => {
        if (meta) {
            setFormData(meta);
        } else {
            setFormData({
                mes: MESES_NOMBRES[new Date().getMonth()],
                anio: currentYear,
                metaProspectos: 0,
                metaOportunidades: 0,
                metaCierres: 0,
                metaIngresos: 0,
                user_id: ''
            });
        }
    }, [meta, visible, currentYear]);

    const aniosOptions = [
        { label: String(currentYear), value: currentYear },
        { label: String(currentYear + 1), value: currentYear + 1 }
    ];

    const footer = (
        <div className="flex justify-content-end gap-3 pt-3">
            <Button
                label="Cancelar"
                onClick={onHide}
                className="p-button-text font-bold"
                style={{ color: COLORS.red, border: `1.5px solid ${COLORS.red}`, borderRadius: '12px', padding: '10px 24px' }}
            />
            <Button
                label="Guardar Meta"
                icon="pi pi-plus"
                loading={loading}
                onClick={() => onSave(formData)}
                style={{ backgroundColor: COLORS.red, borderColor: COLORS.red, borderRadius: '12px', padding: '10px 24px' }}
                className="font-bold"
            />
        </div>
    );

    const header = (
        <div className="flex align-items-center gap-3">
            <IconBox icon="pi-bullseye" color={COLORS.red} bg="#FEF2F2" size="48px" iconSize="1.5rem" />
            <div>
                <div className="text-xl font-bold text-900 line-height-1">Definir Meta</div>
                <div className="text-sm text-500 font-medium mt-1">Establece objetivos mensuales</div>
            </div>
        </div>
    );

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={header}
            footer={footer}
            style={{ width: '90%', maxWidth: '580px', borderRadius: '24px' }}
            modal
            className="custom-modal"
            contentStyle={{ padding: '24px' }}
            pt={{
                header: { style: { padding: '24px 24px 16px 24px', borderBottom: '1px solid #f1f5f9' } },
                footer: { style: { padding: '16px 24px 24px 24px', borderTop: 'none' } },
                mask: { style: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' } }
            }}
        >
            <div className="grid">
                {/* Mes */}
                <div className="col-12 md:col-6 mb-3">
                    <label className="block text-sm font-bold text-700 mb-2">Mes *</label>
                    <Dropdown
                        value={formData.mes}
                        options={[...MESES_NOMBRES]}
                        onChange={(e) => setFormData({ ...formData, mes: e.value })}
                        placeholder="Seleccione..."
                        className="w-full border-round-xl border-1"
                        style={{ height: '48px', alignItems: 'center', borderColor: '#E2E8F0' }}
                    />
                </div>

                {/* Año */}
                <div className="col-12 md:col-6 mb-3">
                    <label className="block text-sm font-bold text-700 mb-2">Año *</label>
                    <Dropdown
                        value={formData.anio}
                        options={aniosOptions}
                        onChange={(e) => setFormData({ ...formData, anio: e.value })}
                        className="w-full border-round-xl border-1"
                        style={{ height: '48px', alignItems: 'center', borderColor: '#E2E8F0' }}
                    />
                </div>

                {/* Meta Prospectos */}
                <div className="col-12 md:col-6 mb-3">
                    <label className="block text-sm font-bold text-600 mb-2">Meta Prospectos</label>
                    <InputNumber
                        value={formData.metaProspectos}
                        onValueChange={(e) => setFormData({ ...formData, metaProspectos: e.value ?? 0 })}
                        placeholder="Ej: 20"
                        className="w-full"
                        inputClassName="w-full border-round-xl border-1 p-3 font-medium border-300"
                        inputStyle={{ height: '48px', borderColor: '#E2E8F0' }}
                    />
                </div>

                {/* Meta Oportunidades */}
                <div className="col-12 md:col-6 mb-3">
                    <label className="block text-sm font-bold text-600 mb-2">Meta Oportunidades</label>
                    <InputNumber
                        value={formData.metaOportunidades}
                        onValueChange={(e) => setFormData({ ...formData, metaOportunidades: e.value ?? 0 })}
                        placeholder="Ej: 10"
                        className="w-full"
                        inputClassName="w-full border-round-xl border-1 p-3 font-medium border-300"
                        inputStyle={{ height: '48px', borderColor: '#E2E8F0' }}
                    />
                </div>

                {/* Meta Cierres */}
                <div className="col-12 md:col-6 mb-3">
                    <label className="block text-sm font-bold text-600 mb-2">Meta Cierres</label>
                    <InputNumber
                        value={formData.metaCierres}
                        onValueChange={(e) => setFormData({ ...formData, metaCierres: e.value ?? 0 })}
                        placeholder="Ej: 5"
                        className="w-full"
                        inputClassName="w-full border-round-xl border-1 p-3 font-medium border-300"
                        inputStyle={{ height: '48px', borderColor: '#E2E8F0' }}
                    />
                </div>

                {/* Meta Ingresos */}
                <div className="col-12 md:col-6 mb-3">
                    <label className="block text-sm font-bold text-600 mb-2">Meta Ingresos ($)</label>
                    <InputNumber
                        value={formData.metaIngresos}
                        onValueChange={(e) => setFormData({ ...formData, metaIngresos: e.value ?? 0 })}
                        placeholder="Ej: 100000"
                        className="w-full"
                        mode="decimal"
                        minFractionDigits={0}
                        inputClassName="w-full border-round-xl border-1 p-3 font-medium border-300"
                        inputStyle={{ height: '48px', borderColor: '#E2E8F0' }}
                    />
                </div>

                {/* Agente */}
                <div className="col-12 mb-3">
                    <label className="block text-sm font-bold text-700 mb-2">Agente Comercial *</label>
                    <Dropdown
                        value={formData.user_id}
                        options={agentes.map(a => ({ label: `${a.nombres} ${a.apellidos}`, value: a.userID }))}
                        onChange={(e) => setFormData({ ...formData, user_id: e.value })}
                        placeholder="Seleccione un agente..."
                        className="w-full border-round-xl border-1"
                        style={{ height: '48px', alignItems: 'center', borderColor: '#E2E8F0' }}
                        filter
                        filterPlaceholder="Buscar agente..."
                    />
                </div>
            </div>
        </Dialog>
    );
};
