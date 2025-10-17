import { useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/logo.png";   // chemin relatif

export default function Edit_commande() {
    const { id } = useParams(); // ID de la commande à modifier
    const [customerName, setCustomerName] = useState('');
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cartItems, setCartItems] = useState([]);
    const [originalCartItems, setOriginalCartItems] = useState([]); // Pour suivre les modifications
    const [nextPage, setNextPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [orderLoading, setOrderLoading] = useState(true);
    const [searchField, setSearchField] = useState('name'); 
    const navigate = useNavigate();

    // Configuration de l'URL de base de votre API Django
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Fonction pour récupérer les détails de la commande
    const fetchOrderDetails = async () => {
        try {
            setOrderLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/orders/${id}/`);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const orderData = await response.json();
            setCustomerName(orderData.customer_name);
            
            // Convertir les items de la commande en format cart
            const cartItemsFromOrder = orderData.items.map(item => ({
                product: item.product,
                quantity: item.quantity
            }));
            
            setCartItems(cartItemsFromOrder);
            setOriginalCartItems([...cartItemsFromOrder]); // Copie pour comparaison
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Erreur lors du chargement de la commande:', err);
        } finally {
            setOrderLoading(false);
        }
    };

    // Fonction pour récupérer les produits
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

    // Effet pour la recherche avec debounce
useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const scrollY = window.scrollY; // Mémoriser la position Y

            // Construction de l'URL avec le champ de recherche spécifique
            let searchUrl = `${API_BASE_URL}/api/products/`;
            if (searchTerm) {
                searchUrl += `?${searchField}=${encodeURIComponent(searchTerm)}`;
            }
            
            fetchProducts(searchUrl).then(() => {
                // Restaurer la position après le fetch et mise à jour DOM
                setTimeout(() => {
                    window.scrollTo(0, scrollY);
                }, 0);
            });
        }, 300); // debounce 300ms

        return () => clearTimeout(delayDebounce);
    }, [searchTerm, searchField, API_BASE_URL]); // Ajout de searchField dans les dépendances


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

    useEffect(() => {
        if (id) {
            fetchOrderDetails();
            
        }
    }, [id]);

    // Fonction pour filtrer les produits selon la recherche


    // Fonction pour ajouter un produit au panier
    const addToCart = (product, quantity) => {
        if (quantity <= 0 || quantity > product.stock) {
            alert('Quantité invalide');
            return;
        }

        const existingItem = cartItems.find(item => item.product.id === product.id);
        
        if (existingItem) {
            // Vérifier que la nouvelle quantité totale ne dépasse pas le stock
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.stock) {
                alert('Quantité totale dépasse le stock disponible');
                return;
            }
            
            setCartItems(cartItems.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        } else {
            setCartItems([...cartItems, { product, quantity }]);
        }
    };

    // Fonction pour définir une quantité spécifique (pour modification directe)
    const setCartItemQuantity = (product, quantity) => {
        if (quantity <= 0 || quantity > product.stock) {
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

    // Fonction pour supprimer un item du panier
    const removeFromCart = (productId) => {
        setCartItems(cartItems.filter(item => item.product.id !== productId));
    };

    // Fonction pour modifier la quantité d'un item dans le panier
    const updateCartItemQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        const product = products.find(p => p.id === productId);
        if (product && newQuantity > product.stock) {
            alert('Quantité dépasse le stock disponible');
            return;
        }

        setCartItems(cartItems.map(item =>
            item.product.id === productId
                ? { ...item, quantity: newQuantity }
                : item
        ));
    };

    // Fonction pour calculer le prix total
    const getTotalPrice = () => {
        return cartItems.reduce((total, item) => 
            total + (parseFloat(item.product.price_v) * item.quantity), 0
        ).toFixed(2);
    };

    // Fonction pour soumettre les modifications
    const updateOrder = async () => {
        if (!customerName.trim()) {
            alert('Veuillez entrer le nom du client');
            return;
        }

        if (cartItems.length === 0) {
            alert('Veuillez ajouter au moins un produit à la commande');
            return;
        }

        try {
            setSubmitting(true);

            // Mettre à jour les informations de base de la commande
            const orderResponse = await fetch(`${API_BASE_URL}/api/orders/${id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_name: customerName
                })
            });

            if (!orderResponse.ok) {
                throw new Error('Erreur lors de la mise à jour de la commande');
            }

            // Vider la commande d'abord (restaure le stock)
            const clearResponse = await fetch(`${API_BASE_URL}/api/orders/${id}/clear_products/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!clearResponse.ok) {
                throw new Error('Erreur lors de la suppression des anciens produits');
            }

            // Ajouter les nouveaux produits
            for (const item of cartItems) {
                const addProductResponse = await fetch(`${API_BASE_URL}/api/orders/${id}/add_product/`, {
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

            alert('Commande mise à jour avec succès !');
            navigate("/commandes"); // Rediriger vers la liste des commandes

        } catch (err) {
            alert(`Erreur: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (orderLoading) {
        return (
            <div className="bg-gradient-to-r from-[#081c3c] to-[#000000] text-white min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <span className="text-lg">Chargement de la commande...</span>
                </div>
            </div>
        );
    }

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
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-teal-400 flex items-center gap-5 mb-6">
                        <ArrowBackIcon 
                            onClick={() => navigate("/commandes")} 
                            className="cursor-pointer hover:text-teal-300 transition" 
                        />
                        <p>Modifier la commande #{id}</p>
                    </h2>

                    {/* Nom du client */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
                        <label className="block text-lg font-medium mb-3">Nom du client:</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Entrez le nom du client"
                            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    {/* Panier */}
                    {cartItems.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
                            <h3 className="text-lg font-bold text-teal-400 mb-4">Panier ({cartItems.length} articles)</h3>
                            <div className="space-y-3">
                                {cartItems.map((item) => (
                                    <div key={item.product.id} className="flex justify-between items-center gap-2 bg-white/5 rounded-lg p-3">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.product.name}</p>
                                            <p className="text-sm text-gray-400">
                                                Prix unitaire: {item.product.price_v}DA
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex items-center space-x-2">
                                                <label className="text-sm">Qté:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={item.product.stock}
                                                    value={item.quantity}
                                                    onChange={(e) => updateCartItemQuantity(item.product.id, parseInt(e.target.value))}
                                                    className="w-16 px-2 py-1 bg-white/20 border border-white/30 rounded text-white text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
                                                />
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">
                                                    {(item.quantity * parseFloat(item.product.price_v)).toFixed(2)}DA
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
                                    onClick={updateOrder}
                                    disabled={submitting}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-2 py-2 rounded-lg font-medium transition-colors duration-200"
                                >
                                    {submitting ? 'Mise à jour...' : 'Mettre à jour la commande'}
                                </button>
                            </div>
                        </div>
                    )}
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

                    {/* Barre de recherche avec boutons radio */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-6">
                        {/* Boutons radio pour choisir le type de recherche */}
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
                                        className="mr-2 text-teal-500 focus:ring-teal-500"
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
                                        className="mr-2 text-teal-500 focus:ring-teal-500"
                                    />
                                    <span className="text-white">Référence</span>
                                </label>
                            </div>
                        </div>

                        {/* Champ de recherche */}
                        <div className="flex items-center space-x-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={`Rechercher un produit par ${searchField === 'name' ? 'nom' : 'référence'}...`}
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
                                                onAddToCart={addToCart}
                                                onSetQuantity={setCartItemQuantity}
                                                cartQuantity={cartItems.find(item => item.product.id === product.id)?.quantity || 0}
                                                highlightText={highlightText}
                                                searchTerm={searchTerm}
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
function ProductCard({ product, onAddToCart, onSetQuantity, cartQuantity, searchTerm, highlightText }) {
    const [quantity, setQuantity] = useState(cartQuantity || 1);
    const availableStock = product.stock - cartQuantity;
    const isInCart = cartQuantity > 0;

    // Mettre à jour la quantité locale quand cartQuantity change
    useEffect(() => {
        if (cartQuantity > 0) {
            setQuantity(cartQuantity);
        } else {
            setQuantity(1);
        }
    }, [cartQuantity]);

    const handleAdd = () => {
        if (quantity > 0 && quantity <= availableStock) {
            onAddToCart(product, quantity);
            if (!isInCart) {
                setQuantity(1);
            }
        }
    };

    const handleSetQuantity = () => {
        if (quantity > 0 && quantity <= product.stock) {
            onSetQuantity(product, quantity);
        }
    };

    // Fonction pour surligner le texte recherché
   

    return (
        <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 ${isInCart ? 'ring-2 ring-teal-500/50' : ''}`}>
            <div className="f">
                <div className="flex-1">
                    <h4 className="text-lg font-bold text-white mb-2">
                        {highlightText(product.reference, searchTerm)}
                        {isInCart && <span className="ml-2 text-teal-400 text-sm">(Dans le panier)</span>}
                    </h4>
                    
                    <p className="text-gray-300 mb-2">
                        {highlightText(product.name, searchTerm)}
                    </p>
                    <p className="text-teal-400 font-medium text-xl mb-1">Prix: {product.price_v}DA</p>
                    <p className="text-gray-300 text-sm">
                        Stock total: {product.stock}
                        {cartQuantity > 0 && (
                            <span className="text-yellow-400 ml-2">
                                • {cartQuantity} dans le panier • {availableStock} disponible
                            </span>
                        )}
                    </p>
                </div>
                
                <div className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Quantité:</label>
                        <input
                            type="number"
                            
                            max={isInCart ? product.stock : availableStock}
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) )}
                            className="w-20 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div className="flex space-x-2">
                        {isInCart ? (
                            <button
                                onClick={handleSetQuantity}
                                disabled={quantity <= 0 || quantity > product.stock}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm w-full"
                            >
                                Modifier
                            </button>
                        ) : (
                             <button
                        onClick={handleAdd}
                        disabled={availableStock <= 0}
                        className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-0 py-2 rounded-lg font-medium transition-colors duration-200 w-full"
                    >
                        {availableStock <= 0 ? 'Rupture' : 'Ajouter'}
                    </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}