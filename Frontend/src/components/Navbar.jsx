/**
 * Barra de navegación principal de CambiaYa.
 * Adapta sus opciones según el estado de autenticación del usuario.
 * Incluye navegación a: Productos, Intercambios, Historial, Chats, Perfil.
 */
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: '#1e293b',
      borderBottom: '1px solid #334155',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              padding: '8px',
              borderRadius: '10px',
            }}>
              <span style={{ color: 'white', fontSize: '18px' }}>⇄</span>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
              Cambia<span style={{ color: '#60a5fa' }}>Ya</span>
            </span>
          </Link>

          {/* Navigation links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/products" id="navbar-products-link" style={navLinkStyle}>
              🛍️ Explorar
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/exchanges" id="navbar-exchanges-link" style={navLinkStyle}>
                  🔄 Intercambios
                </Link>
                <Link to="/exchange-history" id="navbar-history-link" style={navLinkStyle}>
                  📋 Historial
                </Link>
                <Link to="/chats" id="navbar-chats-link" style={navLinkStyle}>
                  💬 Chats
                </Link>
                <Link to="/profile" id="navbar-profile-link" style={{
                  ...navLinkStyle,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }} id="navbar-avatar-fallback">
                    {currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span style={{ display: 'none' }}>Perfil</span>
                </Link>
                <button
                  onClick={handleLogout}
                  id="navbar-logout-btn"
                  style={{
                    background: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => { e.target.style.background = '#ef4444'; e.target.style.color = 'white'; }}
                  onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#ef4444'; }}
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" id="navbar-login-link" style={navLinkStyle}>
                  Ingresar
                </Link>
                <Link to="/register" id="navbar-register-link" style={{
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}>
                  Unirse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const navLinkStyle = {
  color: '#94a3b8',
  textDecoration: 'none',
  padding: '6px 12px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s',
};

export default Navbar;
