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

        useEffect(() => {
            const fetchInitialData = async () => {
                try {
                    // Загружаем пункты выдачи
                    const pointsData = await getAllPickUpPoints();
                    setPickUpPoints(pointsData.data);
    
                    // Загружаем все поставки
                    const suppliesData = await getAllSupplies();
                    setSupplies(suppliesData.data);
    
                    // Загружаем информацию о всех водителях
                    const allDrivers = await getAllDriversWithInfo();
                    setAllDriversInfo(allDrivers);
    
                } catch (error) {
                    setError('Ошибка загрузки данных');
                }
            };
    
            fetchInitialData();
        }, [userToken]);
    
        // Функция для получения информации о всех водителях
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
            const fetchPickUpPoints = async () => {
                try {
                    const pointsData = await getAllPickUpPoints();
                    setPickUpPoints(pointsData.data);
                } catch (error) {
                    setError('Ошибка загрузки пунктов выдачи');
                }
            };
    
            fetchPickUpPoints();
        }, [userToken]);    

    // Загрузка пунктов выдачи при монтировании
    useEffect(() => {
        if (selectedPoint) {
            const fetchDrivers = async () => {
                setIsLoadingDrivers(true);
                try {
                    const point = pickUpPoints.find(p => p.id === selectedPoint);
                    if (point) {
                        setSelectedRegion(point.region);
                        const driversData = await getDriversByRegion(point.region);
                        
                        // Загружаем информацию о пользователях для каждого водителя
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
                                    } as driverWithInfoType; // Явное приведение типа
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
                    setIsLoadingDrivers(false);
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
        if (!selectedDriver || !selectedPoint || !supplyTime) {
            setError('Заполните все поля');
            return;
        }
    
        try {
            // Преобразуем дату в правильный формат (без часового пояса)
            const timeDate = new Date(supplyTime);
            const timeWithoutTz = new Date(timeDate.getTime() - timeDate.getTimezoneOffset() * 60000);
            
            const newSupply = {
                id: 0,
                driver_id: selectedDriver,
                pick_up_point_id: selectedPoint,
                time: timeWithoutTz.toISOString().slice(0, 19).replace('T', ' ') // Формат 'YYYY-MM-DD HH:MM:SS'
            };

            if (new Date(supplyTime) < new Date()) {
                setError('Дата поставки не может быть в прошлом');
                return;
            }
    
            const createdSupply = await addSupply(newSupply, userToken);
            const all_supplies = await getAllSupplies();
            
            setSupplies(all_supplies.data);
            setSuccessMessage('Поставка успешно создана');
            setError(null);
            
            // Сброс формы
            setSelectedPoint(null);
            setSelectedDriver(null);
            setSupplyTime('');
            
        } catch (error) {
            console.error('Ошибка создания поставки:', error);
        
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

    return (
        <div className="supplies-container">
            <div className="supplies-content">
                <h1>Управление поставками</h1>
                
                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                
                <div className="supply-form">
                    <h2>Создать новую поставку</h2>
                    
                    {/* Шаг 1: Выбор пункта выдачи */}
                    <div className="form-group">
                        <label>Пункт выдачи:</label>
                        <select 
                            value={selectedPoint || ''}
                            onChange={(e) => {
                                setSelectedPoint(Number(e.target.value) || null);
                                setSelectedDriver(null); // Сброс выбранного водителя
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
                    
                    {/* Шаг 2: Выбор водителя (только после выбора пункта) */}
                    {selectedPoint && (
                        <div className="form-group">
                            <label>Водитель (регион {selectedRegion}):</label>
                            {isLoadingDrivers ? (
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
                                 {driver.userInfo?.surname + ' ' || ''} 
                                 {driver.userInfo?.name + ' ' || ''} 
                                 {driver.userInfo?.last_name + ' ' || ''}
                                (ID: {driver.id})
                              </option>
                              ))}
                        </select>
                            )}
                        </div>
                    )}
                    
                    {/* Шаг 3: Выбор времени (только после выбора водителя) */}
                    {selectedDriver && (
                        <div className="form-group">
                            <label>Дата и время поставки:</label>
                            <input
                                type="datetime-local"
                                value={supplyTime}
                                onChange={(e) => setSupplyTime(e.target.value)}
                                className="form-input"
                                min={new Date().toISOString().slice(0, 16)} // Нельзя выбрать прошедшую дату
                            />
                        </div>
                    )}
                    
                    {/* Кнопка создания (только когда все поля заполнены) */}
                    {selectedPoint && selectedDriver && supplyTime && (
                        <button 
                            className="create-button"
                            onClick={handleCreateSupply}
                        >
                            Создать поставку
                        </button>
                    )}
                </div>
                
                <div className="supplies-list">
                    <h2>Активные поставки</h2>
                    {supplies.length > 0 ? (
                        <table className="supplies-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Водитель</th>
                                    <th>Пункт выдачи</th>
                                    <th>Регион</th>
                                    <th>Время</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supplies.map(supply => {
                                    const driver = allDriversInfo.find(d => d.id === supply.driver_id);
                                    const point = pickUpPoints.find(p => p.id === supply.pick_up_point_id);
                                    return (
                                        <tr key={supply.id}>
                                            <td>{supply.id}</td>
                                            <td>{driver ? driver.userInfo.surname + " " + driver.userInfo.name + " "  + driver.userInfo.last_name: 'Неизвестно'}</td>
                                            <td>{point ? point.address : 'Неизвестно'}</td>
                                            <td>{point ? point.region : 'Неизвестно'}</td>
                                            <td>{formatDate(supply.time)}</td>
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