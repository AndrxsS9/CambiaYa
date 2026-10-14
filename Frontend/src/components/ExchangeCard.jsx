import React, { useState } from 'react';
import { acceptExchange, rejectExchange, cancelExchange } from '../api/exchanges';
import { Check, X, Calendar, MessageSquare, ArrowRight } from 'lucide-react';

const STATUS_CONFIG = {
    pendiente: {
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        dot: 'bg-amber-500',
        label: 'Pendiente',
    },
    aceptada: {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        dot: 'bg-emerald-500',
        label: 'Aceptada',
    },
    rechazada: {
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        dot: 'bg-rose-500',
        label: 'Rechazada',
    },
    cancelada: {
        bg: 'bg-slate-50 border-slate-200 text-slate-500',
        dot: 'bg-slate-400',
        label: 'Cancelada',
    },
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=600&q=80';

const ExchangeCard = ({ proposal, currentUser, onProposalUpdated }) => {
    const [loading, setLoading] = useState(false);

    const isSender = currentUser && currentUser.id === proposal.proposer;
    const isReceiver = currentUser && proposal.requested_product_detail &&
        currentUser.id === proposal.requested_product_detail.owner;
    const isPending = proposal.status === 'pendiente';

    const handleAction = async (actionFn, actionName) => {
        if (!window.confirm(`¿Estás seguro de que quieres ${actionName} esta propuesta?`)) {
            return;
        }

        setLoading(true);

        try {
            const { data } = await actionFn(proposal.id);
            if (onProposalUpdated) onProposalUpdated(data);
        } catch (err) {
            console.error(`Error al ${actionName} la propuesta:`, err);
        } finally {
            setLoading(false);
        }
    };

    const offeredProduct = proposal.offered_product_detail;
    const requestedProduct = proposal.requested_product_detail;

    const offeredImage = offeredProduct?.images?.length > 0
        ? offeredProduct.images[0].url
        : PLACEHOLDER_IMAGE;

    const requestedImage = requestedProduct?.images?.length > 0
        ? requestedProduct.images[0].url
        : PLACEHOLDER_IMAGE;

    const statusStyle = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.pendiente;

    return (
        <div className="bg-white rounded-3xl shadow-sm hover:shadow-md border border-slate-100 overflow-hidden flex flex-col transition-all duration-300">
            {/* Cabecera de la Tarjeta */}
            <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${statusStyle.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
                    <span>{statusStyle.label}</span>
                </div>
                <div className="flex items-center text-xs text-slate-450">
                    <Calendar size={13} className="mr-1" />
                    <span>
                        {new Date(proposal.created_at).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })}
                    </span>
                </div>
            </div>

            {/* Cuerpo de Intercambio */}
            <div className="p-5 flex flex-col sm:flex-row items-stretch gap-4 justify-between relative">
                {/* Producto Ofrecido */}
                <div className="flex-1 flex items-start gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    <img 
                        src={offeredImage} 
                        alt={offeredProduct?.title} 
                        className="w-16 h-16 object-cover rounded-xl shadow-sm border border-slate-100 flex-shrink-0"
                    />
                    <div className="min-w-0">
                        <span className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Ofreces</span>
                        <strong className="block text-slate-800 text-sm font-bold truncate">{offeredProduct?.title || 'Sin título'}</strong>
                        <span className="inline-block px-1.5 py-0.5 mt-1 bg-slate-100 text-[10px] font-medium text-slate-500 rounded">
                            {offeredProduct?.category}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1 truncate">
                            Propietario: {offeredProduct?.owner_name || proposal.proposer_name}
                        </span>
                    </div>
                </div>

                {/* Flecha de Intercambio */}
                <div className="flex sm:flex-col items-center justify-center px-1">
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-full border border-blue-100 shadow-sm transform rotate-90 sm:rotate-0">
                        <ArrowRight size={16} />
                    </div>
                </div>

                {/* Producto Solicitado */}
                <div className="flex-1 flex items-start gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    <img 
                        src={requestedImage} 
                        alt={requestedProduct?.title} 
                        className="w-16 h-16 object-cover rounded-xl shadow-sm border border-slate-100 flex-shrink-0"
                    />
                    <div className="min-w-0">
                        <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">A cambio de</span>
                        <strong className="block text-slate-800 text-sm font-bold truncate">{requestedProduct?.title || 'Sin título'}</strong>
                        <span className="inline-block px-1.5 py-0.5 mt-1 bg-slate-100 text-[10px] font-medium text-slate-500 rounded">
                            {requestedProduct?.category}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1 truncate">
                            Propietario: {requestedProduct?.owner_name || proposal.receiver_name}
                        </span>
                    </div>
                </div>
            </div>

            {/* Mensaje de la Propuesta */}
            {proposal.message && (
                <div className="mx-5 mb-5 px-4 py-3 bg-blue-50/30 rounded-2xl border border-blue-50/50 text-slate-650 text-sm flex items-start gap-2">
                    <MessageSquare size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="leading-relaxed"><strong className="text-blue-900 font-semibold">Nota:</strong> {proposal.message}</p>
                </div>
            )}

            {/* Acciones */}
            {isPending && (
                <div className="px-5 pb-5 pt-1 mt-auto border-t border-slate-100 flex items-center gap-2">
                    {isReceiver && (
                        <>
                            <button
                                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                onClick={() => handleAction(acceptExchange, 'aceptar')}
                                disabled={loading}
                            >
                                <Check size={14} />
                                <span>Aceptar Trueque</span>
                            </button>
                            <button
                                className="flex-1 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-650 text-xs font-bold rounded-xl transition-all border border-rose-100 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                onClick={() => handleAction(rejectExchange, 'rechazar')}
                                disabled={loading}
                            >
                                <X size={14} />
                                <span>Rechazar</span>
                            </button>
                        </>
                    )}
                    {isSender && (
                        <button
                            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
                            onClick={() => handleAction(cancelExchange, 'cancelar')}
                            disabled={loading}
                        >
                            <X size={14} />
                            <span>Cancelar Propuesta</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExchangeCard;
