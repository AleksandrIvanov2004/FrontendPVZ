import { workingShiftType } from "../types/workingShiftType";
import api from "../api";

export const addWorkingShift = async (payload: workingShiftType, userToken: string): Promise<void> => {
    try {
        await api.post('/working_shifts', payload, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });
    } catch (error) {
        throw new Error('Ошибка при добавлении смены');
    }
};

export const getAllWorkingShifts = async (): Promise<{ data: workingShiftType[] }> => {
    try {
        const response = await api.get('/all_working_shifts');
        return { data: response.data }; 
    } catch (error) {
        throw new Error('Ошибка при получении смен');
    }
};