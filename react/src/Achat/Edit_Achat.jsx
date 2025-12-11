import { useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/logo.png";
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
export default function Edit_achat() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { id } = useParams();
    const [supplierName, setSupplierName] = useState('');
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cartItems, setCartItems] = useState([]);
    const [originalCartItems, setOriginalCartItems] = useState([]);
    const [nextPage, setNextPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [achatLoading, setAchatLoading] = useState(true);
    const [searchField, setSearchField] = useState('name');
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchAchatDetails = async () => {
        try {
            setAchatLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/achats/${id}/`);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const achatData = await response.json();
            setSupplierName(achatData.supplier_name);
            
            const cartItemsFromAchat = achatData.items.map(item => ({
                product: item.product,
                quantity: item.quantity
            }));
            
            setCartItems(cartItemsFromAchat);
            setOriginalCartItems([...cartItemsFromAchat]);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Erreur lors du chargement de l\'achat:', err);
        } finally {
            setAchatLoading(false);
        }
    };

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

    useEffect(() => {
        if (id) {
            fetchAchatDetails();
        }
    }, [id]);

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

    const setCartItemQuantity = (product, quantity) => {
        if (quantity <= 0) {
            alert('Quantité invalide');
            return;
        }

        const existingItem = cartItems.find(item => item.product.id === product.id);
        
        if (existingItem) {
            setCartItems(cartItems.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: quantity }
                    : item
            ));
        } else {
            setCartItems([...cartItems, { product, quantity }]);
        }
    };

    const removeFromCart = (productId) => {
        setCartItems(cartItems.filter(item => item.product.id !== productId));
    };

    const updateCartItemQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems(cartItems.map(item =>
            item.product.id === productId
                ? { ...item, quantity: newQuantity }
                : item
        ));
    };

    const getTotalPrice = () => {
        return cartItems.reduce((total, item) => 
            total + (parseFloat(item.product.price) * item.quantity), 0
        ).toFixed(2);
    };

    const updateAchat = async () => {
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

            const achatResponse = await fetch(`${API_BASE_URL}/api/achats/${id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    supplier_name: supplierName
                })
            });

            if (!achatResponse.ok) {
                throw new Error('Erreur lors de la mise à jour de l\'achat');
            }

            const clearResponse = await fetch(`${API_BASE_URL}/api/achats/${id}/clear_products/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!clearResponse.ok) {
                throw new Error('Erreur lors de la suppression des anciens produits');
            }

            for (const item of cartItems) {
                const addProductResponse = await fetch(`${API_BASE_URL}/api/achats/${id}/add_product/`, {
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

            alert('Achat mis à jour avec succès !');
            navigate("/achats");

        } catch (err) {
            alert(`Erreur: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (achatLoading) {
        return (
            <div className="bg-gradient-to-r from-[#081c3c] to-[#000000] text-white min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <span className="text-lg">Chargement de l\'achat...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-[#081c3c] to-[#000000] text-white min-h-screen">
            {/* NAVBAR */}
            <div className="sticky top-0 z-50 bg-gradient-to-r from-[#081c3c] to-[#000000] border-b border-white/10">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex justify-between items-center">

                        {/* Logo et titre */}
                        <div className="flex items-center gap-2 sm:gap-3" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}
>
                            <img src={logo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                            <h1 className="text-lg sm:text-2xl font-bold text-teal-400">Gesta Order</h1>
                        </div>

                        {/* Menu desktop */}
                        <div className="hidden md:flex gap-3 lg:gap-4">
                            <button
                                onClick={() => navigate("/product")}
                                className="flex items-center gap-2 bg-white/10 px-3 lg:px-4 py-2 rounded-xl hover:bg-white/20 transition border border-white/20 text-sm"
                            >
                                <StoreIcon style={{ fontSize: 20 }} />
                                <span className="hidden lg:inline">Produits</span>
                            </button>
                            <button
                                onClick={() => navigate("/commandes")}
                                className="flex items-center gap-2 bg-white/10 px-3 lg:px-4 py-2 rounded-xl hover:bg-white/20 transition border border-white/20 text-sm"
                            >
                                <ShoppingCartIcon style={{ fontSize: 20 }} />
                                <span className="hidden lg:inline">Commandes</span>
                            </button>
                            <button
                                onClick={() => navigate("/achats")}
                                className="flex items-center gap-2 bg-white/10 px-3 lg:px-4 py-2 rounded-xl hover:bg-white/20 transition border border-white/20 text-sm"
                            >
                                <TransferWithinAStationIcon style={{ fontSize: 20 }} />
                                <span className="hidden lg:inline">Achats</span>
                            </button>
                        </div>

                        {/* Bouton menu mobile */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden bg-white/10 p-2 rounded-lg hover:bg-white/20 transition"
                        >
                            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>

                    {/* Menu mobile déroulant */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 space-y-2 pb-4">
                            <button
                                onClick={() => {
                                    navigate("/product");
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl hover:bg-white/20 transition border border-white/20"
                            >
                                <StoreIcon style={{ fontSize: 20 }} /> Produits
                            </button>
                            <button
                                onClick={() => {
                                    navigate("/commandes");
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl hover:bg-white/20 transition border border-white/20"
                            >
                                <ShoppingCartIcon style={{ fontSize: 20 }} /> Commandes
                            </button>
                            <button
                                onClick={() => {
                                    navigate("/achats");
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl hover:bg-white/20 transition border border-white/20"
                            >
                                <TransferWithinAStationIcon style={{ fontSize: 20 }} /> Achats
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-5 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-teal-400 flex items-center gap-5 mb-6">
                        <ArrowBackIcon 
                            onClick={() => navigate("/achats")} 
                            className="cursor-pointer hover:text-teal-300 transition" 
                        />
                        <p>Modifier l'achat #{id}</p>
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
                                    <div key={item.product.id} className="flex justify-between items-center gap-2 bg-white/5 rounded-lg p-3">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.product.name}</p>
                                            <p className="text-sm text-gray-400">
                                                Prix unitaire: {item.product.price}DA
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex items-center space-x-2">
                                                <label className="text-sm">Qté:</label>
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => updateCartItemQuantity(item.product.id, parseFloat(e.target.value))}
                                                    className="w-20 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                />
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">
                                                    {(item.quantity * parseFloat(item.product.price)).toFixed(2)}DA
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.product.id)}
                                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors duration-200"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-white/20 mt-4 pt-4 flex justify-between items-center gap-2">
                                <span className="text-xl font-bold">Total: {getTotalPrice()}DA</span>
                                <button
                                    onClick={updateAchat}
                                    disabled={submitting}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-2 py-2 rounded-lg font-medium transition-colors duration-200"
                                >
                                    {submitting ? 'Mise à jour...' : 'Mettre à jour l\'achat'}
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
                                                onSetQuantity={setCartItemQuantity}
                                                cartQuantity={cartItems.find(item => item.product.id === product.id)?.quantity || 0}
                                                highlightText={highlightText}
                                                searchTerm={searchTerm}
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

function ProductCard({ product, onAddToCart, onSetQuantity, cartQuantity, searchTerm, highlightText }) {
    const [quantity, setQuantity] = useState(cartQuantity || 1);
    const isInCart = cartQuantity > 0;

    useEffect(() => {
        if (cartQuantity > 0) {
            setQuantity(cartQuantity);
        } else {
            setQuantity(1);
        }
    }, [cartQuantity]);

    const handleAdd = () => {
        if (quantity > 0) {
            onAddToCart(product, quantity);
            if (!isInCart) {
                setQuantity(1);
            }
        }
    };

    const handleSetQuantity = () => {
        if (quantity > 0) {
            onSetQuantity(product, quantity);
        }
    };

    return (
        <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 ${isInCart ? 'ring-2 ring-teal-500/50' : ''}`}>
            <div>
                <div className="flex-1">
                    <h4 className="text-lg font-bold text-white mb-2">
                        {highlightText(product.reference, searchTerm)}
                        {isInCart && <span className="ml-2 text-teal-400 text-sm">(Dans le panier)</span>}
                    </h4>
                    
                    <p className="text-gray-300 mb-2">
                        {highlightText(product.name, searchTerm)}
                    </p>
                    <p className="text-teal-400 font-medium text-xl mb-1">Prix: {product.price}DA</p>
                    <p className="text-gray-300 text-sm">Stock actuel: {product.stock}</p>
                </div>
                
                <div className="flex flex-col gap-3 mt-4">
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

                    <div className="flex space-x-2">
                        {isInCart ? (
                            <button
                                onClick={handleSetQuantity}
                                disabled={quantity <= 0}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm w-full"
                            >
                                Modifier
                            </button>
                        ) : (
                            <button
                                onClick={handleAdd}
                                className="bg-teal-600 hover:bg-teal-700 px-0 py-2 rounded-lg font-medium transition-colors duration-200 w-full"
                            >
                                Ajouter
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}