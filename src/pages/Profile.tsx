import React, { useEffect, useState } from 'react';
import { UserType } from '../types/userType';
import { ErrorType } from '../types/errorType';
import '../styles/Profile1.css';
import { RegisterPayload } from '../types/regType';
import { createrUser } from '../service/createUserService';
import { selectAuthToken } from '../features/auth/authSlice';
import { useDispatch, useSelector } from 'react-redux';

const Profile = () => {
    const [user, setUser] = useState<UserType>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ErrorType>({ isError: false });
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [newUser, setNewUser] = useState<RegisterPayload>({
        id: 0,
        login: '',
        password: '',
        surname: '',
        name: '',
        last_name: '',
        age: 0,
        phone_number: '',
        region: 0,
        role: 'worker'
    });
    const userToken = useSelector(selectAuthToken);

    // Функция для преобразования роли в читаемый формат
    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Администратор';
            case 'driver':
                return 'Водитель';
            case 'worker':
                return 'Сотрудник ПВЗ';
            default:
                return role; // На случай, если появится новая роль
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const userSurname = localStorage.getItem('userSurname');
                const userName = localStorage.getItem('userName');
                const userLastName = localStorage.getItem('userLastName');
                const userLogin = localStorage.getItem('userLogin');
                const userRole = localStorage.getItem('userRole');
                const userPassword = localStorage.getItem('userPassword');
                const userRegion = localStorage.getItem('userRegion');
                const userAge = localStorage.getItem('userAge');
                const userPhoneNumber = localStorage.getItem('userPhoneNumber');

                if (!userId || !userName) {
                    throw new Error("User data not found in localStorage");
                }

                const userData: UserType = {
                    id: Number(userId),
                    login: userLogin ? String(userLogin) : '',
                    password: String(userPassword),
                    surname: String(userSurname),
                    name: String(userName),
                    last_name: String(userLastName),
                    age: Number(userAge),
                    phone_number: String(userPhoneNumber),
                    region: Number(userRegion),
                    role: userRole ? String(userRole) : '',
                };

                setUser(userData);
            } catch (err) {
                setError({ isError: true, message: "Something went wrong" });
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!user) {
        return <div className="error-message">No user data available</div>;
    }

    if (error.isError) {
        return <div className="error-message">{error.message || "Error loading profile"}</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <h2>Профиль пользователя</h2>
                </div>
                
                <div className="profile-body">
                    <div className="profile-field">
                        <span className="field-label">ФИО:</span>
                        <span className="field-value">
                            {user.surname} {user.name} {user.last_name}
                        </span>
                    </div>
                    
                    <div className="profile-field">
                        <span className="field-label">Возраст:</span>
                        <span className="field-value">{user.age}</span>
                    </div>
                    
                    <div className="profile-field">
                        <span className="field-label">Телефон:</span>
                        <span className="field-value">{user.phone_number}</span>
                    </div>
                    
                    <div className="profile-field">
                        <span className="field-label">Регион:</span>
                        <span className="field-value">{user.region}</span>
                    </div>
                    
                    <div className="profile-field">
                        <span className="field-label">Роль:</span>
                        <span className="field-value">{getRoleDisplayName(user.role)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;