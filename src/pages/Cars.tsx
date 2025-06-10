import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableCars, assignCarToDriver, addCar, deleteCar } from '../service/carService';
import { getDriversByRegion } from '../service/driverService';
import { getUserById } from '../service/userService';
import { selectAuthToken } from '../features/auth/authSlice';
import { useSelector } from 'react-redux';
import '../styles/CarsPage.css';

interface DriverWithUserInfo {
  id: number;
  user_id: number;
  userInfo: {
    name: string;
    surname: string;
    last_name: string;
  };
}

const CarsPage = () => {
    const navigate = useNavigate();
    const [cars, setCars] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<DriverWithUserInfo[]>([]);
    const [region, setRegion] = useState<number | null>(null);
    const [driverId, setDriverId] = useState<number | null>(null);
    const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
    const [newCarNumber, setNewCarNumber] = useState<string>('');
    const [newCarRegion, setNewCarRegion] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loadingDrivers, setLoadingDrivers] = useState(false);
    const userToken = useSelector(selectAuthToken);

    // Проверка авторизации
    useEffect(() => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            alert('Вы не авторизованы');
            navigate('/login');
        }
    }, [navigate]);

    // Скрытие сообщений
    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, error]);

    // Загрузка машин при изменении региона
    useEffect(() => {
        fetchCars();
    }, [region]);

    const fetchCars = async () => {
        try {
            const data = await getAvailableCars(userToken, region ?? undefined);
            setCars(data);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const fetchDrivers = async () => {
        if (!region) return;
        
        setLoadingDrivers(true);
        try {
            const driversResponse = await getDriversByRegion(region);
            
            // Для каждого водителя получаем информацию о пользователе
            const driversWithInfo = await Promise.all(
                driversResponse.data.map(async (driver: any) => {
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
            
            setDrivers(driversWithInfo);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoadingDrivers(false);
        }
    };

    const handleAssignCar = async () => {
        if (!driverId || !selectedCarId) return alert('Выберите водителя и машину');

        try {
            await assignCarToDriver(driverId, selectedCarId, userToken);
            setSuccessMessage('Машина успешно назначена водителю');
            setDriverId(null);
            setSelectedCarId(null);
            fetchCars();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleAddCar = async () => {
        if (!newCarNumber || !newCarRegion) return alert('Введите номер и регион машины');
        
        try {
            await addCar({
                id: 0,
                number: newCarNumber,
                region: newCarRegion
            }, userToken);
            setSuccessMessage('Машина успешно добавлена');
            setNewCarNumber('');
            setNewCarRegion(null);
            fetchCars();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDeleteCar = async () => {
        if (!selectedCarId) return alert('Выберите машину для удаления');
        
        try {
            await deleteCar(selectedCarId);
            setSuccessMessage('Машина успешно удалена');
            setSelectedCarId(null);
            fetchCars();
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="cars-page-container">
            {successMessage && (
                <div className="notification success">
                    {successMessage}
                    <button onClick={() => setSuccessMessage(null)}>×</button>
                </div>
            )}
            {error && (
                <div className="notification error">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="cars-content">
                <h1>Свободные машины</h1>

                <div className="filter-section">
                    <label>
                        Регион:
                        <input
                            type="number"
                            value={region ?? ''}
                            onChange={(e) => setRegion(Number(e.target.value) || null)}
                            placeholder="Введите номер региона"
                        />
                    </label>
                    <button
                        className='refresh-button' 
                        onClick={fetchDrivers}
                        disabled={!region || loadingDrivers}
                    >
                        {loadingDrivers ? 'Загрузка...' : 'Загрузить водителей'}
                    </button>
                </div>

                <ul className="cars-list">
                    {cars.map((car) => (
                        <li key={car.id} className="car-item">
                            <input
                                type="radio"
                                name="car"
                                value={car.id}
                                onChange={() => setSelectedCarId(car.id)}
                                checked={selectedCarId === car.id}
                            />
                            (ID: {car.id}) {car.number} {car.region}
                        </li>
                    ))}
                </ul>

                <div className="assignment-section">
                    <label>
                        Водитель:
                        <select
                            value={driverId ?? ''}
                            onChange={(e) => setDriverId(Number(e.target.value) || null)}
                            disabled={drivers.length === 0}
                        >
                            <option value="">Выберите водителя</option>
                            {drivers.map((driver) => (
                                <option key={driver.id} value={driver.id}>
                                    {driver.id} - {driver.userInfo.surname} {driver.userInfo.name} {driver.userInfo.last_name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button 
                        className="assign-button"
                        onClick={handleAssignCar}
                        disabled={!driverId || !selectedCarId}
                    >
                        Назначить машину водителю
                    </button>
                </div>

                <div className="add-car-section">
                    <h2>Добавить новую машину</h2>
                    <label>
                        Номер машины:
                        <input
                            type="text"
                            value={newCarNumber}
                            onChange={(e) => setNewCarNumber(e.target.value)}
                            placeholder="Например: А123БВ"
                        />
                    </label>
                    <label>
                        Регион:
                        <input
                            type="number"
                            value={newCarRegion ?? ''}
                            onChange={(e) => setNewCarRegion(Number(e.target.value) || null)}
                            placeholder="Например: 77"
                        />
                    </label>
                    <button 
                        className="add-button"
                        onClick={handleAddCar}
                        disabled={!newCarNumber || !newCarRegion}
                    >
                        Добавить машину
                    </button>
                </div>

                <div className="delete-car-section">
                    <h2>Удалить машину</h2>
                    <button 
                        className="delete-button"
                        onClick={handleDeleteCar}
                        disabled={!selectedCarId}
                    >
                        Удалить выбранную машину
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CarsPage;