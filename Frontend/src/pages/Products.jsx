import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import { Search, Plus, X, PackageOpen } from 'lucide-react';

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
        <div className="min-h-screen bg-slate-50 pt-12 pb-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                            Explora <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Oportunidades</span>
                        </h1>
                        <p className="text-lg text-slate-600 max-w-2xl">
                            Encuentra objetos únicos, dale una segunda vida a lo que no usas y conecta con personas a través del intercambio.
                        </p>
                    </div>

                    {currentUser && (
                        <button 
                            onClick={() => setShowForm(!showForm)}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            {showForm ? <X className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
                            {showForm ? 'Cancelar publicación' : 'Publicar producto'}
                        </button>
                    )}
                </div>

                {showForm && currentUser && (
                    <div className="mb-12 bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Nuevo Producto</h2>
                        <ProductForm
                            onSuccess={handleProductCreated}
                            onCancel={() => setShowForm(false)}
                        />
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-10 flex flex-col sm:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="¿Qué estás buscando hoy?"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                    </form>
                    
                    <div className="sm:w-64">
                        <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)}
                            className="block w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-colors"
                        >
                            <option value="">Todas las categorías</option>
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-8">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {!loading && !error && products.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-slate-100 border-dashed shadow-sm">
                        <div className="bg-indigo-50 p-6 rounded-full mb-6">
                            <PackageOpen className="h-16 w-16 text-indigo-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No hay productos disponibles</h3>
                        <p className="text-slate-500 max-w-md">
                            Sé el primero en publicar algo interesante para la comunidad y empieza a intercambiar hoy mismo.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
        </div>
    );
};

export default Products;
