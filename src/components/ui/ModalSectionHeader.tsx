import React from 'react';
import { COLORS } from '@/utils/constants';

// ═══════════════════════════════════════════════════════════
// MODAL SECTION HEADER — Encabezado de sección en modales
// ═══════════════════════════════════════════════════════════

export interface ModalSectionHeaderProps {
    icon: string;
    title: string;
}

export const ModalSectionHeader: React.FC<ModalSectionHeaderProps> = ({ icon, title }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '8px 0 16px',
            paddingBottom: '10px',
            borderBottom: `1.5px solid ${COLORS.gray100}`,
        }}
    >
        <div
            style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: COLORS.redLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <i className={`pi ${icon}`} style={{ color: COLORS.red, fontSize: '0.85rem' }} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: COLORS.gray800 }}>{title}</span>
    </div>
);
