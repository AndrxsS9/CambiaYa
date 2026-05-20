import React, { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '../api/products';
import { ImagePlus, X, UploadCloud, AlertCircle } from 'lucide-react';

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const CATEGORIES = ['Electrónica', 'Ropa', 'Libros', 'Deportes', 'Hogar', 'Otro'];

const ProductForm = ({ initialData, onSuccess, onCancel }) => {
    const isEdit = !!initialData;
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        category: initialData?.category || 'Otro',
        estimated_value: initialData?.estimated_value || '',
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        return () => {
            previews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [previews]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const invalidFiles = files.filter((f) => f.size > MAX_IMAGE_SIZE_BYTES);

        if (invalidFiles.length > 0) {
            setError(`Algunas imágenes superan el límite de ${MAX_IMAGE_SIZE_MB}MB y no fueron añadidas.`);
            return;
        }
        
        previews.forEach((url) => URL.revokeObjectURL(url));
        const newPreviews = files.map((file) => URL.createObjectURL(file));

        setImages(files);
        setPreviews(newPreviews);
        setError('');
    };

    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
        
        const newPreviews = previews.filter((_, index) => index !== indexToRemove);
        URL.revokeObjectURL(previews[indexToRemove]);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim() || !formData.description.trim()) {
            setError('El título y la descripción son obligatorios.');
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                const { data } = await updateProduct(initialData.id, formData);
                if (onSuccess) onSuccess(data);
            } else {
                const submitData = new FormData();
                Object.entries(formData).forEach(([key, value]) => {
                    if (value !== '') submitData.append(key, value);
                });
                images.forEach((img) => {
                    submitData.append('images', img);
                });

                const { data } = await createProduct(submitData);
                if (onSuccess) onSuccess(data);
            }
        } catch (err) {
            const apiErrors = err.response?.data || {};
            const errorMsg = Object.values(apiErrors).flat().join(', ')
                || 'Error al guardar el producto.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="flex items-center gap-2 p-4 mb-4 text-sm text-rose-800 border border-rose-200 rounded-xl bg-rose-50">
                    <AlertCircle size={18} className="text-rose-500 flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="title" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Título <span className="text-rose-500">*</span>
                    </label>
                    <input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Ej. Bicicleta de montaña"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="category" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Categoría
                    </label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all appearance-none"
                    >
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="description" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Descripción <span className="text-rose-500">*</span>
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe los detalles, el estado y lo que buscas a cambio..."
                    required
                    rows="4"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                />
            </div>

            <div className="space-y-2 max-w-xs">
                <label htmlFor="estimated_value" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Valor estimado (COP) <span className="text-slate-400 normal-case font-medium ml-1">Opcional</span>
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-bold">$</span>
                    </div>
                    <input
                        id="estimated_value"
                        type="number"
                        name="estimated_value"
                        value={formData.estimated_value}
                        onChange={handleChange}
                        min="0"
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {!isEdit && (
                <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Imágenes del artículo
                    </label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all hover:border-blue-400 group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                <p className="mb-1 text-sm text-slate-500"><span className="font-semibold text-blue-600">Haz clic para subir</span> o arrastra y suelta</p>
                                <p className="text-xs text-slate-400">PNG, JPG hasta {MAX_IMAGE_SIZE_MB}MB</p>
                            </div>
                            <input 
                                id="images" 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={handleImageChange}
                                className="hidden" 
                            />
                        </label>
                    </div>

                    {previews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                            {previews.map((url, idx) => (
                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                                    <img src={url} alt={`Vista previa ${idx + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-2 right-2 p-1 bg-white/90 text-slate-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 hover:text-rose-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                {onCancel && (
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        disabled={loading}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-650 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
                    >
                        Cancelar
                    </button>
                )}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Guardando...</span>
                        </>
                    ) : (
                        <>
                            {isEdit ? 'Actualizar Producto' : 'Publicar Producto'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
