import React, { useState } from 'react';
import { useAuth } from '@/hooks';
import { Dialog } from 'primereact/dialog';
import { COLORS } from '@/utils/constants';

interface ChangePasswordModalProps {
    visible: boolean;
    onHide: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ visible, onHide }) => {
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
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Error al cambiar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError(null);
        setErrors({});
        onHide();
    };

    const EyeBtn = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
        <button
            type="button"
            onClick={toggle}
            style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                color: COLORS.gray400, fontSize: '14px'
            }}
        >
            <i className={show ? 'pi pi-eye-slash' : 'pi pi-eye'} />
        </button>
    );

    return (
        <Dialog
            visible={visible}
            onHide={handleClose}
            header={null}
            showHeader={false}
            closable={false}
            style={{ width: '420px', borderRadius: '24px', overflow: 'hidden', border: 'none' }}
            contentStyle={{ padding: 0, borderRadius: '24px', border: 'none' }}
        >
            <div className="bg-white p-5">
                {/* Custom Header with close button */}
                <div className="flex justify-content-between align-items-center mb-5">
                    <div className="flex align-items-center gap-3">
                        <div className="flex align-items-center justify-content-center border-round-12"
                            style={{ width: '42px', height: '42px', backgroundColor: '#FEE2E2', color: COLORS.red }}>
                            <i className="pi pi-lock text-xl" />
                        </div>
                        <div>
                            <h2 className="m-0 text-xl font-black text-900">Cambiar Contraseña</h2>
                            <p className="m-0 text-xs text-500 font-medium">Protege tu acceso a la plataforma</p>
                        </div>
                    </div>
                    {!loading && (
                        <button
                            onClick={handleClose}
                            className="p-2 border-round-circle border-none bg-gray-50 text-500 cursor-pointer hover:bg-gray-100 transition-duration-200"
                        >
                            <i className="pi pi-times" />
                        </button>
                    )}
                </div>

                {success ? (
                    <div className="text-center py-4">
                        <div className="flex align-items-center justify-content-center border-round-circle mx-auto mb-4"
                            style={{ width: '80px', height: '80px', backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                            <i className="pi pi-check text-4xl" />
                        </div>
                        <h3 className="text-2xl font-bold text-900 mb-2">¡Todo listo!</h3>
                        <p className="text-600 mb-5">Tu contraseña ha sido actualizada con éxito.</p>
                        <button
                            onClick={handleClose}
                            className="w-full py-3 border-round-xl border-none font-bold text-white cursor-pointer transition-all active:scale-95"
                            style={{ backgroundColor: COLORS.red, boxShadow: '0 4px 12px rgba(227, 30, 36, 0.2)' }}
                        >
                            Entendido
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-column gap-4">
                        {error && (
                            <div className="p-3 border-round-xl bg-red-50 text-red-600 flex align-items-center gap-2 text-sm font-semibold border-1" style={{ borderColor: '#FEE2E2' }}>
                                <i className="pi pi-exclamation-circle" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex flex-column gap-2">
                            <label className="text-xs font-bold text-500 tracking-wider">CONTRASEÑA ACTUAL</label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => { setCurrentPassword(e.target.value); if (errors.currentPassword) setErrors(p => ({ ...p, currentPassword: undefined })); }}
                                    placeholder="••••••••"
                                    disabled={loading}
                                    className={`w-full p-3 border-round-xl border-1 text-900 font-semibold outline-none transition-all ${errors.currentPassword ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-red-400 bg-gray-50'}`}
                                />
                                <EyeBtn show={showCurrent} toggle={() => setShowCurrent(!showCurrent)} />
                            </div>
                            {errors.currentPassword && <span className="text-xs text-red-500 font-bold">{errors.currentPassword}</span>}
                        </div>

                        <div className="w-full h-px bg-gray-100" />

                        <div className="flex flex-column gap-2">
                            <label className="text-xs font-bold text-500 tracking-wider">NUEVA CONTRASEÑA</label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(p => ({ ...p, newPassword: undefined })); }}
                                    placeholder="Mínimo 6 caracteres"
                                    disabled={loading}
                                    className={`w-full p-3 border-round-xl border-1 text-900 font-semibold outline-none transition-all ${errors.newPassword ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-red-400 bg-gray-50'}`}
                                />
                                <EyeBtn show={showNew} toggle={() => setShowNew(!showNew)} />
                            </div>
                            {errors.newPassword && <span className="text-xs text-red-500 font-bold">{errors.newPassword}</span>}
                        </div>

                        <div className="flex flex-column gap-2">
                            <label className="text-xs font-bold text-500 tracking-wider">CONFIRMAR NUEVA CONTRASEÑA</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: undefined })); }}
                                    placeholder="Repite la contraseña"
                                    disabled={loading}
                                    className={`w-full p-3 border-round-xl border-1 text-900 font-semibold outline-none transition-all ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-red-400 bg-gray-50'}`}
                                />
                                <EyeBtn show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                            </div>
                            {errors.confirmPassword && <span className="text-xs text-red-500 font-bold">{errors.confirmPassword}</span>}
                        </div>

                        <div className="flex flex-column gap-2 mt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 border-round-xl border-none font-bold text-white cursor-pointer transition-all active:scale-95 disabled:opacity-70 disabled:cursor-auto"
                                style={{
                                    backgroundColor: COLORS.red,
                                    boxShadow: '0 4px 12px rgba(227, 30, 36, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                            >
                                {loading && <i className="pi pi-spin pi-spinner" />}
                                {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                            </button>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="w-full py-2 border-none bg-transparent text-500 font-bold cursor-pointer hover:text-700 transition-duration-200"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Dialog>
    );
};
