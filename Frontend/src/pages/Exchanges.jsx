import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getExchanges } from '../api/exchanges';
import ExchangeCard from '../components/ExchangeCard';
import { Link, useNavigate } from 'react-router-dom';

const TABS = [
    { key: 'received', label: 'Recibidas' },
    { key: 'sent', label: 'Enviadas' },
];

const STATUS_FILTERS = [
    { key: '', label: 'Todos' },
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'aceptada', label: 'Aceptadas' },
    { key: 'rechazada', label: 'Rechazadas' },
    { key: 'cancelada', label: 'Canceladas' },
];

const Exchanges = () => {
    const { currentUser, isAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('received');
    const [statusFilter, setStatusFilter] = useState('');
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchProposals = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = { type: activeTab };
                if (statusFilter) params.status = statusFilter;
                const { data } = await getExchanges(params);
                setProposals(data.results || data);
            } catch {
                setError('Error al cargar las propuestas de intercambio.');
            } finally {
                setLoading(false);
            }
        };
        fetchProposals();
    }, [activeTab, statusFilter, isAuthenticated]);

    const handleProposalUpdated = (updatedProposal) => {
        setProposals((prev) =>
            prev.map((p) => (p.id === updatedProposal.id ? updatedProposal : p))
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="exchanges-page">
                <div className="exchanges-page__auth-required">
                    <h2>Mis Intercambios</h2>
                    <p>Debes iniciar sesión para ver tus propuestas de intercambio.</p>
                    <Link to="/login" className="btn btn--primary">Iniciar Sesión</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="exchanges-page">
            <div className="exchanges-page__header">
                <h2>Mis Intercambios</h2>
                <button
                    className="btn btn--secondary"
                    onClick={() => navigate('/products')}
                >
                    ← Volver a Productos
                </button>
            </div>

            <div className="exchanges-page__tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        className={`exchanges-page__tab ${
                            activeTab === tab.key ? 'exchanges-page__tab--active' : ''
                        }`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="exchanges-page__filters">
                {STATUS_FILTERS.map((filter) => (
                    <button
                        key={filter.key}
                        className={`exchanges-page__filter ${
                            statusFilter === filter.key ? 'exchanges-page__filter--active' : ''
                        }`}
                        onClick={() => setStatusFilter(filter.key)}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {loading && <p className="exchanges-page__loading">Cargando propuestas...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && proposals.length === 0 && (
                <div className="exchanges-page__empty">
                    <p>
                        {activeTab === 'received'
                            ? 'No has recibido propuestas de intercambio.'
                            : 'No has enviado propuestas de intercambio.'}
                    </p>
                    <Link to="/products" className="btn btn--primary">
                        Explorar Productos
                    </Link>
                </div>
            )}

            <div className="exchanges-page__list">
                {proposals.map((proposal) => (
                    <ExchangeCard
                        key={proposal.id}
                        proposal={proposal}
                        currentUser={currentUser}
                        onProposalUpdated={handleProposalUpdated}
                    />
                ))}
            </div>
        </div>
    );
};

export default Exchanges;
