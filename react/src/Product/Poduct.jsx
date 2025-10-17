import { useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Product() {
    const [customerName, setCustomerName] = useState('');
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cartItems, setCartItems] = useState([]);
    const [nextPage, setNextPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    
    const navigate = useNavigate();
    // Configuration de l'URL de base de votre API Django
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Fonction pour récupérer les produits avec pagination et recherche
    const fetchProducts = async (url, isLoadMore = false) => {
        try {
            if (!isLoadMore) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (isLoadMore) {
                // Ajouter les nouveaux produits aux existants
                setProducts(prevProducts => [...prevProducts, ...data.results]);
                setFilteredProducts(prevProducts => [...prevProducts, ...data.results]);
            } else {
                // Remplacer tous les produits (nouvelle recherche ou premier chargement)
                setProducts(data.results);
                setFilteredProducts(data.results);
            }
            
            setNextPage(data.next);
            setTotalCount(data.count || data.results.length);
            setError(null);
            
        } catch (err) {
            setError(err.message);
            console.error('Erreur lors du chargement des produits:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Fonction pour rafraîchir les produits depuis le serveur externe
    const refreshProducts = async () => {
        setLoading(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/refresh_products/`);

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log("Produits rafraîchis:", data);
            
        } catch (error) {
            console.error("Erreur lors du rafraîchissement des produits:", error);
            setError("Erreur lors du rafraîchissement des produits");
        } finally {
            setLoading(false);
            // Recharger les produits après le rafraîchissement
            const searchUrl = `${API_BASE_URL}/api/products/${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
            fetchProducts(searchUrl);
        }
    };

    // Effet pour la recherche avec debounce
useEffect(() => {
    const delayDebounce = setTimeout(() => {
        const scrollY = window.scrollY; // Mémoriser la position Y

        const searchUrl = `${API_BASE_URL}/api/products/${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
        
        fetchProducts(searchUrl).then(() => {
            // Restaurer la position après le fetch et mise à jour DOM
            setTimeout(() => {
                window.scrollTo(0, scrollY);
            }, 0);
        });
    }, 300); // debounce 300ms

    return () => clearTimeout(delayDebounce);
}, [searchTerm, API_BASE_URL]);


    // Charger plus de produits
    const loadMoreProducts = () => {
        if (nextPage && !loadingMore) {
            fetchProducts(nextPage, true);
        }
    };

    // Fonction pour surligner le texte recherché
    const highlightText = (text, search) => {
        if (!search.trim()) return text;

        const regex = new RegExp(`(${search})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            regex.test(part) ? (
                <span key={index} className="bg-teal-600 text-black px-1 rounded">
                    {part}
                </span>
            ) : part
        );
    };

    return (
        <div className="bg-gradient-to-r from-[#081c3c] to-[#000000] text-white min-h-screen">
            {/* Navbar */}
            <div className="navbar">
                <div className="container mx-auto">
                    <div className="flex items-center p-5 gap-5">
                        <div className="logo flex items-center">
                            <h1 className="text-3xl font-bold text-teal-500">Gesta order</h1>
                        </div>
                        <img
                            src={logo}
                            alt="Logo Gesta Order"
                            className="h-10 w-10 mr-2 rounded-full"
                        />
                        <div></div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-5 py-8">
                {/* En-tête */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-teal-400 flex items-center gap-5">
                        <ArrowBackIcon 
                            onClick={() => navigate("/")} 
                            className="cursor-pointer hover:text-teal-300 transition"
                        />
                        <p>Mes Produits</p>
                        
                    </h2>
                    <button 
                        onClick={refreshProducts}
                        className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors duration-200"
                        disabled={loading}
                    >
                        <RefreshIcon className={loading ? 'animate-spin' : ''}/>
                    </button>
                </div>

                {/* Liste des produits */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-teal-400">Produits disponibles</h3>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-300">
                                {products.length} / {totalCount} produit(s)
                            </span>
                            {searchTerm && (
                                <span className="text-xs text-teal-300 bg-teal-900/30 px-2 py-1 rounded">
                                    Recherche: "{searchTerm}"
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Barre de recherche */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Rechercher un produit par nom ou référence..."
                                    className="w-full px-4 py-3 pl-10 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="bg-gray-600 hover:bg-gray-700 px-3 py-3 rounded-lg transition-colors duration-200"
                                    title="Effacer la recherche"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        
                    </div>

                    {/* Indicateur de chargement initial */}
                    {loading && products.length === 0 && (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                            <span className="ml-3 text-lg">Chargement des produits...</span>
                        </div>
                    )}

                    {/* Affichage des erreurs */}
                    {error && (
                        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
                            <p className="text-red-300">Erreur: {error}</p>
                            <button
                                onClick={() => {
                                    const searchUrl = `${API_BASE_URL}/api/products/${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
                                    fetchProducts(searchUrl);
                                }}
                                className="mt-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors duration-200"
                            >
                                Réessayer
                            </button>
                        </div>
                    )}

                    {/* Affichage des produits */}
                    {!loading && !error && (
                        <>
                            {products.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h4 className="text-xl font-semibold mb-2">
                                        {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
                                    </h4>
                                    <p className="text-gray-400">
                                        {searchTerm
                                            ? `Aucun produit ne correspond à "${searchTerm}"`
                                            : 'Les produits apparaîtront ici une fois ajoutés.'
                                        }
                                    </p>
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="mt-3 bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors duration-200"
                                        >
                                            Voir tous les produits
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-4 mb-6">
                                        {products.map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                searchTerm={searchTerm}
                                                highlightText={highlightText}
                                            />
                                        ))}
                                    </div>
                                    
                                    {/* Bouton "Charger plus" */}
                                    {nextPage && (
                                        <div className="flex justify-center py-6">
                                            <button
                                                onClick={loadMoreProducts}
                                                disabled={loadingMore}
                                                className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
                                            >
                                                {loadingMore ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                        Chargement...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                        Charger plus
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Composant pour chaque produit
function ProductCard({ product, searchTerm, highlightText }) {
    const availableStock = product.stock >= 0 ? product.stock : 'Rupture de stock';

    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex justify-between items-center">
                <div className="flex-1">
                    <h4 className="text-lg font-bold text-white mb-2">
                        {highlightText(product.reference, searchTerm)}
                    </h4>
                    <p className="text-gray-300 mb-2">
                        {highlightText(product.name, searchTerm)}
                    </p>
                    <p className="text-teal-400 font-medium text-xl mb-1">Prix: {product.price_v}DA</p>
                    <p className="text-gray-300 text-sm">
                        Stock disponible: {availableStock}
                    </p>
                </div>
            </div>
        </div>
    );
}