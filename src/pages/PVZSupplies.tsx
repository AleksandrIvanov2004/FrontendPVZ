import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthToken } from '../features/auth/authSlice';
import { getSuppliesByPickUpPoint } from '../service/supplyService';
import { getWorkerByUserId } from '../service/workerService';
import { getPickUpPointById } from '../service/pickUpPointService';
import { getUserById } from '../service/userService';
import { SupplyType } from '../types/supplyType';
import { getDriverById } from '../service/driverService';
import '../styles/PvzSupplies.css';

interface SupplyWithDetails extends SupplyType {
    status: 'pending' | 'delivered' | 'processing' | 'confirmed' | 'overdue';
    pickUpPointAddress?: string;
    driverPhone?: string;
    driverName?: string;
    isConfirmed?: boolean;
}

const PvzSupplies = () => {
    const userToken = useSelector(selectAuthToken);
    const userId = Number(localStorage.getItem('userId'));
    
    const [supplies, setSupplies] = useState<SupplyWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPvzId, setCurrentPvzId] = useState<number | null>(null);
    const [pvzAddress, setPvzAddress] = useState<string>('');

    // Получаем подтвержденные поставки из localStorage
    const getConfirmedSupplies = (): number[] => {
        const confirmed = localStorage.getItem('confirmedSupplies');
        return confirmed ? JSON.parse(confirmed) : [];
    };

    // Добавляем поставку в подтвержденные
    const addConfirmedSupply = (supplyId: number) => {
        const confirmed = getConfirmedSupplies();
        if (!confirmed.includes(supplyId)) {
            const updated = [...confirmed, supplyId];
            localStorage.setItem('confirmedSupplies', JSON.stringify(updated));
        }
    };

    // Проверяем, прошли ли сутки с момента поставки
    const isOverdue = (supplyTime: string): boolean => {
        const supplyDate = new Date(supplyTime);
        const now = new Date();
        const diffTime = now.getTime() - supplyDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays >= 1;
    };

    useEffect(() => {
        const fetchPvzSupplies = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const workerData = await getWorkerByUserId(userId);
                const pvzId = Number(workerData.pick_up_point_id);
                setCurrentPvzId(pvzId);
                
                const pvzData = await getPickUpPointById(pvzId);
                setPvzAddress(pvzData.address);
                
                const response = await getSuppliesByPickUpPoint(pvzId);
                const confirmedSupplies = getConfirmedSupplies();
                const now = new Date();
                
                const enrichedSupplies = await Promise.all(
                    response.data.map(async (supply: SupplyType) => {
                        const supplyDate = new Date(supply.time);
                        const isConfirmed = confirmedSupplies.includes(supply.id);
                        const overdue = isOverdue(supply.time);
                        
                        // Определяем статус поставки
                        let status: 'pending' | 'delivered' | 'processing' | 'confirmed' | 'overdue';
                        
                        if (isConfirmed) {
                            status = 'confirmed';
                        } else if (overdue) {
                            status = 'overdue';
                        } else if (supplyDate.toDateString() === now.toDateString()) {
                            status = 'processing';
                        } else {
                            status = 'pending';
                        }
                        
                        const pointData = await getPickUpPointById(supply.pick_up_point_id);
                        
                        let driverPhone = 'Не указан';
                        let driverName = 'Не указан';
                        if (supply.driver_id) {
                            try {
                                const driverData = await getDriverById(supply.driver_id);
                                const userData = await getUserById(driverData.user_id);
                                driverPhone = userData.phone_number || 'Не указан';
                                driverName = `${userData.surname} ${userData.name} ${userData.last_name}`;
                            } catch (error) {
                                console.error(`Ошибка получения данных водителя ${supply.driver_id}:`, error);
                            }
                        }
                        
                        return {
                            ...supply,
                            status,
                            pickUpPointAddress: pointData.address,
                            driverPhone,
                            driverName,
                            isConfirmed
                        };
                    })
                );
                
                // Фильтруем поставки - скрываем только подтвержденные, которым больше суток
                const filteredSupplies = enrichedSupplies.filter(supply => {
                    if (supply.isConfirmed && isOverdue(supply.time)) {
                        return false;
                    }
                    return true;
                });
                
                // Сортируем поставки
                filteredSupplies.sort((a, b) => {
                    // Сначала просроченные
                    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
                    if (b.status === 'overdue' && a.status !== 'overdue') return 1;
                    // Затем сегодняшние
                    if (a.status === 'processing' && b.status !== 'processing') return -1;
                    if (b.status === 'processing' && a.status !== 'processing') return 1;
                    // Затем остальные
                    return new Date(a.time).getTime() - new Date(b.time).getTime();
                });
                
                setSupplies(filteredSupplies);
            } catch (error) {
                console.error('Ошибка загрузки поставок:', error);
                setError('Не удалось загрузить данные о поставках');
            } finally {
                setIsLoading(false);
            }
        };

        if (userId && userToken) {
            fetchPvzSupplies();
        }
    }, [userId, userToken]);

    const handleConfirmDelivery = async (supplyId: number) => {
        try {
            // Добавляем в подтвержденные
            addConfirmedSupply(supplyId);
            
            // Обновляем состояние
            setSupplies(prevSupplies => 
                prevSupplies.map(supply => 
                    supply.id === supplyId 
                        ? { ...supply, status: 'confirmed', isConfirmed: true } 
                        : supply
                )
            );
            
        } catch (error) {
            console.error('Ошибка подтверждения поставки:', error);
            setError('Не удалось подтвердить получение поставки');
        }
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Ожидается';
            case 'processing': return 'Сегодня';
            case 'confirmed': return 'Подтверждена';
            case 'overdue': return 'Просрочена';
            default: return '';
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'pending': return 'pending';
            case 'processing': return 'processing';
            case 'confirmed': return 'confirmed';
            case 'overdue': return 'overdue';
            default: return '';
        }
    };

    if (isLoading) {
        return <div className="loading-container">Загрузка данных...</div>;
    }

    if (error) {
        return <div className="error-container">{error}</div>;
    }

    return (
        <div className="pvz-supplies-container">
            <div className="header">
                <h1>Поставки в пункт выдачи</h1>
                <div className="pvz-info">
                    <h3>ПВЗ #{currentPvzId}</h3>
                    <p>{pvzAddress}</p>
                </div>
            </div>
            
            <div className="supplies-list">
                {supplies.length > 0 ? (
                    <div className="supply-cards">
                        {supplies.map(supply => (
                            <div key={supply.id} className={`supply-card ${getStatusClass(supply.status)}`}>
                                <div className="supply-card-header">
                                    <h3>Поставка #{supply.id}</h3>
                                    <span className={`supply-status ${getStatusClass(supply.status)}`}>
                                        {getStatusLabel(supply.status)}
                                    </span>
                                </div>
                                
                                <div className="supply-details">
                                    <div className="detail">
                                        <span className="detail-label">Дата и время:</span>
                                        <span className="detail-value">{formatDate(supply.time)}</span>
                                    </div>
                                    
                                    <div className="detail">
                                        <span className="detail-label">Адрес ПВЗ:</span>
                                        <span className="detail-value">{supply.pickUpPointAddress}</span>
                                    </div>
                                    
                                    {supply.driver_id && (
                                        <>
                                            <div className="detail">
                                                <span className="detail-label">Водитель:</span>
                                                <span className="detail-value">
                                                    {supply.driverName} 
                                                </span>
                                            </div>
                                            <div className="detail">
                                                <span className="detail-label">Телефон:</span>
                                                <a 
                                                    href={`tel:${supply.driverPhone}`} 
                                                    className="detail-value phone-link"
                                                >
                                                    {supply.driverPhone}
                                                </a>
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                {(supply.status === 'processing' || supply.status === 'overdue') && (
                                    <div className="supply-actions">
                                        <button 
                                            className="confirm-button"
                                            onClick={() => handleConfirmDelivery(supply.id)}
                                        >
                                            Подтвердить получение
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-supplies">
                        <p>Нет поставок в ваш пункт выдачи</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PvzSupplies;