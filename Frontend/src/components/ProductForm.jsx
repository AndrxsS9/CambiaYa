import React, { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '../api/products';

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
        <form onSubmit={handleSubmit} className="product-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
                <label htmlFor="title">Título *</label>
                <input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Nombre del producto"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="description">Descripción *</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe tu producto..."
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="category">Categoría</label>
                <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                >
                    {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="estimated_value">Valor estimado (opcional)</label>
                <input
                    id="estimated_value"
                    type="number"
                    name="estimated_value"
                    value={formData.estimated_value}
                    onChange={handleChange}
                    min="0"
                    placeholder="0.00"
                />
            </div>

            {!isEdit && (
                <div className="form-group">
                    <label htmlFor="images">Imágenes</label>
                    <input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    {previews.length > 0 && (
                        <div className="preview">
                            {previews.map((url, idx) => (
                                <img key={idx} src={url} alt={`Vista previa ${idx + 1}`} width="80" />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="form-actions">
                <button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Publicar')}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel} disabled={loading}>
                        Cancelar
                    </button>
                )}
            </div>
        </form>
    );
};

export default ProductForm;
