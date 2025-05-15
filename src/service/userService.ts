import api from '../api';
import { RegisterPayload } from '../types/regType';
import { UserType } from '../types/userType';

export const getAllUsers = async (): Promise<{ data: UserType[] }> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await api.get('/all_users',  {
            headers: { Authorization: `Bearer ${token}` }
        });
        return { data: response.data }; 
    } catch (error) {
        throw new Error('Ошибка при получении пользователей');
    }
};

export const getUserById = async (id: number): Promise<RegisterPayload> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await api.get(`/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;  
    } catch (error) {
        throw new Error('Error fetching users');
    }
};

export const deleteUser = async (userId: number): Promise<void> => {
    try {
        const token = localStorage.getItem('authToken');
        await api.delete(`/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error) {
        throw new Error('Ошибка при удалении пользователя');
    }
};