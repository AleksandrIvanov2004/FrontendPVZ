import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthToken } from '../features/auth/authSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, faUser, faSearch, 
  faFileCsv, faFilter, faRedo, faTruck 
} from '@fortawesome/free-solid-svg-icons';
import { getAllWorkers } from '../service/workerService';
import { getAllWorkingShifts } from '../service/workingShiftService';
import { getAllSupplies } from '../service/supplyService'; // Add this import
import '../styles/ReportsPage.css';
import { workerType } from '../types/workerType'; 
import { workingShiftType } from '../types/workingShiftType';
import { UserType } from '../types/userType';
import { getUserById } from '../service/userService';
import { RegisterPayload } from '../types/regType';
import { getPickUpPointById } from '../service/pickUpPointService';
import { SupplyType } from '../types/supplyType'; // Add this import

interface ExtendedWorker extends workerType {
    userData: {
        id: number;
        name: string;
        surname: string;
        last_name: string;
        role: string;
    };
}

interface ExtendedWorkingShift extends workingShiftType {
    worker_name: string;
    worker_surname: string;
    worker_lastname?: string;
    pick_up_point_address: string;
    hours_worked: number;
    status: 'completed' | 'in_progress' | 'canceled';
}

interface ExtendedSupply extends SupplyType {
    driver_name: string;
    driver_surname: string;
    driver_lastname?: string;
    pick_up_point_address: string;
    formatted_time: string;
}

const ReportsPage: React.FC = () => {
    const token = useSelector(selectAuthToken);
    
    // State for active tab
    const [activeTab, setActiveTab] = useState<'shifts' | 'supplies'>('shifts');
    
    // Shifts data and filters
    const [shifts, setShifts] = useState<ExtendedWorkingShift[]>([]);
    const [allShifts, setAllShifts] = useState<ExtendedWorkingShift[]>([]);
    
    // Supplies data and filters
    const [supplies, setSupplies] = useState<ExtendedSupply[]>([]);
    const [allSupplies, setAllSupplies] = useState<ExtendedSupply[]>([]);
    
    const [workers, setWorkers] = useState<ExtendedWorker[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Common filters
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Shifts specific filters
    const [workerId, setWorkerId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // Supplies specific filters
    const [driverId, setDriverId] = useState<number | null>(null);
    const [readyFilter, setReadyFilter] = useState<string>('all');

    const getWorkerFullName = (worker: ExtendedWorker) => {
        return `${worker.userData.surname} ${worker.userData.name} ${worker.userData.last_name}`;
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        
        try {
            const [workersResponse, shiftsResponse, suppliesResponse] = await Promise.all([
                getAllWorkers(),
                getAllWorkingShifts(),
                getAllSupplies() // Load supplies data
            ]);
            
            // Process workers data
            const workersWithUserData = await Promise.all(
                workersResponse.data.map(async (worker: workerType) => {
                    try {
                        const user = await getUserById(worker.user_id);
                        return {
                            ...worker,
                            userData: {
                                id: user.id,
                                name: user.name,
                                surname: user.surname,
                                last_name: user.last_name,
                                role: user.role
                            }
                        };
                    } catch (err) {
                        console.error(`Ошибка загрузки пользователя ${worker.user_id}:`, err);
                        return {
                            ...worker,
                            userData: {
                                id: -1,
                                name: 'Неизвестно',
                                surname: 'Неизвестно',
                                last_name: '',
                                role: ''
                            }
                        };
                    }
                })
            );
            
            setWorkers(workersWithUserData);

            // Process shifts data
            const calculateHoursWorked = (startTime: string, endTime: string | null): number => {
                if (!endTime) return 0;
                
                const start = new Date(startTime);
                const end = new Date(endTime);
                const diffMs = end.getTime() - start.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                
                return parseFloat(diffHours.toFixed(1));
            };
            
            const formattedShifts = await Promise.all(
                shiftsResponse.data.map(async (shift: any) => {
                    const worker = workersWithUserData.find(w => w.id === shift.worker_id);
                    
                    let pickUpPointAddress = 'Не указан';
                    try {
                        if (worker?.pick_up_point_id) {
                            const pickUpPoint = await getPickUpPointById(worker.pick_up_point_id);
                            pickUpPointAddress = pickUpPoint.address || 'Адрес не указан';
                        }
                    } catch (err) {
                        console.error(`Ошибка загрузки пункта выдачи:`, err);
                    }
                    
                    return {
                        ...shift,
                        worker_name: worker?.userData.name || '',
                        worker_surname: worker?.userData.surname || '',
                        worker_lastname: worker?.userData.last_name || '',
                        pick_up_point_address: pickUpPointAddress,
                        hours_worked: shift.hours_worked || calculateHoursWorked(shift.start_time, shift.end_time),
                        status: shift.status || 'completed'
                    };
                })
            );
            
            setAllShifts(formattedShifts);
            setShifts(formattedShifts);

            // Process supplies data
            const formattedSupplies = await Promise.all(
                suppliesResponse.data.map(async (supply: SupplyType) => {
                    const driver = workersWithUserData.find(w => w.id === supply.driver_id);
                    let pickUpPointAddress = 'Не указан';
                    
                    try {
                        if (supply.pick_up_point_id) {
                            const pickUpPoint = await getPickUpPointById(supply.pick_up_point_id);
                            pickUpPointAddress = pickUpPoint.address || 'Адрес не указан';
                        }
                    } catch (err) {
                        console.error(`Ошибка загрузки пункта выдачи:`, err);
                    }
                    
                    return {
                        ...supply,
                        driver_name: driver?.userData.name || '',
                        driver_surname: driver?.userData.surname || '',
                        driver_lastname: driver?.userData.last_name || '',
                        pick_up_point_address: pickUpPointAddress,
                        formatted_time: formatDateTime(supply.time)
                    };
                })
            );
            
            setAllSupplies(formattedSupplies);
            setSupplies(formattedSupplies);
        } catch (err) {
            setError('Не удалось загрузить данные');
            console.error('Ошибка загрузки:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (activeTab === 'shifts') {
            applyShiftsFilters();
        } else {
            applySuppliesFilters();
        }
    };

    const applyShiftsFilters = () => {
        let filtered = [...allShifts];
        
        if (startDate) {
            filtered = filtered.filter(shift => 
                new Date(shift.start_time) >= new Date(startDate)
            );
        }
        
        if (endDate) {
            filtered = filtered.filter(shift => 
                new Date(shift.start_time) <= new Date(endDate + 'T23:59:59')
            );
        }
        
        if (workerId) {
            filtered = filtered.filter(shift => shift.worker_id === workerId);
        }
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(shift => shift.status === statusFilter);
        }
        
        if (searchTerm.trim()) {
            const term = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(shift => {
                const fullName = `${shift.worker_surname} ${shift.worker_name} ${shift.worker_lastname || ''}`.toLowerCase();
                return fullName.includes(term);
            });
        }
        
        setShifts(filtered);
    };

    const applySuppliesFilters = () => {
        let filtered = [...allSupplies];
        
        if (startDate) {
            filtered = filtered.filter(supply => 
                new Date(supply.time) >= new Date(startDate)
            );
        }
        
        if (endDate) {
            filtered = filtered.filter(supply => 
                new Date(supply.time) <= new Date(endDate + 'T23:59:59')
            );
        }
        
        if (driverId) {
            filtered = filtered.filter(supply => supply.driver_id === driverId);
        }
        
        if (readyFilter !== 'all') {
            const readyStatus = readyFilter === 'ready';
            filtered = filtered.filter(supply => supply.ready === readyStatus);
        }
        
        if (searchTerm.trim()) {
            const term = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(supply => {
                const fullName = `${supply.driver_surname} ${supply.driver_name} ${supply.driver_lastname || ''}`.toLowerCase();
                return fullName.includes(term);
            });
        }
        
        setSupplies(filtered);
    };

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
        
        if (activeTab === 'shifts') {
            setWorkerId(null);
            setStatusFilter('all');
            setShifts(allShifts);
        } else {
            setDriverId(null);
            setReadyFilter('all');
            setSupplies(allSupplies);
        }
    };

    const exportToCSV = () => {
        if (activeTab === 'shifts') {
            exportShiftsToCSV();
        } else {
            exportSuppliesToCSV();
        }
    };

    const exportShiftsToCSV = () => {
        if (shifts.length === 0) return;

        const BOM = "\uFEFF";
        
        const escapeCSVValue = (value: any) => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const headers = [
            'ID смены', 'ID работника', 'Фамилия', 'Имя', 'Отчество',
            'Начало смены', 'Конец смены', 'Адрес пункта', 
            'Часов', 'Статус'
        ].map(escapeCSVValue).join(',');

        const rows = shifts.map(shift => {
            const worker = workers.find(w => w.id === shift.worker_id);
            return [
                shift.id,
                shift.worker_id,
                worker?.userData?.surname || '',
                worker?.userData?.name || '',
                worker?.userData?.last_name || '',
                formatDateTime(shift.start_time),
                shift.end_time ? formatDateTime(shift.end_time) : '',
                shift.pick_up_point_address,
                shift.hours_worked.toFixed(1).replace('.', ','),
                getStatusText(shift.status)
            ].map(escapeCSVValue).join(',');
        });

        const csvContent = BOM + [headers, ...rows].join('\r\n');
        downloadCSV(csvContent, `смены_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const exportSuppliesToCSV = () => {
        if (supplies.length === 0) return;

        const BOM = "\uFEFF";
        
        const escapeCSVValue = (value: any) => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const headers = [
            'ID поставки', 'ID водителя', 'Фамилия', 'Имя', 'Отчество',
            'Дата и время', 'Адрес пункта', 'Готовность'
        ].map(escapeCSVValue).join(',');

        const rows = supplies.map(supply => {
            const driver = workers.find(w => w.id === supply.driver_id);
            return [
                supply.id,
                supply.driver_id,
                driver?.userData?.surname || '',
                driver?.userData?.name || '',
                driver?.userData?.last_name || '',
                supply.formatted_time,
                supply.pick_up_point_address,
                supply.ready ? 'Готов' : 'Не готов'
            ].map(escapeCSVValue).join(',');
        });

        const csvContent = BOM + [headers, ...rows].join('\r\n');
        downloadCSV(csvContent, `поставки_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const getStatusText = (status: string) => {
        switch(status) {
            case 'completed': return 'Завершена';
            case 'in_progress': return 'В процессе';
            case 'canceled': return 'Отменена';
            default: return status;
        }
    };

    const renderTabContent = () => {
        if (activeTab === 'shifts') {
            return (
                <>
                    <div className="filter-row">
                        <div className="filter-group">
                            <label>
                                <FontAwesomeIcon icon={faUser} /> Сотрудник:
                            </label>
                            <select
                                value={workerId || ''}
                                onChange={(e) => setWorkerId(e.target.value ? parseInt(e.target.value) : null)}
                            >
                                <option value="">Все сотрудники</option>
                                {workers.map(worker => (
                                    <option key={worker.id} value={worker.id}>
                                        {getWorkerFullName(worker)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="filter-group">
                            <label>Статус:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Все статусы</option>
                                <option value="completed">Завершена</option>
                                <option value="in_progress">В процессе</option>
                                <option value="canceled">Отменена</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="results-section">
                        {shifts.length > 0 ? (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Сотрудник</th>
                                            <th>Начало</th>
                                            <th>Конец</th>
                                            <th>Пункт выдачи</th>
                                            <th>Часы</th>
                                            <th>Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shifts.map(shift => (
                                            <tr key={shift.id}>
                                                <td>{shift.id}</td>
                                                <td>{shift.worker_surname} {shift.worker_name} {shift.worker_lastname}</td>
                                                <td>{formatDateTime(shift.start_time)}</td>
                                                <td>{shift.end_time ? formatDateTime(shift.end_time) : '—'}</td>
                                                <td>{shift.pick_up_point_address}</td>
                                                <td>{shift.hours_worked.toFixed(1)}</td>
                                                <td className={`status-${shift.status}`}>
                                                    {getStatusText(shift.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            !loading && <div className="no-results">Нет данных для отображения</div>
                        )}
                    </div>
                </>
            );
        } else {
            return (
                <>
                    <div className="filter-row">
                        <div className="filter-group">
                            <label>
                                <FontAwesomeIcon icon={faTruck} /> Водитель:
                            </label>
                            <select
                                value={driverId || ''}
                                onChange={(e) => setDriverId(e.target.value ? parseInt(e.target.value) : null)}
                            >
                                <option value="">Все водители</option>
                                {workers.filter(w => w.userData.role === 'driver').map(driver => (
                                    <option key={driver.id} value={driver.id}>
                                        {getWorkerFullName(driver)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="filter-group">
                            <label>Готовность:</label>
                            <select
                                value={readyFilter}
                                onChange={(e) => setReadyFilter(e.target.value)}
                            >
                                <option value="all">Все</option>
                                <option value="ready">Готов</option>
                                <option value="not_ready">Не готов</option>
                            </select>
                        </div>
                        
                    </div>

                    
                    
                    <div className="results-section">
                        {supplies.length > 0 ? (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Водитель</th>
                                            <th>Дата и время</th>
                                            <th>Пункт выдачи</th>
                                            <th>Готовность</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplies.map(supply => (
                                            <tr key={supply.id}>
                                                <td>{supply.id}</td>
                                                <td>{supply.driver_surname} {supply.driver_name} {supply.driver_lastname}</td>
                                                <td>{supply.formatted_time}</td>
                                                <td>{supply.pick_up_point_address}</td>
                                                <td className={supply.ready ? 'status-completed' : 'status-canceled'}>
                                                    {supply.ready ? 'Готов' : 'Не готов'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            !loading && <div className="no-results">Нет данных для отображения</div>
                        )}
                    </div>
                </>
            );
        }
    };

    return (
        <div className="reports-container">
            <h1>Отчеты</h1>
            
            <div className="tabs">
                <button 
                    className={`tab-btn ${activeTab === 'shifts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('shifts')}
                >
                    Смены работников
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'supplies' ? 'active' : ''}`}
                    onClick={() => setActiveTab('supplies')}
                >
                    Поставки
                </button>
            </div>

            <div className="controls-section">
                    <button 
                        type="button" 
                        className="action-btn apply-btn"
                        onClick={applyFilters}
                    >
                        Применить фильтры
                    </button>
                    
                    <button 
                        type="button" 
                        className="action-btn reset-btn"
                        onClick={resetFilters}
                    >
                        <FontAwesomeIcon icon={faRedo} /> Сбросить
                    </button>
                    
                    <button 
                        onClick={exportToCSV} 
                        className="export-btn"
                        disabled={activeTab === 'shifts' ? shifts.length === 0 : supplies.length === 0}
                    >
                        <FontAwesomeIcon icon={faFileCsv} /> Экспорт в CSV
                    </button>
                    
                    <div className="stats">
                        Найдено: {activeTab === 'shifts' ? shifts.length : supplies.length}
                    </div>
                </div>
            
            <div className="filters-section">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>
                            <FontAwesomeIcon icon={faCalendarAlt} /> Начальная дата:
                        </label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label>
                            <FontAwesomeIcon icon={faCalendarAlt} /> Конечная дата:
                        </label>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group search-group">
                        <label>
                            <FontAwesomeIcon icon={faSearch} /> Поиск:
                        </label>
                        <input
                            type="text"
                            placeholder={`Поиск по ${activeTab === 'shifts' ? 'имени сотрудника' : 'имени водителя'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                {renderTabContent()}
                
            
            </div>
            
            {loading && <div className="loading">Загрузка данных...</div>}
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default ReportsPage;