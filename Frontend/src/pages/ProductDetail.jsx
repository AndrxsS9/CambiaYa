import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getProduct } from '../api/products';
import ExchangeModal from '../components/ExchangeModal';
import { ArrowLeft, Tag, DollarSign, User, Calendar, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=600&q=80';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useContext(AuthContext);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [exchangeSuccess, setExchangeSuccess] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const { data } = await getProduct(id);
                setProduct(data);
            } catch (err) {
                console.error('Error al cargar el producto:', err);
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 text-rose-500 rounded-full mb-6">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Producto no disponible</h2>
                    <p className="text-slate-500 mb-6">
                        El artículo que buscas no se ha encontrado o no está disponible en este momento.
                    </p>
                    <button 
                        onClick={() => navigate('/products')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all border border-slate-200 text-center cursor-pointer"
                    >
                        Volver a Explorar
                    </button>
                </motion.div>
            </div>
        );
    }

    const isOwner = currentUser && currentUser.id === product.owner;
    const canExchange = currentUser && !isOwner && product.available !== false;

    // Obtener imágenes
    const productImages = product.images?.length > 0 
        ? product.images.map(img => img.url) 
        : [PLACEHOLDER_IMAGE];
        
    const activeImage = productImages[activeImageIndex] || PLACEHOLDER_IMAGE;

    return (
        <div className="min-h-screen bg-slate-50 pt-10 pb-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* breadcrumb */}
                <div className="mb-6">
                    <button 
                        onClick={() => navigate('/products')}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
                    >
                        <ArrowLeft size={16} className="transform group-hover:-translate-x-0.5 transition-transform" />
                        <span>Volver a Explorar</span>
                    </button>
                </div>

                {/* Grid principal */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Sección izquierda: Fotos */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-4">
                        <div className="aspect-[4/3] w-full bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 relative group">
                            <img
                                src={activeImage}
                                alt={product.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {product.available === false && (
                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="bg-slate-900/80 text-white font-bold text-sm tracking-wide uppercase px-4 py-2 rounded-xl border border-slate-700">
                                        No Disponible
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Miniaturas de imágenes */}
                        {productImages.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-1">
                                {productImages.map((imgUrl, index) => {
                                    const isActive = activeImageIndex === index;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setActiveImageIndex(index)}
                                            className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer flex-shrink-0 transition-all ${
                                                isActive ? 'border-blue-500 shadow-sm scale-95' : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <img
                                                src={imgUrl}
                                                alt={`${product.title} miniatura ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Sección derecha: Info */}
                    <div className="w-full lg:w-1/2">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col min-h-[480px]">
                            {/* Cabecera info */}
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-100 mb-2">
                                        {product.category}
                                    </span>
                                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
                                        {product.title}
                                    </h1>
                                </div>

                                <div className="flex-shrink-0">
                                    {product.available !== false ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-bold">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Disponible
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-xs font-bold">
                                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                            Cerrado
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Valor estimado */}
                            {product.estimated_value && (
                                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                                            <DollarSign size={16} />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider">Valor Estimado</span>
                                    </div>
                                    <span className="text-2xl font-black text-slate-800">
                                        ${parseFloat(product.estimated_value).toLocaleString('es-CO')}
                                    </span>
                                </div>
                            )}

                            {/* Descripción */}
                            <div className="border-t border-slate-100 pt-6 mb-6">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Descripción del artículo
                                </span>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {product.description || 'Sin descripción adicional para este producto.'}
                                </p>
                            </div>

                            {/* Info de autor */}
                            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-semibold">
                                <div className="flex items-center gap-1.5">
                                    <User size={14} className="text-slate-350" />
                                    <span>Publicado por: <strong className="text-slate-650">{product.owner_name || 'Miembro de CambiaYa'}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-slate-350" />
                                    <span>{new Date(product.created_at).toLocaleDateString('es-CO', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}</span>
                                </div>
                            </div>

                            {/* Acciones y Notificaciones de Éxito */}
                            <div className="mt-8">
                                <AnimatePresence>
                                    {exchangeSuccess && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="mb-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                                            <span>
                                                ¡Propuesta enviada con éxito! Puedes gestionarla en{' '}
                                                <Link to="/exchanges" className="underline text-emerald-950 font-extrabold hover:text-emerald-900 transition-colors">
                                                    Mis Intercambios
                                                </Link>.
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {canExchange && (
                                    <button
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                                        onClick={() => setShowExchangeModal(true)}
                                        id="btn-offer-exchange"
                                    >
                                        <ShoppingBag size={18} />
                                        <span>Ofrecer Intercambio</span>
                                    </button>
                                )}

                                {product.available === false && (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs font-semibold text-slate-500">
                                        Este producto ya no está disponible para intercambio.
                                    </div>
                                )}

                                {isOwner && (
                                    <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl text-center text-xs font-semibold text-blue-700">
                                        Este es tu producto. No puedes hacerte propuestas a ti mismo.
                                    </div>
                                )}

                                {!currentUser && (
                                    <Link
                                        to="/login"
                                        className="block w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-center transition-all border border-slate-200 text-sm"
                                    >
                                        Inicia sesión para ofrecer un intercambio
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Intercambio */}
            <AnimatePresence>
                {showExchangeModal && (
                    <ExchangeModal
                        requestedProduct={product}
                        currentUser={currentUser}
                        onClose={() => setShowExchangeModal(false)}
                        onSuccess={handleExchangeSuccess}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductDetail;
