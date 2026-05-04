import React, { useState } from 'react';
import { COLORS } from '@/utils/constants';
import { Prospecto } from '@/types';

// ═══════════════════════════════════════════════════════════
// PROSPECTO CARD
// ═══════════════════════════════════════════════════════════

export interface ProspectoCardProps {
    prospecto: Prospecto;
    onEdit: (p: Prospecto) => void;
    onDelete: (p: Prospecto) => void;
}

export const ProspectoCard: React.FC<ProspectoCardProps> = ({ prospecto, onEdit, onDelete }) => {
    const [hovered, setHovered] = useState(false);

    const avatarColors = [COLORS.red, COLORS.blue, COLORS.green, COLORS.yellow, COLORS.purple];
    const avatarColor = avatarColors[prospecto.nombre.charCodeAt(0) % avatarColors.length];
    const initial = prospecto.nombre.charAt(0).toUpperCase();

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: COLORS.white,
                border: `1.5px solid ${hovered ? COLORS.gray200 : COLORS.gray100}`,
                borderRadius: '12px',
                padding: '14px 16px',
                boxShadow: hovered
                    ? '0 4px 16px rgba(0,0,0,0.08)'
                    : '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
                cursor: 'default',
                position: 'relative',
            }}
        >
            {/* Top row: Avatar + Nombre + Actions */}
            <div className="flex align-items-center justify-content-between mb-2">
                <div className="flex align-items-center gap-2">
                    {/* Avatar */}
                    <div
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: `${avatarColor}20`,
                            color: avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            flexShrink: 0,
                        }}
                    >
                        {initial}
                    </div>
                    {/* Nombre + empresa */}
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: COLORS.gray800, lineHeight: '1.2' }}>
                            {prospecto.nombre}
                        </div>
                        {prospecto.empresa && (
                            <div style={{ fontSize: '0.73rem', color: COLORS.gray500, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                <i className="pi pi-building mr-1" style={{ fontSize: '0.65rem' }} />
                                {prospecto.empresa}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div
                    className="flex gap-1"
                    style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.2s ease' }}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(prospecto); }}
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            padding: '4px 6px', borderRadius: '6px', color: COLORS.blue,
                            display: 'flex', alignItems: 'center',
                        }}
                        title="Editar"
                    >
                        <i className="pi pi-pencil" style={{ fontSize: '0.78rem' }} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(prospecto); }}
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            padding: '4px 6px', borderRadius: '6px', color: COLORS.red,
                            display: 'flex', alignItems: 'center',
                        }}
                        title="Eliminar"
                    >
                        <i className="pi pi-trash" style={{ fontSize: '0.78rem' }} />
                    </button>
                </div>
            </div>

            {/* Email */}
            <div style={{ fontSize: '0.76rem', color: COLORS.gray500, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <i className="pi pi-envelope mr-1" style={{ fontSize: '0.7rem', color: COLORS.gray400 }} />
                {prospecto.email}
            </div>

            {/* Teléfono */}
            <div style={{ fontSize: '0.76rem', color: COLORS.gray500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="pi pi-phone mr-1" style={{ fontSize: '0.7rem', color: COLORS.gray400 }} />
                {prospecto.telefono}
            </div>
        </div>
    );
};
