import api from '../api';
import { carType } from '../types/carType';
import { driverType } from '../types/driverType';

export const getAvailableCars = async (userToken: string, region?: number) => {
    try {
        const response = await api.get('/available_cars', {
            headers: {
                Authorization: `Bearer ${userToken}`, // Добавляем токен в заголовок
            },
            params: {
                region,
            },
        });
        return response.data
    } catch (error) {
        throw new Error('Ошибка при получении машин');
    }
};

export const assignCarToDriver = async (driverId: number, carId: number, userToken: string): Promise<driverType> => {
    try {
        const response = await api.put(`/drivers/${driverId}/${carId}/assign_car`, {
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userToken}`, // Добавляем токен в заголовок
            },
        });
        return response.data;
    } catch (error) {
        throw new Error('Ошибка при назначении машины');
    }
};

export const addCar = async (payload: carType, userToken: string): Promise<void> => {
    try {
        await api.post('/cars', payload, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });
    } catch (error) {
        throw new Error('Ошибка при добавлении машины');
    }
};

export const deleteCar = async (carId: number): Promise<void> => {
    try {
        const token = localStorage.getItem('authToken');
        await api.delete(`/cars/${carId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error) {
        throw new Error('Ошибка при удалении машины');
    }
};