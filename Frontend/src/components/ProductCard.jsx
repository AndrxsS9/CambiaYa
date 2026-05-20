import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteProduct } from '../api/products';
import ProductForm from './ProductForm';
import { Edit2, Trash2, User } from 'lucide-react';

const DESCRIPTION_MAX_LENGTH = 90;
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=600&q=80'; // Placeholder premium

const ProductCard = ({ product, currentUser, onProductUpdated, onProductDeleted }) => {
    const [isEditing, setIsEditing] = useState(false);
    const isOwner = currentUser && currentUser.id === product.owner;

    const handleDelete = async (e) => {
        e.preventDefault();
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

    const handleEditSuccess = (updatedProduct) => {
        setIsEditing(false);
        if (onProductUpdated) onProductUpdated(updatedProduct);
    };

    if (isEditing) {
        return (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 relative z-10">
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

    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 transform hover:-translate-y-1 relative">
            <Link to={`/products/${product.id}`} className="block relative aspect-w-4 aspect-h-3 overflow-hidden bg-slate-100">
                <img
                    src={imageUrl}
                    alt={product.title}
                    className="w-full h-56 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <Link to={`/products/${product.id}`} className="hover:text-blue-600 transition-colors">
                        <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{product.title}</h3>
                    </Link>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 whitespace-nowrap">
                        {product.category}
                    </span>
                </div>
                
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">
                    {product.description}
                </p>

                <div className="flex items-center text-xs text-slate-400 mb-4 pt-4 border-t border-slate-100">
                    <User className="w-4 h-4 mr-1" />
                    <span>Por {product.owner_name || 'Usuario'}</span>
                </div>

                {isOwner && (
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                            className="flex-1 inline-flex justify-center items-center py-2 px-4 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-sm font-medium rounded-xl transition-colors"
                        >
                            <Edit2 className="w-4 h-4 mr-1.5" /> Editar
                        </button>
                        <button 
                            onClick={handleDelete} 
                            className="flex-1 inline-flex justify-center items-center py-2 px-4 bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 text-sm font-medium rounded-xl transition-colors"
                        >
                            <Trash2 className="w-4 h-4 mr-1.5" /> Eliminar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
