/**
 * Formats user names strictly as "First Name + First Last Name"
 * taking only the first part of nombres and the first part of apellidos.
 */
export const formatUserDisplayName = (nombres: string = '', apellidos: string = ''): string => {
    const first = nombres.trim().split(/\s+/)[0] || '';
    const last = apellidos.trim().split(/\s+/)[0] || '';
    const full = `${first} ${last}`.trim();
    return full || 'Usuario';
};
