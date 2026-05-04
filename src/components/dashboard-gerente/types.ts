export interface Lead {
    "Full name"?: string;
    "Phone number"?: string;
    "¿En qué ciudad vives?"?: string;
    "¿Cuánto puedes pagar mensualmente por tu vehículo?"?: string;
    "¿Tienes disponible para un pago inicial ?"?: string;
    "Resultado 1ra.Llamada"?: string;
    "Resultado 2da.Llamada"?: string;
    "Vendedor Asignado"?: string;
    "Lead"?: string;
    "Etapa"?: string;
    "Data created"?: string;
    "Date created"?: string;
    // Housing specific
    "¿En qué estás interesado?"?: string;
    "¿Cuánto puedes pagar mensualmente por tu vivienda?"?: string;
    "Etapa Oportunidad"?: string;
    _tipo?: 'veh' | 'viv';
}

export interface VendorStats {
    total: number;
    veh: number;
    viv: number;
    gestionados: number;
    calientes: number;
}

export type Period = 7 | 14 | 30 | 0;
