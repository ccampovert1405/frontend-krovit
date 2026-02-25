import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

// ═══════════════════════════════════════════════════════════
// PÁGINA DE LOGIN
// ═══════════════════════════════════════════════════════════

interface LoginPageProps {
    onForgotPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onForgotPassword }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = (): boolean => {
        const e: { email?: string; password?: string } = {};
        if (!email.trim()) e.email = 'El correo es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Ingresa un correo válido';
        if (!password) e.password = 'La contraseña es requerida';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setError(null);
        if (!validate()) return;
        setLoading(true);
        try {
            await login({ correo: email.trim(), password });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Orbs decorativos */}
            <div className="auth-orb auth-orb--1" />
            <div className="auth-orb auth-orb--2" />

            <div className="auth-card">
                {/* Header */}
                <div className="auth-header">
                    <div className="auth-icon-wrap">
                        <i className="pi pi-shield" />
                    </div>
                    <h1>Planifikt CRM</h1>
                    <p>Inicia sesión en tu cuenta</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="auth-error-banner">
                        <i className="pi pi-exclamation-circle" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form className="auth-form" onSubmit={handleSubmit}>
                    {/* Email */}
                    <div className={`auth-field ${errors.email ? 'auth-field--error' : ''}`}>
                        <label htmlFor="login-email">Correo electrónico</label>
                        <input
                            id="login-email"
                            type="text"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                            placeholder="correo@ejemplo.com"
                            autoComplete="email"
                            disabled={loading}
                        />
                        {errors.email && <div className="auth-field__error">{errors.email}</div>}
                    </div>

                    {/* Password */}
                    <div className={`auth-field ${errors.password ? 'auth-field--error' : ''}`}>
                        <label htmlFor="login-password">Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="login-password"
                                type={showPwd ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                                placeholder="Ingresa tu contraseña"
                                autoComplete="current-password"
                                disabled={loading}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(!showPwd)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                                    color: 'rgba(255,255,255,0.35)', fontSize: '14px'
                                }}
                            >
                                <i className={showPwd ? 'pi pi-eye-slash' : 'pi pi-eye'} />
                            </button>
                        </div>
                        {errors.password && <div className="auth-field__error">{errors.password}</div>}
                    </div>

                    {/* Submit */}
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? (
                            <><i className="pi pi-spin pi-spinner" /> Iniciando sesión...</>
                        ) : (
                            <><i className="pi pi-sign-in" /> Iniciar Sesión</>
                        )}
                    </button>

                    {/* Forgot */}
                    <div className="auth-secondary">
                        <button type="button" onClick={onForgotPassword}>
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
