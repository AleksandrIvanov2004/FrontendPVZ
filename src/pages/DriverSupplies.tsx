import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectAuthToken } from '../features/auth/authSlice';
import { useSelector } from 'react-redux';
import { getSuppliesByDriver } from '../service/supplyService';
import { getDriverByUserId } from '../service/driverService';
import { getPickUpPointById } from '../service/pickUpPointService';
import { SupplyType } from '../types/supplyType';
import '../styles/DriverSupplies.css';

interface SupplyWithDetails extends SupplyType {
    pickUpPointAddress?: string;
    pickUpPointRegion?: number;
    status: 'pending' | 'processing' | 'confirmed' | 'overdue';
    isConfirmed?: boolean;
}

const DriverSupplies = () => {
    const navigate = useNavigate();
    const userToken = useSelector(selectAuthToken);
    const userId = Number(localStorage.getItem('userId'));
    
    const [supplies, setSupplies] = useState<SupplyWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDriverId, setCurrentDriverId] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        const fetchDriverSupplies = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const driverData = await getDriverByUserId(userId);
                setCurrentDriverId(driverData.id);
                
                const response = await getSuppliesByDriver(driverData.id);
                const confirmedSupplies = getConfirmedSupplies();
                const now = new Date();
                
                const enrichedSupplies = await Promise.all(
                    response.data.map(async (supply: SupplyType) => {
                        const pointResponse = await getPickUpPointById(supply.pick_up_point_id);
                        const isConfirmed = confirmedSupplies.includes(supply.id);
                        const overdue = isOverdue(supply.time);
                        
                        // Определяем статус поставки
                        let status: 'pending' | 'processing' | 'confirmed' | 'overdue';
                        
                        if (isConfirmed) {
                            status = 'confirmed';
                        } else if (overdue) {
                            status = 'overdue';
                        } else if (new Date(supply.time).toDateString() === now.toDateString()) {
                            status = 'processing';
                        } else {
                            status = 'pending';
                        }
                        
                        return {
                            ...supply,
                            pickUpPointAddress: pointResponse.address,
                            pickUpPointRegion: pointResponse.region,
                            status,
                            isConfirmed
                        };
                    })
                );
                
                // Фильтруем поставки - показываем все, кроме подтвержденных с истекшим сроком
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
                    // Затем остальные по дате
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
            fetchDriverSupplies();
        }
    }, [userId, userToken]);

    const handleMarkAsDelivered = async (supplyId: number) => {
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
            
            setSuccessMessage('Поставка отмечена как доставленная');
        } catch (error) {
            console.error('Ошибка при подтверждении поставки:', error);
            setError('Не удалось отметить поставку как доставленную');
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
            case 'pending': return 'Запланирована';
            case 'processing': return 'Сегодня';
            case 'confirmed': return 'Доставлена';
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
        <div className="driver-supplies-container">
            <div className="header">
                <h1>Мои поставки</h1>
                {successMessage && <div className="success-message">{successMessage}</div>}
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
                                        <span className="detail-label">Пункт выдачи:</span>
                                        <span className="detail-value">
                                            {supply.pickUpPointAddress} (Регион: {supply.pickUpPointRegion})
                                        </span>
                                    </div>
                                </div>
                                
                                {(supply.status === 'processing' || supply.status === 'overdue') && (
                                    <div className="supply-actions">
                                        <button 
                                            className="delivered-button"
                                            onClick={() => handleMarkAsDelivered(supply.id)}
                                        >
                                            Доставлено
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-supplies">
                        <p>У вас нет активных поставок</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverSupplies;