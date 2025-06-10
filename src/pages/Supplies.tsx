import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectAuthToken } from '../features/auth/authSlice';
import { useSelector } from 'react-redux';
import { addSupply, getAllSupplies } from '../service/supplyService';
import { getAllPickUpPoints } from '../service/pickUpPointService';
import { getDriversByRegion } from '../service/driverService';
import '../styles/Supplies.css';
import { pickUpPointType } from '../types/pickUpPoint';
import { driverType } from '../types/driverType';
import { getUserById } from '../service/userService';
import { RegisterPayload } from '../types/regType';
import { driverWithInfoType } from '../types/driverWithInfoType';
import { SupplyType } from '../types/supplyType';
import { getAllDrivers } from '../service/driverService';
import { getAllProducts } from '../service/productService';
import { productType } from '../types/productType';
import { StatusEnum__2 } from '../types/productType';
import { updateProduct } from '../service/productService';

const Supplies = () => {
    const navigate = useNavigate();
    const userToken = useSelector(selectAuthToken);
    
    const [supplies, setSupplies] = useState<SupplyType[]>([]);
    const [drivers, setDrivers] = useState<driverWithInfoType[]>([]);
    const [pickUpPoints, setPickUpPoints] = useState<pickUpPointType[]>([]);
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
    const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
    const [supplyTime, setSupplyTime] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
    const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
    const [allDriversInfo, setAllDriversInfo] = useState<driverWithInfoType[]>([]);
    const [filteredSupplies, setFilteredSupplies] = useState<SupplyType[]>([]);
    const [products, setProducts] = useState<productType[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<productType[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<productType[]>([]);
    const [isLoading, setIsLoading] = useState({
        drivers: false,
        products: false,
        creating: false
    });
    const [users, setUsers] = useState<RegisterPayload>({id: 0,
        login: '',
        password: '',
        surname: '',
        name: '',
        last_name: '',
        age: 0,
        phone_number: '',
        region: 0,
        role: 'worker'});

        const isOverdue = (supplyTime: string): boolean => {
            const supplyDate = new Date(supplyTime);
            const now = new Date();
            const diffTime = now.getTime() - supplyDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays >= 1;
        };
    
        const filterSupplies = (allSupplies: SupplyType[]) => {
            return allSupplies.filter(supply => !isOverdue(supply.time));
        };
    
        useEffect(() => {
            const fetchInitialData = async () => {
                try {
                    // Загружаем пункты выдачи
                    const pointsData = await getAllPickUpPoints();
                    setPickUpPoints(pointsData.data);
    
                    // Загружаем все поставки и фи  льтруем их
                    const suppliesData = await getAllSupplies();
                    setSupplies(suppliesData.data);
                    setFilteredSupplies(filterSupplies(suppliesData.data));
    
                    // Загружаем информацию о всех водителях
                    const allDrivers = await getAllDriversWithInfo();
                    setAllDriversInfo(allDrivers);
    
                    // Загружаем все товары
                    const productsData = await getAllProducts();
                    setProducts(productsData.data);
    
                } catch (error) {
                    setError('Ошибка загрузки данных');
                }
            };
    
            fetchInitialData();
        }, [userToken]);
    
        useEffect(() => {
            setFilteredSupplies(filterSupplies(supplies));
        }, [supplies]);
    
        // Фильтруем товары при выборе пункта выдачи
        useEffect(() => {
            if (selectedPoint) {
                const filtered = products.filter(
                    product => product.pick_up_point_id === selectedPoint && 
                              product.status === 'NOT_SENT'
                );
                setFilteredProducts(filtered);
            } else {
                setFilteredProducts([]);
            }
        }, [selectedPoint, products]);
    
        const getAllDriversWithInfo = async () => {
            try {
                const allDrivers = await getAllDrivers();
    
                const driversWithInfo = await Promise.all(
                    allDrivers.data.map(async (driver: driverType) => {
                        try {
                            const userInfo = await getUserById(driver.user_id);
                            return {
                                ...driver,
                                userInfo: {
                                    name: userInfo.name,
                                    surname: userInfo.surname,
                                    last_name: userInfo.last_name
                                }
                            };
                        } catch (error) {
                            console.error(`Ошибка загрузки пользователя ${driver.user_id}`, error);
                            return {
                                ...driver,
                                userInfo: {
                                    name: 'Неизвестно',
                                    surname: '',
                                    last_name: ''
                                }
                            };
                        }
                    })
                );
                return driversWithInfo;
            } catch (error) {
                console.error('Ошибка загрузки водителей', error);
                return [];
            }
        };
    
        useEffect(() => {
            if (selectedPoint) {
                const fetchDrivers = async () => {
                    setIsLoading(prev => ({...prev, drivers: true}));
                    try {
                        const point = pickUpPoints.find(p => p.id === selectedPoint);
                        if (point) {
                            setSelectedRegion(point.region);
                            const driversData = await getDriversByRegion(point.region);
                            
                            const driversWithUserInfo = await Promise.all(
                                driversData.data.map(async (driver: driverType) => {
                                    try {
                                        const userInfo = await getUserById(driver.user_id);
                                        return {
                                            id: driver.id,
                                            car_id: driver.car_id,
                                            user_id: driver.user_id,
                                            userInfo: {
                                                name: userInfo.name,
                                                surname: userInfo.surname,
                                                last_name: userInfo.last_name
                                            }
                                        } as driverWithInfoType;
                                    } catch (error) {
                                        console.error(`Ошибка загрузки пользователя ${driver.user_id}`, error);
                                        return {
                                            id: driver.id,
                                            car_id: driver.car_id,
                                            user_id: driver.user_id,
                                            userInfo: {
                                                name: 'Неизвестно',
                                                surname: '',
                                                last_name: ''
                                            }
                                        } as driverWithInfoType;
                                    }
                                })
                            );
                            
                            setDrivers(driversWithUserInfo);
                        }
                    } catch (error) {
                        setError('Ошибка загрузки водителей');
                    } finally {
                        setIsLoading(prev => ({...prev, drivers: false}));
                    }
                };
    
                fetchDrivers();
            } else {
                setDrivers([]);
                setSelectedRegion(null);
                setSelectedDriver(null);
            }
        }, [selectedPoint, userToken, pickUpPoints]);
    
        const handleCreateSupply = async () => {
            if (!selectedDriver || !selectedPoint || !supplyTime || selectedProducts.length === 0) {
                setError('Заполните все поля и выберите товары');
                return;
            }
        
            try {
                setIsLoading(prev => ({...prev, creating: true}));
                
                // Проверка времени поставки
                const timeDate = new Date(supplyTime);
                const hours = timeDate.getHours();
                
                // Проверяем что время между 9:00 и 20:00
                if (hours < 9 || hours >= 20) {
                    setError('Время поставки должно быть с 9:00 до 20:00');
                    return;
                }
        
                // Проверка что дата не в прошлом
                if (timeDate < new Date()) {
                    setError('Дата поставки не может быть в прошлом');
                    return;
                }
        
                // Создаем поставку
                const timeWithoutTz = new Date(timeDate.getTime() - timeDate.getTimezoneOffset() * 60000);
                
                const newSupply = {
                    id: 0,
                    driver_id: selectedDriver,
                    pick_up_point_id: selectedPoint,
                    time: timeWithoutTz.toISOString().slice(0, 19).replace('T', ' '),
                    ready: false
                };
        
                const createdSupply = await addSupply(newSupply, userToken);
                
                // Обновляем статус выбранных товаров
                await Promise.all(
                    selectedProducts.map(async product => {
                        const updatedProduct = {
                            ...product,
                            status: 'SENT_IN_PVZ' as StatusEnum__2,
                            supply_id: createdSupply.id
                        };
                        await updateProduct(product.id, updatedProduct, userToken);
                    })
                );
                
                // Обновляем данные
                const [updatedSupplies, updatedProducts] = await Promise.all([
                    getAllSupplies(),
                    getAllProducts()
                ]);
                
                setSupplies(updatedSupplies.data);
                setProducts(updatedProducts.data);
                setSuccessMessage(`Поставка успешно создана с ${selectedProducts.length} товарами`);
                setError(null);
                
                // Сброс формы
                setSelectedPoint(null);
                setSelectedDriver(null);
                setSupplyTime('');
                setSelectedProducts([]);
                
            } catch (error) {
                console.error('Ошибка создания поставки:', error);
                setError('Ошибка создания поставки');
            } finally {
                setIsLoading(prev => ({...prev, creating: false}));
            }
        };
    
        const handleProductSelect = (product: productType) => {
            setSelectedProducts(prev => 
                prev.some(p => p.id === product.id) 
                    ? prev.filter(p => p.id !== product.id)
                    : [...prev, product]
            );
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
    
        const getStatusLabel = (status: StatusEnum__2) => {
            switch(status) {
                case 'NOT_SENT': return 'Не отправлен';
                case 'SENT_IN_PVZ': return 'Отправлен в ПВЗ';
                case 'DELIVERED_IN_PVZ': return 'Доставлен в ПВЗ';
                case 'RECEIVED': return 'Получен';
                default: return status;
            }
        };
    
        const getStatusColor = (status: StatusEnum__2) => {
            switch(status) {
                case 'NOT_SENT': return '#ffeb3b';
                case 'SENT_IN_PVZ': return '#2196f3';
                case 'DELIVERED_IN_PVZ': return '#4caf50';
                case 'RECEIVED': return '#9e9e9e';
                default: return '#f44336';
            }
        };

        return (
            <div className="supplies-container">
                <div className="supplies-content">
                    <h1>Управление поставками</h1>
                    
                    {error && <div className="error-message">{error}</div>}
                    {successMessage && <div className="success-message">{successMessage}</div>}
                    
                    <div className="supply-form">
                        <h2>Создать новую поставку</h2>
                        
                        <div className="form-group">
                            <label>Пункт выдачи:</label>
                            <select 
                                value={selectedPoint || ''}
                                onChange={(e) => {
                                    setSelectedPoint(Number(e.target.value) || null);
                                    setSelectedDriver(null);
                                    setSelectedProducts([]);
                                }}
                                className="form-select"
                            >
                                <option value="">Выберите пункт выдачи</option>
                                {pickUpPoints.map(point => (
                                    <option key={point.id} value={point.id}>
                                        {point.address} (Регион: {point.region})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {selectedPoint && (
                            <>
                                <div className="form-group">
                                    <label>Водитель (регион {selectedRegion}):</label>
                                    {isLoading.drivers ? (
                                        <div className="loading">Загрузка водителей...</div>
                                    ) : (
                                        <select 
                                            value={selectedDriver || ''}
                                            onChange={(e) => setSelectedDriver(Number(e.target.value))}
                                            className="form-select"
                                        >
                                            <option value="">Выберите водителя</option>
                                            {drivers.map(driver => (
                                                <option key={driver.id} value={driver.id}>
                                                    {driver.userInfo?.surname} {driver.userInfo?.name} (ID: {driver.id})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                
                                {selectedDriver && (
                                    <div className="form-group">
                                    <label>Дата и время поставки (с 9:00 до 20:00):</label>
                                    <input
                                        type="datetime-local"
                                        value={supplyTime}
                                        onChange={(e) => setSupplyTime(e.target.value)}
                                        className="form-input"
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                    <div className="time-hint">Доступное время: с 9:00 до 20:00</div>
                                </div>
                                )}
                                
                                <div className="products-to-ship">
                                    <h3>Товары для отправки ({selectedProducts.length} выбрано)</h3>
                                    {filteredProducts.length > 0 ? (
                                        <div className="products-grid">
                                            {filteredProducts.map(product => (
                                                <div 
                                                    key={product.id}
                                                    className={`product-card ${
                                                        selectedProducts.some(p => p.id === product.id) ? 'selected' : ''
                                                    }`}
                                                    onClick={() => handleProductSelect(product)}
                                                >
                                                    <div className="product-header">
                                                        <span 
                                                            className="product-status"
                                                            style={{ backgroundColor: getStatusColor(product.status) }}
                                                        >
                                                            {getStatusLabel(product.status)}
                                                        </span>
                                                    </div>
                                                    <h4>Артикул: {product.articul}</h4>
                                                    <p>{product.discr}</p>
                                                    <p>ID: {product.id}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>Нет товаров для отправки в этом пункте</p>
                                    )}
                                </div>
                                
                                {selectedPoint && selectedDriver && supplyTime && selectedProducts.length > 0 && (
                                    <button 
                                        className="create-button"
                                        onClick={handleCreateSupply}
                                        
                                    >
                                        {isLoading.creating  ? 'Создание...' : 'Создать поставку'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    
                    <div className="supplies-list">
                        <h2>Активные поставки</h2>
                        {filteredSupplies.length > 0 ? (
                            <table className="supplies-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Водитель</th>
                                        <th>Пункт выдачи</th>
                                        <th>Регион</th>
                                        <th>Время</th>
                                        <th>Товаров</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSupplies.map(supply => {
                                        const driver = allDriversInfo.find(d => d.id === supply.driver_id);
                                        const point = pickUpPoints.find(p => p.id === supply.pick_up_point_id);
                                        const supplyProducts = products.filter(p => p.supply_id === supply.id);
                                        
                                        
                                        return (
                                            <tr key={supply.id}>
                                                <td>{supply.id}</td>
                                                <td>{driver ? `${driver.userInfo.surname} ${driver.userInfo.name}` : 'Неизвестно'}</td>
                                                <td>{point ? point.address : 'Неизвестно'}</td>
                                                <td>{point ? point.region : 'Неизвестно'}</td>
                                                <td>{formatDate(supply.time)}</td>
                                                <td>{supplyProducts.length}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p>Нет активных поставок</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };
    
    export default Supplies;