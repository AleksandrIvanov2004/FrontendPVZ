import React, { useState } from 'react';
import { loginUser } from '../service/loginService';
import { ErrorType } from '../types/errorType';
import { SuccessType } from '../types/successType';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuthToken, clearAuthToken } from '../features/auth/authSlice';
import { setProfile } from '../features/profile/profileSlice';
import '../styles/Login.css'

const Login = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<ErrorType>({ isError: false });
    const [success, setSuccess] = useState<SuccessType>({ isSuccess: false });

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError({ isError: false });
        setSuccess({ isSuccess: false });

        // Простая валидация
        if (!login || !password) {
            setError({
                isError: true,
                message: 'Пожалуйста, заполните все поля',
            });
            return;
        }

        try {
            // Отправка данных на сервер для логина
            const response = await loginUser({ login, password });

            const access_token: string = response.access_token;
            console.log("Login token = ", access_token);

            if (access_token) {
                localStorage.setItem('authToken', access_token);
                dispatch(setAuthToken(access_token));

                localStorage.setItem('userId', response.user.id)
                localStorage.setItem('userAge', response.user.age)
                localStorage.setItem('userName', response.user.name)
                localStorage.setItem('userSurname', response.user.surname)
                localStorage.setItem('userLastName', response.user.last_name)
                localStorage.setItem('userLogin', response.user.login)
                localStorage.setItem('userPassword', response.user.password)
                localStorage.setItem('userPhoneNumber', response.user.phone_number)
                localStorage.setItem('userRegion', response.user.region)
                localStorage.setItem('userRole', response.user.role)

                dispatch(setProfile({
                    id: response.user.id,
                    age: response.user.age,
                    name: response.user.name,
                    surname: response.user.surname,
                    last_name: response.user.last_name,
                    login: response.user.login,
                    password: response.user.password,
                    phone_number: response.user.phone_number,
                    region: response.user.region,
                    role: response.user.role,
                }));

                setSuccess({
                    isSuccess: true,
                    message: 'Успешная авторизация, добро пожаловать!',
                });


                setTimeout(() => {
                    navigate('/profile');
                }, 2000);
            } else {
                setSuccess({
                    isSuccess: false,
                    message: 'Проблемы с токеном авторизации',
                });
            }

        } catch (err: any) {
            console.error("Login error:", err);

            setError({
                isError: true,
                message: err.response?.data?.message || 'Ошибка при авторизации',
                code: err.response?.status,
            });
        }
    };

    return (
        <div className='login-container'>
            <h1>Авторизация</h1>
            <div>
                <div>
                    <label>Логин</label>
                    <input
                        type="login"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Пароль</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error.isError && <p style={{ color: 'red' }}>{error.message}</p>}
                {success.isSuccess && <p style={{ color: 'green' }}>{success.message}</p>}
                <button onClick={handleSubmit}>Войти</button>
            </div>
        </div>
    );
};

export default Login;