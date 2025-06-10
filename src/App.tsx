import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Cars from './pages/Cars'
import Workers from './pages/Workers';
import PickUpPoints from './pages/PickUpPoints';
import WorkingShifts from './pages/WorkingShifts';
import DriverSupplies from './pages/DriverSupplies'
import store from './store';
import Navbar from './components/Navbar';
import { Provider, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { setAuthToken } from './features/auth/authSlice';
import { setProfile } from './features/profile/profileSlice';
import Supplies from './pages/Supplies';
import PvzSupplies from './pages/PVZSupplies';
import ProductsPage from './pages/Product';
import ShiftsReportPage from './pages/ShiftsReportPage';
import ProductsPagePVZ from './pages/ProductsPage';


 function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/workers" element={<Workers />} />
        <Route path="/pick_up_points" element={<PickUpPoints />} />
        <Route path="/working_shifts" element={<WorkingShifts />} />
        <Route path="/supplies" element={<Supplies />} />
        <Route path="/my_supplies" element={<DriverSupplies />} />
        <Route path="/pvz_supplies" element={<PvzSupplies />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/reports" element={<ShiftsReportPage />} />
        <Route path="/pvz_products" element={<ProductsPagePVZ />} />
      </Routes>
    </>
  );
}

const AppWrapper = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      dispatch(setAuthToken(token)); // Устанавливаем токен в Redux
    }

    const userId = localStorage.getItem('userId')
    const userAge = localStorage.getItem('userAge')
    const userName = localStorage.getItem('userName')
    const userSurname = localStorage.getItem('userSurname')
    const userLastName = localStorage.getItem('userLastName')
    const userLogin = localStorage.getItem('userLogin')
    const userPassword = localStorage.getItem('userPassword')
    const userRole = localStorage.getItem('userRole')
    const userRegion = localStorage.getItem('userRegion')
    const userPhoneNumber = localStorage.getItem('userPhoneNumber')

    if (userId && userAge && userName && userSurname && userLastName && userRegion && userPhoneNumber && userLogin && userPassword && userRole) {
      dispatch(setProfile({
        id: Number(userId),
        age: Number(userAge),
        name: userName,
        surname: userSurname,
        last_name: userLastName,
        login: userLogin,
        password: userPassword,
        region: Number(userRegion),
        phone_number: userPhoneNumber,
        role: userRole,
      }))
    }
  }, [dispatch]);

  return <App />;
};

const WrappedApp = () => (
  <Provider store={store}>
    <Router>
      <AppWrapper />
    </Router>
  </Provider>
);

export default WrappedApp;