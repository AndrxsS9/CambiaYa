import React, { useState, useEffect } from 'react';
import { getProducts } from '../api/products';
import { createExchange } from '../api/exchanges';

const ExchangeModal = ({ requestedProduct, currentUser, onClose, onSuccess }) => {
    const [myProducts, setMyProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMyProducts = async () => {
            try {
                const { data } = await getProducts();
                const products = data.results || data;
                const available = products.filter(
                    (p) => p.owner === currentUser.id && p.available !== false && p.id !== requestedProduct.id
                );
                setMyProducts(available);
            } catch {
                setError('Error al cargar tus productos.');
            } finally {
                setLoading(false);
            }
        };
        fetchMyProducts();
    }, [currentUser.id, requestedProduct.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct) {
            setError('Selecciona un producto para ofrecer.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const { data } = await createExchange({
                offered_product: selectedProduct,
                requested_product: requestedProduct.id,
                message,
            });
            if (onSuccess) onSuccess(data);
        } catch (err) {
            const detail = err.response?.data;
            if (typeof detail === 'object') {
                const messages = Object.values(detail).flat();
                setError(messages.join(' '));
            } else {
                setError('Error al crear la propuesta de intercambio.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="exchange-modal-overlay" onClick={onClose}>
            <div className="exchange-modal" onClick={(e) => e.stopPropagation()}>
                <div className="exchange-modal__header">
                    <h3>Ofrecer Intercambio</h3>
                    <button
                        className="exchange-modal__close"
                        onClick={onClose}
                        aria-label="Cerrar modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="exchange-modal__target">
                    <p className="exchange-modal__label">Producto que deseas:</p>
                    <div className="exchange-modal__product-info">
                        <strong>{requestedProduct.title}</strong>
                        <span className="exchange-modal__category">{requestedProduct.category}</span>
                    </div>
                </div>

                {loading && <p className="exchange-modal__loading">Cargando tus productos...</p>}

                {!loading && myProducts.length === 0 && (
                    <div className="exchange-modal__empty">
                        <p>No tienes productos disponibles para intercambiar.</p>
                        <p>Publica un producto primero para poder hacer ofertas.</p>
                    </div>
                )}

                {!loading && myProducts.length > 0 && (
                    <form onSubmit={handleSubmit}>
                        <p className="exchange-modal__label">Selecciona tu producto a ofrecer:</p>
                        <div className="exchange-modal__products-list">
                            {myProducts.map((product) => (
                                <label
                                    key={product.id}
                                    className={`exchange-modal__product-option ${
                                        selectedProduct === product.id ? 'exchange-modal__product-option--selected' : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="offered_product"
                                        value={product.id}
                                        checked={selectedProduct === product.id}
                                        onChange={() => setSelectedProduct(product.id)}
                                    />
                                    <div className="exchange-modal__product-option-info">
                                        <strong>{product.title}</strong>
                                        <span>{product.category}</span>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="exchange-modal__message">
                            <label htmlFor="exchange-message">Mensaje (opcional):</label>
                            <textarea
                                id="exchange-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Escribe un mensaje para el dueño del producto..."
                                rows={3}
                            />
                        </div>

                        {error && <p className="exchange-modal__error">{error}</p>}

                        <div className="exchange-modal__actions">
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={onClose}
                                disabled={submitting}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn btn--primary"
                                disabled={submitting || !selectedProduct}
                            >
                                {submitting ? 'Enviando...' : 'Enviar Propuesta'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ExchangeModal;
