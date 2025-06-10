import { SupplyType } from "../types/supplyType";
import api from "../api";

export const getAllSupplies = async (): Promise<{ data: SupplyType[] }> => {
    try {
        const response = await api.get('/all_supplies');
        return { data: response.data }; 
    } catch (error) {
        throw new Error('Ошибка при получении поставок');
    }
};

export const getSupplyById = async (id: number): Promise<SupplyType> => {
    try {
        const response = await api.get(`/supplies/${id}`);
        return response.data;  
    } catch (error) {
        throw new Error('Error fetching supplies');
    }
};


export const addSupply = async (payload: SupplyType, userToken: string): Promise<SupplyType> => {
    try {
        const response = await api.post('/supplies', payload, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error('Ошибка при добавлении поставки');
    }
};

export const getSuppliesByDriver = async (driver_id: number): Promise<{ data: SupplyType[] }> => {
    try {
        const response = await api.get(`/supplies/list/${driver_id}`);
        return {data: response.data};  
    } catch (error) {
        throw new Error('Error fetching supplies');
    }
};

export const getSuppliesByPickUpPoint = async (pick_up_point_id: number): Promise<{ data: SupplyType[] }> => {
    try {
        const response = await api.get(`/supplies/spisok/${pick_up_point_id}`);
        return {data: response.data};  
    } catch (error) {
        throw new Error('Error fetching supplies');
    }
};

export const deleteSupplyById = async (supplyId: number): Promise<void> => {
    try {
        await api.delete(`/supplies/${supplyId}`);
    } catch (error) {
        throw new Error('Ошибка при удалении поставки');
    }
};

export const updateSupplyReadyStatus = async (supplyId: number, updatedData: SupplyType): Promise<SupplyType> => {
    try {
        const response = await api.put(`/supplies/${supplyId}`, updatedData, {
           
        });
        return response.data;
    } catch (error) {
        throw new Error('Ошибка при обновлении поставки');
    }
};