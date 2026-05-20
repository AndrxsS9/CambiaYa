/**
 * Tarjeta de producto individual.
 *
 * Muestra imagen, título, descripción truncada, categoría y propietario.
 * Los botones de edición y eliminación solo se muestran al dueño del producto.
 */
import React, { useState } from 'react';
import { deleteProduct } from '../api/products';
import ProductForm from './ProductForm';

const DESCRIPTION_MAX_LENGTH = 100;
const PLACEHOLDER_IMAGE = 'https://placehold.co/300x200?text=Sin+imagen';

const ProductCard = ({ product, currentUser, onProductUpdated, onProductDeleted }) => {
    const [isEditing, setIsEditing] = useState(false);
    const isOwner = currentUser && currentUser.id === product.owner;

    /** Maneja la eliminación con confirmación del usuario. */
    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
            return;
        }

        try {
            await deleteProduct(product.id);
            if (onProductDeleted) onProductDeleted(product.id);
        } catch {
            alert('Error al eliminar el producto.');
        }
    };

    /** Callback cuando la edición fue exitosa. */
    const handleEditSuccess = (updatedProduct) => {
        setIsEditing(false);
        if (onProductUpdated) onProductUpdated(updatedProduct);
    };

    if (isEditing) {
        return (
            <div className="product-card product-card--editing">
                <ProductForm
                    initialData={product}
                    onSuccess={handleEditSuccess}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    const imageUrl = product.images?.length > 0
        ? product.images[0].url
        : PLACEHOLDER_IMAGE;

    const truncatedDescription = product.description.length > DESCRIPTION_MAX_LENGTH
        ? product.description.substring(0, DESCRIPTION_MAX_LENGTH) + '...'
        : product.description;

    return (
        <div className="product-card">
            <img
                src={imageUrl}
                alt={product.title}
                className="product-card__image"
            />
            <div className="product-card__body">
                <h3 className="product-card__title">{product.title}</h3>
                <span className="product-card__category">{product.category}</span>
                <p className="product-card__description">{truncatedDescription}</p>
                <p className="product-card__owner">
                    Publicado por: {product.owner_name || 'Usuario'}
                </p>

                {isOwner && (
                    <div className="product-card__actions">
                        <button onClick={() => setIsEditing(true)}>Editar</button>
                        <button onClick={handleDelete} className="btn--danger">Eliminar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
