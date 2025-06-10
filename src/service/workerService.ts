import api from '../api';
import { workerType } from '../types/workerType';

export const getAllWorkers = async (): Promise<{ data: workerType[] }> => {
    try {
        const response = await api.get('/all_workers');
        return { data: response.data }; 
    } catch (error) {
        throw new Error('Ошибка при получении учителей');
    }
};

export const getWorkerByUserId = async (user_id: number): Promise<workerType> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await api.get(`/worker/${user_id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;  
    } catch (error) {
        throw new Error('Error fetching users');
    }
};

export const getWorkersByRegion = async (region: number): Promise<{ data: workerType[] }> => {
    try {
        const response = await api.get(`/workers/list/${region}`);
        return {data: response.data};  
    } catch (error) {
        throw new Error('Error fetching workers');
    }
};