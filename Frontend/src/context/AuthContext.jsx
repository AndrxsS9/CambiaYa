import React, { createContext, useState, useEffect, useCallback } from 'react';
import { login as loginAPI } from '../api/auth';

export const AuthContext = createContext({
    currentUser: null,
    token: null,
    login: async () => {},
    logout: () => {},
    isAuthenticated: false,
});

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('access_token'));

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser && token) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('user');
            }
        }
    }, [token]);

    const login = useCallback(async (email, password) => {
        const { data } = await loginAPI({ email, password });
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        const payload = JSON.parse(atob(data.access.split('.')[1]));
        const user = { id: payload.user_id, email };
        localStorage.setItem('user', JSON.stringify(user));

        setToken(data.access);
        setCurrentUser(user);
        return data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setToken(null);
        setCurrentUser(null);
    }, []);

    const value = {
        currentUser,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!currentUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => React.useContext(AuthContext);

export default AuthContext;
