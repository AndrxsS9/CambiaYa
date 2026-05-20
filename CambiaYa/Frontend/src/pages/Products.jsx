/**
 * Página principal de productos del marketplace.
 *
 * Muestra el listado público de productos con búsqueda por palabra clave
 * y filtrado por categoría. Permite publicar si el usuario está autenticado.
 */
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';

const CATEGORIES = ['Electrónica', 'Ropa', 'Libros', 'Deportes', 'Hogar', 'Otro'];

const Products = () => {
    const { currentUser } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [showForm, setShowForm] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (search) params.search = search;
            if (category) params.category = category;

            const { data } = await getProducts(params);
            // Soporta respuesta paginada (data.results) o plana (data)
            setProducts(data.results || data);
        } catch {
            setError('Hubo un error al cargar los productos. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [category]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    const handleProductCreated = (newProduct) => {
        setProducts((prev) => [newProduct, ...prev]);
        setShowForm(false);
    };

    const handleProductUpdated = (updatedProduct) => {
        setProducts((prev) =>
            prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
        );
    };

    const handleProductDeleted = (deletedId) => {
        setProducts((prev) => prev.filter((p) => p.id !== deletedId));
    };

    return (
        <div className="products-page">
            <h2>Productos Disponibles</h2>

            <div className="filters">
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit">Buscar</button>
                </form>

                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Todas las categorías</option>
                    {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {currentUser && (
                <div className="publish-section">
                    <button onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cerrar formulario' : 'Publicar producto'}
                    </button>
                    {showForm && (
                        <ProductForm
                            onSuccess={handleProductCreated}
                            onCancel={() => setShowForm(false)}
                        />
                    )}
                </div>
            )}

            {loading && <p>Cargando productos...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && products.length === 0 && (
                <p>No se encontraron productos.</p>
            )}

            <div className="products-grid">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        currentUser={currentUser}
                        onProductUpdated={handleProductUpdated}
                        onProductDeleted={handleProductDeleted}
                    />
                ))}
            </div>
        </div>
    );
};

export default Products;
