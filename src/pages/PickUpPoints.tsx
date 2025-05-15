import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectAuthToken } from '../features/auth/authSlice';
import { useSelector } from 'react-redux';
import { 
    getAvailablePickUpPoints, 
    assignPickUpPointToWorker, 
    addPickUpPoint, 
    deletePickUpPoint 
} from '../service/pickUpPointService';
import '../styles/CarsPage.css';

const PickUpPointsPage = () => {
    const navigate = useNavigate();
    const [pickUpPoints, setPickUpPoints] = useState<any[]>([]);
    const [region, setRegion] = useState<number>(0);
    const [workerId, setWorkerId] = useState<number | null>(null);
    const [selectedPickUpPointId, setSelectedPickUpPointId] = useState<number | null>(null);
    const [newAddress, setNewAddress] = useState<string>('');
    const [newRegion, setNewRegion] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const userToken = useSelector(selectAuthToken);

    // Проверка авторизации при загрузке страницы
    useEffect(() => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            alert('Вы не авторизованы');
            navigate('/login');
        }
    }, [navigate]);

    // Автоматическое скрытие сообщений через 5 секунд
    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, error]);

    // Запрос пунктов выдачи с сервера
    useEffect(() => {
        fetchPickUpPoints();
    }, [region]);

    const fetchPickUpPoints = async () => {
        try {
            const data = await getAvailablePickUpPoints(userToken, region);
            setPickUpPoints(data);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleAssignPickUpPoint = async () => {
        if (!workerId || !selectedPickUpPointId) {
            setError('Выберите работника и пункт выдачи');
            return;
        }

        try {
            await assignPickUpPointToWorker(workerId, selectedPickUpPointId, userToken);
            setWorkerId(null);
            setSelectedPickUpPointId(null);
            fetchPickUpPoints();
        } catch (e: any) {
        
        }
    };

    const handleAddPickUpPoint = async () => {
        if (!newAddress || !newRegion) {
            setError('Введите адрес и регион пункта выдачи');
            return;
        }
        
        try {
            await addPickUpPoint({
                id: 0,
                address: newAddress,
                region: newRegion
            }, userToken);
            setSuccessMessage('Пункт выдачи успешно добавлен');
            setNewAddress('');
            setNewRegion(0);
            fetchPickUpPoints();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDeletePickUpPoint = async () => {
        if (!selectedPickUpPointId) {
            setError('Выберите пункт выдачи для удаления');
            return;
        }
        
        try {
            await deletePickUpPoint(selectedPickUpPointId);
            setSuccessMessage('Пункт выдачи успешно удалён');
            setSelectedPickUpPointId(null);
            fetchPickUpPoints();
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="cars-page-container">
            {/* Уведомление об успехе */}
            {successMessage && (
                <div className="notification success">
                    {successMessage}
                    <button onClick={() => setSuccessMessage(null)}>×</button>
                </div>
            )}

            {/* Уведомление об ошибке */}
            {error && (
                <div className="notification error">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="cars-scrollable-content">
                <div className="cars-content">
                    <h1>Пункты выдачи</h1>

                    <div className="filter-section">
                        <label>
                            Регион:
                            <input
                                type="number"
                                value={region}
                                onChange={(e) => setRegion(Number(e.target.value))}
                                placeholder="Введите регион"
                            />
                        </label>
                    </div>

                    <ul className="cars-list">
                        {pickUpPoints.map((pickUpPoint) => (
                            <li key={pickUpPoint.id} className="car-item">
                                <input
                                    type="radio"
                                    name="pickUpPoint"
                                    value={pickUpPoint.id}
                                    onChange={() => setSelectedPickUpPointId(pickUpPoint.id)}
                                    checked={selectedPickUpPointId === pickUpPoint.id}
                                />
                                (ID: {pickUpPoint.id}) Регион: {pickUpPoint.region} Адрес: {pickUpPoint.address}
                            </li>
                        ))}
                    </ul>

                    <div className="assignment-section">
                        <label>
                            ID Работника:
                            <input
                                type="number"
                                value={workerId ?? ''}
                                onChange={(e) => setWorkerId(Number(e.target.value) || null)}
                                placeholder="Введите ID работника"
                            />
                        </label>

                        <button 
                            className="assign-button"
                            onClick={handleAssignPickUpPoint}
                            disabled={!workerId || !selectedPickUpPointId}
                        >
                            Назначить пункт выдачи работнику
                        </button>
                    </div>

                    <div className="add-car-section">
                        <h2>Добавить новый пункт выдачи</h2>
                        <label>
                            Адрес:
                            <input
                                type="text"
                                value={newAddress}
                                onChange={(e) => setNewAddress(e.target.value)}
                                placeholder="Введите адрес пункта"
                            />
                        </label>
                        <label>
                            Регион:
                            <input
                                type="number"
                                value={newRegion}
                                onChange={(e) => setNewRegion(Number(e.target.value))}
                                placeholder="Введите регион"
                            />
                        </label>
                        <button 
                            className="add-button"
                            onClick={handleAddPickUpPoint}
                            disabled={!newAddress || !newRegion}
                        >
                            Добавить пункт выдачи
                        </button>
                    </div>

                    <div className="delete-car-section">
                        <h2>Удалить пункт выдачи</h2>
                        <button 
                            className="delete-button"
                            onClick={handleDeletePickUpPoint}
                            disabled={!selectedPickUpPointId}
                        >
                            Удалить выбранный пункт выдачи
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PickUpPointsPage;