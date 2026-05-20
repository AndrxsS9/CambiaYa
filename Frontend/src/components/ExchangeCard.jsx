import React, { useState } from 'react';
import { acceptExchange, rejectExchange, cancelExchange } from '../api/exchanges';

const STATUS_COLORS = {
    pendiente: '#f59e0b',
    aceptada: '#10b981',
    rechazada: '#ef4444',
    cancelada: '#6b7280',
};

const STATUS_ICONS = {
    pendiente: '⏳',
    aceptada: '✅',
    rechazada: '❌',
    cancelada: '🚫',
};

const PLACEHOLDER_IMAGE = 'https://placehold.co/120x90?text=Sin+imagen';

const ExchangeCard = ({ proposal, currentUser, onProposalUpdated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isSender = currentUser && currentUser.id === proposal.proposer;
    const isReceiver = currentUser && proposal.requested_product_detail &&
        currentUser.id === proposal.requested_product_detail.owner;
    const isPending = proposal.status === 'pendiente';

    const handleAction = async (actionFn, actionName) => {
        if (!window.confirm(`¿Estás seguro de que quieres ${actionName} esta propuesta?`)) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data } = await actionFn(proposal.id);
            if (onProposalUpdated) onProposalUpdated(data);
        } catch (err) {
            setError(err.response?.data?.detail || `Error al ${actionName} la propuesta.`);
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

    const statusColor = STATUS_COLORS[proposal.status] || '#6b7280';
    const statusIcon = STATUS_ICONS[proposal.status] || '';

    return (
        <div className="exchange-card">
            <div className="exchange-card__status-bar" style={{ backgroundColor: statusColor }}>
                <span>{statusIcon} {proposal.status_display}</span>
                <span className="exchange-card__date">
                    {new Date(proposal.created_at).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </span>
            </div>

            <div className="exchange-card__body">
                <div className="exchange-card__product">
                    <img src={offeredImage} alt={offeredProduct?.title || 'Producto ofrecido'} />
                    <div className="exchange-card__product-info">
                        <span className="exchange-card__product-label">Producto ofrecido</span>
                        <strong>{offeredProduct?.title || 'Sin título'}</strong>
                        <span className="exchange-card__product-category">
                            {offeredProduct?.category}
                        </span>
                        <span className="exchange-card__product-owner">
                            De: {offeredProduct?.owner_name || proposal.proposer_name}
                        </span>
                    </div>
                </div>

                <div className="exchange-card__arrow">⇄</div>

                <div className="exchange-card__product">
                    <img src={requestedImage} alt={requestedProduct?.title || 'Producto solicitado'} />
                    <div className="exchange-card__product-info">
                        <span className="exchange-card__product-label">Producto solicitado</span>
                        <strong>{requestedProduct?.title || 'Sin título'}</strong>
                        <span className="exchange-card__product-category">
                            {requestedProduct?.category}
                        </span>
                        <span className="exchange-card__product-owner">
                            De: {requestedProduct?.owner_name || proposal.receiver_name}
                        </span>
                    </div>
                </div>
            </div>

            {proposal.message && (
                <div className="exchange-card__message">
                    <strong>Mensaje:</strong> {proposal.message}
                </div>
            )}

            {error && <p className="exchange-card__error">{error}</p>}

            {isPending && (
                <div className="exchange-card__actions">
                    {isReceiver && (
                        <>
                            <button
                                className="btn btn--success"
                                onClick={() => handleAction(acceptExchange, 'aceptar')}
                                disabled={loading}
                            >
                                {loading ? '...' : '✓ Aceptar'}
                            </button>
                            <button
                                className="btn btn--danger"
                                onClick={() => handleAction(rejectExchange, 'rechazar')}
                                disabled={loading}
                            >
                                {loading ? '...' : '✗ Rechazar'}
                            </button>
                        </>
                    )}
                    {isSender && (
                        <button
                            className="btn btn--secondary"
                            onClick={() => handleAction(cancelExchange, 'cancelar')}
                            disabled={loading}
                        >
                            {loading ? '...' : '↩ Cancelar Propuesta'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExchangeCard;
