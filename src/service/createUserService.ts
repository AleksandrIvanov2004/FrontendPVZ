import api from '../api';
import { RegisterPayload } from '../types/regType';


export const createrUser = async (payload: RegisterPayload, userToken: string): Promise<void> => {
    try {
        await api.post('/users', payload, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });
    } catch (error) {
        throw new Error('Ошибка при добавлении пользователя');
    }
};