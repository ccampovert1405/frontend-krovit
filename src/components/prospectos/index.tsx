import React, { useState, useEffect, useMemo } from 'react';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { useProspectos, useFilters, useAuth } from '@/hooks';
import {
    apiGetUsersByRole, 
    UsuarioAPI, 
    apiGetGruposVentas, 
    GrupoVentasAPI,
    apiCreateSeguimiento,
    apiUpdateSeguimiento,
    apiGetSeguimientosByProspecto,
    apiGetUncontactedProspectsCount,
    apiGetAgencias,
    AgenciaAPI
} from '@/services/api';
import { COLORS, ETAPAS_AIDA, ETAPA_COLORS, MESES_NOMBRES } from '@/utils/constants';
import { formatUserDisplayName } from '@/utils/formatters';
import { Prospecto, EtapaAIDA, EstadoSeguimiento } from '@/types';
import { PageHeader, IconBox } from '@/components/ui';
import { NuevoProspectoModal, NuevoProspectoForm } from './NuevoProspectoModal';
import { EditarProspectoModal } from './ProspectoEditor';
import { useNotification } from '@/context/NotificationContext';
import { notifyApiError } from '@/utils/errorHelpers';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { ProspectoSeguimientoBox } from './ProspectoSeguimientoBox';
import { ProspectoSemaforo, getSemaforoInfo } from './ProspectoSemaforo';

// ═══════════════════════════════════════════════════════════
// PROSPECTOS PAGE — Reemplazo de Kanban por DataTable
// ═══════════════════════════════════════════════════════════


export const ProspectosPage: React.FC = () => {
    const { user } = useAuth();
    const {
        selectedMes,
        setSelectedMes,
        selectedAgente,
        setSelectedAgente,
        mesActual,
    } = useFilters();

    const isSuperGerente = user?.rol === 'Admin' || user?.rol === 'Administrador' || user?.rol === 'Gerente';
    const isGerenteComercial = user?.rol === 'Gerente Comercial';
    const isGerente = isSuperGerente || isGerenteComercial;
    const isJefe = user?.rol === 'Jefe Comercial';
    const isPrivileged = isGerente || isJefe;

    const [agencias, setAgencias] = React.useState<AgenciaAPI[]>([]);
    const [selectedAgencia, setSelectedAgencia] = React.useState<string | number>('Todas');
    const [grupos, setGrupos] = React.useState<GrupoVentasAPI[]>([]);
    const [selectedGrupo, setSelectedGrupo] = React.useState<string | number>('Todos');
    const [agentes, setAgentes] = React.useState<UsuarioAPI[]>([]);

    useEffect(() => {
        if (isGerente) {
            apiGetAgencias()
                .then(setAgencias)
                .catch(console.error);
        }
    }, [isGerente]);

    useEffect(() => {
        if (isPrivileged) {
            apiGetGruposVentas()
                .then(setGrupos)
                .catch(console.error);
        }
    }, [isPrivileged]);

    useEffect(() => {
        if (isPrivileged) {
            apiGetUsersByRole('Agente Comercial')
                .then(setAgentes)
                .catch(console.error);
        }
    }, [isPrivileged]);

    const assignedAgency = useMemo(() => {
        if (!isGerenteComercial) return null;
        return agencias.find(a => String(a.encargadoId) === String(user?.id));
    }, [agencias, isGerenteComercial, user]);

    useEffect(() => {
        if (isGerenteComercial && assignedAgency) {
            setSelectedAgencia(assignedAgency.id);
        }
    }, [assignedAgency, isGerenteComercial]);

    const jefeGrupo = useMemo(() => {
        if (!isJefe) return null;
        return grupos.find(g => 
            String(g.jefeComercialId) === String(user?.id) || 
            (g.jefeComercial && String(g.jefeComercial.userID) === String(user?.id))
        );
    }, [grupos, isJefe, user]);

    const currentAgentes = useMemo(() => {
        if (isGerente) {
            if (selectedGrupo !== 'Todos') {
                const selectedGrupoObj = grupos.find(g => String(g.id) === String(selectedGrupo));
                return selectedGrupoObj?.agentes || [];
            }
            if (selectedAgencia !== 'Todas') {
                const agencyGroups = grupos.filter(g => g.agenciaId && String(g.agenciaId) === String(selectedAgencia));
                return agencyGroups.flatMap(g => g.agentes || []);
            }
            if (isGerenteComercial && assignedAgency) {
                const agencyGroups = grupos.filter(g => g.agenciaId && String(g.agenciaId) === String(assignedAgency.id));
                return agencyGroups.flatMap(g => g.agentes || []);
            }
            return agentes;
        }
        if (isJefe) {
            return jefeGrupo?.agentes || [];
        }
        return [];
    }, [isGerente, isJefe, isGerenteComercial, selectedGrupo, selectedAgencia, grupos, agentes, jefeGrupo, assignedAgency]);

    const selectedAgentUser = useMemo(() => {
        return currentAgentes.find(a => formatUserDisplayName(a.nombres, a.apellidos) === selectedAgente);
    }, [currentAgentes, selectedAgente]);

    const allowedAgentIds = useMemo(() => {
        if (isGerente) {
            if (selectedGrupo !== 'Todos') {
                const selectedGrupoObj = grupos.find(g => String(g.id) === String(selectedGrupo));
                return new Set((selectedGrupoObj?.agentes || []).map(a => String(a.userID)));
            }
            if (selectedAgencia !== 'Todas') {
                const agencyGroups = grupos.filter(g => g.agenciaId && String(g.agenciaId) === String(selectedAgencia));
                return new Set(agencyGroups.flatMap(g => g.agentes || []).map(a => String(a.userID)));
            }
            if (isGerenteComercial && assignedAgency) {
                const agencyGroups = grupos.filter(g => g.agenciaId && String(g.agenciaId) === String(assignedAgency.id));
                return new Set(agencyGroups.flatMap(g => g.agentes || []).map(a => String(a.userID)));
            }
            return null;
        }
        if (isJefe) {
            const myGroup = grupos.find(g => 
                String(g.jefeComercialId) === String(user?.id) || 
                (g.jefeComercial && String(g.jefeComercial.userID) === String(user?.id))
            );
            return new Set((myGroup?.agentes || []).map(a => String(a.userID)));
        }
        return null;
    }, [isGerente, isGerenteComercial, isJefe, selectedGrupo, selectedAgencia, grupos, agencias, user, assignedAgency]);

    const agencyOptions = useMemo(() => {
        if (isGerenteComercial) {
            if (assignedAgency) {
                return [{ label: assignedAgency.nombre, value: assignedAgency.id }];
            }
            return [];
        }
        return [
            { label: 'Todas las agencias', value: 'Todas' },
            ...agencias.map(a => ({ label: a.nombre, value: a.id }))
        ];
    }, [agencias, isGerenteComercial, assignedAgency]);

    const grupoOptions = useMemo(() => {
        const filtered = selectedAgencia === 'Todas'
            ? grupos
            : grupos.filter(g => g.agenciaId && String(g.agenciaId) === String(selectedAgencia));
        return [
            { label: 'Todos los grupos', value: 'Todos' },
            ...filtered.map(g => ({ label: g.nombre, value: g.id }))
        ];
    }, [grupos, selectedAgencia]);

    const agenteOptions = useMemo(() => {
        return [
            { label: isJefe ? 'Todos los agentes del grupo' : 'Todos los agentes', value: 'Todos' },
            ...currentAgentes.map(a => {
                const name = formatUserDisplayName(a.nombres, a.apellidos);
                return { label: name, value: name };
            })
        ];
    }, [currentAgentes, isJefe]);

    const {
        prospectos,
        modalVisible,
        addProspecto,
        openModal,
        closeModal,
        deleteProspecto,
        updateProspecto,
        loading,
        refresh
    } = useProspectos({
        mes: selectedMes,
        anio: '2026',
        userId: selectedAgentUser?.userID
    });

    const [editingProspecto, setEditingProspecto] = useState<Prospecto | null>(null);
    const [selectedEtapa, setSelectedEtapa] = useState<EtapaAIDA | 'Todas'>('Todas');
    const [detailProspect, setDetailProspect] = useState<Prospecto | null>(null);
    const [filterUncontacted, setFilterUncontacted] = useState(false);
    const [filterDiscarded, setFilterDiscarded] = useState(false);
    const [filterSemaforo, setFilterSemaforo] = useState<string>('Todos');
    const [savingSeguimiento, setSavingSeguimiento] = useState(false);
    const [apiUncontactedCount, setApiUncontactedCount] = useState<number>(0);

    const fetchUncontactedCount = () => {
        const mesNombre = MESES_NOMBRES[selectedMes].toLowerCase();
        apiGetUncontactedProspectsCount({ mes: mesNombre, anio: '2026' })
            .then(res => setApiUncontactedCount(res.count))
            .catch(console.error);
    };

    useEffect(() => {
        fetchUncontactedCount();
    }, [prospectos, selectedMes]);

    useEffect(() => {
        if (!detailProspect) return;

        apiGetSeguimientosByProspecto(detailProspect.id)
            .then((segs) => {
                const mapped: any[] = segs.map(s => ({
                    ...s,
                    id: s.id,
                    fecha_registro: s.fecha_registro,
                    estado: s.estado,
                    tipo_seguimiento: s.tipo_seguimiento,
                    gestion_realizada: s.gestion_realizada
                }));
                setDetailProspect(prev => prev ? { ...prev, seguimientos: mapped } : null);
            })
            .catch(err => console.error("Error loading trackings", err));
    }, [detailProspect?.id]);

    const handleSaveSeguimiento = async (prospectoId: string | number, data: any) => {
        try {
            setSavingSeguimiento(true);
            if (data.id) {
                await apiUpdateSeguimiento(String(data.id), data);
                showSuccess('Seguimiento actualizado exitosamente.', 'Actualizado');
            } else {
                await apiCreateSeguimiento({
                    ...data,
                    prospect_id: String(prospectoId),
                });
                showSuccess('Seguimiento registrado exitosamente.', 'Guardado');
            }
            
            // Recargar seguimientos
            const segs = await apiGetSeguimientosByProspecto(prospectoId);
            const mapped: any[] = segs.map(s => ({
                ...s,
                id: s.id,
                fecha_registro: s.fecha_registro,
                estado: s.estado,
                tipo_seguimiento: s.tipo_seguimiento,
                gestion_realizada: s.gestion_realizada
            }));

            if (detailProspect) {
                setDetailProspect({
                    ...detailProspect,
                    seguimientos: mapped,
                });
            }
            await refresh();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al procesar seguimiento';
            showError(msg, 'Error');
        } finally {
            setSavingSeguimiento(false);
        }
    };

    const [globalFilter, setGlobalFilter] = useState('');
    const { showSuccess, showError, showWarn } = useNotification();

    const groupAgentIds = allowedAgentIds;

    // ─── Agrupación y Filtros (Locales) ────────────────────────────────
    const grouped = useMemo(() => {
        const stageMap = ETAPAS_AIDA.reduce((acc, etapa) => {
            acc[etapa] = [];
            return acc;
        }, {} as Record<string, Prospecto[]>);

        prospectos.forEach(p => {
            // Excluir de las etapas activas a los prospectos descartados
            const isDesc = p.seguimientos?.some(s => s.tipo_seguimiento === EstadoSeguimiento.NUMERO_EQUIVOCADO);
            if (isDesc) return;

            const pEtapa = (p.etapa as string).toUpperCase();
            const matchesGroup = !groupAgentIds || (p.user_create_id && groupAgentIds.has(String(p.user_create_id))) || (!p.user_create_id && filterSemaforo === 'libre');
            if (matchesGroup && stageMap[pEtapa]) {
                stageMap[pEtapa].push(p);
            }
        });

        return stageMap;
    }, [prospectos, groupAgentIds, filterSemaforo]);

    const descartadosCount = useMemo(() => {
        return prospectos.filter(p => {
            const matchesGroup = !groupAgentIds || (p.user_create_id && groupAgentIds.has(String(p.user_create_id))) || (!p.user_create_id && filterSemaforo === 'libre');
            const isDesc = p.seguimientos?.some(s => s.tipo_seguimiento === EstadoSeguimiento.NUMERO_EQUIVOCADO);
            return matchesGroup && isDesc;
        }).length;
    }, [prospectos, groupAgentIds, filterSemaforo]);

    const filteredProspectos = prospectos.filter(p => {
        const isDesc = p.seguimientos?.some(s => s.tipo_seguimiento === EstadoSeguimiento.NUMERO_EQUIVOCADO);

        if (filterDiscarded) {
            if (!isDesc) return false;
        } else {
            if (isDesc) return false;
        }

        const pEtapa = (p.etapa as string).toUpperCase();
        const matchesStage = selectedEtapa === 'Todas' || pEtapa === selectedEtapa;
        
        // Filtrado por grupo
        const matchesGroup = !groupAgentIds || (p.user_create_id && groupAgentIds.has(String(p.user_create_id))) || (!p.user_create_id && filterSemaforo === 'libre');

        let matchesUncontacted = true;
        if (filterUncontacted) {
            if (!p.seguimientos || p.seguimientos.length === 0) {
                matchesUncontacted = true;
            } else {
                const sorted = [...p.seguimientos].sort((a, b) => 
                    new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime()
                );
                matchesUncontacted = sorted[0]?.tipo_seguimiento === 'NO CONTESTA';
            }
        }

        let matchesSemaforo = true;
        if (filterSemaforo !== 'Todos') {
            if (filterSemaforo === 'libre') {
                const hasAgent = p.user_create_id || p.user_create || (p.agente && p.agente !== '—');
                matchesSemaforo = !hasAgent;
            } else {
                const semaforoInfo = getSemaforoInfo(p);
                matchesSemaforo = semaforoInfo.level === filterSemaforo;
            }
        }

        const search = globalFilter.toLowerCase();
        const matchesSearch = !search ||
            p.nombre.toLowerCase().includes(search) ||
            (p.apellido?.toLowerCase().includes(search)) ||
            (p.empresa?.toLowerCase().includes(search)) ||
            (p.cedula?.toLowerCase().includes(search)) ||
            p.email.toLowerCase().includes(search);

        return matchesStage && matchesGroup && matchesUncontacted && matchesSearch && matchesSemaforo;
    });

    // ─── Templates para DataTable ───────────────────────────
    const semaforoBodyTemplate = (p: Prospecto) => (
        <ProspectoSemaforo prospecto={p} />
    );

    const semaforoSortFunction = (event: any) => {
        event.data.sort((data1: any, data2: any) => {
            const val1 = getSemaforoInfo(data1).value;
            const val2 = getSemaforoInfo(data2).value;
            return event.order * (val1 - val2);
        });
    };

    const empresaBodyTemplate = (p: Prospecto) => (
        <div style={{ color: COLORS.gray500, fontWeight: 500, fontSize: '0.85rem' }}>
            {p.empresa || '—'}
        </div>
    );


    const etapaBodyTemplate = (p: Prospecto) => {
        const isDesc = p.seguimientos?.some(s => s.tipo_seguimiento === EstadoSeguimiento.NUMERO_EQUIVOCADO);
        if (isDesc) {
            return (
                <Tag
                    value="DESCARTADO"
                    style={{
                        backgroundColor: `${COLORS.gray500}15`,
                        color: COLORS.gray500,
                        borderRadius: '8px',
                        fontWeight: 600,
                        padding: '4px 12px'
                    }}
                />
            );
        }
        const color = (ETAPA_COLORS as Record<string, string>)[p.etapa] ?? COLORS.gray400;
        return (
            <Tag
                value={p.etapa}
                style={{
                    backgroundColor: `${color}15`,
                    color: color,
                    borderRadius: '8px',
                    fontWeight: 600,
                    padding: '4px 12px'
                }}
            />
        );
    };

    const fechaCreacionBodyTemplate = (p: Prospecto) => {
        const dateStr = p.created_at;
        if (!dateStr) return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>—</div>;

        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>{dateStr}</div>;
            }

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return (
                <div style={{ color: COLORS.gray500, fontWeight: 500, fontSize: '0.85rem' }}>
                    {`${day}-${month}-${year}`}
                </div>
            );
        } catch {
            return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>{dateStr}</div>;
        }
    };

    const fechaActualizacionBodyTemplate = (p: Prospecto) => {
        const dateStr = p.updated_at;
        if (!dateStr) return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>—</div>;

        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>{dateStr}</div>;
            }

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return (
                <div style={{ color: COLORS.gray500, fontWeight: 500, fontSize: '0.85rem' }}>
                    {`${day}-${month}-${year}`}
                </div>
            );
        } catch {
            return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>{dateStr}</div>;
        }
    };

    const actionBodyTemplate = (p: Prospecto) => (
        <div className="flex align-items-center gap-2">
            <Button
                icon="pi pi-pencil"
                text
                rounded
                className="p-button-plain"
                tooltip="Editar"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingProspecto(p);
                }}
            />
            <Button
                icon="pi pi-trash"
                text
                rounded
                className="p-button-danger"
                tooltip="Eliminar"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(p);
                }}
            />
        </div>
    );


    // ─── Handlers ────────────────────────────────────────────
    const handleSave = async (formData: NuevoProspectoForm) => {
        try {
            await addProspecto({
                nombre: formData.nombre,
                apellido: formData.apellido,
                empresa: formData.empresa,
                cedula: formData.cedula,
                email: formData.email,
                telefono: formData.telefono,
                celular: formData.celular,
                ciudad: formData.ciudad,
                etapa: 'ATENCION',
                user_create_id: formData.user_create_id,
                fuente: 'Directo',
                mes: new Date().getMonth(),
            } as any);
            closeModal();
            showSuccess(`${formData.nombre} fue registrado correctamente.`, 'Prospecto creado');
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al crear');
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
                    notifyApiError(err, { showError, showWarn }, 'Error al eliminar');
                }
            },
        });
    };

    const nombreBodyTemplate = (p: Prospecto) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ color: COLORS.gray800, fontWeight: 600, fontSize: '0.85rem' }}>
                {p.nombre} {p.apellido || ''}
            </div>
            {p.cedula && (
                <div style={{ color: COLORS.gray400, fontSize: '0.75rem', fontWeight: 500 }}>
                    {p.cedula}
                </div>
            )}
        </div>
    );

    const userBodyTemplate = (p: Prospecto) => {
        const hasAgent = !!(p.user_create_id || p.user_create || (p.agente && p.agente !== '—'));
        const semaforoInfo = getSemaforoInfo(p);
        const lockIcon = semaforoInfo.isLocked ? 'pi pi-lock' : 'pi pi-lock-open';

        const name = hasAgent
            ? (p.user_create
                ? `${p.user_create.nombres} ${p.user_create.apellidos}`.trim()
                : (p.agente || '—'))
            : 'Sin Asignar';

        return (
            <Tag
                value={name}
                icon={lockIcon}
                style={{
                    backgroundColor: `${COLORS.gray500}15`,
                    color: semaforoInfo.isLocked ? COLORS.gray700 : (hasAgent ? COLORS.blue : COLORS.gray600),
                    borderRadius: '8px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    border: `1px solid ${COLORS.gray300}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            />
        );
    };

    return (
        <div style={{ padding: '0 10px' }}>
            <ConfirmDialog />

            <PageHeader title="Prospectos" subtitle="Gestión de leads y prospección comercial">
                <div className="flex gap-2 align-items-center flex-wrap">
                    {/* Filtro Agencia - SOLO PARA GERENTES */}
                    {isGerente && (
                        <div className="flex align-items-center gap-2">
                            <IconBox icon="pi-building" color={COLORS.blue} bg={COLORS.blueLight} />
                            <Dropdown
                                value={selectedAgencia}
                                options={agencyOptions}
                                onChange={(e) => {
                                    setSelectedAgencia(e.value);
                                    setSelectedGrupo('Todos');
                                    setSelectedAgente('Todos');
                                }}
                                className="w-12rem"
                                placeholder="Seleccionar agencia"
                            />
                        </div>
                    )}

                    {/* Filtro Grupo - SOLO PARA GERENTES */}
                    {isGerente && (
                        <div className="flex align-items-center gap-2">
                            <IconBox icon="pi-sitemap" color={COLORS.blue} bg={COLORS.blueLight} />
                            <Dropdown
                                value={selectedGrupo}
                                options={grupoOptions}
                                onChange={(e) => {
                                    setSelectedGrupo(e.value);
                                    setSelectedAgente('Todos');
                                }}
                                className="w-12rem"
                                placeholder="Seleccionar grupo"
                            />
                        </div>
                    )}

                    {/* Filtro Agente - PARA GERENTES Y JEFES */}
                    {isPrivileged && (
                        <div className="flex align-items-center gap-2">
                            <IconBox icon="pi-users" color={COLORS.red} bg={COLORS.redLight} />
                            <Dropdown
                                value={selectedAgente}
                                options={agenteOptions}
                                onChange={(e) => setSelectedAgente(e.value)}
                                className="w-12rem"
                                placeholder="Seleccionar agente"
                            />
                        </div>
                    )}

                    {/* Filtro Mes */}
                    <div className="flex align-items-center gap-2">
                        <IconBox icon="pi-calendar" color={COLORS.blue} bg={COLORS.blueLight} />
                        <Dropdown
                            value={selectedMes}
                            options={MESES_NOMBRES.slice(0, mesActual + 1).map((mes, i) => ({
                                label: `${mes} 2026`,
                                value: i,
                            }))}
                            onChange={(e) => setSelectedMes(e.value)}
                            className="w-10rem"
                            placeholder="Seleccionar mes"
                        />
                    </div>
                </div>
            </PageHeader>

            <div className="flex flex-wrap gap-4 mb-5">
                {ETAPAS_AIDA.map(etapa => {
                    const count = grouped[etapa]?.length || 0;
                    const isSelected = selectedEtapa === etapa;
                    const color = (ETAPA_COLORS as any)[etapa];
                    return (
                        <div
                            key={etapa}
                            onClick={() => {
                                setSelectedEtapa(isSelected ? 'Todas' : etapa);
                                setFilterUncontacted(false);
                                setFilterDiscarded(false);
                                setFilterSemaforo('Todos');
                            }}
                            style={{
                                cursor: 'pointer',
                                flex: 1,
                                minWidth: '200px',
                                background: COLORS.white,
                                border: `1.5px solid ${isSelected ? color : COLORS.gray100}`,
                                borderRadius: '24px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                transition: 'all 0.2s',
                                boxShadow: isSelected ? `0 8px 24px ${color}20` : 'none'
                            }}
                        >
                            <div className="flex align-items-center justify-content-between">
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color }} />
                                <span style={{
                                    background: `${color}15`,
                                    borderRadius: '999px',
                                    padding: '4px 12px',
                                    fontSize: '0.8rem',
                                    color: color,
                                    fontWeight: 700
                                }}>{count}</span>
                            </div>
                            <div>
                                <div style={{ color: COLORS.gray400, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{etapa}</div>
                                <div style={{ fontWeight: 800, fontSize: '1.5rem', color: COLORS.black, marginTop: '4px' }}>{count}</div>
                            </div>
                        </div>
                    );
                })}

                {/* Card No Contactados */}
                <div
                    onClick={() => {
                        const newFilter = !filterUncontacted;
                        setFilterUncontacted(newFilter);
                        if (newFilter) {
                            setSelectedEtapa('Todas');
                            setFilterDiscarded(false);
                            setFilterSemaforo('Todos');
                        }
                    }}
                    style={{
                        cursor: 'pointer',
                        flex: 1,
                        minWidth: '200px',
                        background: COLORS.white,
                        border: `1.5px solid ${filterUncontacted ? COLORS.orange : COLORS.gray100}`,
                        borderRadius: '24px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s',
                        boxShadow: filterUncontacted ? `0 8px 24px ${COLORS.orange}20` : 'none'
                    }}
                >
                    <div className="flex align-items-center justify-content-between">
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS.orange }} />
                        <span style={{
                            background: `${COLORS.orange}15`,
                            borderRadius: '999px',
                            padding: '4px 12px',
                            fontSize: '0.8rem',
                            color: COLORS.orange,
                            fontWeight: 700
                        }}>{apiUncontactedCount}</span>
                    </div>
                    <div>
                        <div style={{ color: COLORS.gray400, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>No Contactados</div>
                        <div style={{ fontWeight: 800, fontSize: '1.5rem', color: COLORS.black, marginTop: '4px' }}>{apiUncontactedCount}</div>
                    </div>
                </div>

                {/* Card Descartados */}
                <div
                    onClick={() => {
                        const newFilter = !filterDiscarded;
                        setFilterDiscarded(newFilter);
                        if (newFilter) {
                            setSelectedEtapa('Todas');
                            setFilterUncontacted(false);
                            setFilterSemaforo('Todos');
                        }
                    }}
                    style={{
                        cursor: 'pointer',
                        flex: 1,
                        minWidth: '200px',
                        background: COLORS.white,
                        border: `1.5px solid ${filterDiscarded ? COLORS.gray500 : COLORS.gray100}`,
                        borderRadius: '24px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s',
                        boxShadow: filterDiscarded ? `0 8px 24px ${COLORS.gray500}20` : 'none'
                    }}
                >
                    <div className="flex align-items-center justify-content-between">
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS.gray500 }} />
                        <span style={{
                            background: `${COLORS.gray500}15`,
                            borderRadius: '999px',
                            padding: '4px 12px',
                            fontSize: '0.8rem',
                            color: COLORS.gray500,
                            fontWeight: 700
                        }}>{descartadosCount}</span>
                    </div>
                    <div>
                        <div style={{ color: COLORS.gray400, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descartados</div>
                        <div style={{ fontWeight: 800, fontSize: '1.5rem', color: COLORS.black, marginTop: '4px' }}>{descartadosCount}</div>
                    </div>
                </div>
            </div>

            {/* ─── Barra de búsqueda y tabla ─── */}
            <div style={{
                background: COLORS.white,
                borderRadius: '24px',
                padding: '24px',
                border: `1.5px solid ${COLORS.gray100}`,
                marginBottom: '40px'
            }}>
                <div className="flex justify-content-between align-items-center mb-4 flex-wrap card-header-filters" style={{ gap: '12px' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: COLORS.black }}>Prospectos Directos</div>
                        <div style={{ color: COLORS.gray400, fontSize: '0.82rem', marginTop: '2px' }}>Gestiona y califica tus leads potenciales</div>
                    </div>
                    <div className="flex gap-2 flex-wrap filters-row" style={{ alignItems: 'center' }}>
                        <span className="filter-item-search" style={{ width: '100%', minWidth: '180px', maxWidth: '280px', display: 'flex', alignItems: 'center', position: 'relative' }}>
                            <i className="pi pi-search" style={{
                                color: COLORS.gray400,
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 1
                            }} />
                            <InputText
                                placeholder="Buscar prospectos..."
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                style={{
                                    borderRadius: '12px',
                                    border: `1.5px solid ${COLORS.gray100}`,
                                    padding: '12px 12px 12px 40px',
                                    width: '100%',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </span>

                        <Dropdown
                            className="filter-item-dropdown"
                            value={filterSemaforo}
                            options={[
                                { label: 'Todos los semáforos', value: 'Todos' },
                                { label: '🟢 Al día (<24h)', value: 'green' },
                                { label: '🟡 Pendiente (24h - 48h)', value: 'yellow' },
                                { label: '🟠 Urgente (48h - 72h)', value: 'orange' },
                                { label: '🔴 Crítico (72h - 120h)', value: 'red' },
                                ...(isPrivileged ? [{ label: '🔓 Liberados / Libre (>5d)', value: 'libre' }] : []),
                            ]}
                            onChange={(e) => {
                                setFilterSemaforo(e.value);
                                if (e.value !== 'Todos') {
                                    setFilterUncontacted(false);
                                }
                            }}
                            placeholder="Alerta de Inactividad"
                            style={{
                                borderRadius: '12px',
                                border: `1.5px solid ${COLORS.gray100}`,
                                minWidth: '180px',
                                height: '46px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        />
                        <Button
                            label="Nuevo Prospecto"
                            icon="pi pi-plus"
                            className="btn-brand filter-item-btn"
                            onClick={openModal}
                            style={{ borderRadius: '12px', background: COLORS.red, border: 'none', fontSize: '0.9rem', fontWeight: 600 }}
                        />
                    </div>
                </div>

                {/* ── Contenedor con clase mobile-show-cards:
                     En móvil: oculta .datatable-premium, muestra .mobile-card-list
                     En desktop: muestra sólo la tabla normal
                ── */}
                <div className="mobile-show-cards">

                    {/* ─── Vista de Tarjetas (Mobile) ─── */}
                    <div className="mobile-card-list">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: COLORS.gray400 }}>
                                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }} />
                            </div>
                        ) : filteredProspectos.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: COLORS.gray400 }}>
                                <i className="pi pi-users" style={{ fontSize: '2.5rem', marginBottom: '8px', display: 'block' }} />
                                <div style={{ fontWeight: 600 }}>No se encontraron prospectos</div>
                            </div>
                        ) : filteredProspectos.map(p => {
                            const isDesc = p.seguimientos?.some(s => s.tipo_seguimiento === EstadoSeguimiento.NUMERO_EQUIVOCADO);
                            const color = (ETAPA_COLORS as Record<string, string>)[p.etapa] ?? COLORS.gray400;
                            const hasAgent = p.user_create_id || p.user_create || (p.agente && p.agente !== '—');
                            const agentName = p.user_create
                                ? `${p.user_create.nombres} ${p.user_create.apellidos}`.trim()
                                : (p.agente || '—');
                            return (
                                <div
                                    key={p.id}
                                    className="mobile-card-item"
                                    onClick={() => setDetailProspect(p)}
                                >
                                    <div className="mobile-card-item__header">
                                        <div>
                                            <div className="mobile-card-item__name">{p.nombre} {p.apellido || ''}</div>
                                            {p.cedula && <div className="mobile-card-item__sub">{p.cedula}</div>}
                                            {p.empresa && <div className="mobile-card-item__sub">{p.empresa}</div>}
                                        </div>
                                        <ProspectoSemaforo prospecto={p} />
                                    </div>
                                    <div className="mobile-card-item__meta">
                                        <span style={{
                                            background: isDesc ? `${COLORS.gray500}15` : `${color}15`,
                                            color: isDesc ? COLORS.gray500 : color,
                                            borderRadius: '8px',
                                            padding: '3px 10px',
                                            fontSize: '0.72rem',
                                            fontWeight: 700
                                        }}>{isDesc ? 'DESCARTADO' : p.etapa}</span>
                                        {hasAgent ? (
                                            <span style={{ fontSize: '0.75rem', color: COLORS.gray600, marginLeft: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                <i className={getSemaforoInfo(p).icon} style={{ fontSize: '0.7rem', color: getSemaforoInfo(p).isLocked ? COLORS.gray600 : COLORS.red }} />
                                                {agentName}
                                            </span>
                                        ) : (
                                            <span style={{
                                                background: `${COLORS.gray500}15`,
                                                color: COLORS.gray600,
                                                borderRadius: '6px',
                                                padding: '2px 6px',
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                                marginLeft: '4px',
                                                border: `1px solid ${COLORS.gray300}`,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '3px'
                                            }}>
                                                <i className="pi pi-lock-open" style={{ fontSize: '0.7rem' }} />
                                                Sin Asignar
                                            </span>
                                        )}
                                    </div>
                                    <div className="mobile-card-item__actions" onClick={e => e.stopPropagation()}>
                                        <Button
                                            label="Detalle"
                                            icon="pi pi-eye"
                                            size="small"
                                            outlined
                                            onClick={() => setDetailProspect(p)}
                                            style={{ flex: 1, fontSize: '0.78rem', borderRadius: '10px' }}
                                        />
                                        <Button
                                            icon="pi pi-pencil"
                                            size="small"
                                            text
                                            onClick={() => setEditingProspecto(p)}
                                            style={{ borderRadius: '10px', minWidth: '44px' }}
                                        />
                                        <Button
                                            icon="pi pi-trash"
                                            size="small"
                                            text
                                            severity="danger"
                                            onClick={() => handleDelete(p)}
                                            style={{ borderRadius: '10px', minWidth: '44px' }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ─── DataTable (Desktop) ─── */}
                    <DataTable
                        value={filteredProspectos}
                        paginator
                        rows={10}
                        loading={loading}
                        className="datatable-premium"
                        emptyMessage="No se encontraron prospectos"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                        paginatorTemplate="CurrentPageReport PrevPageLink PageLinks NextPageLink"
                        onRowClick={(e) => setDetailProspect(e.data as Prospecto)}
                        pt={{
                            bodyRow: { style: { cursor: 'pointer' } }
                        }}
                    >
                        <Column field="nombre" header="NOMBRE" body={nombreBodyTemplate} alignHeader="left" align="left" />
                        <Column field="empresa" header="EMPRESA" body={empresaBodyTemplate} alignHeader="left" align="left" />
                        <Column field="user_create" header="Asignado a" body={userBodyTemplate} style={{ minWidth: '220px' }} alignHeader="left" align="left" />
                        <Column field="etapa" header="ETAPA" body={etapaBodyTemplate} alignHeader="left" align="left" />
                        <Column field="semaforo" header="SEGUIMIENTO" sortable sortFunction={semaforoSortFunction} body={semaforoBodyTemplate} alignHeader="left" align="left" />
                        <Column field="created_at" header="FECHA CREACIÓN" sortable body={fechaCreacionBodyTemplate} alignHeader="left" align="left" />
                        <Column field="updated_at" header="FECHA ACTUALIZACIÓN" sortable body={fechaActualizacionBodyTemplate} alignHeader="left" align="left" />
                        <Column header="ACCIONES" body={actionBodyTemplate} alignHeader="left" align="left" />
                    </DataTable>
                </div>
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
                            notifyApiError(err, { showError, showWarn }, 'Error al actualizar');
                        }
                    }}
                />
            )}

            {/* Modal de Detalle de Prospecto */}
            <Dialog 
                header={
                    <div className="flex align-items-center gap-3">
                        <IconBox 
                            icon="pi-user" 
                            color={COLORS.blue} 
                            bg={COLORS.blueLight} 
                            size="48px"
                            iconSize="1.2rem"
                        />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: COLORS.gray800 }}>
                                {detailProspect?.nombre} {detailProspect?.apellido}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: COLORS.gray500, marginTop: '2px' }}>
                                Detalle del prospecto
                            </div>
                        </div>
                    </div>
                }
                visible={!!detailProspect}
                onHide={() => setDetailProspect(null)}
                style={{ width: '720px', borderRadius: '16px', overflow: 'hidden' }}
                breakpoints={{ '960px': '90vw', '641px': '100%' }}
                modal
                headerStyle={{ borderBottom: 'none' }}
                contentStyle={{ borderTop: 'none' }}
            >
                {detailProspect && (
                    <div className="flex flex-column gap-4">
                        {/* Info del Prospecto */}
                        <div style={{
                            background: COLORS.gray50,
                            borderRadius: '12px',
                            padding: '16px 20px',
                        }}>
                            <div className="grid">
                                <div className="col-6">
                                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', marginBottom: '4px' }}>Empresa</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: COLORS.gray800 }}>{detailProspect.empresa || '—'}</div>
                                </div>
                                <div className="col-6">
                                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', marginBottom: '4px' }}>Etapa AIDA</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: (ETAPA_COLORS as Record<string, string>)[detailProspect.etapa] ?? COLORS.gray800 }}>{detailProspect.etapa}</div>
                                </div>
                                <div className="col-6 mt-2">
                                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', marginBottom: '4px' }}>Asignado a</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: COLORS.gray800 }}>
                                        <Tag
                                            value={
                                                (detailProspect.user_create_id || detailProspect.user_create || (detailProspect.agente && detailProspect.agente !== '—'))
                                                    ? (detailProspect.user_create
                                                        ? `${detailProspect.user_create.nombres} ${detailProspect.user_create.apellidos}`.trim()
                                                        : (detailProspect.agente || '—'))
                                                    : 'Sin Asignar'
                                            }
                                            icon={getSemaforoInfo(detailProspect).icon}
                                            style={{
                                                backgroundColor: `${COLORS.gray500}15`,
                                                color: getSemaforoInfo(detailProspect).isLocked ? COLORS.gray700 : COLORS.blue,
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                padding: '3px 10px',
                                                fontSize: '0.8rem',
                                                border: `1px solid ${COLORS.gray300}`,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="col-6 mt-2">
                                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', marginBottom: '4px' }}>Fuente</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: COLORS.gray800 }}>{detailProspect.fuente || '—'}</div>
                                </div>
                            </div>
                        </div>

                        <TabView>
                            <TabPanel header="Datos de Contacto" leftIcon="pi pi-id-card mr-2">
                                <div style={{ padding: '10px 5px' }}>
                                    <div className="grid row-gap-3">
                                        <div className="col-6">
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.gray400, textTransform: 'uppercase' }}>Email</div>
                                            <div style={{ fontSize: '0.9rem', color: COLORS.gray800, marginTop: '4px', wordBreak: 'break-all' }}>{detailProspect.email}</div>
                                        </div>
                                        <div className="col-6">
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.gray400, textTransform: 'uppercase' }}>Ciudad</div>
                                            <div style={{ fontSize: '0.9rem', color: COLORS.gray800, marginTop: '4px' }}>{detailProspect.ciudad || '—'}</div>
                                        </div>
                                        <div className="col-6">
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.gray400, textTransform: 'uppercase' }}>Celular</div>
                                            <div style={{ fontSize: '0.9rem', color: COLORS.gray800, marginTop: '4px' }}>{detailProspect.celular || '—'}</div>
                                        </div>
                                        <div className="col-6">
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.gray400, textTransform: 'uppercase' }}>Teléfono Fijo</div>
                                            <div style={{ fontSize: '0.9rem', color: COLORS.gray800, marginTop: '4px' }}>{detailProspect.telefono || '—'}</div>
                                        </div>
                                        <div className="col-6">
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.gray400, textTransform: 'uppercase' }}>Cédula</div>
                                            <div style={{ fontSize: '0.9rem', color: COLORS.gray800, marginTop: '4px' }}>{detailProspect.cedula || '—'}</div>
                                        </div>
                                        <div className="col-6">
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.gray400, textTransform: 'uppercase' }}>Fecha Registro</div>
                                            <div style={{ fontSize: '0.9rem', color: COLORS.gray800, marginTop: '4px' }}>
                                                {detailProspect.created_at ? new Date(detailProspect.created_at).toLocaleDateString() : '—'}
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.gray400, textTransform: 'uppercase' }}>Notas / Observaciones</div>
                                            <div style={{ 
                                                fontSize: '0.9rem', 
                                                color: COLORS.gray700, 
                                                marginTop: '6px',
                                                background: COLORS.gray50,
                                                borderRadius: '8px',
                                                padding: '12px',
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: '1.4'
                                            }}>{detailProspect.notas || 'Sin notas.'}</div>
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>
                            
                            <TabPanel header="Seguimientos" leftIcon="pi pi-history mr-2">
                                <ProspectoSeguimientoBox 
                                    prospecto={detailProspect} 
                                    onSaveSeguimiento={handleSaveSeguimiento}
                                    loading={savingSeguimiento}
                                />
                            </TabPanel>
                        </TabView>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default ProspectosPage;

