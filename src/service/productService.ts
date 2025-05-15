import { productType } from "../types/productType";
import api from "../api";

export const getAllProducts = async (): Promise<{ data: productType[] }> => {
    try {
        const response = await api.get('/all_products',  );
        return { data: response.data }; 
    } catch (error) {
        throw new Error('Ошибка при получении пользователей');
    }
};

export const addProduct = async (payload: productType, userToken: string): Promise<productType> => {
    try {
       return await api.post('/products', payload, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });
    } catch (error) {
        throw new Error('Ошибка при добавлении товара');
    }
};
