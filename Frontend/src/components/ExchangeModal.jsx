import React, { useState, useEffect } from 'react';
import { getProducts } from '../api/products';
import { createExchange } from '../api/exchanges';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Package, MessageCircle, Info } from 'lucide-react';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=600&q=80';

const ExchangeModal = ({ requestedProduct, currentUser, onClose, onSuccess }) => {
    const [myProducts, setMyProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchMyProducts = async () => {
            try {
                const { data } = await getProducts();
                const products = data.results || data;
                const available = products.filter(
                    (p) => p.owner === currentUser.id && p.available !== false && p.id !== requestedProduct.id
                );
                setMyProducts(available);
            } catch (err) {
                console.error('Error al cargar productos del usuario:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyProducts();
    }, [currentUser.id, requestedProduct.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;

        setSubmitting(true);

        try {
            const { data } = await createExchange({
                offered_product: selectedProduct,
                requested_product: requestedProduct.id,
                message,
            });
            if (onSuccess) onSuccess(data);
        } catch (err) {
            console.error('Error al enviar la propuesta de intercambio:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabecera */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Ofrecer Intercambio</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Propón un trueque justo con tus artículos disponibles.</p>
                    </div>
                    <button
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                        onClick={onClose}
                        aria-label="Cerrar modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Producto Deseado */}
                    <div className="bg-blue-50/30 border border-blue-100/50 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-0.5">Artículo que deseas:</span>
                            <strong className="block text-slate-800 text-sm font-bold truncate">{requestedProduct.title}</strong>
                            <span className="inline-block px-1.5 py-0.5 mt-1 bg-white text-[10px] font-medium text-slate-500 rounded border border-slate-100">
                                {requestedProduct.category}
                            </span>
                        </div>
                        {requestedProduct.images?.length > 0 ? (
                            <img 
                                src={requestedProduct.images[0].url} 
                                alt={requestedProduct.title}
                                className="w-12 h-12 object-cover rounded-xl border border-white shadow-sm flex-shrink-0"
                            />
                        ) : (
                            <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Package size={20} />
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : myProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <div className="bg-slate-100 p-4 rounded-full mb-3">
                                <Package className="h-8 w-8 text-slate-400" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-700 mb-1">Sin productos disponibles</h4>
                            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                                No tienes productos activos o disponibles. Publica un producto primero para poder ofrecerlo en intercambio.
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                                Entendido
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Selector de productos del usuario */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    Selecciona el producto que ofreces:
                                </label>
                                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                    {myProducts.map((product) => {
                                        const isSelected = selectedProduct === product.id;
                                        const productImage = product.images?.length > 0 
                                            ? product.images[0].url 
                                            : PLACEHOLDER_IMAGE;
                                        return (
                                            <label
                                                key={product.id}
                                                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group select-none ${
                                                    isSelected 
                                                        ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/10' 
                                                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/30'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="offered_product"
                                                    value={product.id}
                                                    checked={isSelected}
                                                    onChange={() => setSelectedProduct(product.id)}
                                                    className="sr-only"
                                                />
                                                <img 
                                                    src={productImage} 
                                                    alt={product.title}
                                                    className="w-12 h-12 object-cover rounded-xl border border-slate-100 shadow-sm flex-shrink-0"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <strong className="block text-slate-800 text-sm font-bold truncate group-hover:text-slate-900 transition-colors">
                                                        {product.title}
                                                    </strong>
                                                    <span className="inline-block px-1.5 py-0.5 mt-0.5 bg-slate-100 text-[9px] font-medium text-slate-500 rounded">
                                                        {product.category}
                                                    </span>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                                                    isSelected 
                                                        ? 'bg-blue-600 border-blue-600 text-white' 
                                                        : 'border-slate-300 bg-white text-transparent group-hover:border-slate-400'
                                                }`}>
                                                    <Check size={12} strokeWidth={3} />
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Mensaje opcional */}
                            <div>
                                <label htmlFor="exchange-message" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <MessageCircle size={14} className="text-slate-400" />
                                    <span>Mensaje para el dueño (opcional):</span>
                                </label>
                                <textarea
                                    id="exchange-message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Hola, me gustaría cambiar mi artículo por el tuyo..."
                                    rows={3}
                                    className="block w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all resize-none leading-relaxed"
                                />
                            </div>

                            {/* Botones de acción */}
                            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                                <button
                                    type="button"
                                    className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-650 text-xs font-bold rounded-xl transition-all border border-slate-200 flex items-center justify-center cursor-pointer"
                                    onClick={onClose}
                                    disabled={submitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    disabled={submitting || !selectedProduct}
                                >
                                    {submitting ? 'Enviando...' : 'Proponer Trueque'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ExchangeModal;
