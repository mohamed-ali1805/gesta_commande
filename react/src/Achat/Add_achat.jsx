import { useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeFilledIcon from '@mui/icons-material/HomeFilled';
import Navbar from '../Main/Navbar';
export default function Add_achat() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [supplierName, setSupplierName] = useState('');
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchField, setSearchField] = useState('name');
    const [cartItems, setCartItems] = useState([]);
    const [nextPage, setNextPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
                setProducts(prevProducts => [...prevProducts, ...data.results]);
                setFilteredProducts(prevProducts => [...prevProducts, ...data.results]);
            } else {
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

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const scrollY = window.scrollY;

            let searchUrl = `${API_BASE_URL}/api/products/`;
            if (searchTerm) {
                searchUrl += `?${searchField}=${encodeURIComponent(searchTerm)}`;
            }
            
            fetchProducts(searchUrl).then(() => {
                setTimeout(() => {
                    window.scrollTo(0, scrollY);
                }, 0);
            });
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm, searchField, API_BASE_URL]);

    const loadMoreProducts = () => {
        if (nextPage && !loadingMore) {
            fetchProducts(nextPage, true);
        }
    };

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

    const addToCart = (product, quantity) => {
        if (quantity <= 0) {
            alert('Quantité invalide');
            return;
        }

        const existingItem = cartItems.find(item => item.product.id === product.id);

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            setCartItems(cartItems.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        } else {
            setCartItems([...cartItems, { product, quantity }]);
        }
    };

    const removeFromCart = (productId) => {
        setCartItems(cartItems.filter(item => item.product.id !== productId));
    };

    const getTotalPrice = () => {
        return cartItems.reduce((total, item) =>
            total + (parseFloat(item.product.price) * item.quantity), 0
        ).toFixed(2);
    };

    const submitAchat = async () => {
        if (!supplierName.trim()) {
            alert('Veuillez entrer le nom du fournisseur');
            return;
        }

        if (cartItems.length === 0) {
            alert('Veuillez ajouter au moins un produit à l\'achat');
            return;
        }

        try {
            setSubmitting(true);

            const achatResponse = await fetch(`${API_BASE_URL}/api/achats/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    supplier_name: supplierName
                })
            });

            if (!achatResponse.ok) {
                throw new Error('Erreur lors de la création de l\'achat');
            }

            const achat = await achatResponse.json();

            for (const item of cartItems) {
                const addProductResponse = await fetch(`${API_BASE_URL}/api/achats/${achat.id}/add_product/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        product_id: item.product.id,
                        quantity: item.quantity
                    })
                });

                if (!addProductResponse.ok) {
                    throw new Error(`Erreur lors de l'ajout du produit ${item.product.name}`);
                }
            }

            setSupplierName('');
            setCartItems([]);
            setSearchTerm('');
            fetchProducts(`${API_BASE_URL}/api/products/`);
            alert('Achat créé avec succès !');
            navigate("/achats");

        } catch (err) {
            alert(`Erreur: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-gradient-to-r from-[#081c3c] to-[#000000] text-white min-h-screen">
            {/* NAVBAR */}
            <Navbar />

            <div className="container mx-auto px-5 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-teal-400 flex items-center gap-5 mb-6">
                        <ArrowBackIcon onClick={() => navigate("/achats")} className="cursor-pointer hover:text-teal-300 transition" />
                        <p>Ajouter un achat</p>
                    </h2>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
                        <label className="block text-lg font-medium mb-3">Nom du fournisseur:</label>
                        <input
                            type="text"
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            placeholder="Entrez le nom du fournisseur"
                            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    {cartItems.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
                            <h3 className="text-lg font-bold text-teal-400 mb-4">Panier ({cartItems.length} articles)</h3>
                            <div className="space-y-3">
                                {cartItems.map((item) => (
                                    <div key={item.product.id} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                                        <div>
                                            <p className="font-medium">{item.product.name}</p>
                                            <p className="text-sm text-gray-400">
                                                {item.quantity} x {item.product.price}DA = {(item.quantity * parseFloat(item.product.price)).toFixed(2)}DA
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors duration-200"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-white/20 mt-4 pt-4 flex justify-between items-center">
                                <span className="text-xl font-bold">Total: {getTotalPrice()}DA</span>
                                <button
                                    onClick={submitAchat}
                                    disabled={submitting}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                                >
                                    {submitting ? 'Création...' : 'Créer l\'achat'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-teal-400">Produits disponibles</h3>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-300">
                                {products.length} / {totalCount} produit(s)
                            </span>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-6">
                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">Rechercher par :</label>
                            <div className="flex gap-6">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="searchField"
                                        value="name"
                                        checked={searchField === 'name'}
                                        onChange={(e) => setSearchField(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span className="text-white">Nom</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="searchField"
                                        value="reference"
                                        checked={searchField === 'reference'}
                                        onChange={(e) => setSearchField(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span className="text-white">Référence</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={`Rechercher un produit par ${searchField === 'name' ? 'nom' : 'référence'}...`}
                                    className="w-full px-4 py-3 pl-10 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {!loading && !error && (
                        <>
                            {products.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h4 className="text-xl font-semibold mb-2">Aucun produit trouvé</h4>
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-4 mb-6">
                                        {products.map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                onAddToCart={addToCart}
                                                cartQuantity={cartItems.find(item => item.product.id === product.id)?.quantity || 0}
                                                highlightText={highlightText}
                                                searchTerm={searchTerm}
                                                searchField={searchField}
                                            />
                                        ))}
                                    </div>

                                    {nextPage && (
                                        <div className="flex justify-center py-6">
                                            <button
                                                onClick={loadMoreProducts}
                                                disabled={loadingMore}
                                                className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
                                            >
                                                {loadingMore ? 'Chargement...' : 'Charger plus'}
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

function ProductCard({ product, onAddToCart, cartQuantity, searchTerm, searchField, highlightText }) {
    const [quantity, setQuantity] = useState(1);

    const handleAdd = () => {
        if (quantity > 0) {
            onAddToCart(product, quantity);
            setQuantity(1);
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div>
                <div className="flex-1">
                    <h4 className="text-lg font-bold text-white mb-2">
                        {searchField === 'reference' 
                            ? highlightText(product.reference, searchTerm)
                            : product.reference
                        }
                    </h4>
                    <p className="text-gray-300 mb-2">
                        {searchField === 'name' 
                            ? highlightText(product.name, searchTerm)
                            : product.name
                        }
                    </p>
                    <p className="text-teal-400 font-medium text-xl mb-1">Prix d'achat: {product.price}DA</p>
                    <p className="text-gray-300 text-sm">Stock actuel: {product.stock}</p>
                </div>

                <div className="flex flex-col gap-5 mt-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Quantité:</label>
                        <input
                            type="number"
                            min="0.1"
                            step="0.01"
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value))}
                            className="w-20 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <button
                        onClick={handleAdd}
                        className="bg-teal-600 hover:bg-teal-700 px-0 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                        Ajouter
                    </button>
                </div>
            </div>
        </div>
    );
}