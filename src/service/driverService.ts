import api from '../api';
import { driverType } from '../types/driverType';

export const getAllDrivers = async (): Promise<{ data: driverType[] }> => {
    try {
        const response = await api.get('/all_drivers');
        return { data: response.data }; 
    } catch (error) {
        throw new Error('Ошибка при получении водителей');
    }
};

export const getDriversByRegion = async (region: number): Promise<{ data: driverType[] }> => {
    try {
        const response = await api.get(`/drivers/list/${region}`);
        return {data: response.data};  
    } catch (error) {
        throw new Error('Error fetching drivers');
    }
};

export const getDriverByUserId = async (user_id: number): Promise<driverType> => {
    try {
        const response = await api.get(`/driver/${user_id}`);
        return response.data;  
    } catch (error) {
        throw new Error('Error fetching users');
    }
};

export const getDriverById = async (id: number): Promise<driverType> => {
    try {
        const response = await api.get(`/drivers/${id}`);
        return response.data;  
    } catch (error) {
        throw new Error('Error fetching users');
    }
};