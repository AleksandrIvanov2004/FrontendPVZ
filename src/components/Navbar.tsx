import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthToken, selectAuthToken } from '../features/auth/authSlice';
import { clearProfile, selectUserRole } from '../features/profile/profileSlice';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Получаем данные из Redux
    const reduxToken = useSelector(selectAuthToken);
    const reduxRole = useSelector(selectUserRole);
    
    // Локальное состояние для управления UI
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    // При монтировании компонента сразу делаем logout
    useEffect(() => {
        
        handleInitialLogout();
    }, []);

    // Синхронизация состояния при изменении Redux
    useEffect(() => {
        if (isAuthChecked) { // Только после начального logout
            const token = localStorage.getItem('authToken') || reduxToken;
            const userRole = localStorage.getItem('userRole') || reduxRole;
            setIsAuthenticated(!!token);
            setRole(userRole);
        }
    }, [reduxToken, reduxRole, isAuthChecked]);

    const handleInitialLogout = () => {
        // Очищаем все данные без перенаправления
        dispatch(clearAuthToken());
        dispatch(clearProfile());
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        
        // Обновляем состояние
        setIsAuthenticated(false);
        setRole(null);
        setIsAuthChecked(true); // Помечаем что начальный logout выполнен
    };

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    const handleLogout = () => {
        handleInitialLogout();
        navigate('/');
    };

    // Показываем loader пока проверяем аутентификацию
    if (!isAuthChecked) {
        return (
            <nav className="navbar">
                <div className="navbar-loader">Loading...</div>
            </nav>
        );
    }

    return (
        <nav className="navbar">
            <ul className="navbar-links">
            {!isAuthenticated ? ( 
                <li>
                    <button
                     className='nav-btn'
                     onClick={() => handleNavigate('/')}>Вход</button>
                </li>) : null}

                {isAuthenticated ? (
                    <>
                        <li>
                            <button
                             className='nav-btn'
                             onClick={() => handleNavigate('/profile')}>Профиль</button>
                        </li>
                        {role === 'admin' && (
                            <li>
                                <button
                                 className='nav-btn'
                                 onClick={() => handleNavigate('/cars')}>Машины</button>
                            </li>
                        )}
                        {role === 'admin' && (
                            <li>
                                <button
                                 className='nav-btn'
                                 onClick={() => handleNavigate('/pick_up_points')}>Пункты выдачи</button>
                            </li>
                        )}
                         {role === 'admin' && (
                            <li>
                                <button
                                 className='nav-btn'
                                 onClick={() => handleNavigate('/workers')}>Управление сотрудниками</button>
                            </li>
                        )}
                        {role === 'admin' && (
                            <li>
                                <button
                                 className='nav-btn'
                                 onClick={() => handleNavigate('/supplies')}>Управление поставками</button>
                            </li>
                        )}
                        {role === 'worker' && (
                            <li>
                                <button
                                 className='nav-btn'
                                 onClick={() => handleNavigate('/working_shifts')}>Смены</button>
                            </li>
                        )}
                        {role === 'driver' && (
                            <li>
                                <button
                                 className='nav-btn'
                                 onClick={() => handleNavigate('/my_supplies')}>Мои поставки</button>
                            </li>
                        )}
                        {role === 'worker' && (
                            <li>
                                <button
                                 className='nav-btn'
                                 onClick={() => handleNavigate('/pvz_supplies')}>Поставки</button>
                            </li>
                        )}
                        {role === 'worker' && (
                            <li>
                                <button
                                 className='nav-btn'
                                 onClick={() => handleNavigate('/pvz_products')}>Товары</button>
                            </li>
                        )}
                        {role === 'admin' && (
                            <li>
                                <button
                                 className='nav-btn'
                                 onClick={() => handleNavigate('/products')}>Товары</button>
                            </li>
                        )}
                        {role === 'admin' && (
                            <li>
                                <button
                                 className='nav-btn'
                                 onClick={() => handleNavigate('/reports')}>Отчёты</button>
                            </li>
                        )}

                        <li>
                            <button className="logout-btn" onClick={handleLogout}>
                                Выйти
                            </button>
                        </li>
                    </>
                ) : null}
            </ul>
        </nav>
    );
};

export default Navbar;