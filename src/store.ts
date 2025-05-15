import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import profileReducer from './features/profile/profileSlice';
import uiReducer from './features/ui/uiSlice';

 
 const store = configureStore({
     reducer: {
         auth: authReducer,
         profile: profileReducer,
         ui: uiReducer
     },
 });
 
 export type RootState = ReturnType<typeof store.getState>;
 export type AppDispatch = typeof store.dispatch;
 export default store;