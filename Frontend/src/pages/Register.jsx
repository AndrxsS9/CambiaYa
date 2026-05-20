/**
 * Página de registro de nuevos usuarios.
 *
 * Recoge nombre, correo y contraseña, valida campos vacíos,
 * muestra errores de la API en español y redirige a /login tras éxito.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth';

const Register = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.first_name.trim() || !formData.email.trim() || !formData.password) {
            setError('Todos los campos son obligatorios.');
            return;
        }

        setLoading(true);
        try {
            await register(formData);
            navigate('/login');
        } catch (err) {
            const apiErrors = err.response?.data || {};
            if (apiErrors.email) {
                setError(Array.isArray(apiErrors.email) ? apiErrors.email[0] : apiErrors.email);
            } else if (apiErrors.password) {
                setError(Array.isArray(apiErrors.password) ? apiErrors.password[0] : apiErrors.password);
            } else if (apiErrors.detail) {
                setError(apiErrors.detail);
            } else {
                setError('Error al registrar usuario. Verifica los datos e intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <h2>Registro</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="first_name">Nombre completo</label>
                    <input
                        id="first_name"
                        type="text"
                        name="first_name"
                        placeholder="Tu nombre completo"
                        value={formData.first_name}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="correo@ejemplo.com"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        placeholder="Mínimo 8 caracteres"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Procesando...' : 'Registrarse'}
                </button>
            </form>
        </div>
    );
};

export default Register;
