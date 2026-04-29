/**
 * Barra de navegación principal.
 * Adapta sus opciones según el estado de autenticación.
 */
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Package, Repeat } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-blue-600 p-2 rounded-lg group-hover:rotate-12 transition-transform">
              <Repeat className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Cambia<span className="text-blue-600">Ya</span></span>
          </Link>

          {/* Links */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
              Explorar
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-1 text-slate-700 hover:text-blue-600 font-semibold transition-colors">
                  <User size={18} />
                  <span>{user?.name?.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-slate-600 font-medium hover:text-blue-600 transition-colors">
                  Ingresar
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                  Unirse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
