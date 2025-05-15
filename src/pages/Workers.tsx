import React, { useEffect, useState } from 'react';
import { 
  LinearProgress, 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  Container,
  Tabs,
  Tab,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getAllDrivers } from '../service/driverService';
import { getAllWorkers } from '../service/workerService';
import { getAllUsers, getUserById, deleteUser } from '../service/userService';
import { driverType } from '../types/driverType';
import { workerType } from '../types/workerType';
import { UserType } from '../types/userType';
import { ErrorType } from '../types/errorType';
import { selectAuthToken } from '../features/auth/authSlice';
import { useSelector } from 'react-redux';
import { RegisterPayload } from '../types/regType';
import { createrUser } from '../service/createUserService';

type DataType = 'users' | 'drivers' | 'workers' | 'create';

interface UserCommonFields {
  id: number;
  name: string;
  surname: string;
  last_name?: string;
  age?: number;
  phone_number?: string;
  region?: string | number;
}

type CombinedData = UserCommonFields & {
  type: DataType;
  additionalInfo?: Record<string, any>;
  user?: UserType | RegisterPayload;
  originalId?: number;
};

const DataViewer = () => {
  const [data, setData] = useState<CombinedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorType>({ isError: false });
  const [currentTab, setCurrentTab] = useState<DataType>('users');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
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
  const [formErrors, setFormErrors] = useState<Partial<RegisterPayload>>({});
  const userToken = useSelector(selectAuthToken);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const fetchData = async (type: DataType) => {
    if (type === 'create') return;
    
    setLoading(true);
    setError({ isError: false });

    try {
      let response;
      let combinedData: CombinedData[] = [];

      switch (type) {
        case 'drivers':
          response = await getAllDrivers();
          combinedData = await Promise.all(response.data.map(async (driver: driverType) => {
            const userData = await getUserById(driver.user_id);
            return {
              id: userData.id,
              name: userData.name,
              surname: userData.surname,
              last_name: userData.last_name,
              age: userData.age,
              phone_number: userData.phone_number,
              region: userData.region,
              type: 'drivers',
              additionalInfo: {
                id: driver.id,
                user_id: driver.user_id,
                car_id: driver.car_id
              },
              originalId: driver.id,
              user: userData
            };
          }));
          break;

        case 'workers':
          response = await getAllWorkers();
          combinedData = await Promise.all(response.data.map(async (worker: workerType) => {
            const userData = await getUserById(worker.user_id);
            return {
              id: userData.id,
              name: userData.name,
              surname: userData.surname,
              last_name: userData.last_name,
              age: userData.age,
              phone_number: userData.phone_number,
              region: userData.region,
              type: 'workers',
              additionalInfo: {
                id: worker.id,
                user_id: worker.user_id,
                pick_up_point_id: worker.pick_up_point_id
              },
              originalId: worker.id,
              user: userData
            };
          }));
          break;

        case 'users':
        default:
          response = await getAllUsers();
          combinedData = response.data.map((user: UserType) => ({
            ...user,
            id: user.id,
            type: 'users',
            additionalInfo: {
              user_id: user.id
            }
          }));
          break;
      }

      setData(combinedData);
    } catch (err) {
      setError({
        isError: true,
        message: `Ошибка при загрузке ${type}: ${err instanceof Error ? err.message : String(err)}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (userId: number) => {
    setItemToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await deleteUser(itemToDelete);
      await fetchData(currentTab);
    } catch (err) {
      setError({
        isError: true,
        message: 'Ошибка при удалении пользователя'
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  useEffect(() => {
    fetchData(currentTab);
  }, [currentTab, userToken]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: DataType) => {
    setCurrentTab(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'region' ? Number(value) : value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors: Partial<RegisterPayload> = {};
    if (!newUser.name) errors.name = 'Имя обязательно';
    if (!newUser.surname) errors.surname = 'Фамилия обязательна';
    if (!newUser.login) errors.login = 'Логин обязателен';
    if (!newUser.password) errors.password = 'Пароль обязателен';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      const response = await createrUser(newUser, userToken);
      setSuccessMessage('Пользователь успешно зарегистрирован!');
      setNewUser({ 
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
      setError({ isError: false });
      setTimeout(() => {
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError({ 
        isError: true, 
        message: err instanceof Error ? err.message : "Ошибка при регистрации" 
      });
      setSuccessMessage('');
    }
  };

  if (loading) return <LinearProgress />;

  if (error.isError) return (
    <Container>
      <Typography color="error">{error.message}</Typography>
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Управление пользователями
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Все пользователи" value="users" />
          <Tab label="Водители" value="drivers" />
          <Tab label="Работники" value="workers" />
          <Tab label="Создать пользователя" value="create" />
        </Tabs>
      </Box>

      {currentTab === 'create' ? (
        <Card sx={{ p: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Создание нового пользователя
          </Typography>
          
          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}
             <Grid container spacing={3}>
             <Grid>
              <TextField
                fullWidth
                label="Фамилия*"
                name="surname"
                value={newUser.surname}
                onChange={handleInputChange}
                error={!!formErrors.surname}
                helperText={formErrors.surname}
              />
            </Grid>

            <Grid >
              <TextField
                fullWidth
                label="Имя*"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid>
              <TextField
                fullWidth
                label="Отчество"
                name="last_name"
                value={newUser.last_name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid>
              <TextField
                fullWidth
                label="Логин*"
                name="login"
                value={newUser.login}
                onChange={handleInputChange}
                error={!!formErrors.login}
                helperText={formErrors.login}
              />
            </Grid>
            <Grid>
              <TextField
                fullWidth
                label="Пароль*"
                name="password"
                type="password"
                value={newUser.password}
                onChange={handleInputChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
              />
            </Grid>

            <Grid>
              <TextField
                fullWidth
                label="Возраст"
                name="age"
                type="number"
                value={newUser.age}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid>
              <TextField
                fullWidth
                label="Телефон"
                name="phone_number"
                value={newUser.phone_number}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid>
              <TextField
                fullWidth
                label="Регион"
                name="region"
                type="number"
                value={newUser.region}
                onChange={handleInputChange}
              />
            </Grid>
           
            <Grid>
              <FormControl fullWidth>
                <InputLabel>Роль пользователя*</InputLabel>
                <Select
                  name="role"
                  value={newUser.role}
                  onChange={handleSelectChange}
                  label="Роль пользователя"
                >
                  <MenuItem value="admin">Администратор</MenuItem>
                  <MenuItem value="driver">Водитель</MenuItem>
                  <MenuItem value="worker">Работник</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid>
              <Button 
                variant="outlined" 
                onClick={() => setCurrentTab('users')}
              >
                Отмена
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? 'Создание...' : 'Создать пользователя'}
              </Button>
            </Grid>
          </Grid>
        </Card>
      ) : (
        <>
          {data.length === 0 ? (
            <Typography variant="body1" sx={{ mt: 3 }}>
              Нет данных для отображения
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {data.map((item) => (
                <Grid>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" component="div">
                          {item.surname} {item.name} {item.last_name}
                        </Typography>
                        {item.type === 'users' && (
                          <Tooltip title="Удалить пользователя">
                            <IconButton
                              onClick={() => handleDeleteClick(item.id)}
                              color="error"
                              aria-label="delete user"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      <Box mt={2}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>ID пользователя:</strong> {item.id}
                        </Typography>
                        
                        {item.type !== 'users' && item.additionalInfo && (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              <strong>ID {item.type === 'drivers' ? 'водителя' : 'работника'}:</strong> {item.additionalInfo.id}
                            </Typography>
                            {item.type === 'drivers' && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>ID автомобиля:</strong> {item.additionalInfo.car_id || 'Не назначен'}
                              </Typography>
                            )}
                            {item.type === 'workers' && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>ID Пункта выдачи:</strong> {item.additionalInfo.pick_up_point_id || 'Не назначен'}
                              </Typography>
                            )}
                            
                          </>
                        )}
                        
                        {item.age && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Возраст:</strong> {item.age}
                          </Typography>
                        )}
                        
                        {item.phone_number && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Телефон:</strong> {item.phone_number}
                          </Typography>
                        )}
                        
                        {item.region && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Регион:</strong> {item.region}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Отмена</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DataViewer;