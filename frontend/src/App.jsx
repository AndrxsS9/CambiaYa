/**
 * Componente raíz de la aplicación CambiaYa.
 *
 * Configura el enrutamiento y envuelve toda la app con el AuthProvider
 * para que todos los componentes hijos tengan acceso al estado de autenticación.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Products from './pages/Products';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Chats from './pages/Chats';
import ExchangeHistory from './pages/ExchangeHistory';

// Componente de Ruta Privada
const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="p-10 text-center">Cargando...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Products />} />
            <Route path="/products" element={<Products />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Rutas protegidas */}
            <Route
                path="/profile"
                element={
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                }
            />
            <Route
                path="/chats"
                element={
                    <PrivateRoute>
                        <Chats />
                    </PrivateRoute>
                }
            />
            <Route
                path="/history"
                element={
                    <PrivateRoute>
                        <ExchangeHistory />
                    </PrivateRoute>
                }
            />

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-slate-50 flex flex-col">
                    <Navbar />
                    <main className="flex-grow">
                        <AppRoutes />
                    </main>
                    <footer className="py-8 text-center text-slate-400 text-sm">
                        © 2026 TruequeUni — Proyecto de Calidad de Software
                    </footer>
                </div>
            </Router>
        </AuthProvider>
    );
};

export default App;
