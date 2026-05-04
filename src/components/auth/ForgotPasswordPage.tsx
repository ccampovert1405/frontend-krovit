import React, { useState } from 'react';
import { useAuth } from '@/hooks';

// ═══════════════════════════════════════════════════════════
// PÁGINA DE CAMBIO DE CONTRASEÑA
// ═══════════════════════════════════════════════════════════

interface ForgotPasswordPageProps {
    onBackToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBackToLogin }) => {
    const { changePassword } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<{
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>({});

    const validate = (): boolean => {
        const e: typeof errors = {};
        if (!currentPassword) e.currentPassword = 'La contraseña actual es requerida';
        if (!newPassword) e.newPassword = 'La nueva contraseña es requerida';
        else if (newPassword.length < 6) e.newPassword = 'Mínimo 6 caracteres';
        if (!confirmPassword) e.confirmPassword = 'Confirma tu nueva contraseña';
        else if (newPassword !== confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setError(null);
        if (!validate()) return;
        setLoading(true);
        try {
            await changePassword({ oldPassword: currentPassword, newPassword });
            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    // Toggle eye button
    const EyeBtn = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
        <button
            type="button"
            onClick={toggle}
            style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                color: 'rgba(255,255,255,0.35)', fontSize: '14px'
            }}
        >
            <i className={show ? 'pi pi-eye-slash' : 'pi pi-eye'} />
        </button>
    );

    return (
        <div className="auth-page">
            <div className="auth-orb auth-orb--1" />
            <div className="auth-orb auth-orb--2" />

            <div className="auth-card">
                {/* Header */}
                <div className="auth-header">
                    <div className="auth-icon-wrap">
                        <i className="pi pi-lock" />
                    </div>
                    <h1>Cambiar Contraseña</h1>
                    <p>Ingresa tu contraseña actual y la nueva</p>
                </div>

                {success ? (
                    <div className="auth-success">
                        <div className="auth-success__icon">
                            <i className="pi pi-check" />
                        </div>
                        <h3>¡Contraseña actualizada!</h3>
                        <p>Tu contraseña ha sido cambiada exitosamente.</p>
                        <button className="auth-btn" style={{ marginTop: '24px' }} onClick={onBackToLogin}>
                            <i className="pi pi-arrow-left" /> Volver al inicio de sesión
                        </button>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="auth-error-banner">
                                <i className="pi pi-exclamation-circle" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form className="auth-form" onSubmit={handleSubmit}>
                            {/* Current password */}
                            <div className={`auth-field ${errors.currentPassword ? 'auth-field--error' : ''}`}>
                                <label htmlFor="current-pwd">Contraseña actual</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="current-pwd"
                                        type={showCurrent ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => { setCurrentPassword(e.target.value); if (errors.currentPassword) setErrors(p => ({ ...p, currentPassword: undefined })); }}
                                        placeholder="Ingresa tu contraseña actual"
                                        disabled={loading}
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <EyeBtn show={showCurrent} toggle={() => setShowCurrent(!showCurrent)} />
                                </div>
                                {errors.currentPassword && <div className="auth-field__error">{errors.currentPassword}</div>}
                            </div>

                            <div className="auth-divider"><span>Nueva contraseña</span></div>

                            {/* New password */}
                            <div className={`auth-field ${errors.newPassword ? 'auth-field--error' : ''}`}>
                                <label htmlFor="new-pwd">Nueva contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="new-pwd"
                                        type={showNew ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(p => ({ ...p, newPassword: undefined })); }}
                                        placeholder="Mínimo 6 caracteres"
                                        disabled={loading}
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <EyeBtn show={showNew} toggle={() => setShowNew(!showNew)} />
                                </div>
                                {errors.newPassword && <div className="auth-field__error">{errors.newPassword}</div>}
                            </div>

                            {/* Confirm password */}
                            <div className={`auth-field ${errors.confirmPassword ? 'auth-field--error' : ''}`}>
                                <label htmlFor="confirm-pwd">Confirmar nueva contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="confirm-pwd"
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: undefined })); }}
                                        placeholder="Repite la nueva contraseña"
                                        disabled={loading}
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <EyeBtn show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                                </div>
                                {errors.confirmPassword && <div className="auth-field__error">{errors.confirmPassword}</div>}
                            </div>

                            {/* Submit */}
                            <button type="submit" className="auth-btn" disabled={loading}>
                                {loading ? (
                                    <><i className="pi pi-spin pi-spinner" /> Cambiando...</>
                                ) : (
                                    <><i className="pi pi-check" /> Cambiar Contraseña</>
                                )}
                            </button>

                            {/* Back */}
                            <div className="auth-secondary">
                                <button type="button" onClick={onBackToLogin}>
                                    <i className="pi pi-arrow-left" style={{ marginRight: '6px', fontSize: '0.7rem' }} />
                                    Volver al inicio de sesión
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
