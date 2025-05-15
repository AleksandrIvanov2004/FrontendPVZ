import api from '../api';
import { workerType } from '../types/workerType';
import { pickUpPointType } from '../types/pickUpPoint';

export const getAllPickUpPoints = async (): Promise<{ data: pickUpPointType[] }> => {
    try {
        const response = await api.get('/all_pick_up_points');
        return { data: response.data }; 
    } catch (error) {
        throw new Error('Ошибка при получении пунктов выдачи');
    }
};

export const getAvailablePickUpPoints = async (userToken: string, region: number) => {
    try {
        const response = await api.get('/available_pick_up_points', {
            headers: {
                Authorization: `Bearer ${userToken}`, // Добавляем токен в заголовок
            },
            params: {
                region,
            },
        });
        return response.data
    } catch (error) {
        throw new Error('Ошибка при получении пунктов выдачи');
    }
};

export const assignPickUpPointToWorker = async (workerId: number, pickUpPointId: number, userToken: string): Promise<workerType> => {
    try {
        const response = await api.put(`/workers/${workerId}/${pickUpPointId}/assign_pick_up_point`, {
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userToken}`, // Добавляем токен в заголовок
            },
        });
        return response.data;
    } catch (error) {
        throw new Error('Ошибка при назначении пункта назначения');
    }
};

export const addPickUpPoint = async (payload: pickUpPointType, userToken: string): Promise<void> => {
    try {
        await api.post('/pick_up_points', payload, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });
    } catch (error) {
        throw new Error('Ошибка при добавлении пункьа выдачи');
    }
};

export const deletePickUpPoint = async (pickUpPointId: number): Promise<void> => {
    try {
        const token = localStorage.getItem('authToken');
        await api.delete(`/pick_up_points/${pickUpPointId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error) {
        throw new Error('Ошибка при удалении пункта выдачи');
    }
};

export const getPickUpPointById = async (id: number): Promise<pickUpPointType> => {
    try {
        const response = await api.get(`/pick_up_points/${id}`);
        return response.data;  
    } catch (error) {
        throw new Error('Error fetching users');
    }
};
