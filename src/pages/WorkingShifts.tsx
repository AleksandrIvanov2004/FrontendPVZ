import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectAuthToken } from '../features/auth/authSlice';
import { useSelector } from 'react-redux';
import { addWorkingShift } from '../service/workingShiftService';
import '../styles/WorkingShifts.css';
import { getWorkerByUserId } from '../service/workerService';

const WorkingShifts = () => {
    const navigate = useNavigate();
    const userToken = useSelector(selectAuthToken);
    const userId = Number(localStorage.getItem('userId'));
    
    const [shiftStarted, setShiftStarted] = useState(false);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [workerId, setWorkerId] = useState<number>(0);

    const fetchWorkerByUserId = async () => {
        try {
            const data = await getWorkerByUserId(userId);
            setWorkerId(data.id);
        } catch (e: any) {
            alert(e.message);
        }
    };

    fetchWorkerByUserId();

    // Преобразование Date в строку для Python datetime
    const toPythonDateTime = (date: Date): string => {
        return date.toISOString().replace('Z', ''); // Убираем 'Z' для совместимости
    };

    const handleStartShift = () => {
        const now = new Date();
        setStartTime(now);
        setShiftStarted(true);
        setError(null);
        setSuccessMessage(`Смена начата в ${now.toLocaleTimeString()}`);
        
        // Сохраняем в localStorage как ISO строку (без 'Z')
        localStorage.setItem('currentShiftStart', toPythonDateTime(now));
    };

    const handleEndShift = async () => {
        if (!startTime) {
            setError('Не найдено время начала смены');
            return;
        }

        const now = new Date();
        setEndTime(now);
        
        try {
            // Формируем данные для отправки (преобразуем даты)
            const shiftData = {
                id: 0,
                worker_id: workerId,
                start_time: toPythonDateTime(startTime),
                end_time: toPythonDateTime(now)
            };

            // Отправляем запрос (без изменений в функции addWorkingShift)
            await addWorkingShift(shiftData, userToken);

            setSuccessMessage(`Смена успешно завершена в ${now.toLocaleTimeString()}`);
            setShiftStarted(false);
            setStartTime(null);
            localStorage.removeItem('currentShiftStart');
            
        } catch (e: any) {
            setError(`Ошибка при сохранении смены: ${e.message}`);
            setEndTime(null);
        }
    };

    // Форматирование длительности смены
    const formatDuration = (start: Date, end: Date) => {
        const diff = end.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours} ч ${minutes} мин`;
    };

    return (
        <div className="working-shifts-container">
            <div className="working-shifts-content">
                <h1>Управление сменами</h1>
                
                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                
                <div className="shift-controls">
                    {!shiftStarted ? (
                        <button 
                            className="start-shift-btn"
                            onClick={handleStartShift}
                            disabled={shiftStarted}
                        >
                            Открыть смену
                        </button>
                    ) : (
                        <>
                            <div className="shift-info">
                                <p>Смена начата: {startTime?.toLocaleTimeString()}</p>
                                {startTime && (
                                    <p>Продолжительность: {formatDuration(startTime, new Date())}</p>
                                )}
                            </div>
                            <button 
                                className="end-shift-btn"
                                onClick={handleEndShift}
                            >
                                Закрыть смену
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkingShifts;