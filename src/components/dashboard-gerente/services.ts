import axios from 'axios';
import { Lead } from './types';
import { API_VEH, API_VIV } from './constants';

export const leadService = {
    /**
     * Fetches vehicle leads from the API.
     */
    getVehicleLeads: async (): Promise<Lead[]> => {
        try {
            const response = await axios.get<Lead[]>(API_VEH);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error fetching vehicle leads:', error);
            throw error;
        }
    },

    /**
     * Fetches housing leads from the API.
     */
    getHousingLeads: async (): Promise<Lead[]> => {
        try {
            const response = await axios.get<Lead[]>(API_VIV);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error fetching housing leads:', error);
            throw error;
        }
    },

    /**
     * Fetches both vehicle and housing leads in parallel.
     */
    getAllLeads: async (): Promise<[Lead[], Lead[]]> => {
        return Promise.all([
            leadService.getVehicleLeads(),
            leadService.getHousingLeads(),
        ]);
    }
};
