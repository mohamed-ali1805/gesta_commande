import { useState, useEffect, useRef } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";   // chemin relatif
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeFilledIcon from '@mui/icons-material/HomeFilled';
import Navbar from '../Main/Navbar';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
export default function Add_commande() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchField, setSearchField] = useState('name'); // Nouveau state pour le champ de recherche
    const [cartItems, setCartItems] = useState([]);
    const [nextPage, setNextPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    


const [scannerOpen, setScannerOpen] = useState(false);

       const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    // Chaque session de scan a un ID unique.
    // Quand stopScanner est appelé, on incrémente ce compteur.
    // Le callback zxing compare son ID capturé au moment du lancement
    // avec la valeur courante : s'ils diffèrent, le callback est orphelin et s'ignore.
    const scanSessionId = useRef(0);

    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Tuer proprement le flux vidéo et le codeReader
    const killScanner = () => {
        if (codeReaderRef.current) {
            try { codeReaderRef.current.reset(); } catch (_) {}
            codeReaderRef.current = null;
        }
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    };

    const stopScanner = () => {
        // Invalider TOUS les callbacks en cours en changeant l'ID de session
        scanSessionId.current += 1;
        killScanner();
        setScannerOpen(false);
    };

    const startScanner = async () => {
        // 1. Tuer l'éventuel scanner précédent
        killScanner();

        // 2. Vider la recherche et passer en mode référence
        setSearchTerm('');
        setSearchField('reference');

        // 3. Incrémenter l'ID de session — tous les anciens callbacks deviennent orphelins
        scanSessionId.current += 1;
        const mySessionId = scanSessionId.current;

        setScannerOpen(true);

        // 4. Laisser React rendre la modale + la balise <video>
        await new Promise(resolve => setTimeout(resolve, 0));

        // Si l'utilisateur a déjà fermé pendant le délai, abandonner
        if (mySessionId !== scanSessionId.current) return;

        try {
            
            // Vérifier encore une fois (l'import est async et peut prendre du temps)
            if (mySessionId !== scanSessionId.current) return;

            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);

            const codeReader = new BrowserMultiFormatReader(hints);
            codeReaderRef.current = codeReader;

            const devices = await BrowserMultiFormatReader.listVideoInputDevices();
            const deviceId = devices[devices.length - 1]?.deviceId;

            if (mySessionId !== scanSessionId.current) return;

            codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
                // Ce callback peut être appelé des dizaines de fois par seconde.
                // On l'ignore s'il appartient à une session révoquée.
                if (mySessionId !== scanSessionId.current) return;
                if (!result) return;

                const barcode = result.getText();

                // Révoquer immédiatement cette session avant de faire quoi que ce soit
                scanSessionId.current += 1;

                setSearchField('reference');
                setSearchTerm(barcode);
                killScanner();
                setScannerOpen(false);
            });

        } catch (e) {
            console.error('Erreur scanner:', e);
            if (mySessionId === scanSessionId.current) {
                stopScanner();
            }
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

    // Effet pour la recherche avec debounce (modifié)
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

    // Fonction pour supprimer un item du panier
    const removeFromCart = (productId) => {
        setCartItems(cartItems.filter(item => item.product.id !== productId));
    };

    // Fonction pour calculer le prix total
    const getTotalPrice = () => {
        return cartItems.reduce((total, item) =>
            total + (parseFloat(item.product.price_v) * item.quantity), 0
        ).toFixed(2);
    };

    // Fonction pour soumettre la commande
    const submitOrder = async () => {
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

            // Créer la commande
            const orderResponse = await fetch(`${API_BASE_URL}/api/orders/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_name: customerName
                })
            });

            if (!orderResponse.ok) {
                throw new Error('Erreur lors de la création de la commande');
            }

            const order = await orderResponse.json();

            // Ajouter chaque produit à la commande
            for (const item of cartItems) {
                const addProductResponse = await fetch(`${API_BASE_URL}/api/orders/${order.id}/add_product/`, {
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

            // Réinitialiser le formulaire
            setCustomerName('');
            setCartItems([]);
            setSearchTerm('');
            fetchProducts(`${API_BASE_URL}/api/products/`); // Recharger les produits pour mettre à jour les stocks
            alert('Commande créée avec succès !');
            navigate("/commandes"); // Rediriger vers la liste des commandes

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

            <div className="w-full max-w-full px-5 py-8">
                {/* En-tête */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-teal-400 flex items-center gap-5 mb-6"><ArrowBackIcon onClick={() => navigate("/commandes")} className="cursor-pointer hover:text-teal-300 transition" /><p>Ajouter une commande</p></h2>

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
                                    <div key={item.product.id} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                                        <div>
                                            <p className="font-medium">{item.product.name}</p>
                                            <p className="text-sm text-gray-400">
                                                {item.quantity} x {item.product.price_v}DA = {(item.quantity * parseFloat(item.product.price_v)).toFixed(2)}DA
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
                                    onClick={submitOrder}
                                    disabled={submitting}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                                >
                                    {submitting ? 'Création...' : 'Créer la commande'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Liste des produits */}
                <div>
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
                        <h3 className="text-xl font-bold text-teal-400">Produits disponibles</h3>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-300">
                                {products.length} / {totalCount} produit(s)
                            </span>
                            {searchTerm && (
                                <span className="text-xs text-teal-300 bg-teal-900/30 px-2 py-1 rounded max-w-[160px] truncate">
    Recherche: "{searchTerm}"
</span>
                            )}
                        </div>
                    </div>

                    {/* Barre de recherche avec boutons radio */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-6">
                        {/* Boutons radio pour choisir le type de recherche */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                                Rechercher par :
                            </label>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
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

                                <button
                                    onClick={startScanner}
                                    type="button"
                                    title="Scanner un code-barres EAN-13"
                                    className="flex items-center gap-2 bg-teal-700 hover:bg-teal-600 active:bg-teal-800 px-3 py-1.5 rounded-lg transition-colors duration-200 text-sm font-medium text-white whitespace-nowrap"
                                >
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m12-9V6a1 1 0 00-1-1h-3m4 9v3a1 1 0 01-1 1h-3" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M7 8v8M10 8v8M13 8v8M16 8v8" />
                                    </svg>
                                    Scanner
                                </button>
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
                                    let searchUrl = `${API_BASE_URL}/api/products/`;
                                    if (searchTerm) {
                                        searchUrl += `?${searchField}=${encodeURIComponent(searchTerm)}`;
                                    }
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
                                            ? `Aucun produit ne correspond à "${searchTerm}" dans le champ ${searchField === 'name' ? 'nom' : 'référence'}`
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
                                    <div className="flex flex-col gap-4 justify-center">
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

{/* ===== MODALE SCANNER ===== */}
            {scannerOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
                    onClick={(e) => { if (e.target === e.currentTarget) stopScanner(); }}
                >
                    <div className="bg-[#081c3c] border border-teal-700 rounded-2xl p-4 w-full max-w-xs shadow-2xl">

                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-teal-400 font-bold text-base flex items-center gap-2">
                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M7 8v8M10 8v8M13 8v8M16 8v8M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m12-9V6a1 1 0 00-1-1h-3m4 9v3a1 1 0 01-1 1h-3" />
                                </svg>
                                Scanner EAN-13
                            </h3>
                            <button onClick={stopScanner} type="button"
                                className="text-gray-400 hover:text-white transition-colors p-1">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="relative rounded-xl overflow-hidden bg-black" style={{ height: '220px' }}>
                            <video ref={videoRef} className="w-full h-full object-cover"
                                autoPlay muted playsInline />
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-teal-400 opacity-80 animate-pulse" />
                                <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-teal-400" />
                                <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-teal-400" />
                                <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-teal-400" />
                                <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-teal-400" />
                            </div>
                        </div>

                        <p className="text-center text-gray-400 text-sm mt-3">
                            Pointez vers un code-barres EAN-13
                        </p>

                        <button onClick={stopScanner} type="button"
                            className="mt-3 w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm text-gray-200 transition-colors">
                            Annuler
                        </button>
                    </div>
                </div>
            )}
            
        </div>
    );
}

// Composant pour chaque produit (modifié)
function ProductCard({ product, onAddToCart, cartQuantity, searchTerm, searchField, highlightText }) {
    const [quantity, setQuantity] = useState(1);
    const availableStock = product.stock - cartQuantity;

    const handleAdd = () => {
        if (quantity > 0 && quantity <= availableStock) {
            onAddToCart(product, quantity);
            setQuantity(1);
        }
    };

    return (
        <div className="bg-white/10  backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="">
                <div className="flex-1 ">
                    <h4 className="text-sm font-bold text-gray-300 mb-2 flex flex-col">
    {product.references.map(ref => (
        <span key={ref.id} className="mr-2">
            {highlightText(ref.code, searchTerm)}
        </span>
    ))}
</h4>
                    <p className="text-gray-300 mb-2">
                        {searchField === 'name' 
                            ? highlightText(product.name, searchTerm)
                            : product.name
                        }
                    </p>
                    <p className="text-teal-400 font-medium text-xl mb-1">Prix: {product.price_v}DA</p>
                    <p className="text-gray-300 text-sm">
                        Stock disponible: {availableStock}
                        {cartQuantity > 0 && (
                            <span className="text-yellow-400 ml-2">
                                (dont {cartQuantity} dans le panier)
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex flex-col gap-5">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Quantité:</label>
                        <input
  type="number"
  min="0.1"             // ou "0" selon ton besoin
  step="0.01"           // permet les valeurs avec deux décimales
  max={availableStock}
  value={quantity}
  onChange={(e) => setQuantity(parseFloat(e.target.value))} // parseFloat au lieu de parseInt
  className="w-20 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
/>

                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={availableStock <= 0}
                        className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-0 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                        {availableStock <= 0 ? 'Rupture' : 'Ajouter'}
                    </button>
                </div>
            </div>
        </div>
    );
}