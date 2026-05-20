import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getProduct } from '../api/products';
import ExchangeModal from '../components/ExchangeModal';

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400?text=Sin+imagen';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useContext(AuthContext);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [exchangeSuccess, setExchangeSuccess] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const { data } = await getProduct(id);
                setProduct(data);
            } catch {
                setError('No se pudo cargar el producto. Es posible que no exista.');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleExchangeSuccess = (proposal) => {
        setShowExchangeModal(false);
        setExchangeSuccess(true);
        setTimeout(() => setExchangeSuccess(false), 5000);
    };

    if (loading) {
        return (
            <div className="product-detail-page">
                <p className="product-detail__loading">Cargando producto...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="product-detail-page">
                <p className="error-message">{error}</p>
                <button className="btn btn--secondary" onClick={() => navigate('/products')}>
                    ← Volver a productos
                </button>
            </div>
        );
    }

    const isOwner = currentUser && currentUser.id === product.owner;
    const canExchange = currentUser && !isOwner && product.available !== false;

    const imageUrl = product.images?.length > 0
        ? product.images[0].url
        : PLACEHOLDER_IMAGE;

    return (
        <div className="product-detail-page">
            <div className="product-detail__breadcrumb">
                <Link to="/products">← Volver a productos</Link>
            </div>

            <div className="product-detail">
                <div className="product-detail__image-section">
                    <img
                        src={imageUrl}
                        alt={product.title}
                        className="product-detail__image"
                    />
                    {product.images?.length > 1 && (
                        <div className="product-detail__thumbnails">
                            {product.images.map((img, index) => (
                                <img
                                    key={img.id || index}
                                    src={img.url}
                                    alt={`${product.title} - imagen ${index + 1}`}
                                    className="product-detail__thumbnail"
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="product-detail__info">
                    <div className="product-detail__header">
                        <h1 className="product-detail__title">{product.title}</h1>
                        <span className={`product-detail__availability ${
                            product.available !== false ? 'product-detail__availability--available' : 'product-detail__availability--unavailable'
                        }`}>
                            {product.available !== false ? '● Disponible' : '● No disponible'}
                        </span>
                    </div>

                    <span className="product-detail__category">{product.category}</span>

                    {product.estimated_value && (
                        <p className="product-detail__value">
                            Valor estimado: <strong>${parseFloat(product.estimated_value).toLocaleString('es-CO')}</strong>
                        </p>
                    )}

                    <div className="product-detail__description">
                        <h3>Descripción</h3>
                        <p>{product.description}</p>
                    </div>

                    <div className="product-detail__owner-info">
                        <span>Publicado por: <strong>{product.owner_name || 'Usuario'}</strong></span>
                        <span className="product-detail__date">
                            {new Date(product.created_at).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                    </div>

                    {exchangeSuccess && (
                        <div className="product-detail__success">
                            ✓ ¡Propuesta de intercambio enviada exitosamente! Puedes ver tus propuestas en{' '}
                            <Link to="/exchanges">Mis Intercambios</Link>.
                        </div>
                    )}

                    {canExchange && (
                        <button
                            className="btn btn--exchange"
                            onClick={() => setShowExchangeModal(true)}
                            id="btn-offer-exchange"
                        >
                            🔄 Ofrecer Intercambio
                        </button>
                    )}

                    {product.available === false && (
                        <p className="product-detail__unavailable-msg">
                            Este producto ya no está disponible para intercambio.
                        </p>
                    )}

                    {isOwner && (
                        <p className="product-detail__owner-msg">
                            Este es tu producto. No puedes ofrecerte un intercambio a ti mismo.
                        </p>
                    )}

                    {!currentUser && (
                        <p className="product-detail__login-msg">
                            <Link to="/login">Inicia sesión</Link> para ofrecer un intercambio.
                        </p>
                    )}
                </div>
            </div>

            {showExchangeModal && (
                <ExchangeModal
                    requestedProduct={product}
                    currentUser={currentUser}
                    onClose={() => setShowExchangeModal(false)}
                    onSuccess={handleExchangeSuccess}
                />
            )}
        </div>
    );
};

export default ProductDetail;
