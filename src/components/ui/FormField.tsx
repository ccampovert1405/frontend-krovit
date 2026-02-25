import React from 'react';
import { COLORS } from '@/utils/constants';

// ═══════════════════════════════════════════════════════════
// FORM FIELD — Wrapper reutilizable para campos de formulario
// ═══════════════════════════════════════════════════════════

export interface FormFieldProps {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, required, children }) => (
    <div className="field mb-3">
        <label
            style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: COLORS.gray700,
                marginBottom: '6px',
            }}
        >
            {label} {required && <span style={{ color: COLORS.red }}>*</span>}
        </label>
        {children}
    </div>
);
