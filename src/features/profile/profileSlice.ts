import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ProfileState {
    id: number;
    age: number,
    login: string;
    password: string;
    name: string;
    surname: string;
    last_name: string;
    phone_number: string;
    region: number;
    role: string;
}

const initialState: ProfileState = {
    id: 1,
    age: 0,
    login: '',
    password: '',
    name: '',
    surname: '',
    last_name: '',
    phone_number: '',
    region: 0,
    role: ''
};

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        setProfile(state, action: PayloadAction<ProfileState>) {
            state.id = action.payload.id;
            state.age = action.payload.age;
            state.login = action.payload.login;
            state.password = action.payload.password;
            state.name = action.payload.name;
            state.surname = action.payload.surname;
            state.last_name = action.payload.last_name;
            state.region = action.payload.region;
            state.phone_number = action.payload.phone_number;
            state.role = action.payload.role;
        },
        clearProfile(state) {
            state.id = 1;
            state.age = 0;
            state.login = '';
            state.password = '';
            state.name = '';
            state.surname = '';
            state.last_name = '';
            state.phone_number = '';
            state.region = 0;
            state.role = '';
        },
    },
});

export const { setProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;

export const selectUser = (state: { profile: ProfileState }) => state.profile;
export const selectUserRole = (state: { profile: ProfileState }) => state.profile.role;