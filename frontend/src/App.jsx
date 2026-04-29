import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'
import './index.css'

// Placeholder Pages (próxima fase)
const ProductsPage = () => <div className="p-8"><h2 className="text-2xl font-bold">Marketplace de Trueques</h2><p className="text-slate-500">Próximamente el listado de productos aquí.</p></div>

// Componente de Ruta Privada
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="p-10 text-center">Cargando...</div>;
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProductsPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Rutas protegidas */}
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
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
  )
}

export default App
