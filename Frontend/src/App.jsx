/**
 * Componente raíz de la aplicación CambiaYa.
 *
 * Configura el enrutamiento y envuelve toda la app con el AuthProvider
 * para que todos los componentes hijos tengan acceso al estado de autenticación.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Products from './pages/Products';
import Register from './pages/Register';

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Products />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/register" element={<Register />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
