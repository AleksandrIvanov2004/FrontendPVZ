import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthToken } from '../features/auth/authSlice';
import { getAllProducts, updateProductStatus } from '../service/productService'; // Добавлен updateProductStatus
import { getPickUpPointById } from '../service/pickUpPointService';
import { getSupplyById } from '../service/supplyService';
import { getWorkerByUserId } from '../service/workerService';
import '../styles/ProductsPage1.css';

export type StatusEnum__2 = 'NOT_SENT' | 'SENT_IN_PVZ' | 'DELIVERED_IN_PVZ' | 'RECEIVED';

export type productType = {
    id: number;
    articul: string;
    discr: string;
    pick_up_point_id: number;
    supply_id: number | null;
    status: StatusEnum__2;
};

interface EnhancedProduct extends productType {
    pickUpPointAddress: string;
    supplyDate: string | null;
}

const ProductsPagePVZ = () => {
    const token = useSelector(selectAuthToken);
    const userId = Number(localStorage.getItem('userId'));
    const [products, setProducts] = useState<EnhancedProduct[]>([]);
    const [loading, setLoading] = useState({
        initial: true,
        updating: false
    });
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<StatusEnum__2 | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPvz, setCurrentPvz] = useState<{
        id: number;
        address: string;
    } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setError(null);
                setLoading(prev => ({ ...prev, initial: true }));
                
                const worker = await getWorkerByUserId(userId);
                const pvzId = Number(worker.pick_up_point_id);
                const pvz = await getPickUpPointById(pvzId);
                
                setCurrentPvz({ id: pvzId, address: pvz.address });
                
                const response = await getAllProducts();
                const pvzProducts = response.data.filter(
                    (product: productType) => product.pick_up_point_id === pvzId
                );
                
                const enhancedProducts = await enhanceProductsData(pvzProducts);
                setProducts(enhancedProducts);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ошибка загрузки товаров');
                console.error('Ошибка загрузки:', err);
            } finally {
                setLoading(prev => ({ ...prev, initial: false }));
            }
        };

        if (token && userId) loadData();
    }, [token, userId]);

    const enhanceProductsData = async (products: productType[]): Promise<EnhancedProduct[]> => {
        return await Promise.all(products.map(async product => {
            let supplyDate = null;
            
            try {
                if (product.supply_id) {
                    const supply = await getSupplyById(product.supply_id);
                    supplyDate = supply.time;
                }
            } catch (err) {
                console.error('Ошибка загрузки данных поставки:', err);
            }
            
            return {
                ...product,
                pickUpPointAddress: currentPvz?.address || 'Не указан',
                supplyDate
            };
        }));
    };

    // Функция для подтверждения выдачи товара
    const handleConfirmDelivery = async (productId: number) => {
        try {
            setLoading(prev => ({ ...prev, updating: true }));
            setError(null);
            
            // Находим продукт для обновления
            const productToUpdate = products.find(p => p.id === productId);
            if (!productToUpdate) return;
            
            // Обновляем статус товара
            await updateProductStatus(productId, {
                ...productToUpdate,
                status: 'RECEIVED'
            });
            
            // Обновляем состояние
            setProducts(prev => prev.map(product => 
                product.id === productId 
                    ? { ...product, status: 'RECEIVED' } 
                    : product
            ));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка подтверждения выдачи');
            console.error('Ошибка подтверждения:', err);
        } finally {
            setLoading(prev => ({ ...prev, updating: false }));
        }
    };

    const getStatusText = (status: StatusEnum__2): string => {
        switch(status) {
            case 'NOT_SENT': return 'Не отправлен';
            case 'SENT_IN_PVZ': return 'Отправлен в ПВЗ';
            case 'DELIVERED_IN_PVZ': return 'Доставлен в ПВЗ';
            case 'RECEIVED': return 'Получен';
            default: return status;
        }
    };

    const getStatusClass = (status: StatusEnum__2): string => {
        switch(status) {
            case 'NOT_SENT': return 'not-sent';
            case 'SENT_IN_PVZ': return 'sent';
            case 'DELIVERED_IN_PVZ': return 'delivered';
            case 'RECEIVED': return 'received';
            default: return '';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Не указана';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredProducts = products.filter(product => {
        if (filterStatus !== 'all' && product.status !== filterStatus) {
            return false;
        }
        
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            return (
                product.articul.toLowerCase().includes(term) ||
                product.discr.toLowerCase().includes(term)
            );
        }
        
        return true;
    });

    if (loading.initial) return <div className="loading">Загрузка товаров...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!currentPvz) return <div className="error">Не удалось загрузить данные ПВЗ</div>;

    return (
        <div className="products-page">
            <header>
                <h1>Товары в пункте выдачи</h1>
                <div className="pvz-info">
                    <h3>ПВЗ #{currentPvz.id}</h3>
                    <p>{currentPvz.address}</p>
                </div>
            </header>
            
            <div className="controls">
                <div className="filter-group">
                    <label>Статус:</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as StatusEnum__2 | 'all')}
                    >
                        <option value="all">Все статусы</option>
                        <option value="NOT_SENT">Не отправлен</option>
                        <option value="SENT_IN_PVZ">Отправлен в ПВЗ</option>
                        <option value="DELIVERED_IN_PVZ">Доставлен в ПВЗ</option>
                        <option value="RECEIVED">Получен</option>
                    </select>
                </div>
                
                <div className="search-group">
                    <input
                        type="text"
                        placeholder="Поиск по артикулу или описанию..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="products-list">
                {filteredProducts.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Артикул</th>
                                <th>Описание</th>
                                <th>Дата поставки</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product.id}>
                                    <td>{product.id}</td>
                                    <td>{product.articul}</td>
                                    <td>{product.discr}</td>
                                    <td>{formatDate(product.supplyDate)}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(product.status)}`}>
                                            {getStatusText(product.status)}
                                        </span>
                                    </td>
                                    <td>
                                        {product.status === 'DELIVERED_IN_PVZ' && (
                                            <button
                                                onClick={() => handleConfirmDelivery(product.id)}
                                                disabled={loading.updating}
                                                className="confirm-button"
                                            >
                                                {loading.updating ? 'Обработка...' : 'Подтвердить выдачу'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="no-results">
                        {products.length === 0 
                            ? 'Нет товаров в вашем пункте выдачи' 
                            : 'Товары по вашему запросу не найдены'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsPagePVZ;