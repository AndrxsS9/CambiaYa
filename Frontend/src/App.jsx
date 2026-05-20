import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Register from './pages/Register';
import Exchanges from './pages/Exchanges';
import Login from './pages/Login';
import Profile from './pages/Profile';

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Products />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/exchanges" element={<Exchanges />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
