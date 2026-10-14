/**
 * Componente raíz de la aplicación CambiaYa.
 *
 * Integra todos los módulos del sistema:
 * - Autenticación (Login, Register)
 * - Productos (listado y detalle)
 * - Perfil de usuario
 * - Intercambios (solicitudes e historial)
 * - Chat entre usuarios
 *
 * Envuelve toda la app con el AuthProvider para que todos los
 * componentes hijos tengan acceso al estado de autenticación.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Exchanges from './pages/Exchanges';
import ExchangeHistory from './pages/ExchangeHistory';
import Chats from './pages/Chats';

// Componente de Ruta Privada — redirige a /login si no está autenticado
const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Cargando...</p>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <Routes>
                    {/* Rutas públicas */}
                    <Route path="/" element={<Products />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Rutas privadas */}
                    <Route
                        path="/profile"
                        element={<PrivateRoute><Profile /></PrivateRoute>}
                    />
                    <Route
                        path="/exchanges"
                        element={<PrivateRoute><Exchanges /></PrivateRoute>}
                    />
                    <Route
                        path="/exchange-history"
                        element={<PrivateRoute><ExchangeHistory /></PrivateRoute>}
                    />
                    <Route
                        path="/chats"
                        element={<PrivateRoute><Chats /></PrivateRoute>}
                    />

                    {/* Ruta catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
