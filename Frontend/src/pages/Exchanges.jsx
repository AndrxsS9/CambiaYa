import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getExchanges } from '../api/exchanges';
import ExchangeCard from '../components/ExchangeCard';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Inbox, Send, Layers } from 'lucide-react';

const TABS = [
    { key: 'received', label: 'Propuestas Recibidas', icon: Inbox },
    { key: 'sent', label: 'Propuestas Enviadas', icon: Send },
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

    const fetchProposals = async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const params = { type: activeTab };
            if (statusFilter) params.status = statusFilter;
            const { data } = await getExchanges(params);
            setProposals(data.results || data);
        } catch (err) {
            console.error('Error al cargar las propuestas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProposals();
    }, [activeTab, statusFilter, isAuthenticated]);

    const handleProposalUpdated = (updatedProposal) => {
        setProposals((prev) =>
            prev.map((p) => (p.id === updatedProposal.id ? updatedProposal : p))
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-6">
                        <ArrowLeftRight size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Mis Intercambios</h2>
                    <p className="text-slate-500 mb-6">
                        Inicia sesión para gestionar y revisar tus propuestas de intercambio.
                    </p>
                    <Link to="/login" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-200 text-center">
                        Iniciar Sesión
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-12 pb-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Cabecera */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                            Mis <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Intercambios</span>
                        </h1>
                        <p className="text-slate-500">
                            Gestiona tus trueques solicitados y recibidos de la comunidad.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center justify-center px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-50 shadow-sm transition-all self-start sm:self-auto"
                    >
                        ← Volver a Explorar
                    </button>
                </div>

                {/* Tabs de Navegación */}
                <div className="flex bg-slate-200/60 p-1.5 rounded-2xl mb-8 max-w-md">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                                    isActive 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Filtros de Estado */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Filtrar por:</span>
                    {STATUS_FILTERS.map((filter) => {
                        const isActive = statusFilter === filter.key;
                        return (
                            <button
                                key={filter.key}
                                onClick={() => setStatusFilter(filter.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    isActive 
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {filter.label}
                            </button>
                        );
                    })}
                </div>

                {/* Lista / Loader */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {proposals.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm p-8"
                            >
                                <div className="bg-blue-50 p-6 rounded-full mb-4">
                                    <Layers className="h-12 w-12 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">No hay propuestas aquí</h3>
                                <p className="text-slate-400 max-w-sm mb-6">
                                    {activeTab === 'received'
                                        ? 'No has recibido ninguna propuesta de intercambio con el estado seleccionado.'
                                        : 'No has enviado ninguna propuesta de intercambio con el estado seleccionado.'}
                                </p>
                                <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-200">
                                    Explorar Productos
                                </Link>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {proposals.map((proposal) => (
                                        <motion.div
                                            key={proposal.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            layout
                                        >
                                            <ExchangeCard
                                                proposal={proposal}
                                                currentUser={currentUser}
                                                onProposalUpdated={handleProposalUpdated}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Exchanges;
